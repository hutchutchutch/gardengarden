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
}

interface Source {
  id: string
  url: string
  title: string
  snippet: string
  similarity?: number
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

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// Main handler
serve(async (req) => {
  const startTime = Date.now()
  console.log('[START] ai-chat-with-storage function initiated')
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[1] Parsing request body...')
    const { 
      message, 
      thread_id,
      lesson_id, 
      plant_id,
      conversation_history = [], 
      include_sources = true 
    } = await req.json() as RequestBody

    console.log(`[2] Request parsed - Message: "${message?.substring(0, 50)}...", Thread: ${thread_id}, Lesson: ${lesson_id}`)

    // Validate inputs
    if (!message || !thread_id) {
      throw new Error('Missing required fields: message and thread_id')
    }

    let relevantChunks: string[] = []
    let contextText = ''

    // If we have a lesson_id, retrieve relevant content and store chunk IDs
    if (lesson_id && include_sources) {
      const retrieveStartTime = Date.now()
      console.log(`[3] Starting content retrieval for lesson: ${lesson_id}`)
      
      try {
        // Generate embedding for the message
        console.log('[3.1] Creating embedding for student message...')
        const queryEmbedding = await createEmbedding(message)
        
        // Use our vector search function
        console.log('[3.2] Searching for relevant chunks...')
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_lesson_content', {
            query_embedding: queryEmbedding,
            p_lesson_id: lesson_id,
            match_count: 3
          })

        const retrieveTime = Date.now() - retrieveStartTime
        console.log(`[3.3] Content retrieval took ${retrieveTime}ms`)

        if (!searchError && searchResults && searchResults.length > 0) {
          console.log(`[3.4] Retrieved ${searchResults.length} relevant chunks`)
          
          // Store chunk IDs for the database
          relevantChunks = searchResults.map((chunk: any) => chunk.id)
          
          // Create context from the retrieved content
          contextText = searchResults
            .map((chunk: any, idx: number) => `[Source ${idx + 1}]: ${chunk.content.substring(0, 300)}...`)
            .join('\n\n')
          
          console.log(`[3.5] Created context text of ${contextText.length} characters`)
        } else {
          console.log('[3.6] No relevant chunks found or search error:', searchError)
        }
      } catch (error) {
        console.error('[3.EXCEPTION] Error retrieving lesson content:', error)
        // Continue without context if retrieval fails
      }
    } else {
      console.log('[3.SKIP] Skipping content retrieval - no lesson_id or sources disabled')
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
        console.log(`[4.1] Plant query took ${plantTime}ms`)

        if (plant && !error) {
          const daysSincePlanting = Math.floor(
            (new Date().getTime() - new Date(plant.planting_date).getTime()) / (1000 * 60 * 60 * 24)
          )
          plantContext = `\n\nCurrent plant information:\n- Nickname: ${plant.nickname || 'Unnamed plant'}\n- Growth stage: ${plant.current_stage}\n- Health score: ${plant.current_health_score || 'Not assessed'}/100\n- Days since planting: ${daysSincePlanting}`
          
          console.log('[4.2] Plant context created successfully')
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

    // Get the current user ID from the auth context
    const authHeader = req.headers.get('Authorization')
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '')
    const userId = user?.id

    // Store student message with relevant chunks
    console.log('[7] Storing student message...')
    const { data: studentMessageData, error: studentMessageError } = await supabase
      .from('messages')
      .insert({
        thread_id: thread_id,
        sender_id: userId,
        content: message,
        relevant_chunks: relevantChunks,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (studentMessageError) {
      console.error('[7.ERROR] Error storing student message:', studentMessageError)
    } else {
      console.log('[7.1] Student message stored successfully')
    }

    // Store AI response with same relevant chunks for reference
    console.log('[8] Storing AI response...')
    const { data: aiMessageData, error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        thread_id: thread_id,
        sender_id: null, // AI assistant doesn't have a user ID
        content: aiMessage,
        relevant_chunks: relevantChunks, // Store same chunks for reference
        ai_sources: relevantChunks.length > 0 ? relevantChunks.map(id => ({ chunk_id: id })) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (aiMessageError) {
      console.error('[8.ERROR] Error storing AI response:', aiMessageError)
    } else {
      console.log('[8.1] AI response stored successfully')
    }

    // Update thread last_message_at
    await supabase
      .from('message_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', thread_id)

    // Log API usage for monitoring
    if (openAIData.usage) {
      console.log(`[9] Logging API usage - Tokens: ${openAIData.usage.total_tokens}`)
      await supabase
        .from('api_usage_logs')
        .insert({
          service_name: 'openai',
          endpoint: 'chat.completions',
          user_id: userId,
          tokens_used: openAIData.usage.total_tokens,
          cost: (openAIData.usage.total_tokens / 1000) * 0.002, // Approximate cost
          request_data: { message_length: message.length, lesson_id },
          response_data: { response_length: aiMessage.length, chunks_used: relevantChunks.length },
          response_time_ms: openAITime,
        })
        .catch(err => console.error('[9.ERROR] Error logging API usage:', err))
    }

    const totalTime = Date.now() - startTime
    console.log(`[10] SUCCESS - Total execution time: ${totalTime}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        message: aiMessage,
        relevant_chunks: relevantChunks,
        student_message_id: studentMessageData?.id,
        ai_message_id: aiMessageData?.id,
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
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 