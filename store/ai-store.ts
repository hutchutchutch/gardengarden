import { create } from 'zustand';
import { AIMessage } from '@/types';
import { aiConversations as mockConversations } from '@/mocks/ai-conversations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (content: string, imageUri?: string, mode?: 'ai' | 'teacher') => Promise<void>;
  clearConversation: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,

      fetchMessages: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          set({ messages: mockConversations, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch messages', isLoading: false });
        }
      },

      sendMessage: async (content, imageUri, mode = 'ai') => {
        set({ isLoading: true, error: null });
        try {
          // Add user message
          const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
            recipientId: mode === 'ai' ? 'ai-assistant' : 'teacher-id' // In real app, get actual teacher ID
          };
          
          set(state => ({
            messages: [...state.messages, userMessage]
          }));

          if (mode === 'teacher') {
            // In a real app, this would send to teacher via Supabase
            // For now, simulate teacher response
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const teacherResponse: AIMessage = {
              id: (Date.now() + 1).toString(),
              role: 'teacher',
              content: "I've received your message! I'll review your plant's progress and get back to you soon. Keep up the great work with your daily care routine!",
              timestamp: new Date().toISOString(),
              recipientId: 'student-id' // In real app, get actual student ID
            };
            
            set(state => ({
              messages: [...state.messages, teacherResponse],
              isLoading: false
            }));
          } else {
            // AI mode - existing logic
            // In a real app, this would call an AI API
            // For now, we'll simulate a response
            
            // Prepare the message content for the AI
            let messages = [];
            
            // Add system message
            messages.push({
              role: 'system',
              content: 'You are a helpful gardening assistant that provides advice on plant care, identification, and troubleshooting. Keep responses concise and educational.'
            });
            
            // Add conversation history (last 5 messages)
            const history = [...get().messages].slice(-5);
            messages = [
              ...messages,
              ...history.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            ];
            
            // Add image if provided - but we need to handle this differently
            // since our AIMessage type expects content to be a string
            if (imageUri) {
              // In a real implementation, we would handle image content properly
              // For now, we'll just add a note about the image in the content
              messages.push({
                role: 'user',
                content: `${content} [Image attached]`
              });
            }
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate a mock response based on the user's query
            let responseContent = '';
            if (content.toLowerCase().includes('water')) {
              responseContent = "Watering depends on the plant type and current weather. Most garden plants need about 1-2 inches of water per week. Check the soil moisture by inserting your finger about an inch deep - if it feels dry, it's time to water. The current weather forecast shows it will be warm, so you might need to water more frequently.";
            } else if (content.toLowerCase().includes('fertilize') || content.toLowerCase().includes('feed')) {
              responseContent = "Most plants benefit from fertilization during their growing season. Use a balanced fertilizer (like 10-10-10) for general feeding, or choose specialized formulations for flowering or fruiting plants. Apply fertilizer every 4-6 weeks during the growing season, following package instructions for amounts.";
            } else if (content.toLowerCase().includes('pest') || content.toLowerCase().includes('bug')) {
              responseContent = "I notice some potential pest damage in your photo. Common garden pests include aphids, caterpillars, and slugs. For organic control, try neem oil spray, insecticidal soap, or introducing beneficial insects like ladybugs. Remember to inspect the undersides of leaves regularly, as many pests hide there.";
            } else {
              responseContent = "Your plants are looking healthy overall! Continue with your regular care routine, making sure to water consistently and monitor for any signs of stress. As the weather warms up, watch for increased water needs. The growth pattern looks normal for this stage of development.";
            }
            
            // Add AI response
            const aiResponse: AIMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: responseContent,
              timestamp: new Date().toISOString()
            };
            
            set(state => ({
              messages: [...state.messages, aiResponse],
              isLoading: false
            }));
          }
        } catch (error) {
          set({ 
            error: 'Failed to get AI response', 
            isLoading: false 
          });
        }
      },

      clearConversation: async () => {
        set({ messages: [], error: null });
      }
    }),
    {
      name: 'ai-conversation-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);