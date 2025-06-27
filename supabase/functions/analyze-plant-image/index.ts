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
    const { imageUrl, studentId } = await req.json();
    if (!imageUrl || !studentId) {
      return new Response(JSON.stringify({
        error: 'Missing imageUrl or studentId'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Processing analysis for student:', studentId, 'image:', imageUrl);
    // Create initial record with pending status
    const { data: analysisRecord, error: insertError } = await supabase.from('image_analysis').insert({
      student_id: studentId,
      image_url: imageUrl,
      processing_status: 'processing'
    }).select().single();
    if (insertError) {
      console.error('Error creating analysis record:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to create analysis record'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Created analysis record:', analysisRecord.id);
    try {
      // Download image and convert to base64
      console.log('Downloading image from:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} - ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      console.log('Image downloaded, size:', imageBuffer.byteLength, 'bytes');
      // Check if image is too large (Gemini API limit is 20MB for images, but we'll be conservative)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (imageBuffer.byteLength > maxSize) {
        throw new Error(`Image too large: ${imageBuffer.byteLength} bytes. Maximum allowed: ${maxSize} bytes. Please compress the image before uploading.`);
      }
      const base64Image = arrayBufferToBase64(imageBuffer);
      console.log('Image converted to base64, size:', base64Image.length);
      const analysisPrompt = `
Analyze this plant image and provide a detailed assessment in the following JSON format. Be specific and educational, as this is for a student learning about plant growth:

{
  "current_stage": {
    "name": "[Stage name like 'Seedling', 'Vegetative Growth', 'Flowering', 'Fruiting', etc.]",
    "description": "[Detailed description of what you observe about the current growth stage, including specific visual indicators]"
  },
  "overall_health": {
    "rating": "[Excellent/Good/Fair/Poor/Critical]",
    "positive_signs": [
      "[Specific positive observations about the plant's health]",
      "[Another positive sign]"
    ],
    "areas_for_improvement": [
      "[Specific issues or areas that need attention]",
      "[Another area for improvement]"
    ]
  },
  "tips": [
    {
      "title": "[Educational tip title]",
      "description": "[Detailed, actionable advice for the student]"
    },
    {
      "title": "[Another tip title]",
      "description": "[Another detailed tip]"
    }
  ]
}

Focus on:
- Identifying the specific growth stage with clear visual evidence
- Providing educational value for students learning about plant biology
- Giving actionable, specific advice rather than generic tips
- Being encouraging while pointing out areas for improvement
- Including 3-5 practical tips that students can implement

Please respond with only the JSON object, no additional text.`;
      // Call Gemini API directly
      console.log('Calling Gemini API...');
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
      console.log('Raw analysis text:', analysisText);
      // Parse the JSON response
      let analysisData;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        analysisData = JSON.parse(jsonMatch[0]);
        console.log('Parsed analysis data:', analysisData);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.error('Raw response:', analysisText);
        throw new Error('Failed to parse AI response');
      }
      // Update the analysis record with results
      console.log('Updating analysis record with results...');
      const { error: updateError } = await supabase.from('image_analysis').update({
        current_stage_name: analysisData.current_stage.name,
        current_stage_description: analysisData.current_stage.description,
        health_rating: analysisData.overall_health.rating,
        positive_signs: analysisData.overall_health.positive_signs,
        areas_for_improvement: analysisData.overall_health.areas_for_improvement,
        tips: analysisData.tips,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', analysisRecord.id);
      if (updateError) {
        console.error('Error updating analysis record:', updateError);
        throw new Error('Failed to save analysis results');
      }
      console.log('Analysis completed successfully');
      return new Response(JSON.stringify({
        success: true,
        analysisId: analysisRecord.id,
        analysis: analysisData
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (analysisError) {
      console.error('Error during analysis:', analysisError);
      // Update record with error status
      await supabase.from('image_analysis').update({
        processing_status: 'failed',
        error_message: analysisError.message,
        updated_at: new Date().toISOString()
      }).eq('id', analysisRecord.id);
      return new Response(JSON.stringify({
        error: 'Analysis failed',
        details: analysisError.message,
        analysisId: analysisRecord.id
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
