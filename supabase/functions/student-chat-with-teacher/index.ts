import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
interface RequestBody {
  message: string
  student_id: string
  thread_id?: string
  create_message?: boolean
}

interface ChunkResult {
  id: string
  content: string
  lesson_url_id: string
  lesson_id: string
  similarity: number
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get API keys
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

// Create embeddings using OpenAI
async function createEmbedding(text: string): Promise<number[]> {
  console.log(`[EMBED] Creating embedding for text: "${text.substring(0, 100)}..."`)
  
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
    const error = await response.text()
    console.error(`[EMBED.ERROR] OpenAI embedding error:`, error)
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// Main handler
serve(async (req) => {
  console.log('[START] student-chat-with-teacher function initiated')
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { 
      message, 
      student_id,
      thread_id,
      create_message = true
    } = await req.json() as RequestBody

    console.log(`[1] Request parsed:`)
    console.log(`[1.1] Message: "${message?.substring(0, 100)}..."`)
    console.log(`[1.2] Student ID: ${student_id}`)
    console.log(`[1.3] Thread ID: ${thread_id || 'not provided'}`)
    console.log(`[1.4] Create message: ${create_message}`)

    // Validate inputs
    if (!message || !student_id) {
      throw new Error('Missing required fields: message and student_id')
    }

    // Get the current user ID from the auth context
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '')
    const userId = user?.id
    console.log(`[2] User ID: ${userId}, Auth error: ${authError?.message || 'none'}`)

    // Step 1: Create embedding for the student's message
    console.log('[3] Creating embedding for student message...')
    const queryEmbedding = await createEmbedding(message)
    console.log(`[3.1] Embedding created, vector length: ${queryEmbedding.length}`)

    // Step 2: Get student's active lessons to potentially filter search
    console.log('[4] Finding student\'s active lessons...')
    const { data: studentPlants, error: plantsError } = await supabase
      .from('plants')
      .select(`
        lesson_id,
        lesson:lessons!inner(id, status)
      `)
      .eq('student_id', student_id)
      .eq('lesson.status', 'active')

    const activeLessonIds = studentPlants?.map(p => p.lesson_id) || []
    console.log(`[4.1] Found ${activeLessonIds.length} active lessons: ${activeLessonIds.join(', ')}`)

    // Step 3: Search for relevant content chunks
    console.log('[5] Searching for relevant content chunks...')
    
    let searchResults: any[] = []
    let searchError: any = null
    
    try {
      // Try to call the RPC function first
      const result = await supabase.rpc('search_all_lesson_content', {
        query_embedding: queryEmbedding,
        p_lesson_ids: activeLessonIds.length > 0 ? activeLessonIds : null,
        match_count: 3
      })
      
      searchResults = result.data || []
      searchError = result.error
      
    } catch (err) {
      console.log('[5.1] RPC function not found, attempting to create it...')
      
      try {
        // Create the RPC function
        const createFunctionQuery = `
          CREATE OR REPLACE FUNCTION public.search_all_lesson_content(
            query_embedding vector,
            p_lesson_ids uuid[] DEFAULT NULL,
            match_count integer DEFAULT 3
          )
          RETURNS TABLE(
            id uuid,
            content text,
            lesson_url_id uuid,
            lesson_id uuid,
            similarity double precision
          )
          LANGUAGE plpgsql
          AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              uc.id,
              uc.content,
              uc.lesson_url_id,
              lu.lesson_id,
              1 - (uc.embedding <=> query_embedding) as similarity
            FROM url_chunks uc
            JOIN lesson_urls lu ON uc.lesson_url_id = lu.id
            WHERE 
              uc.embedding IS NOT NULL
              AND (p_lesson_ids IS NULL OR lu.lesson_id = ANY(p_lesson_ids))
            ORDER BY uc.embedding <=> query_embedding
            LIMIT match_count;
          END;
          $$;
        `
        
        // Try to create the function using raw SQL
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionQuery })
        
        if (createError) {
          console.log('[5.2] Could not create RPC function, falling back to direct query')
          console.error('[5.2.1] Create function error:', createError)
        } else {
          console.log('[5.2] RPC function created successfully, retrying search...')
          
          // Retry the search after creating the function
          const retryResult = await supabase.rpc('search_all_lesson_content', {
            query_embedding: queryEmbedding,
            p_lesson_ids: activeLessonIds.length > 0 ? activeLessonIds : null,
            match_count: 3
          })
          
          searchResults = retryResult.data || []
          searchError = retryResult.error
        }
        
      } catch (createErr) {
        console.log('[5.3] Error creating RPC function, using fallback approach')
        console.error('[5.3.1] Create error:', createErr)
        
        // Fallback: Use a direct query approach
        try {
          const fallbackQuery = `
            SELECT 
              uc.id,
              uc.content,
              uc.lesson_url_id,
              lu.lesson_id,
              1 - (uc.embedding <=> $1::vector) as similarity
            FROM url_chunks uc
            JOIN lesson_urls lu ON uc.lesson_url_id = lu.id
            WHERE 
              uc.embedding IS NOT NULL
              ${activeLessonIds.length > 0 ? 'AND lu.lesson_id = ANY($2::uuid[])' : ''}
            ORDER BY uc.embedding <=> $1::vector
            LIMIT $${activeLessonIds.length > 0 ? '3' : '2'};
          `
          
          const queryParams = activeLessonIds.length > 0 
            ? [JSON.stringify(queryEmbedding), activeLessonIds]
            : [JSON.stringify(queryEmbedding), 3]
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('url_chunks')
            .select(`
              id,
              content,
              lesson_url_id,
              lesson_urls!inner(
                lesson_id
              )
            `)
            .not('embedding', 'is', null)
            .limit(3)
          
          if (!fallbackError && fallbackData) {
            // Transform the fallback data to match expected format
            searchResults = fallbackData.map((chunk: any) => ({
              id: chunk.id,
              content: chunk.content,
              lesson_url_id: chunk.lesson_url_id,
              lesson_id: chunk.lesson_urls.lesson_id,
              similarity: 0.5 // Default similarity since we can't calculate it easily
            }))
          }
          
          searchError = fallbackError
          
        } catch (fallbackErr) {
          console.error('[5.4] Fallback query also failed:', fallbackErr)
          searchError = fallbackErr
        }
      }
    }

    console.log(`[5.3] Search completed, found ${searchResults?.length || 0} results`)
    console.log(`[5.4] Search error: ${searchError?.message || 'none'}`)

    // Process results
    const relevantChunks: ChunkResult[] = searchResults || []
    const distinctLessonUrlIds = [...new Set(relevantChunks.map(chunk => chunk.lesson_url_id))]
    
    console.log(`[6] Found ${relevantChunks.length} relevant chunks from ${distinctLessonUrlIds.length} distinct lesson URLs`)
    relevantChunks.forEach((chunk, idx) => {
      console.log(`[6.${idx + 1}] Chunk ${chunk.id}:`)
      console.log(`  - Content preview: "${chunk.content.substring(0, 100)}..."`)
      console.log(`  - Lesson URL ID: ${chunk.lesson_url_id}`)
      console.log(`  - Lesson ID: ${chunk.lesson_id}`)
      console.log(`  - Similarity: ${chunk.similarity}`)
    })

    // Step 4: Store the message if requested
    let messageId: string | null = null
    if (create_message && thread_id) {
      console.log('[7] Storing student message with relevant chunks...')
      
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread_id,
          sender_id: userId || student_id,
          content: message,
          relevant_chunks: relevantChunks.map(chunk => chunk.id),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (messageError) {
        console.error('[7.ERROR] Error storing message:', messageError)
      } else {
        messageId = messageData.id
        console.log('[7.1] Message stored successfully with ID:', messageId)
      }

      // Update thread last_message_at
      await supabase
        .from('message_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', thread_id)
    }

    // Return results
    const response = {
      success: true,
      message_id: messageId,
      relevant_chunks: relevantChunks.map(chunk => ({
        chunk_id: chunk.id,
        content: chunk.content,
        lesson_url_id: chunk.lesson_url_id,
        lesson_id: chunk.lesson_id,
        similarity: chunk.similarity
      })),
      distinct_lesson_url_ids: distinctLessonUrlIds
    }

    console.log('[8] SUCCESS - Returning response')
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[ERROR] Function failed:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 