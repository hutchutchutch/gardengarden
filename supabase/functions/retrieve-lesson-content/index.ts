import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Get API keys from environment
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
// Create embeddings using OpenAI
async function createEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}
// Main handler
serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { query, lesson_id, limit = 5, threshold = 0.7 } = await req.json();
    // Validate inputs
    if (!query || !lesson_id) {
      throw new Error('Missing required fields: query and lesson_id');
    }
    // Create embedding for the query
    console.log('Creating embedding for query:', query);
    const queryEmbedding = await createEmbedding(query);
    // Get lesson URLs for this lesson
    const { data: lessonUrls, error: urlError } = await supabase.from('lesson_urls').select('id, url, title').eq('lesson_id', lesson_id).eq('processing_status', 'completed');
    if (urlError) throw urlError;
    if (!lessonUrls || lessonUrls.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        results: [],
        message: 'No processed URLs found for this lesson'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    const lessonUrlIds = lessonUrls.map((url)=>url.id);
    // Perform vector similarity search
    console.log('Performing vector similarity search...');
    const { data: searchResults, error: searchError } = await supabase.rpc('match_url_chunks', {
      query_embedding: queryEmbedding,
      lesson_url_ids: lessonUrlIds,
      match_threshold: threshold,
      match_count: limit
    });
    if (searchError) {
      console.error('Search error:', searchError);
      // Fallback to text search if vector search fails
      const { data: textResults, error: textError } = await supabase.from('url_chunks').select('id, content, lesson_url_id, metadata').in('lesson_url_id', lessonUrlIds).textSearch('content', query).limit(limit);
      if (textError) throw textError;
      // Map text results to include URL information
      const resultsWithUrls = textResults.map((chunk)=>{
        const lessonUrl = lessonUrls.find((url)=>url.id === chunk.lesson_url_id);
        return {
          ...chunk,
          similarity: 0.5,
          source_url: lessonUrl?.url,
          source_title: lessonUrl?.title
        };
      });
      return new Response(JSON.stringify({
        success: true,
        results: resultsWithUrls,
        search_type: 'text',
        query
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // Map results to include URL information
    const resultsWithUrls = searchResults.map((chunk)=>{
      const lessonUrl = lessonUrls.find((url)=>url.id === chunk.lesson_url_id);
      return {
        ...chunk,
        source_url: lessonUrl?.url,
        source_title: lessonUrl?.title
      };
    });
    // Update retrieval count for the lesson URLs that were retrieved
    const retrievedUrlIds = [
      ...new Set(resultsWithUrls.map((r)=>r.lesson_url_id))
    ];
    for (const urlId of retrievedUrlIds){
      await supabase.rpc('increment', {
        table_name: 'lesson_urls',
        column_name: 'retrieval_count',
        row_id: urlId
      }).catch((err)=>console.error('Error updating retrieval count:', err));
    }
    // Update rag_references count for lesson URLs
    for (const urlId of retrievedUrlIds){
      await supabase.from('lesson_urls').update({
        rag_references: resultsWithUrls.filter((r)=>r.lesson_url_id === urlId).length
      }).eq('id', urlId).catch((err)=>console.error('Error updating rag_references:', err));
    }
    return new Response(JSON.stringify({
      success: true,
      results: resultsWithUrls,
      search_type: 'vector',
      query,
      total_sources: retrievedUrlIds.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in retrieve-lesson-content function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
