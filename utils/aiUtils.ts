import { imageToBase64 } from './imageUtils';

type ContentPart = 
  | { type: 'text'; text: string; }
  | { type: 'image'; image: string; }

type CoreMessage = 
  | { role: 'system'; content: string; }  
  | { role: 'user'; content: string | Array<ContentPart>; }
  | { role: 'assistant'; content: string | Array<ContentPart>; };

export const analyzePlantImage = async (imageUri: string): Promise<any> => {
  try {
    const base64Image = await imageToBase64(imageUri);
    
    if (!base64Image) {
      throw new Error('Failed to convert image to base64');
    }
    
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: 'You are a gardening expert AI that analyzes plant images. Provide detailed information about the plant species, health status, care instructions, and any visible issues. Format your response as JSON with the following structure: {"plantName": "Common Name (Scientific Name)", "healthStatus": "Healthy/Needs Attention/Critical", "careInstructions": ["instruction1", "instruction2"], "issues": ["issue1", "issue2"], "confidence": 0.XX}'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this plant and tell me what it is, its health status, care instructions, and any issues you can identify.'
          },
          {
            type: 'image',
            image: base64Image
          }
        ]
      }
    ];
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to parse the AI response as JSON
    try {
      return JSON.parse(data.completion);
    } catch (e) {
      // If parsing fails, return the raw text
      return {
        rawResponse: data.completion,
        error: 'Failed to parse AI response as JSON'
      };
    }
  } catch (error) {
    console.error('Error analyzing plant image:', error);
    throw error;
  }
};