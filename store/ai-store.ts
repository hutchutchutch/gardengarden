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
  sendMessage: (content: string, imageUri?: string, mode?: 'ai' | 'teacher', lessonId?: string, plantId?: string, receiverId?: string) => Promise<void>;
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
          
          // Get sender roles from database for proper role detection
          const uniqueSenderIds = [...new Set(messages.map(m => m.sender_id).filter(Boolean))];
          console.log('Unique sender IDs:', uniqueSenderIds);
          
          // Fetch user roles for all senders to properly determine message roles
          const senderRoleMap = new Map<string, 'student' | 'teacher'>();
          if (uniqueSenderIds.length > 0) {
            const { data: senderData } = await supabase
              .from('users')
              .select('id, role')
              .in('id', uniqueSenderIds);
            
            if (senderData) {
              senderData.forEach(sender => {
                senderRoleMap.set(sender.id, sender.role);
              });
            }
          }
          
          // Get current user's role from database
          const { data: currentUserData } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user?.email)
            .single();
          
          const currentUserDbId = currentUserData?.id;
          const currentUserRole = currentUserData?.role;
          
          // Convert database messages to AIMessage format
          const aiMessages: AIMessage[] = messages.map(msg => {
            // Determine role based on actual sender role from database
            let role: 'user' | 'assistant' | 'teacher' = 'user';
            
            if (msg.sender_id === null) {
              // AI messages have null sender_id
              role = 'assistant';
            } else {
              // Get the actual role of the sender
              const senderRole = senderRoleMap.get(msg.sender_id);
              
              // Map database role to message role
              if (senderRole === 'teacher') {
                role = 'teacher';
              } else if (senderRole === 'student') {
                role = 'user';
              }
              // If sender role not found, fallback to checking if it's current user
              else if (msg.sender_id === currentUserDbId) {
                role = 'user';
              }
            }
            
            return {
              id: msg.id,
              role,
              content: msg.content || '',
              timestamp: msg.created_at,
              sources: msg.ai_sources || undefined,
              sender_id: msg.sender_id || undefined
            };
          });
          
          // Enrich AI messages and student messages with full source information
          const enrichedMessages: AIMessage[] = [];
          for (const msg of aiMessages) {
            // Handle AI messages with ai_sources
            if (msg.role === 'assistant' && msg.sources && msg.sources.length > 0) {
              // Get all chunk_ids from the sources
              const chunkIds = msg.sources
                .map((s: any) => s.chunk_id)
                .filter(Boolean);
              
              if (chunkIds.length > 0) {
                try {
                  console.log(`Enriching AI message ${msg.id} with ${chunkIds.length} source chunks`);
                  // Fetch full chunk and lesson_url information
                  const { data: chunkData, error: chunkError } = await supabase
                    .from('url_chunks')
                    .select(`
                      id,
                      content,
                      lesson_url_id,
                      lesson_urls!inner(
                        url,
                        title
                      )
                    `)
                    .in('id', chunkIds);

                  if (!chunkError && chunkData) {
                    // Transform sources with full information
                    const enrichedSources = msg.sources.map((source: any) => {
                      const chunkInfo = chunkData.find((chunk: any) => chunk.id === source.chunk_id);
                      if (chunkInfo) {
                        return {
                          chunk_id: source.chunk_id,
                          lesson_url_id: chunkInfo.lesson_url_id,
                          url: (chunkInfo.lesson_urls as any)?.url || '',
                          title: (chunkInfo.lesson_urls as any)?.title || 'Lesson Reference',
                          snippet: chunkInfo.content.substring(0, 200) + '...',
                          content: chunkInfo.content,
                          similarity: source.similarity
                        };
                      }
                      return source;
                    });
                    
                    console.log(`Successfully enriched AI message ${msg.id} with full source data`);
                    enrichedMessages.push({
                      ...msg,
                      sources: enrichedSources
                    });
                  } else {
                    console.error('Error fetching chunk data for sources:', chunkError);
                    enrichedMessages.push(msg);
                  }
                } catch (error) {
                  console.error('Error enriching AI message sources:', error);
                  enrichedMessages.push(msg);
                }
              } else {
                enrichedMessages.push(msg);
              }
            }
            // Handle student messages with relevant_chunks
            else if (msg.role === 'user') {
              // Check if this message has relevant_chunks stored in the database
              try {
                const { data: dbMessage, error: dbError } = await supabase
                  .from('messages')
                  .select('relevant_chunks')
                  .eq('id', msg.id)
                  .single();

                if (!dbError && dbMessage?.relevant_chunks && dbMessage.relevant_chunks.length > 0) {
                  console.log(`Enriching student message ${msg.id} with ${dbMessage.relevant_chunks.length} relevant chunks`);
                  // Fetch full chunk and lesson_url information for student message
                  const { data: chunkData, error: chunkError } = await supabase
                    .from('url_chunks')
                    .select(`
                      id,
                      content,
                      lesson_url_id,
                      lesson_urls!inner(
                        url,
                        title
                      )
                    `)
                    .in('id', dbMessage.relevant_chunks);

                  if (!chunkError && chunkData) {
                    // Transform chunk data into Source format
                    const sources = chunkData.map((chunk: any) => ({
                      chunk_id: chunk.id,
                      lesson_url_id: chunk.lesson_url_id,
                      url: (chunk.lesson_urls as any)?.url || '',
                      title: (chunk.lesson_urls as any)?.title || 'Lesson Reference',
                      snippet: chunk.content.substring(0, 200) + '...',
                      content: chunk.content,
                      similarity: 0.5 // Default similarity for existing messages
                    }));
                    
                    console.log(`Successfully enriched student message ${msg.id} with relevant chunks`);
                    enrichedMessages.push({
                      ...msg,
                      sources: sources
                    });
                  } else {
                    enrichedMessages.push(msg);
                  }
                } else {
                  enrichedMessages.push(msg);
                }
              } catch (error) {
                console.error('Error enriching student message sources:', error);
                enrichedMessages.push(msg);
              }
            } else {
              enrichedMessages.push(msg);
            }
          }
          
          console.log(`Converted to ${enrichedMessages.length} AI messages with enriched sources`);
          set({ messages: enrichedMessages, isLoading: false, error: null });
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

      sendMessage: async (content, imageUri, mode = 'ai', lessonId, plantId, receiverId) => {
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
            const teacherMessage = await MessageService.sendMessage(currentThreadId, userDbId, content, imageUri, receiverId);
            
            // Update local state with the saved teacher message
            const savedTeacherMessage: AIMessage = {
              id: teacherMessage.id,
              role: 'teacher',
              content: teacherMessage.content || '',
              timestamp: teacherMessage.created_at,
              sender_id: userDbId
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
            timestamp: new Date().toISOString(),
            sender_id: userDbId
          };
          
          set(state => ({
            messages: [...state.messages, userMessage]
          }));

          if (mode === 'teacher') {
            // Student sending message to teacher - call student-chat-with-teacher function
            try {
              // Call student-chat-with-teacher function to identify relevant resources
              const { data: resourceData, error: resourceError } = await supabase.functions.invoke('student-chat-with-teacher', {
                body: {
                  message: content,
                  student_id: userDbId,
                  thread_id: currentThreadId,
                  create_message: true // This will save the message and return relevant chunks
                }
              });

              if (resourceError) {
                console.error('Error calling student-chat-with-teacher:', resourceError);
                // Fallback: save message without resources
                const fallbackMessage = await MessageService.sendMessage(currentThreadId, userDbId, content, imageUri, receiverId);
                const savedUserMessage: AIMessage = {
                  id: fallbackMessage.id,
                  role: 'user',
                  content: fallbackMessage.content || '',
                  timestamp: fallbackMessage.created_at,
                  sender_id: userDbId
                };
                
                set(state => ({
                  messages: [...state.messages.slice(0, -1), savedUserMessage],
                  isLoading: false
                }));
              } else if (resourceData?.success) {
                // Transform the relevant chunks into Source format
                let sources: any[] | undefined = undefined;
                if (resourceData.relevant_chunks && resourceData.relevant_chunks.length > 0) {
                  try {
                    // Get lesson URL information for the chunks
                    const lessonUrlIds = [...new Set(resourceData.relevant_chunks.map((chunk: any) => chunk.lesson_url_id))];
                    
                    const { data: lessonUrls, error: urlError } = await supabase
                      .from('lesson_urls')
                      .select('id, url, title')
                      .in('id', lessonUrlIds);

                    if (!urlError && lessonUrls) {
                      sources = resourceData.relevant_chunks.map((chunk: any) => {
                        const lessonUrl = lessonUrls.find((lu: any) => lu.id === chunk.lesson_url_id);
                        
                        return {
                          chunk_id: chunk.chunk_id,
                          lesson_url_id: chunk.lesson_url_id,
                          url: lessonUrl?.url || '',
                          title: lessonUrl?.title || 'Lesson Reference',
                          snippet: chunk.content.substring(0, 200) + '...',
                          content: chunk.content,
                          similarity: chunk.similarity
                        };
                      });
                    }
                  } catch (error) {
                    console.error('Error fetching lesson URL data for student message sources:', error);
                  }
                }

                // Update local state with the saved message including sources
                const savedUserMessage: AIMessage = {
                  id: resourceData.message_id,
                  role: 'user',
                  content: content,
                  timestamp: new Date().toISOString(),
                  sources: sources,
                  sender_id: userDbId
                };
                
                set(state => ({
                  messages: [...state.messages.slice(0, -1), savedUserMessage],
                  isLoading: false
                }));

                console.log('Student message sent to teacher with relevant resources via thread:', currentThreadId);
              }
            } catch (error) {
              console.error('Error in student-chat-with-teacher flow:', error);
              // Fallback: save message without resources
              const fallbackMessage = await MessageService.sendMessage(currentThreadId, userDbId, content, imageUri, receiverId);
              const savedUserMessage: AIMessage = {
                id: fallbackMessage.id,
                role: 'user',
                content: fallbackMessage.content || '',
                timestamp: fallbackMessage.created_at,
                sender_id: userDbId
              };
              
              set(state => ({
                messages: [...state.messages.slice(0, -1), savedUserMessage],
                isLoading: false
              }));
            }
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
                  timestamp: new Date().toISOString(),
                  sender_id: userDbId
                };

                // Transform chunk_details into proper Source objects with lesson_url_id
                let transformedSources: any[] | undefined = undefined;
                if (data.chunk_details && data.chunk_details.length > 0) {
                  try {
                    // Since chunk_details now includes lesson_url_id, get unique lesson_url_ids
                    const lessonUrlIds = [...new Set(data.chunk_details.map((chunk: any) => chunk.lesson_url_id))];
                    
                    // Fetch lesson_url information
                    const { data: lessonUrls, error: urlError } = await supabase
                      .from('lesson_urls')
                      .select('id, url, title')
                      .in('id', lessonUrlIds);

                    if (!urlError && lessonUrls) {
                      transformedSources = data.chunk_details.map((chunk: any) => {
                        const lessonUrl = lessonUrls.find((lu: any) => lu.id === chunk.lesson_url_id);
                        
                        return {
                          chunk_id: chunk.id,
                          lesson_url_id: chunk.lesson_url_id,
                          url: lessonUrl?.url || '',
                          title: lessonUrl?.title || 'Lesson Reference',
                          snippet: chunk.content.substring(0, 200) + '...',
                          content: chunk.content,
                          similarity: chunk.similarity
                        };
                      });
                    }
                  } catch (error) {
                    console.error('Error fetching lesson URL data for sources:', error);
                  }
                }

                // Add AI response (already saved to database)
                const aiResponse: AIMessage = {
                  id: data.ai_message_id,
                  role: 'assistant',
                  content: data.message || '',
                  timestamp: new Date().toISOString(),
                  sources: transformedSources
                };
                
                // Build messages array with user message and AI response
                const newMessages = [savedUserMessage, aiResponse];
                
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