import { supabase } from '@/config/supabase';

interface RelevantChunk {
  chunk_id: string;
  content: string;
  lesson_url_id: string;
  lesson_id: string;
  similarity: number;
}

interface StudentTeacherMessageResponse {
  success: boolean;
  message_id?: string;
  relevant_chunks: RelevantChunk[];
  distinct_lesson_url_ids: string[];
  error?: string;
}

export const studentTeacherMessageService = {
  /**
   * Send a message from student to teacher with relevant lesson content chunks
   * @param message - The student's message
   * @param studentId - The student's ID
   * @param threadId - Optional thread ID if part of an existing conversation
   * @param createMessage - Whether to store the message in the database (default: true)
   * @returns Response with relevant content chunks and message ID
   */
  async sendMessageWithContext(
    message: string,
    studentId: string,
    threadId?: string,
    createMessage: boolean = true
  ): Promise<StudentTeacherMessageResponse> {
    try {
      console.log('[StudentTeacherMessage] Sending message with context', {
        messageLength: message.length,
        studentId,
        threadId,
        createMessage
      });

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('student-chat-with-teacher', {
        body: {
          message,
          student_id: studentId,
          thread_id: threadId,
          create_message: createMessage
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data as StudentTeacherMessageResponse;
      
      console.log('[StudentTeacherMessage] Response received', {
        success: result.success,
        messageId: result.message_id,
        chunksFound: result.relevant_chunks.length,
        distinctUrls: result.distinct_lesson_url_ids.length
      });

      return result;
    } catch (error) {
      console.error('[StudentTeacherMessage] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        relevant_chunks: [],
        distinct_lesson_url_ids: []
      };
    }
  },

  /**
   * Get formatted context from relevant chunks for display
   * @param chunks - Array of relevant chunks
   * @returns Formatted string with context
   */
  formatRelevantContext(chunks: RelevantChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }

    return chunks
      .map((chunk, index) => {
        const preview = chunk.content.substring(0, 200);
        const relevance = Math.round(chunk.similarity * 100);
        return `**Reference ${index + 1}** (${relevance}% relevant):\n${preview}${chunk.content.length > 200 ? '...' : ''}`;
      })
      .join('\n\n');
  },

  /**
   * Get lesson information for the distinct lesson URLs found
   * @param lessonUrlIds - Array of lesson URL IDs
   * @returns Lesson URL information
   */
  async getLessonUrlInfo(lessonUrlIds: string[]) {
    if (lessonUrlIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('lesson_urls')
      .select(`
        id,
        url,
        title,
        lesson_id,
        lessons(
          id,
          name,
          plant_type
        )
      `)
      .in('id', lessonUrlIds);

    if (error) {
      console.error('[StudentTeacherMessage] Error fetching lesson URLs:', error);
      return [];
    }

    return data || [];
  }
}; 