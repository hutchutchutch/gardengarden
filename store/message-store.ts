import { create } from 'zustand';
import { Message, MessageThread, MessageService, MessageFilters } from '@/services/message-service';

interface MessageState {
  messageThreads: MessageThread[];
  currentThreadMessages: Message[];
  currentThreadId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTeacherMessageThreads: (teacherId: string, filters?: MessageFilters) => Promise<void>;
  fetchThreadMessages: (threadId: string) => Promise<void>;
  markThreadAsRead: (threadId: string, userId: string) => Promise<void>;
  sendMessage: (
    threadId: string,
    senderId: string,
    content: string
  ) => Promise<void>;
  getOrCreateThread: (studentId: string, teacherId: string) => Promise<string>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messageThreads: [],
  currentThreadMessages: [],
  currentThreadId: null,
  isLoading: false,
  error: null,

  fetchTeacherMessageThreads: async (teacherId: string, filters?: MessageFilters) => {
    set({ isLoading: true, error: null });
    try {
      const threads = await MessageService.getTeacherMessageThreads(teacherId, filters);
      set({ messageThreads: threads, isLoading: false });
    } catch (error) {
      console.error('Error fetching teacher message threads:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch message threads',
        isLoading: false 
      });
    }
  },

  fetchThreadMessages: async (threadId: string) => {
    set({ isLoading: true, error: null, currentThreadId: threadId });
    try {
      const messages = await MessageService.getThreadMessages(threadId);
      set({ currentThreadMessages: messages, isLoading: false });
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoading: false 
      });
    }
  },

  markThreadAsRead: async (threadId: string, userId: string) => {
    try {
      await MessageService.markMessagesAsRead(threadId, userId);
      // Update local state
      const { messageThreads } = get();
      const updatedThreads = messageThreads.map(thread => 
        thread.id === threadId ? { ...thread, unread_count: 0 } : thread
      );
      set({ messageThreads: updatedThreads });
    } catch (error) {
      console.error('Error marking thread as read:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark messages as read' });
    }
  },

  sendMessage: async (
    threadId: string,
    senderId: string,
    content: string
  ) => {
    try {
      const newMessage = await MessageService.sendMessage(
        threadId,
        senderId,
        content
      );
      
      // Add to current thread messages
      const { currentThreadMessages, messageThreads } = get();
      set({ 
        currentThreadMessages: [...currentThreadMessages, newMessage],
        // Update last message in thread list
        messageThreads: messageThreads.map(thread => 
          thread.id === threadId 
            ? { ...thread, last_message: newMessage, last_message_at: newMessage.created_at }
            : thread
        )
      });
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    }
  },

  getOrCreateThread: async (studentId: string, teacherId: string) => {
    try {
      const thread = await MessageService.getOrCreateThread(studentId, teacherId);
      // Add to threads if not already present
      const { messageThreads } = get();
      const threadExists = messageThreads.some(t => t.id === thread.id);
      if (!threadExists) {
        set({ messageThreads: [...messageThreads, thread] });
      }
      return thread.id;
    } catch (error) {
      console.error('Error getting/creating thread:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to get or create thread' });
      throw error;
    }
  },

  clearMessages: () => {
    set({ messageThreads: [], currentThreadMessages: [], currentThreadId: null, error: null });
  },

  setError: (error: string | null) => {
    set({ error });
  }
})); 