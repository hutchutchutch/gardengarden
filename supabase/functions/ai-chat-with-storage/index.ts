import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

// Types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  message: string
  thread_id: string
  lesson_id?: string
  plant_id?: string
  conversation_history?: ChatMessage[]
  include_sources?: boolean
  mode?: 'ai' | 'teacher'  // Add mode to help determine behavior
}

interface Source {
  id: string
  url: string
  title: string
  snippet: string
  similarity?: number
}

interface ChunkResult {
  id: string
  content: string
  chunk_index: number
  lesson_id: string
  similarity: number
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get API keys
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`

// Create embeddings using OpenAI
async function createEmbedding(text: string): Promise<number[]> {
  console.log(`[EMBED.1] Creating embedding for text: "${text.substring(0, 50)}..."`)
  const startTime = Date.now()
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
    }),
  })

  const embedTime = Date.now() - startTime
  console.log(`[EMBED.2] Embedding API response: ${response.status}, took ${embedTime}ms`)

  if (!response.ok) {
    const error = await response.text()
    console.error(`[EMBED.ERROR] OpenAI embedding error:`, error)
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`[EMBED.3] Embedding created successfully, vector length: ${data.data[0].embedding.length}`)
  return data.data[0].embedding
}

// Main handler
serve(async (req) => {
  const startTime = Date.now()
  console.log('[START] ai-chat-with-storage function initiated')
  console.log(`[START.1] Method: ${req.method}, URL: ${req.url}`)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[1] Parsing request body...')
    const requestBody = await req.json()
    console.log('[1.1] Raw request body:', JSON.stringify(requestBody, null, 2))
    
    const { 
      message, 
      thread_id,
      lesson_id, 
      plant_id,
      conversation_history = [], 
      include_sources = true,
      mode = 'ai'
    } = requestBody as RequestBody

    console.log(`[2] Request parsed:`)
    console.log(`[2.1] Message: "${message?.substring(0, 100)}..."`)
    console.log(`[2.2] Thread ID: ${thread_id}`)
    console.log(`[2.3] Lesson ID: ${lesson_id}`)
    console.log(`[2.4] Plant ID: ${plant_id}`)
    console.log(`[2.5] Mode: ${mode}`)
    console.log(`[2.6] Include sources: ${include_sources}`)
    console.log(`[2.7] Conversation history length: ${conversation_history.length}`)

    // Validate inputs
    if (!message || !thread_id) {
      console.error('[2.ERROR] Missing required fields')
      throw new Error('Missing required fields: message and thread_id')
    }

    // Get the current user ID from the auth context
    const authHeader = req.headers.get('Authorization')
    console.log(`[2.8] Auth header present: ${!!authHeader}`)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '')
    const userId = user?.id
    console.log(`[2.9] User ID: ${userId}, Auth error: ${authError?.message || 'none'}`)

    // CRITICAL: For chatbot mode, we need to find the active lesson
    let effectiveLessonId = lesson_id
    let relevantChunks: ChunkResult[] = []
    let contextText = ''

    // If we're in AI/chatbot mode and don't have a lesson_id, try to find the active lesson
    if (mode === 'ai' && !lesson_id) {
      console.log('[3.AUTO] No lesson_id provided in AI mode, attempting to find active lesson...')
      
      try {
        // Get the thread to find the student
        const { data: thread, error: threadError } = await supabase
          .from('message_threads')
          .select('student_id')
          .eq('id', thread_id)
          .single()
        
        if (thread && !threadError) {
          console.log(`[3.AUTO.1] Found thread with student_id: ${thread.student_id}`)
          
          // Find the student's active lesson
          const { data: enrollment, error: enrollError } = await supabase
            .from('lesson_enrollments')
            .select('lesson_id')
            .eq('student_id', thread.student_id)
            .eq('is_active', true)
            .single()
          
          if (enrollment && !enrollError) {
            effectiveLessonId = enrollment.lesson_id
            console.log(`[3.AUTO.2] Found active lesson: ${effectiveLessonId}`)
          } else {
            console.log(`[3.AUTO.3] No active lesson found: ${enrollError?.message || 'no enrollment'}`)
          }
        }
             } catch (error) {
         console.error('[3.AUTO.ERROR] Error finding active lesson:', error instanceof Error ? error.message : error)
      }
    }

    // Now retrieve content if we have a lesson (either provided or found)
    if (effectiveLessonId && include_sources) {
      const retrieveStartTime = Date.now()
      console.log(`[3] Starting content retrieval for lesson: ${effectiveLessonId}`)
      
      try {
        // Generate embedding for the message
        console.log('[3.1] Creating embedding for student message...')
        console.log(`[3.1.1] Full message text: "${message}"`)
        
        const queryEmbedding = await createEmbedding(message)
        console.log(`[3.1.2] Embedding created, vector length: ${queryEmbedding.length}`)
        
        // Use our vector search function
        console.log('[3.2] Searching for relevant chunks...')
        console.log(`[3.2.1] Calling search_lesson_content with lesson_id: ${effectiveLessonId}`)
        
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_lesson_content', {
            query_embedding: queryEmbedding,
            p_lesson_id: effectiveLessonId,
            match_count: 3
          })

        const retrieveTime = Date.now() - retrieveStartTime
        console.log(`[3.3] Content retrieval completed in ${retrieveTime}ms`)
        console.log(`[3.3.1] Search error: ${searchError?.message || 'none'}`)
        console.log(`[3.3.2] Search results: ${JSON.stringify(searchResults, null, 2)}`)

        if (!searchError && searchResults && searchResults.length > 0) {
          console.log(`[3.4] Retrieved ${searchResults.length} relevant chunks`)
          
          // Store the full chunk data
          relevantChunks = searchResults as ChunkResult[]
          
          // Create context from the retrieved content
          contextText = searchResults
            .map((chunk: any, idx: number) => {
              const preview = chunk.content.substring(0, 300)
              console.log(`[3.4.${idx + 1}] Chunk ${chunk.id} preview: "${preview}..."`)
              return `[Source ${idx + 1}]: ${preview}...`
            })
            .join('\n\n')
          
          console.log(`[3.5] Created context text of ${contextText.length} characters`)
        } else {
          console.log('[3.6] No relevant chunks found')
          if (searchError) {
            console.error('[3.6.1] Search error details:', searchError)
          }
        }
              } catch (error) {
          console.error('[3.EXCEPTION] Error retrieving lesson content:', error)
          console.error('[3.EXCEPTION.1] Error stack:', error instanceof Error ? error.stack : 'Unknown error')
        // Continue without context if retrieval fails
      }
    } else {
      console.log(`[3.SKIP] Skipping content retrieval - effectiveLessonId: ${effectiveLessonId}, include_sources: ${include_sources}`)
    }

    // Get plant information if plant_id is provided
    let plantContext = ''
    if (plant_id) {
      const plantStartTime = Date.now()
      console.log(`[4] Fetching plant info for ID: ${plant_id}`)
      
      try {
        const { data: plant, error } = await supabase
          .from('plants')
          .select('nickname, current_stage, current_health_score, planting_date')
          .eq('id', plant_id)
          .single()

        const plantTime = Date.now() - plantStartTime
        console.log(`[4.1] Plant query took ${plantTime}ms, error: ${error?.message || 'none'}`)

        if (plant && !error) {
          const daysSincePlanting = Math.floor(
            (new Date().getTime() - new Date(plant.planting_date).getTime()) / (1000 * 60 * 60 * 24)
          )
          plantContext = `\n\nCurrent plant information:\n- Nickname: ${plant.nickname || 'Unnamed plant'}\n- Growth stage: ${plant.current_stage}\n- Health score: ${plant.current_health_score || 'Not assessed'}/100\n- Days since planting: ${daysSincePlanting}`
          
          console.log('[4.2] Plant context created successfully')
          console.log(`[4.2.1] Plant context: ${plantContext}`)
        }
      } catch (error) {
        console.error('[4.EXCEPTION] Error retrieving plant info:', error)
      }
    }

    // Prepare messages for OpenAI
    console.log('[5] Preparing OpenAI messages...')
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are Garden Guru AI, a knowledgeable and friendly gardening assistant helping students learn about plant care. 
        
Your role is to:
- Provide helpful, educational advice about plant care, identification, and troubleshooting
- Be encouraging and supportive of students' gardening efforts
- Give practical, actionable advice suitable for beginners
- Use the provided context from lesson materials when relevant
- Keep responses concise but informative (2-3 paragraphs max)
- Use emojis occasionally to make responses more engaging 🌱

${contextText ? `Here is relevant information from the lesson materials:\n${contextText}` : ''}
${plantContext}`
      },
      ...conversation_history.slice(-5), // Include last 5 messages for context
      {
        role: 'user',
        content: message
      }
    ]

    console.log(`[5.1] Prepared ${messages.length} messages for OpenAI`)
    console.log('[5.2] System message includes context:', !!contextText)
    console.log('[5.3] System message includes plant info:', !!plantContext)

    // Call OpenAI API
    const openAIStartTime = Date.now()
    console.log('[6] Calling OpenAI API...')
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const openAITime = Date.now() - openAIStartTime
    console.log(`[6.1] OpenAI response status: ${openAIResponse.status}, took ${openAITime}ms`)

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('[6.ERROR] OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    console.log('[6.2] Parsing OpenAI response...')
    const openAIData = await openAIResponse.json()
    const aiMessage = openAIData.choices[0].message.content
    console.log(`[6.3] AI message length: ${aiMessage.length} characters`)
    console.log(`[6.4] AI message preview: "${aiMessage.substring(0, 100)}..."`)

    // Store student message with relevant chunks
    console.log('[7] Storing student message...')
    console.log(`[7.1] Storing with thread_id: ${thread_id}, sender_id: ${userId}`)
    console.log(`[7.2] Message content length: ${message.length}`)
    console.log(`[7.3] Relevant chunk IDs: ${relevantChunks.map(c => c.id).join(', ')}`)
    
    const { data: studentMessageData, error: studentMessageError } = await supabase
      .from('messages')
      .insert({
        thread_id: thread_id,
        sender_id: userId,
        content: message,
        relevant_chunks: relevantChunks.map(chunk => chunk.id),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (studentMessageError) {
      console.error('[7.ERROR] Error storing student message:', studentMessageError)
      console.error('[7.ERROR.1] Error details:', JSON.stringify(studentMessageError, null, 2))
    } else {
      console.log('[7.4] Student message stored successfully with ID:', studentMessageData.id)
    }

    // Store AI response - ensure content is not too long
    console.log('[8] Storing AI response...')
    console.log(`[8.1] AI message content length: ${aiMessage.length}`)
    
    // Truncate if needed (safety check, though TEXT column should handle it)
    const safeAiMessage = aiMessage.length > 10000 ? aiMessage.substring(0, 9997) + '...' : aiMessage
    
    const { data: aiMessageData, error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        thread_id: thread_id,
        sender_id: null, // AI assistant doesn't have a user ID
        content: safeAiMessage,
        relevant_chunks: relevantChunks.map(chunk => chunk.id),
        ai_sources: relevantChunks.length > 0 ? relevantChunks.map(chunk => ({ 
          chunk_id: chunk.id,
          similarity: chunk.similarity 
        })) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (aiMessageError) {
      console.error('[8.ERROR] Error storing AI response:', aiMessageError)
      console.error('[8.ERROR.1] Error code:', aiMessageError.code)
      console.error('[8.ERROR.2] Error details:', JSON.stringify(aiMessageError, null, 2))
      console.error('[8.ERROR.3] Attempted to store content of length:', safeAiMessage.length)
    } else {
      console.log('[8.2] AI response stored successfully with ID:', aiMessageData.id)
    }

    // Store chunk messages as separate chatbot messages if we have them
    const chunkMessageIds: string[] = []
    if (relevantChunks.length > 0 && mode === 'ai') {
      console.log(`[8.3] Storing ${relevantChunks.length} chunk messages...`)
      
      for (let i = 0; i < relevantChunks.length; i++) {
        const chunk = relevantChunks[i]
        console.log(`[8.3.${i + 1}] Storing chunk ${chunk.id} as message...`)
        
        // Create a formatted message for the chunk
        const chunkMessage = `📚 **Reference ${i + 1}**\n\n${chunk.content}\n\n*Relevance: ${Math.round(chunk.similarity * 100)}%*`
        
        const { data: chunkMessageData, error: chunkError } = await supabase
          .from('messages')
          .insert({
            thread_id: thread_id,
            sender_id: null, // Chatbot message
            content: chunkMessage.length > 10000 ? chunkMessage.substring(0, 9997) + '...' : chunkMessage,
            ai_sources: [{ chunk_id: chunk.id, similarity: chunk.similarity }],
            created_at: new Date(Date.now() + i + 1).toISOString() // Ensure sequential ordering
          })
          .select()
          .single()
        
        if (chunkError) {
          console.error(`[8.3.${i + 1}.ERROR] Error storing chunk message:`, chunkError)
        } else {
          console.log(`[8.3.${i + 1}.SUCCESS] Chunk message stored with ID:`, chunkMessageData.id)
          chunkMessageIds.push(chunkMessageData.id)
        }
      }
    }

    // Update thread last_message_at
    console.log('[8.4] Updating thread last_message_at...')
    const { error: updateError } = await supabase
      .from('message_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', thread_id)
    
    if (updateError) {
      console.error('[8.4.ERROR] Error updating thread:', updateError)
    }

    // Log API usage for monitoring
    if (openAIData.usage) {
      console.log(`[9] Logging API usage - Tokens: ${openAIData.usage.total_tokens}`)
      
      // Check if api_usage_logs table exists first
      const { data: tables } = await supabase
        .rpc('get_tables', { schema_name: 'public' })
        .catch(() => ({ data: [] }))
      
      const hasApiUsageTable = tables?.some((t: any) => t.table_name === 'api_usage_logs')
      
      if (hasApiUsageTable) {
        await supabase
          .from('api_usage_logs')
          .insert({
            service_name: 'openai',
            endpoint: 'chat.completions',
            user_id: userId,
            tokens_used: openAIData.usage.total_tokens,
            cost: (openAIData.usage.total_tokens / 1000) * 0.002, // Approximate cost
            request_data: { 
              message_length: message.length, 
              lesson_id: effectiveLessonId,
              mode: mode 
            },
            response_data: { 
              response_length: aiMessage.length, 
              chunks_used: relevantChunks.length,
              chunk_message_ids: chunkMessageIds
            },
            response_time_ms: openAITime,
          })
                     .catch((err: any) => console.error('[9.ERROR] Error logging API usage:', err))
      } else {
        console.log('[9.SKIP] api_usage_logs table not found, skipping usage logging')
      }
    }

    const totalTime = Date.now() - startTime
    console.log(`[10] SUCCESS - Total execution time: ${totalTime}ms`)
    console.log('[10.1] Response summary:')
    console.log(`[10.1.1] AI message ID: ${aiMessageData?.id}`)
    console.log(`[10.1.2] Student message ID: ${studentMessageData?.id}`)
    console.log(`[10.1.3] Chunk messages created: ${chunkMessageIds.length}`)
    console.log(`[10.1.4] Total tokens used: ${openAIData.usage?.total_tokens}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: aiMessage,
        relevant_chunks: relevantChunks.map(chunk => chunk.id),
        chunk_details: relevantChunks, // Include full chunk details for client
        student_message_id: studentMessageData?.id,
        ai_message_id: aiMessageData?.id,
        chunk_message_ids: chunkMessageIds,
        usage: openAIData.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[ERROR] Function failed after ${totalTime}ms:`, error)
    console.error('[ERROR.1] Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('[ERROR.2] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[ERROR.3] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
          return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : String(error),
          success: false,
          details: {
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : 'No stack trace'
          }
        }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 