import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Get the scrape function URL
const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;
// Main handler
serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get the authorization header to pass through to the scrape function
    const authHeader = req.headers.get('Authorization');
    const { lesson_id, urls } = await req.json();
    // Validate inputs
    if (!lesson_id || !urls || urls.length === 0) {
      throw new Error('Missing required fields: lesson_id and urls');
    }
    // Check if lesson exists and user has permission
    const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id, name, vector_store_id').eq('id', lesson_id).single();
    if (lessonError) {
      throw new Error(`Lesson not found: ${lessonError.message}`);
    }
    console.log(`Processing ${urls.length} URLs for lesson: ${lesson.name}`);
    // Create lesson_url records for each URL
    const lessonUrlRecords = [];
    for (const urlData of urls){
      // Check if URL already exists for this lesson
      const { data: existingUrl } = await supabase.from('lesson_urls').select('id').eq('lesson_id', lesson_id).eq('url', urlData.url).single();
      if (existingUrl) {
        console.log(`URL already exists for lesson: ${urlData.url}`);
        lessonUrlRecords.push(existingUrl);
        continue;
      }
      // Create new lesson_url record
      const { data: newUrl, error: insertError } = await supabase.from('lesson_urls').insert({
        lesson_id,
        url: urlData.url,
        title: urlData.title || null,
        processing_status: 'pending'
      }).select().single();
      if (insertError) {
        console.error(`Error creating lesson_url record: ${insertError.message}`);
        continue;
      }
      lessonUrlRecords.push(newUrl);
    }
    // Process each URL by calling the scrape function
    const processingResults = [];
    const errors = [];
    for (const lessonUrl of lessonUrlRecords){
      try {
        console.log(`Calling scrape function for URL: ${lessonUrl.url}`);
        const scrapeResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}/scrape-lesson-url`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: lessonUrl.url,
            lesson_id: lesson_id,
            lesson_url_id: lessonUrl.id
          })
        });
        if (!scrapeResponse.ok) {
          const errorData = await scrapeResponse.text();
          throw new Error(`Scrape function error: ${errorData}`);
        }
        const result = await scrapeResponse.json();
        processingResults.push({
          lesson_url_id: lessonUrl.id,
          url: lessonUrl.url,
          success: true,
          ...result
        });
      } catch (error) {
        console.error(`Error processing URL ${lessonUrl.url}:`, error);
        errors.push({
          lesson_url_id: lessonUrl.id,
          url: lessonUrl.url,
          error: error.message
        });
        // Update the lesson_url record with error status
        await supabase.from('lesson_urls').update({
          processing_status: 'failed',
          error_message: error.message
        }).eq('id', lessonUrl.id);
      }
    }
    // Calculate summary statistics
    const totalUrls = urls.length;
    const successfulUrls = processingResults.length;
    const failedUrls = errors.length;
    const totalChunks = processingResults.reduce((sum, result)=>sum + (result.chunks_created || 0), 0);
    // Return response with processing summary
    return new Response(JSON.stringify({
      success: true,
      lesson_id,
      summary: {
        total_urls: totalUrls,
        successful: successfulUrls,
        failed: failedUrls,
        total_chunks: totalChunks
      },
      results: processingResults,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in process-lesson-urls function:', error);
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
