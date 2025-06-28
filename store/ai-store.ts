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
  clearError: () => void;
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
        console.log('=== AI Store initializeThread START ===');
        console.log('Parameters:', { studentId, teacherId });
        
        try {
          // Get or create thread between student and teacher
          const thread = await MessageService.getOrCreateThread(studentId, teacherId);
          console.log('Thread obtained:', thread.id);
          set({ currentThreadId: thread.id });
          
          // Fetch existing messages for this thread
          console.log('Fetching messages for thread:', thread.id);
          await get().fetchMessages(thread.id);
          set({ isLoading: false, error: null });
          console.log('=== AI Store initializeThread SUCCESS ===');
        } catch (error: any) {
          console.error('=== AI Store initializeThread ERROR ===');
          console.error('Error details:', {
            error,
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint
          });
          set({ error: error?.message || 'Failed to initialize conversation', isLoading: false });
          console.error('=== AI Store initializeThread END (with error) ===');
          throw error; // Re-throw to be caught by component
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
        // Helper function to initialize a default thread for testing
        // This should use the current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user for default thread');
          set({ error: 'No authenticated user', isLoading: false });
          return;
        }

        // Get the user's details from the database using email
        const { data: userData } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', user.email)
          .single();

        if (!userData) {
          console.error('User data not found');
          set({ error: 'User data not found', isLoading: false });
          return;
        }

        // For testing, use predefined IDs based on role
        if (userData.role === 'student') {
          // Student user - use test teacher
          const teacherId = 'ee242274-2c32-4432-bfad-69cbeb9d1228'; // Hutch Herchenbach (teacher)
          await get().initializeThread(userData.id, teacherId);
        } else if (userData.role === 'teacher') {
          // Teacher user - use test student
          const studentId = '9bc5a262-f6ce-4da5-bdfc-28a9383cabb2'; // Hutch Herky (student)
          await get().initializeThread(studentId, userData.id);
        } else {
          console.error('Unknown user role:', userData.role);
          set({ error: 'Unknown user role', isLoading: false });
        }
      },

      fetchMessages: async (threadId?: string) => {
        const thread = threadId || get().currentThreadId;
        console.log('=== AI Store fetchMessages START ===');
        console.log('Thread ID:', thread);
        
        if (!thread) {
          console.error('No active thread for message fetching');
          set({ error: 'No active thread', isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          console.log('Calling MessageService.getThreadMessages...');
          const messages = await MessageService.getThreadMessages(thread);
          console.log(`Retrieved ${messages.length} messages`);
          
          // Get current user to determine message roles
          const { data: { user } } = await supabase.auth.getUser();
          console.log('Current auth user:', user?.email);
          
          // Get user roles for proper message classification
          const uniqueSenderIds = [...new Set(messages.map(m => m.sender_id))];
          console.log('Unique sender IDs:', uniqueSenderIds);
          
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, role')
            .in('id', uniqueSenderIds);
          
          if (usersError) {
            console.error('Error fetching user roles:', usersError);
          }
          
          const userRoles = new Map(usersData?.map(u => [u.id, u.role]) || []);
          console.log('User roles map:', Object.fromEntries(userRoles));
          
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
              content: msg.content || '',
              timestamp: msg.created_at,
              sources: msg.ai_sources || undefined
            };
          });
          
          console.log(`Converted to ${aiMessages.length} AI messages`);
          set({ messages: aiMessages, isLoading: false, error: null });
          console.log('=== AI Store fetchMessages SUCCESS ===');
        } catch (error: any) {
          console.error('=== AI Store fetchMessages ERROR ===');
          console.error('Error details:', {
            error,
            message: error?.message,
            code: error?.code,
            details: error?.details,
            threadId: thread
          });
          set({ error: error?.message || 'Failed to fetch messages', isLoading: false });
          console.error('=== AI Store fetchMessages END (with error) ===');
          // Don't re-throw here, let the UI handle empty messages gracefully
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

          // Get user's database ID and role using email
          const { data: userData } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();

          if (!userData) {
            throw new Error('User data not found');
          }

          const userDbId = userData.id;
          const userRole = userData.role;

          // If current user is a teacher, always save as teacher message regardless of mode
          if (userRole === 'teacher') {
            // Teacher sending message - just save to database, no AI response
            const teacherMessage = await MessageService.sendMessage(currentThreadId, userDbId, content, imageUri);
            
            // Update local state with the saved teacher message
            const savedTeacherMessage: AIMessage = {
              id: teacherMessage.id,
              role: 'teacher',
              content: teacherMessage.content || '',
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
            const studentMessage = await MessageService.sendMessage(currentThreadId, userDbId, content, imageUri);
            
            // Update local state with the saved user message
            const savedUserMessage: AIMessage = {
              id: studentMessage.id,
              role: 'user',
              content: studentMessage.content || '',
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
              const { data, error } = await supabase.functions.invoke('ai-chat-with-storage', {
                body: {
                  message: content,
                  thread_id: currentThreadId,
                  lesson_id: lessonId,
                  plant_id: plantId,
                  conversation_history: history,
                  include_sources: true,
                  mode: 'ai' // Explicitly set mode for AI messages
                }
              });

              if (error) throw error;

              if (data.success) {
                // ai-chat-with-storage already saves both messages to database
                // Update the user message with the actual saved ID
                const savedUserMessage: AIMessage = {
                  id: data.student_message_id,
                  role: 'user',
                  content,
                  timestamp: new Date().toISOString()
                };

                // Add AI response (already saved to database)
                const aiResponse: AIMessage = {
                  id: data.ai_message_id,
                  role: 'assistant',
                  content: data.message || '',
                  timestamp: new Date().toISOString(),
                  sources: data.relevant_chunks ? data.relevant_chunks.map((chunkId: string) => ({ chunk_id: chunkId })) : undefined
                };
                
                // Build messages array with user message and AI response
                const newMessages = [savedUserMessage, aiResponse];
                
                // If we have chunk details, add them as separate assistant messages
                if (data.chunk_details && data.chunk_details.length > 0) {
                  console.log(`Adding ${data.chunk_details.length} reference chunks as messages`);
                  
                  data.chunk_details.forEach((chunk: any, index: number) => {
                    const chunkMessage: AIMessage = {
                      id: data.chunk_message_ids?.[index] || `chunk-${Date.now()}-${index}`,
                      role: 'assistant',
                      content: `📚 **Reference ${index + 1}**\n\n${chunk.content}\n\n*Relevance: ${Math.round(chunk.similarity * 100)}%*`,
                      timestamp: new Date(Date.now() + index + 1).toISOString(),
                      sources: [{
                        url: chunk.id, // Use chunk ID as URL for now
                        title: `Lesson Reference ${index + 1}`,
                        snippet: chunk.content.substring(0, 200) + '...',
                        similarity: chunk.similarity
                      }]
                    };
                    newMessages.push(chunkMessage);
                  });
                }
                
                set(state => ({
                  messages: [...state.messages.slice(0, -1), ...newMessages],
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
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'ai-conversation-storage',
      storage: createJSONStorage(() => storage)
    }
  )
);