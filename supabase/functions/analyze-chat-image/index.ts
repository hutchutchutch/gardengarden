import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  let result = '';
  for(let i = 0; i < bytes.length; i += chunkSize){
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(result);
}
// Helper function to compress image if needed
async function compressImageIfNeeded(imageBuffer, maxSize = 4 * 1024 * 1024) {
  if (imageBuffer.byteLength <= maxSize) {
    return imageBuffer;
  }
  // For now, just return the original buffer
  // In a production environment, you'd implement actual compression
  console.log(`Image size ${imageBuffer.byteLength} exceeds ${maxSize}, but compression not implemented`);
  return imageBuffer;
}
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY not found in environment variables');
      return new Response(JSON.stringify({
        error: 'GOOGLE_API_KEY not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Parse request body
    const { imageUrl, threadId, conversationHistory, plantId, lessonId } = await req.json();
    if (!imageUrl || !threadId || !conversationHistory) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: imageUrl, threadId, conversationHistory'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Processing chat image analysis for thread:', threadId, 'image:', imageUrl);
    try {
      // Download and compress image
      console.log('Downloading image from:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} - ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      console.log('Image downloaded, size:', imageBuffer.byteLength, 'bytes');
      // Compress if needed
      const compressedBuffer = await compressImageIfNeeded(imageBuffer);
      const base64Image = arrayBufferToBase64(compressedBuffer);
      console.log('Image processed, final size:', base64Image.length);
      // Get plant context if plantId provided
      let plantContext = '';
      if (plantId) {
        const { data: plant } = await supabase.from('plants').select('nickname, current_stage, current_health_score, planting_date').eq('id', plantId).single();
        if (plant) {
          const daysSincePlanting = Math.floor((new Date().getTime() - new Date(plant.planting_date).getTime()) / (1000 * 60 * 60 * 24));
          plantContext = `\n\nCurrent plant information:\n- Nickname: ${plant.nickname || 'Unnamed plant'}\n- Growth stage: ${plant.current_stage}\n- Health score: ${plant.current_health_score || 'Not assessed'}/100\n- Days since planting: ${daysSincePlanting}`;
        }
      }
      // Build conversation context from history
      const recentHistory = conversationHistory.slice(-8); // Last 8 messages for context
      const conversationContext = recentHistory.length > 0 ? '\n\nRecent conversation context:\n' + recentHistory.map((msg)=>`${msg.role === 'user' ? 'Student' : msg.role === 'assistant' ? 'Garden Guru AI' : 'Teacher'}: ${msg.content}`).join('\n') : '';
      // Create context-aware prompt for chat analysis
      const analysisPrompt = `You are Garden Guru AI, a knowledgeable and friendly gardening assistant. A student has shared an image in our conversation and wants your analysis and advice.

Please analyze this plant image in the context of our ongoing conversation. Provide a helpful, educational response that:
- Identifies what you see in the image
- Relates to the conversation context if relevant
- Gives specific, actionable advice
- Encourages the student's learning journey
- Uses a conversational, friendly tone
- Includes relevant emojis to make it engaging 🌱

Keep your response concise but informative (2-3 paragraphs), as this is part of an ongoing chat conversation.
${plantContext}
${conversationContext}

Respond with just your analysis and advice text - no JSON formatting needed.`;
      // Call Gemini API for chat-style analysis
      console.log('Calling Gemini API for chat analysis...');
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                  }
                },
                {
                  text: analysisPrompt
                }
              ]
            }
          ]
        })
      });
      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', geminiResponse.status, errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }
      const geminiResult = await geminiResponse.json();
      console.log('Gemini API response received');
      const analysisText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!analysisText) {
        console.error('No analysis text in Gemini response:', geminiResult);
        throw new Error('No analysis text received from Gemini API');
      }
      console.log('Chat image analysis completed successfully');
      return new Response(JSON.stringify({
        success: true,
        message: analysisText.trim()
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (analysisError) {
      console.error('Error during chat image analysis:', analysisError);
      return new Response(JSON.stringify({
        error: 'Analysis failed',
        details: analysisError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
