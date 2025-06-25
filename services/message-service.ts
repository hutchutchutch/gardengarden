import { supabase } from '@/config/supabase';

export interface Message {
  id: string;
  student_id: string;
  teacher_id: string;
  student_name: string;
  student_avatar: string | null;
  last_message: string;
  timestamp: string;
  unread_count: number;
  plant_name: string | null;
  plant_image: string | null;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageFilters {
  search?: string;
  filter?: 'all' | 'unread' | 'online';
}

export class MessageService {
  static async getTeacherMessages(teacherId: string, filters?: MessageFilters): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters?.filter === 'unread') {
        query = query.gt('unread_count', 0);
      } else if (filters?.filter === 'online') {
        query = query.eq('is_online', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      let messages = data || [];

      // Apply search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        messages = messages.filter(message => 
          message.student_name.toLowerCase().includes(searchLower) ||
          message.last_message.toLowerCase().includes(searchLower)
        );
      }

      return messages;
    } catch (error) {
      console.error('Error in getTeacherMessages:', error);
      throw error;
    }
  }

  static async getStudentMessages(studentId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', studentId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching student messages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStudentMessages:', error);
      throw error;
    }
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ unread_count: 0, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
      throw error;
    }
  }

  static async sendMessage(
    studentId: string,
    teacherId: string,
    message: string,
    studentName: string,
    plantName?: string,
    plantImage?: string
  ): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
          student_name: studentName,
          last_message: message,
          timestamp: new Date().toISOString(),
          unread_count: 1,
          plant_name: plantName,
          plant_image: plantImage,
          is_online: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_online: isOnline, updated_at: new Date().toISOString() })
        .eq('student_id', userId);

      if (error) {
        console.error('Error updating online status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateOnlineStatus:', error);
      throw error;
    }
  }

  // Helper function to format timestamp for display
  static formatTimestamp(timestamp: string): string {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
} 