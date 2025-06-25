import { create } from 'zustand';
import { Message, MessageService, MessageFilters } from '@/services/message-service';

interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTeacherMessages: (teacherId: string, filters?: MessageFilters) => Promise<void>;
  fetchStudentMessages: (studentId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  sendMessage: (
    studentId: string,
    teacherId: string,
    message: string,
    studentName: string,
    plantName?: string,
    plantImage?: string
  ) => Promise<void>;
  updateOnlineStatus: (userId: string, isOnline: boolean) => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchTeacherMessages: async (teacherId: string, filters?: MessageFilters) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await MessageService.getTeacherMessages(teacherId, filters);
      set({ messages, isLoading: false });
    } catch (error) {
      console.error('Error fetching teacher messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoading: false 
      });
    }
  },

  fetchStudentMessages: async (studentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await MessageService.getStudentMessages(studentId);
      set({ messages, isLoading: false });
    } catch (error) {
      console.error('Error fetching student messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoading: false 
      });
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      await MessageService.markMessageAsRead(messageId);
      // Update local state
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, unread_count: 0 } : msg
      );
      set({ messages: updatedMessages });
    } catch (error) {
      console.error('Error marking message as read:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark message as read' });
    }
  },

  sendMessage: async (
    studentId: string,
    teacherId: string,
    message: string,
    studentName: string,
    plantName?: string,
    plantImage?: string
  ) => {
    try {
      const newMessage = await MessageService.sendMessage(
        studentId,
        teacherId,
        message,
        studentName,
        plantName,
        plantImage
      );
      
      // Add to local state
      const { messages } = get();
      set({ messages: [newMessage, ...messages] });
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    }
  },

  updateOnlineStatus: async (userId: string, isOnline: boolean) => {
    try {
      await MessageService.updateOnlineStatus(userId, isOnline);
      // Update local state
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg.student_id === userId ? { ...msg, is_online: isOnline } : msg
      );
      set({ messages: updatedMessages });
    } catch (error) {
      console.error('Error updating online status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update online status' });
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },

  setError: (error: string | null) => {
    set({ error });
  }
})); 