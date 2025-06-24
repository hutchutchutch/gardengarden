import { AIPlantAnalysis } from '@/types';

// This would typically call your backend API that uses GPT-4V
// For MVP, we'll simulate the analysis
export const analyzePhoto = async (photoUri: string): Promise<AIPlantAnalysis> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // In production, you would:
  // 1. Convert photo to base64
  // 2. Send to your backend API endpoint
  // 3. Backend calls OpenAI GPT-4V API
  // 4. Return structured analysis

  // Simulated response for MVP testing
  const mockAnalysis: AIPlantAnalysis = {
    healthScore: Math.floor(Math.random() * 30) + 70, // 70-100
    growthStage: ['sprout', 'growing', 'mature'][Math.floor(Math.random() * 3)],
    issues: [
      'Slight yellowing on lower leaves',
      'Could use more water'
    ].slice(0, Math.floor(Math.random() * 3)),
    recommendations: [
      'Water thoroughly in the morning',
      'Add nitrogen-rich fertilizer',
      'Ensure 6-8 hours of sunlight daily'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    measurements: {
      height: Math.floor(Math.random() * 20) + 10,
      leafCount: Math.floor(Math.random() * 10) + 5,
      fruitCount: Math.floor(Math.random() * 5)
    },
    analyzedAt: new Date().toISOString()
  };

  return mockAnalysis;
};

// Backend API endpoint example (for reference):
/*
export const analyzePhotoAPI = async (photoUri: string): Promise<AIPlantAnalysis> => {
  const formData = new FormData();
  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'plant-photo.jpg'
  } as any);

  const response = await fetch('YOUR_BACKEND_URL/api/analyze-plant', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${authToken}`,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to analyze photo');
  }

  return response.json();
};
*/

// Generate care recommendations based on weather
export const generateWeatherBasedTasks = (weather: any, plant: any) => {
  const tasks = [];
  
  if (weather.condition === 'rainy') {
    tasks.push({
      type: 'observe',
      title: 'Check for overwatering',
      description: 'With today\'s rain, check if soil is too wet',
      priority: 'high'
    });
  } else if (weather.temperature > 85) {
    tasks.push({
      type: 'water',
      title: 'Extra watering needed',
      description: 'High temperatures require additional water',
      priority: 'high'
    });
  }

  tasks.push({
    type: 'photo',
    title: 'Daily photo',
    description: 'Document your plant\'s growth',
    priority: 'medium'
  });

  return tasks;
}; 