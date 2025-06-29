// STARTUP DEBUGGING - This runs immediately when function loads
console.log('[STARTUP] 🚀 Edge Function loading...');

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Initialize Supabase client with error handling
let supabase: any;
try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  console.log('[STARTUP] Creating Supabase client...');
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('[STARTUP] ✅ Supabase client created successfully');
} catch (error) {
  console.error('[STARTUP] ❌ Failed to initialize Supabase client:', error);
  throw error;
}

// Get API keys from environment with validation
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!FIRECRAWL_API_KEY) {
  console.error('[STARTUP] ❌ Missing FIRECRAWL_API_KEY environment variable');
}
if (!OPENAI_API_KEY) {
  console.error('[STARTUP] ❌ Missing OPENAI_API_KEY environment variable');
}

console.log('[STARTUP] ✅ Environment variables loaded');

// Configuration constants
const FIRECRAWL_TIMEOUT = 30000; // 30 seconds max for Firecrawl (increased from 25s)
const EMBEDDING_TIMEOUT = 15000; // 15 seconds per embedding
const MAX_CHUNKS = 20; // Reduced from 30
const MAX_CONTENT_SIZE = 200000; // Reduced from 300KB to 200KB

// Clean text for embedding by removing URLs and long strings
function cleanTextForEmbedding(text: string): string {
  console.log('[CLEANING] Starting text cleaning, original length:', text.length);
  
  // Remove URLs (anything starting with http:// or https:// or www.)
  text = text.replace(/https?:\/\/[^\s]+/gi, '');
  text = text.replace(/www\.[^\s]+/gi, '');
  
  // Remove email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  
  // Split into words and filter out long strings
  const words = text.split(/\s+/);
  const filteredWords = words.filter(word => {
    // Remove words over 30 characters (likely to be IDs, hashes, or other non-meaningful content)
    if (word.length > 30) return false;
    
    // Remove words that look like file paths
    if (word.includes('/') && word.split('/').length > 2) return false;
    
    // Remove words that look like base64 or hex strings (consecutive alphanumeric without meaningful structure)
    if (word.length > 20 && /^[a-zA-Z0-9]+$/.test(word)) return false;
    
    // Remove words with excessive special characters
    const specialCharCount = (word.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialCharCount > word.length * 0.5) return false;
    
    return true;
  });
  
  // Rejoin the filtered words
  text = filteredWords.join(' ');
  
  // Clean up excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove any remaining very long continuous strings without spaces
  text = text.replace(/[^\s]{50,}/g, '');
  
  const originalLength = arguments[0].length;
  const reduction = originalLength > 0 ? Math.round((1 - text.length / originalLength) * 100) : 0;
  console.log('[CLEANING] Cleaned text length:', text.length, 'reduction:', reduction + '%');
  
  return text;
}

// Word-based chunking function that cuts off after periods
function chunkTextBySections(text: string, targetWords = 250): string[] {
  console.log('[CHUNKING] Starting word-based chunking, content length:', text.length);
  
  if (text.length > MAX_CONTENT_SIZE) {
    console.log('[CHUNKING] Content too large, truncating');
    text = text.substring(0, MAX_CONTENT_SIZE);
  }
  
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  
  console.log('[CHUNKING] Total words:', words.length, 'Target words per chunk:', targetWords);
  
  let currentChunk = '';
  let wordCount = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentChunk += (wordCount > 0 ? ' ' : '') + word;
    wordCount++;
    
    // Check if we've reached our target word count
    if (wordCount >= targetWords) {
      // Look for the next sentence ending (period, exclamation, question mark)
      let foundSentenceEnd = false;
      let lookAheadIndex = i + 1;
      
      // Check if current word already ends with sentence punctuation
      if (/[.!?]$/.test(word)) {
        foundSentenceEnd = true;
      } else {
        // Look ahead for next sentence ending, but don't go too far
        const maxLookAhead = Math.min(50, words.length - i - 1); // Max 50 words ahead
        
        for (let j = 0; j < maxLookAhead; j++) {
          const nextWord = words[lookAheadIndex + j];
          currentChunk += ' ' + nextWord;
          
          if (/[.!?]$/.test(nextWord)) {
            foundSentenceEnd = true;
            i = lookAheadIndex + j; // Skip these words in main loop
            break;
          }
        }
      }
      
      // Add the chunk and reset
      chunks.push(currentChunk.trim());
      currentChunk = '';
      wordCount = 0;
      
      // If we couldn't find a sentence end, just continue with next chunk
      if (!foundSentenceEnd && chunks.length % 10 === 0) {
        console.log('[CHUNKING] Warning: No sentence end found for chunk', chunks.length);
      }
    }
  }
  
  // Add any remaining content as the final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  console.log('[CHUNKING] Created', chunks.length, 'chunks, average words per chunk:', Math.round(words.length / chunks.length));
  
  // Log chunk sizes for debugging
  chunks.slice(0, 3).forEach((chunk, index) => {
    const chunkWords = chunk.split(/\s+/).length;
    console.log(`[CHUNKING] Chunk ${index + 1} has ${chunkWords} words`);
  });
  
  return chunks.slice(0, MAX_CHUNKS);
}

// Create embedding with timeout
async function createEmbedding(text: string): Promise<number[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT);
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Main handler
console.log('[STARTUP] 🎯 Registering request handler...');

try {
  serve(async (req: Request) => {
    console.log('[REQUEST] 📨 Received request:', req.method);
    
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    
    const startTime = Date.now();
    let lessonUrlRecord: any = null;
    
    try {
      const { url, lesson_id, lesson_url_id } = await req.json();
      
      console.log('[SCRAPE] Processing URL:', url);
      
      // Validate inputs
      if (!url || !lesson_id) {
        throw new Error('Missing required fields: url and lesson_id');
      }
      
      // Create or get lesson_url record
      if (lesson_url_id) {
        const { data, error } = await supabase
          .from('lesson_urls')
          .select('*')
          .eq('id', lesson_url_id)
          .single();
        if (error) throw error;
        lessonUrlRecord = data;
      } else {
        const { data, error } = await supabase
          .from('lesson_urls')
          .insert({
            lesson_id,
            url: url.trim(),
            processing_status: 'processing',
            processing_progress: 10
          })
          .select()
          .single();
        if (error) throw error;
        lessonUrlRecord = data;
      }
      
      // Update status
      await supabase
        .from('lesson_urls')
        .update({
          processing_status: 'processing',
          processing_progress: 20,
          error_message: null
        })
        .eq('id', lessonUrlRecord.id);
      
      // Call Firecrawl API
      console.log('[FIRECRAWL] Calling API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT);
      
      let firecrawlResponse;
      try {
        firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url.trim(),
            formats: ['markdown'],
            waitFor: 5000,  // Increased wait time
            timeout: 25000   // Increased timeout to better handle slow sites
          }),
          signal: controller.signal
        });
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('[FIRECRAWL] Request error:', error);
        
        // Update lesson URL with error status for timeout or network errors
        if (lessonUrlRecord?.id) {
          await supabase
            .from('lesson_urls')
            .update({
              processing_status: 'failed',
              error_message: error.name === 'AbortError' ? 'Request timeout - website took too long to respond' : 'Network error while fetching website',
              processing_progress: 0
            })
            .eq('id', lessonUrlRecord.id);
        }
        
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
      
      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text();
        console.error('[FIRECRAWL] API error response:', errorText);
        
        // Update lesson URL with error status
        await supabase
          .from('lesson_urls')
          .update({
            processing_status: 'failed',
            error_message: `Firecrawl API error: ${firecrawlResponse.status}`,
            processing_progress: 0
          })
          .eq('id', lessonUrlRecord.id);
        
        throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
      }
      
      const firecrawlData = await firecrawlResponse.json();
      if (!firecrawlData.success || !firecrawlData.data) {
        // Update lesson URL with error status
        await supabase
          .from('lesson_urls')
          .update({
            processing_status: 'failed',
            error_message: firecrawlData.error || 'Failed to scrape URL',
            processing_progress: 0
          })
          .eq('id', lessonUrlRecord.id);
        
        throw new Error(firecrawlData.error || 'Failed to scrape URL');
      }
      
      const { markdown, metadata } = firecrawlData.data;
      const title = metadata?.title || 'Untitled Resource';
      
      console.log('[FIRECRAWL] Success, content length:', markdown.length);
      
      // Clean the content before chunking
      const cleanedContent = cleanTextForEmbedding(markdown);
      console.log('[PROCESSING] Content cleaned, original:', markdown.length, 'cleaned:', cleanedContent.length);
      
      // Update with content
      const updateData: any = {
        processing_progress: 40,
        title,
        scraped_content: markdown,
        metadata
      };
      
      // Try to update with cleaned_content, but handle if column doesn't exist
      try {
        updateData.cleaned_content = cleanedContent;
      } catch (e) {
        console.log('[WARNING] cleaned_content column may not exist yet');
      }
      
      await supabase
        .from('lesson_urls')
        .update(updateData)
        .eq('id', lessonUrlRecord.id);
      
      // Chunk the cleaned content
      const chunks = chunkTextBySections(cleanedContent);
      
      // Update progress
      await supabase
        .from('lesson_urls')
        .update({
          processing_progress: 60
        })
        .eq('id', lessonUrlRecord.id);
      
      // Process chunks in smaller batches
      console.log('[EMBEDDING] Processing', chunks.length, 'chunks');
      const chunkRecords: any[] = [];
      const BATCH_SIZE = 2; // Smaller batch size
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (chunk, batchIndex) => {
          const chunkIndex = i + batchIndex;
          try {
            console.log(`[EMBEDDING] Processing chunk ${chunkIndex + 1}/${chunks.length}`);
            const embedding = await createEmbedding(chunk);
            
            const { data, error } = await supabase
              .from('url_chunks')
              .insert({
                lesson_url_id: lessonUrlRecord.id,
                content: chunk,
                chunk_index: chunkIndex,
                embedding,
                metadata: {
                  source_url: url.trim(),
                  title,
                  chunk_position: `${chunkIndex + 1} of ${chunks.length}`
                }
              })
              .select()
              .single();
            
            if (error) {
              console.error('[DB] Error storing chunk:', error);
              return null;
            }
            return data;
          } catch (error) {
            console.error('[EMBEDDING] Error processing chunk:', error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        chunkRecords.push(...batchResults.filter(r => r !== null));
        
        // Update progress
        const progress = 60 + Math.floor(((i + BATCH_SIZE) / chunks.length) * 30);
        await supabase
          .from('lesson_urls')
          .update({
            processing_progress: Math.min(progress, 90)
          })
          .eq('id', lessonUrlRecord.id);
      }
      
      // Update completion status
      await supabase
        .from('lesson_urls')
        .update({
          processing_status: 'completed',
          processing_progress: 100,
          chunk_count: chunkRecords.length,
          processed_at: new Date().toISOString()
        })
        .eq('id', lessonUrlRecord.id);
      
      const totalTime = Date.now() - startTime;
      console.log('[SUCCESS] Processing completed in', totalTime + 'ms');
      
      return new Response(JSON.stringify({
        success: true,
        lesson_url_id: lessonUrlRecord.id,
        chunks_created: chunkRecords.length,
        title,
        processing_time_ms: totalTime
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('[ERROR] Function failed:', error);
      
      // Simple error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let userMessage = 'Failed to process URL. Please try again.';
      
      if (errorMessage.includes('timeout')) {
        userMessage = 'The website took too long to respond. Please try again later.';
      } else if (errorMessage.includes('403') || errorMessage.includes('protection')) {
        userMessage = 'This website cannot be scraped. Please try a different URL.';
      } else if (errorMessage.includes('network')) {
        userMessage = 'Network error occurred. Please check your connection.';
      }
      
      // Update lesson_url record with error status if we have the record
      if (lessonUrlRecord?.id) {
        try {
          await supabase
            .from('lesson_urls')
            .update({
              processing_status: 'failed',
              error_message: userMessage,
              processing_progress: 0
            })
            .eq('id', lessonUrlRecord.id);
        } catch (updateError) {
          console.error('[ERROR] Failed to update lesson_url status:', updateError);
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        user_message: userMessage,
        processing_time_ms: totalTime
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
  });
  
  console.log('[STARTUP] ✅ Request handler registered successfully');
} catch (startupError) {
  console.error('[STARTUP] ❌ CRITICAL: Failed to register request handler:', startupError);
  throw startupError;
}
