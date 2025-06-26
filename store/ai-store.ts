import { create } from 'zustand';
import { AIMessage } from '@/types';
import { aiConversations as mockConversations } from '@/mocks/ai-conversations';
import { storage } from '@/utils/storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/config/supabase';

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (content: string, imageUri?: string, mode?: 'ai' | 'teacher', lessonId?: string, plantId?: string) => Promise<void>;
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

      sendMessage: async (content, imageUri, mode = 'ai', lessonId, plantId) => {
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
            // AI mode - use the new edge function
            try {
              // Prepare conversation history (last 5 messages)
              const history = [...get().messages]
                .filter(msg => msg.recipientId === 'ai-assistant' || msg.role === 'assistant')
                .slice(-5)
                .map(msg => ({
                  role: msg.role === 'user' ? 'user' : 'assistant',
                  content: msg.content
                }));

              // Call the edge function
              const { data, error } = await supabase.functions.invoke('ai-chat-with-sources', {
                body: {
                  message: content,
                  lesson_id: lessonId,
                  plant_id: plantId,
                  conversation_history: history,
                  include_sources: true
                }
              });

              if (error) throw error;

              if (data.success) {
                // Add AI response with sources
                const aiResponse: AIMessage = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: data.message,
                  timestamp: new Date().toISOString(),
                  sources: data.sources // This will be the array of source objects
                };
                
                set(state => ({
                  messages: [...state.messages, aiResponse],
                  isLoading: false
                }));
              } else {
                throw new Error(data.error || 'Failed to get AI response');
              }
            } catch (error) {
              console.error('Error calling AI edge function:', error);
              
              // Fallback to a generic response
              const fallbackResponse: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment. If this persists, please contact your teacher.",
                timestamp: new Date().toISOString()
              };
              
              set(state => ({
                messages: [...state.messages, fallbackResponse],
                isLoading: false,
                error: 'Failed to get AI response'
              }));
            }
          }
        } catch (error) {
          set({ 
            error: 'Failed to send message', 
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
      storage: createJSONStorage(() => storage)
    }
  )
);