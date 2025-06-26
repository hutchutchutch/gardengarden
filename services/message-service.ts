import { supabase } from '@/config/supabase';

export interface MessageThread {
  id: string;
  student_id: string;
  teacher_id: string;
  thread_type: string;
  last_message_at: string;
  created_at: string;
  // Joined data
  student?: {
    id: string;
    name: string;
  };
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  ai_sources?: any;
  read_at?: string;
}

export interface MessageFilters {
  search?: string;
  filter?: 'all' | 'unread' | 'online';
}

export class MessageService {
  static async getTeacherMessageThreads(teacherId: string, filters?: MessageFilters): Promise<MessageThread[]> {
    try {
      // Get message threads with student info
      let query = supabase
        .from('message_threads')
        .select(`
          id,
          student_id,
          teacher_id,
          thread_type,
          last_message_at,
          created_at,
          student:users!message_threads_student_id_fkey (
            id,
            name
          )
        `)
        .eq('teacher_id', teacherId)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      const { data: threads, error: threadsError } = await query;

      if (threadsError) {
        console.error('Error fetching message threads:', threadsError);
        throw threadsError;
      }

      if (!threads || threads.length === 0) {
        return [];
      }

      // Get last message and unread count for each thread
      const threadIds = threads.map(t => t.id);
      
      // Get last messages
      const { data: lastMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      // Get unread counts
      const { data: unreadCounts, error: unreadError } = await supabase
        .from('messages')
        .select('thread_id')
        .in('thread_id', threadIds)
        .eq('is_read', false)
        .neq('sender_id', teacherId);

      if (unreadError) {
        console.error('Error fetching unread counts:', unreadError);
      }

      // Map last messages and unread counts to threads
      const lastMessageMap = new Map<string, Message>();
      const unreadCountMap = new Map<string, number>();

      if (lastMessages) {
        // Group messages by thread and get the latest one
        for (const msg of lastMessages) {
          if (!lastMessageMap.has(msg.thread_id) || 
              new Date(msg.created_at) > new Date(lastMessageMap.get(msg.thread_id)!.created_at)) {
            lastMessageMap.set(msg.thread_id, msg);
          }
        }
      }

      if (unreadCounts) {
        // Count unread messages per thread
        for (const msg of unreadCounts) {
          unreadCountMap.set(msg.thread_id, (unreadCountMap.get(msg.thread_id) || 0) + 1);
        }
      }

      // Combine data
      let messageThreads = threads.map(thread => ({
        ...thread,
        last_message: lastMessageMap.get(thread.id),
        unread_count: unreadCountMap.get(thread.id) || 0
      }));

      // Apply filters
      if (filters?.filter === 'unread') {
        messageThreads = messageThreads.filter(thread => thread.unread_count > 0);
      }

      // Fix student data structure first (Supabase returns array, we want single object)
      const fixedThreads = messageThreads.map(thread => ({
        ...thread,
        student: Array.isArray(thread.student) ? thread.student[0] : thread.student
      }));

      // Apply search filter
      let filteredThreads = fixedThreads;
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredThreads = fixedThreads.filter(thread => 
          thread.student?.name.toLowerCase().includes(searchLower) ||
          thread.last_message?.content.toLowerCase().includes(searchLower)
        );
      }

      return filteredThreads;
    } catch (error) {
      console.error('Error in getTeacherMessageThreads:', error);
      throw error;
    }
  }

  static async getThreadMessages(threadId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching thread messages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getThreadMessages:', error);
      throw error;
    }
  }

  static async getOrCreateThread(studentId: string, teacherId: string): Promise<MessageThread> {
    try {
      // Check if thread already exists
      const { data: existingThread, error: searchError } = await supabase
        .from('message_threads')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .single();

      if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error searching for thread:', searchError);
        throw searchError;
      }

      if (existingThread) {
        return existingThread;
      }

      // Create new thread
      const { data: newThread, error: createError } = await supabase
        .from('message_threads')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
          thread_type: 'teacher_chat'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating thread:', createError);
        throw createError;
      }

      return newThread;
    } catch (error) {
      console.error('Error in getOrCreateThread:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      throw error;
    }
  }

  static async sendMessage(
    threadId: string,
    senderId: string,
    content: string,
    imageUrl?: string
  ): Promise<Message> {
    try {
      // Insert the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: senderId,
          content: content,
          image_url: imageUrl || null,
          is_read: false
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        throw messageError;
      }

      // Update thread's last_message_at timestamp
      const { error: threadError } = await supabase
        .from('message_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

      if (threadError) {
        console.error('Error updating thread timestamp:', threadError);
      }

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadMessageCount:', error);
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