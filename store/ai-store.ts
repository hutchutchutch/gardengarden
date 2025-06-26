import { create } from 'zustand';
import { AIMessage } from '@/types';
import { storage } from '@/utils/storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/config/supabase';
import { MessageService } from '@/services/message-service';

interface AIState {
  messages: AIMessage[];
  currentThreadId: string | null;
  isLoading: boolean;
  isAILoading: boolean; // Separate loading state for AI responses
  error: string | null;
  
  // Actions
  initializeThread: (studentId: string, teacherId: string) => Promise<void>;
  initializeExistingThread: (threadId: string) => Promise<void>;
  initializeDefaultThread: () => Promise<void>; // Helper for testing with Hutch users
  fetchMessages: (threadId?: string) => Promise<void>;
  sendMessage: (content: string, imageUri?: string, mode?: 'ai' | 'teacher', lessonId?: string, plantId?: string) => Promise<void>;
  clearConversation: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentThreadId: null,
      isLoading: false,
      isAILoading: false,
      error: null,

      initializeThread: async (studentId: string, teacherId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Get or create thread between student and teacher
          const thread = await MessageService.getOrCreateThread(studentId, teacherId);
          set({ currentThreadId: thread.id });
          
          // Fetch existing messages for this thread
          await get().fetchMessages(thread.id);
        } catch (error) {
          console.error('Error initializing thread:', error);
          set({ error: 'Failed to initialize conversation', isLoading: false });
        }
      },

      initializeExistingThread: async (threadId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Set the thread ID directly
          set({ currentThreadId: threadId });
          
          // Fetch existing messages for this thread
          await get().fetchMessages(threadId);
        } catch (error) {
          console.error('Error initializing existing thread:', error);
          set({ error: 'Failed to initialize conversation', isLoading: false });
        }
      },

      initializeDefaultThread: async () => {
        // Helper function to initialize with Hutch users for testing
        const studentId = '9bc5a262-f6ce-4da5-bdfc-28a9383cabb2'; // Hutch Herky
        const teacherId = 'ee242274-2c32-4432-bfad-69cbeb9d1228'; // Hutch Herchenbach
        await get().initializeThread(studentId, teacherId);
      },

      fetchMessages: async (threadId?: string) => {
        const thread = threadId || get().currentThreadId;
        if (!thread) {
          set({ error: 'No active thread', isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const messages = await MessageService.getThreadMessages(thread);
          
          // Get current user to determine message roles
          const { data: { user } } = await supabase.auth.getUser();
          
          // Get user roles for proper message classification
          const { data: usersData } = await supabase
            .from('users')
            .select('id, role')
            .in('id', messages.map(m => m.sender_id));
          
          const userRoles = new Map(usersData?.map(u => [u.id, u.role]) || []);
          
          // Convert database messages to AIMessage format
          const aiMessages: AIMessage[] = messages.map(msg => {
            // Determine role based on sender
            let role: 'user' | 'assistant' | 'teacher' = 'user';
            
            if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
              role = 'assistant';
            } else {
              // Check the actual role of the sender
              const senderRole = userRoles.get(msg.sender_id);
              if (senderRole === 'teacher') {
                role = 'teacher';
              } else {
                role = 'user'; // student messages
              }
            }
            
            return {
              id: msg.id,
              role,
              content: msg.content,
              timestamp: msg.created_at,
              sources: msg.ai_sources || undefined
            };
          });
          
          set({ messages: aiMessages, isLoading: false });
        } catch (error) {
          console.error('Error fetching messages:', error);
          set({ error: 'Failed to fetch messages', isLoading: false });
        }
      },

      sendMessage: async (content, imageUri, mode = 'ai', lessonId, plantId) => {
        const { currentThreadId } = get();
        if (!currentThreadId) {
          set({ error: 'No active thread' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // Get the current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Get user's role from database
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          const userRole = userData?.role;

          // If current user is a teacher, always save as teacher message regardless of mode
          if (userRole === 'teacher') {
            // Teacher sending message - just save to database, no AI response
            const teacherMessage = await MessageService.sendMessage(currentThreadId, user.id, content, imageUri);
            
            // Update local state with the saved teacher message
            const savedTeacherMessage: AIMessage = {
              id: teacherMessage.id,
              role: 'teacher',
              content: teacherMessage.content,
              timestamp: teacherMessage.created_at
            };
            
            set(state => ({
              messages: [...state.messages, savedTeacherMessage],
              isLoading: false
            }));

            console.log('Teacher message sent to thread:', currentThreadId);
            return; // Exit early - no AI response for teacher messages
          }

          // Student sending message - continue with existing logic
          // Add user message to local state immediately
          const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date().toISOString()
          };
          
          set(state => ({
            messages: [...state.messages, userMessage]
          }));

          if (mode === 'teacher') {
            // Student sending message to teacher - save to database only
            const studentMessage = await MessageService.sendMessage(currentThreadId, user.id, content, imageUri);
            
            // Update local state with the saved user message
            const savedUserMessage: AIMessage = {
              id: studentMessage.id,
              role: 'user',
              content: studentMessage.content,
              timestamp: studentMessage.created_at
            };
            
            set(state => ({
              messages: [...state.messages.slice(0, -1), savedUserMessage],
              isLoading: false
            }));

            console.log('Student message sent to teacher via thread:', currentThreadId);
          } else {
            // Student sending message to AI - process with AI
            try {
              // Prepare conversation history (last 5 messages)
              const history = [...get().messages]
                .filter(msg => msg.role === 'assistant' || msg.role === 'user')
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
                // Save AI response to database as well
                const aiResponseMessage = await MessageService.sendMessage(
                  currentThreadId, 
                  '00000000-0000-0000-0000-000000000000', // AI Assistant user ID
                  data.message
                );

                // Add AI response with sources
                const aiResponse: AIMessage = {
                  id: aiResponseMessage.id,
                  role: 'assistant',
                  content: data.message,
                  timestamp: aiResponseMessage.created_at,
                  sources: data.sources
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
          console.error('Error sending message:', error);
          set({ 
            error: 'Failed to send message', 
            isLoading: false 
          });
        }
      },

      clearConversation: async () => {
        set({ messages: [], currentThreadId: null, error: null });
      }
    }),
    {
      name: 'ai-conversation-storage',
      storage: createJSONStorage(() => storage)
    }
  )
);