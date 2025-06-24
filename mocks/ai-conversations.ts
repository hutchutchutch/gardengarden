import { AIMessage } from '@/types';

export const aiConversations: AIMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Why are the leaves on my tomato plant turning yellow?',
    timestamp: '2025-06-22T10:30:00Z'
  },
  {
    id: '2',
    role: 'assistant',
    content: "Yellow leaves on tomato plants can be caused by several factors. The most common reasons are:\n\n1. Overwatering or poor drainage\n2. Nutrient deficiency (especially nitrogen)\n3. Disease or pest issues\n\nLooking at your plant's photo, I notice the yellowing is mainly on the lower leaves, which is often normal as the plant grows. However, make sure you're not overwatering and consider adding a balanced fertilizer if you haven't done so recently.",
    timestamp: '2025-06-22T10:30:30Z'
  },
  {
    id: '3',
    role: 'user',
    content: 'How often should I water my basil plant?',
    timestamp: '2025-06-21T15:45:00Z'
  },
  {
    id: '4',
    role: 'assistant',
    content: "Basil plants prefer consistently moist soil but don't like to be waterlogged. In general:\n\n- Water when the top inch of soil feels dry to the touch\n- During hot weather, this might mean watering every 1-2 days\n- In cooler weather, every 3-4 days may be sufficient\n\nYour basil plant looks healthy in the photo! The current weather forecast shows warm temperatures, so I'd recommend checking the soil moisture daily.",
    timestamp: '2025-06-21T15:45:30Z'
  }
];