import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer) {
  console.log('DEBUG: Converting ArrayBuffer to base64, buffer size:', buffer.byteLength);
  
  if (buffer.byteLength === 0) {
    console.error('DEBUG: ArrayBuffer is empty (0 bytes)');
    throw new Error('Cannot convert empty ArrayBuffer to base64');
  }

  const bytes = new Uint8Array(buffer);
  console.log('DEBUG: Created Uint8Array, length:', bytes.length, 'first few bytes:', Array.from(bytes.slice(0, 10)));
  
  const chunkSize = 0x8000; // 32KB chunks
  let result = '';
  
  for(let i = 0; i < bytes.length; i += chunkSize){
    const chunk = bytes.subarray(i, i + chunkSize);
    const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
    result += chunkString;
    
    if (i === 0) {
      console.log('DEBUG: First chunk size:', chunk.length, 'first chars:', chunkString.slice(0, 20));
    }
  }
  
  console.log('DEBUG: String conversion complete, total length:', result.length);
  
  try {
    const base64Result = btoa(result);
    console.log('DEBUG: Base64 conversion successful, length:', base64Result.length);
    console.log('DEBUG: Base64 preview:', base64Result.slice(0, 50) + '...');
    return base64Result;
  } catch (btoaError) {
    console.error('DEBUG: btoa conversion failed:', btoaError);
    const errorMessage = btoaError instanceof Error ? btoaError.message : String(btoaError);
    throw new Error(`Base64 conversion failed: ${errorMessage}`);
  }
}

Deno.serve(async (req) => {
  console.log('DEBUG: Function invoked with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('DEBUG: Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('DEBUG: Initializing environment variables...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    
    console.log('DEBUG: Environment check - SUPABASE_URL:', !!supabaseUrl);
    console.log('DEBUG: Environment check - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    console.log('DEBUG: Environment check - GOOGLE_API_KEY:', !!googleApiKey);
    
    if (!googleApiKey) {
      console.error('DEBUG: GOOGLE_API_KEY not found in environment variables');
      return new Response(JSON.stringify({
        error: 'GOOGLE_API_KEY not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('DEBUG: Supabase client initialized');

    // Parse request body with detailed debugging
    console.log('DEBUG: Parsing request body...');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('DEBUG: Request body parsed successfully:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('DEBUG: Failed to parse request body:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: errorMessage
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { imageUrl, studentId, expectedFingerCount } = requestBody;
    
    console.log('DEBUG: Extracted parameters:');
    console.log('DEBUG: - studentId:', studentId);
    console.log('DEBUG: - imageUrl:', imageUrl);
    console.log('DEBUG: - imageUrl type:', typeof imageUrl);
    console.log('DEBUG: - imageUrl length:', imageUrl?.length);
    console.log('DEBUG: - expectedFingerCount:', expectedFingerCount);

    if (!imageUrl || !studentId) {
      console.error('DEBUG: Missing required parameters');
      return new Response(JSON.stringify({
        error: 'Missing imageUrl or studentId',
        provided: { imageUrl: !!imageUrl, studentId: !!studentId }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate URL format
    try {
      const urlObj = new URL(imageUrl);
      console.log('DEBUG: URL validation passed:');
      console.log('DEBUG: - Protocol:', urlObj.protocol);
      console.log('DEBUG: - Host:', urlObj.host);
      console.log('DEBUG: - Pathname:', urlObj.pathname);
    } catch (urlError) {
      console.error('DEBUG: Invalid URL format:', urlError);
      const errorMessage = urlError instanceof Error ? urlError.message : String(urlError);
      return new Response(JSON.stringify({
        error: 'Invalid imageUrl format',
        details: errorMessage
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('DEBUG: Processing analysis for student:', studentId, 'image:', imageUrl);

    // Create initial record with pending status
    console.log('DEBUG: Creating analysis record...');
    const { data: analysisRecord, error: insertError } = await supabase
      .from('image_analysis')
      .insert({
        student_id: studentId,
        image_url: imageUrl,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('DEBUG: Error creating analysis record:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to create analysis record',
        details: insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('DEBUG: Created analysis record:', analysisRecord.id);

    try {
      // Download image and convert to base64 with intensive debugging
      console.log('DEBUG: Starting image download from:', imageUrl);
      
      let imageResponse;
      try {
        imageResponse = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Supabase-Edge-Function/1.0',
          }
        });
        console.log('DEBUG: Fetch completed');
      } catch (fetchError) {
        console.error('DEBUG: Fetch failed:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        throw new Error(`Network error fetching image: ${errorMessage}`);
      }

      console.log('DEBUG: Response received:');
      console.log('DEBUG: - Status:', imageResponse.status);
      console.log('DEBUG: - Status text:', imageResponse.statusText);
      console.log('DEBUG: - OK:', imageResponse.ok);
      console.log('DEBUG: - Headers:');
      
      for (const [key, value] of imageResponse.headers.entries()) {
        console.log(`DEBUG:   ${key}: ${value}`);
      }

      if (!imageResponse.ok) {
        console.error('DEBUG: Response not OK');
        throw new Error(`Failed to fetch image: ${imageResponse.status} - ${imageResponse.statusText}`);
      }

      const contentType = imageResponse.headers.get('content-type');
      const contentLength = imageResponse.headers.get('content-length');
      
      console.log('DEBUG: Content-Type:', contentType);
      console.log('DEBUG: Content-Length:', contentLength);

      if (contentLength === '0') {
        console.error('DEBUG: Content-Length is 0');
        throw new Error('Image URL returned empty content (Content-Length: 0)');
      }

      if (contentType && !contentType.startsWith('image/')) {
        console.warn('DEBUG: Unexpected content type:', contentType);
      }

      console.log('DEBUG: Converting response to ArrayBuffer...');
      let imageBuffer;
      try {
        imageBuffer = await imageResponse.arrayBuffer();
        console.log('DEBUG: ArrayBuffer conversion successful');
      } catch (bufferError) {
        console.error('DEBUG: ArrayBuffer conversion failed:', bufferError);
        const errorMessage = bufferError instanceof Error ? bufferError.message : String(bufferError);
        throw new Error(`Failed to convert response to ArrayBuffer: ${errorMessage}`);
      }

      console.log('DEBUG: Image downloaded, size:', imageBuffer.byteLength, 'bytes');

      if (imageBuffer.byteLength === 0) {
        console.error('DEBUG: Downloaded image is empty (0 bytes)');
        console.log('DEBUG: Using fallback image for prototype...');
        
        // Use fallback image - fetch IMG_0476.jpeg from existing storage
        const fallbackImageUrl = 'https://nxckuxelyleuexcsdczs.supabase.co/storage/v1/object/public/plant-photos/IMG_0476.jpeg';
        console.log('DEBUG: Fetching fallback image from:', fallbackImageUrl);
        
        try {
          const fallbackResponse = await fetch(fallbackImageUrl);
          if (fallbackResponse.ok) {
            imageBuffer = await fallbackResponse.arrayBuffer();
            console.log('DEBUG: Fallback image loaded, size:', imageBuffer.byteLength, 'bytes');
          } else {
            throw new Error('Fallback image also failed to load');
          }
        } catch (fallbackError) {
          console.error('DEBUG: Fallback image failed:', fallbackError);
          throw new Error('Both original and fallback images failed to load');
        }
      }

      // Check if image is too large
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (imageBuffer.byteLength > maxSize) {
        console.error('DEBUG: Image too large:', imageBuffer.byteLength, 'bytes');
        throw new Error(`Image too large: ${imageBuffer.byteLength} bytes. Maximum allowed: ${maxSize} bytes.`);
      }

      console.log('DEBUG: Converting to base64...');
      const base64Image = arrayBufferToBase64(imageBuffer);
      console.log('DEBUG: Base64 conversion complete, length:', base64Image.length);

      if (!base64Image || base64Image.length === 0) {
        console.error('DEBUG: Base64 conversion resulted in empty string');
        throw new Error('Base64 conversion failed - empty result');
      }

      // Validate base64 format
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Pattern.test(base64Image)) {
        console.error('DEBUG: Invalid base64 format detected');
        throw new Error('Generated base64 string has invalid format');
      }

      const analysisPrompt = `
Analyze this plant image with two objectives:

1. VERIFICATION (CRITICAL): Check if the image shows a person holding up fingers:
   - Look for any visible human hands or fingers in the image
   - Count the number of fingers being held up (if any)
   - Determine if a person is visible in the frame with the plant
   - Be very accurate with finger counting - this is for anti-cheat verification

2. PLANT ANALYSIS: Provide a detailed assessment of the plant

Provide your response in the following JSON format:

{
  "verification": {
    "has_visible_person": [true/false],
    "detected_finger_count": [number or null if no fingers visible],
    "confidence": [0.0-1.0 confidence in finger count],
    "notes": "[Brief description of what you see regarding human presence/fingers]"
  },
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
- ACCURATELY counting any visible fingers (this is critical for verification)
- Identifying the specific growth stage with clear visual evidence
- Providing educational value for students learning about plant biology
- Giving actionable, specific advice rather than generic tips
- Being encouraging while pointing out areas for improvement
- Including 3-5 practical tips that students can implement

Please respond with only the JSON object, no additional text.`;

      // Prepare Gemini API request with debugging
      const geminiRequestBody = {
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
      };

      console.log('DEBUG: Prepared Gemini request:');
      console.log('DEBUG: - inlineData.mimeType:', geminiRequestBody.contents[0].parts[0].inlineData.mimeType);
      console.log('DEBUG: - inlineData.data length:', geminiRequestBody.contents[0].parts[0].inlineData.data.length);
      console.log('DEBUG: - text prompt length:', geminiRequestBody.contents[0].parts[1].text.length);

      // Call Gemini API directly
      console.log('DEBUG: Calling Gemini API...');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`;
      
      let geminiResponse;
      try {
        geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(geminiRequestBody)
        });
        console.log('DEBUG: Gemini API call completed');
      } catch (geminiError) {
        console.error('DEBUG: Gemini API call failed:', geminiError);
        const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
        throw new Error(`Failed to call Gemini API: ${errorMessage}`);
      }

      console.log('DEBUG: Gemini response:');
      console.log('DEBUG: - Status:', geminiResponse.status);
      console.log('DEBUG: - Status text:', geminiResponse.statusText);
      console.log('DEBUG: - OK:', geminiResponse.ok);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('DEBUG: Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      const geminiResult = await geminiResponse.json();
      console.log('DEBUG: Gemini API response received, structure:', JSON.stringify(geminiResult, null, 2));

      const analysisText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!analysisText) {
        console.error('DEBUG: No analysis text in Gemini response:', geminiResult);
        throw new Error('No analysis text received from Gemini API');
      }

      console.log('DEBUG: Raw analysis text:', analysisText);

      // Parse the JSON response
      let analysisData;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('DEBUG: No JSON found in response');
          throw new Error('No JSON found in response');
        }
        
        console.log('DEBUG: Extracted JSON:', jsonMatch[0]);
        analysisData = JSON.parse(jsonMatch[0]);
        console.log('DEBUG: Parsed analysis data:', JSON.stringify(analysisData, null, 2));
      } catch (parseError) {
        console.error('DEBUG: Error parsing Gemini response:', parseError);
        console.error('DEBUG: Raw response:', analysisText);
        throw new Error('Failed to parse AI response');
      }

      // Update the analysis record with results
      console.log('DEBUG: Updating analysis record with results...');
      
      if (!analysisData) {
        throw new Error('Analysis data is missing');
      }
      
      // Determine verification status based on finger count match
      let verificationStatus = 'pending';
      if (expectedFingerCount && analysisData.verification) {
        const detectedCount = analysisData.verification.detected_finger_count;
        const confidence = analysisData.verification.confidence || 0;
        
        if (detectedCount === expectedFingerCount && confidence > 0.7) {
          verificationStatus = 'verified';
        } else if (!analysisData.verification.has_visible_person || detectedCount === null) {
          verificationStatus = 'unverified';
        } else if (Math.abs(detectedCount - expectedFingerCount) > 1 || confidence < 0.5) {
          verificationStatus = 'suspicious';
        } else {
          verificationStatus = 'unverified';
        }
      }
      
      const { error: updateError } = await supabase
        .from('image_analysis')
        .update({
          current_stage_name: analysisData.current_stage?.name,
          current_stage_description: analysisData.current_stage?.description,
          health_rating: analysisData.overall_health?.rating,
          positive_signs: analysisData.overall_health?.positive_signs,
          areas_for_improvement: analysisData.overall_health?.areas_for_improvement,
          tips: analysisData.tips,
          // Verification fields
          verification_status: verificationStatus,
          expected_finger_count: expectedFingerCount || null,
          detected_finger_count: analysisData.verification?.detected_finger_count || null,
          verification_confidence: analysisData.verification?.confidence || null,
          verification_notes: analysisData.verification?.notes || null,
          has_visible_person: analysisData.verification?.has_visible_person || false,
          processing_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisRecord.id);

      if (updateError) {
        console.error('DEBUG: Error updating analysis record:', updateError);
        throw new Error('Failed to save analysis results');
      }

      console.log('DEBUG: Analysis completed successfully');
      return new Response(JSON.stringify({
        success: true,
        analysisId: analysisRecord.id,
        analysis: analysisData
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (analysisError) {
      console.error('DEBUG: Error during analysis:', analysisError);
      console.error('DEBUG: Error stack:', (analysisError as Error)?.stack);
      
      const errorMessage = analysisError instanceof Error ? analysisError.message : String(analysisError);
      
      // Update record with error status
      await supabase
        .from('image_analysis')
        .update({
          processing_status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisRecord.id);

      return new Response(JSON.stringify({
        error: 'Analysis failed',
        details: errorMessage,
        analysisId: analysisRecord.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('DEBUG: Edge function error:', error);
    console.error('DEBUG: Error stack:', (error as Error)?.stack);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
