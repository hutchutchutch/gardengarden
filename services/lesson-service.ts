import { supabase, supabaseUrl, supabaseAnonKey } from '@/config/supabase';

export interface LessonDocument {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  sections: number;
  rag_references: number;
  processing_progress: number;
  error_message?: string;
  chunk_count?: number;
  added_at?: string;
  processed_at?: string;
}

export interface Lesson {
  id: string;
  name: string;
  description?: string;
  plant_type: string;
  created_by: string;
  class_id: string;
  status: 'draft' | 'active' | 'completed';
  vector_store_id?: string;
  start_date?: string;
  end_date?: string;
  expected_duration_days: number;
  created_at: string;
  updated_at: string;
  lesson_urls?: LessonDocument[];
}

export class LessonService {
  // Get current active lesson for a specific teacher
  static async getCurrentLesson(teacherId?: string): Promise<Lesson | null> {
    try {
      if (!teacherId) {
        console.error('No teacher ID provided');
        return null;
      }

      // First get the teacher's class
      const { data: teacherClass, error: teacherClassError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId)
        .single();

      if (teacherClassError || !teacherClass) {
        console.error('No class found for teacher:', teacherId);
        return null;
      }

      // Get current date for comparison
      const currentDate = new Date().toISOString();
      
      // Get active lessons for this teacher's class
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('status', 'active')
        .eq('class_id', teacherClass.id)
        .lte('start_date', currentDate)
        .gte('end_date', currentDate);

      if (error) {
        console.error('Error fetching active lesson:', error);
        return null;
      }

      if (!lessons || lessons.length === 0) {
        console.log('No active lesson found for teacher');
        return null;
      }
      
      // Get the first active lesson
      const activeLesson = lessons[0];
      
      // Fetch lesson_urls with chunk counts using a direct query
      const { data: urls, error: urlsError } = await supabase
        .from('lesson_urls')
        .select('*')
        .eq('lesson_id', activeLesson.id);

      if (urlsError) {
        console.error('Error fetching lesson URLs:', urlsError);
      }

      // Get chunk counts for each URL
      const urlsWithChunkCount = [];
      if (urls) {
        for (const url of urls) {
          const { count } = await supabase
            .from('url_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_url_id', url.id);
          
                     urlsWithChunkCount.push({
            ...url,
            status: url.processing_status, // Map processing_status to status
            chunk_count: count || 0
          });
        }
      }
      
      const result = {
        ...activeLesson,
        lesson_urls: urlsWithChunkCount
      };
      
      return result;
    } catch (error) {
      console.error('Exception in getCurrentLesson:', error);
      return null;
    }
  }

  // Get completed lessons for a specific teacher
  static async getCompletedLessons(teacherId?: string): Promise<Lesson[]> {
    try {
      if (!teacherId) {
        console.error('No teacher ID provided for completed lessons');
        return [];
      }

      // First get the teacher's class
      const { data: teacherClass, error: completedClassError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId)
        .single();

      if (completedClassError || !teacherClass) {
        console.error('No class found for teacher:', teacherId);
        return [];
      }

      // Get lessons where end_date is in the past for this teacher's class
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .eq('class_id', teacherClass.id)
        .lt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Error fetching completed lessons:', error);
        return [];
      }

      // Transform the data to include chunk_count
      const lessonsWithChunkCount = [];
      if (data) {
        for (const lesson of data) {
          const lessonUrlsWithChunks = [];
          if (lesson.lesson_urls) {
            for (const url of lesson.lesson_urls) {
              const { count } = await supabase
                .from('url_chunks')
                .select('*', { count: 'exact', head: true })
                .eq('lesson_url_id', url.id);
              
              lessonUrlsWithChunks.push({
                ...url,
                status: url.processing_status, // Map processing_status to status
                chunk_count: count || 0
              });
            }
          }
          
          lessonsWithChunkCount.push({
            ...lesson,
            lesson_urls: lessonUrlsWithChunks
          });
        }
      }

      return lessonsWithChunkCount;
    } catch (error) {
      console.error('Error in getCompletedLessons:', error);
      return [];
    }
  }

  // Get upcoming lessons for a specific teacher
  static async getUpcomingLessons(teacherId?: string): Promise<Lesson[]> {
    try {
      if (!teacherId) {
        console.error('No teacher ID provided for upcoming lessons');
        return [];
      }

      // First get the teacher's class
      const { data: teacherClass, error: upcomingClassError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId)
        .single();

      if (upcomingClassError || !teacherClass) {
        console.error('No class found for teacher:', teacherId);
        return [];
      }

      // Get lessons where start_date is in the future for this teacher's class
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .eq('class_id', teacherClass.id)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming lessons:', error);
        return [];
      }

      // Transform the data to include chunk_count
      const lessonsWithChunkCount = [];
      if (data) {
        for (const lesson of data) {
          const lessonUrlsWithChunks = [];
          if (lesson.lesson_urls) {
            for (const url of lesson.lesson_urls) {
              const { count } = await supabase
                .from('url_chunks')
                .select('*', { count: 'exact', head: true })
                .eq('lesson_url_id', url.id);
              
              lessonUrlsWithChunks.push({
                ...url,
                status: url.processing_status, // Map processing_status to status
                chunk_count: count || 0
              });
            }
          }
          
          lessonsWithChunkCount.push({
            ...lesson,
            lesson_urls: lessonUrlsWithChunks
          });
        }
      }

      return lessonsWithChunkCount;
    } catch (error) {
      console.error('Error in getUpcomingLessons:', error);
      return [];
    }
  }

  // Create a new lesson
  static async createLesson(lessonData: {
    name: string;
    description?: string;
    plant_type: string;
    created_by?: string;
    class_id?: string;
    start_date?: string;
    end_date?: string;
    expected_duration_days: number;
  }): Promise<Lesson | null> {
    try {
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          name: lessonData.name,
          description: lessonData.description,
          plant_type: lessonData.plant_type,
          created_by: lessonData.created_by,
          class_id: lessonData.class_id || 'default',
          start_date: lessonData.start_date,
          end_date: lessonData.end_date,
          expected_duration_days: lessonData.expected_duration_days,
          status: 'draft'
        })
        .select()
        .single();

      if (lessonError) {
        console.error('Error creating lesson:', lessonError);
        return null;
      }

      return lesson;
    } catch (error) {
      console.error('Error in createLesson:', error);
      return null;
    }
  }

  // Add document to lesson
  static async addLessonDocument(lessonId: string, document: Omit<LessonDocument, 'id' | 'lesson_id' | 'added_at' | 'processed_at'>): Promise<LessonDocument | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_urls')
        .insert({
          lesson_id: lessonId,
          ...document
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding lesson document:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addLessonDocument:', error);
      return null;
    }
  }

  // Update document status
  static async updateDocumentStatus(
    documentId: string, 
    status: LessonDocument['status'], 
    updates?: Partial<Pick<LessonDocument, 'processing_progress' | 'error_message' | 'sections' | 'rag_references'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lesson_urls')
        .update({
          processing_status: status,
          ...updates
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateDocumentStatus:', error);
      return false;
    }
  }

  // Update document title
  static async updateDocumentTitle(documentId: string, title: string): Promise<boolean> {
    try {
      console.log('Attempting to update document title:', { documentId, title: title.trim() });
      
      // First, check if we have a valid session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        return false;
      }
      
      if (!session.session) {
        console.error('No active session found');
        return false;
      }
      
      console.log('User authenticated:', session.session.user.id);
      
      // Check if the user has permission to update this document
      const { data: permissionCheck, error: permissionError } = await supabase
        .from('lesson_urls')
        .select(`
          id,
          lesson_id,
          lessons!inner(
            id,
            created_by
          )
        `)
        .eq('id', documentId)
        .single();
      
      if (permissionError) {
        console.error('Permission check error:', permissionError);
        return false;
      }
      
      console.log('Permission check result:', permissionCheck);
      
      // Perform the actual update
      const { data, error } = await supabase
        .from('lesson_urls')
        .update({
          title: title.trim()
        })
        .eq('id', documentId)
        .select();

      if (error) {
        console.error('Error updating document title:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('Successfully updated document title:', data);
      return true;
    } catch (error) {
      console.error('Exception in updateDocumentTitle:', error);
      return false;
    }
  }

  // Delete lesson
  static async deleteLesson(lessonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) {
        console.error('Error deleting lesson:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteLesson:', error);
      return false;
    }
  }

  // Get lessons by teacher
  static async getLessonsByTeacher(teacherId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .eq('created_by', teacherId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lessons by teacher:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLessonsByTeacher:', error);
      return [];
    }
  }

  // Get lessons by class
  static async getLessonsByClass(classId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lessons by class:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLessonsByClass:', error);
      return [];
    }
  }

  // Activate a lesson (change status from draft to active)
  static async activateLesson(lessonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (error) {
        console.error('Error activating lesson:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in activateLesson:', error);
      return false;
    }
  }

  // Complete a lesson (change status from active to completed)
  static async completeLesson(lessonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (error) {
        console.error('Error completing lesson:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in completeLesson:', error);
      return false;
    }
  }

  // Get lesson with documents by ID
  static async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .eq('id', lessonId)
        .single();

      if (error) {
        console.error('Error fetching lesson by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLessonById:', error);
      return null;
    }
  }

  // Retry processing a failed document
  static async retryDocumentProcessing(documentId: string): Promise<boolean> {
    try {
      // Get the document details first
      const { data: document, error: fetchError } = await supabase
        .from('lesson_urls')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        console.error('Error fetching document for retry:', fetchError);
        return false;
      }

      // Reset the document status to processing
      const { error: resetError } = await supabase
        .from('lesson_urls')
        .update({
          processing_status: 'processing',
          error_message: null,
          processing_progress: 0
        })
        .eq('id', documentId);

      if (resetError) {
        console.error('Error resetting document status:', resetError);
        return false;
      }

      // Call the edge function to retry processing
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session for retry');
        return false;
      }

      const functionUrl = `${supabaseUrl}/functions/v1/scrape-lesson-url`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          url: document.url,
          lesson_id: document.lesson_id,
          lesson_url_id: documentId
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result?.success) {
        console.error('Edge function retry failed:', result);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in retryDocumentProcessing:', error);
      return false;
    }
  }

  // Delete a lesson document and its chunks
  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // First delete all chunks associated with this document
      const { error: chunksError } = await supabase
        .from('url_chunks')
        .delete()
        .eq('lesson_url_id', documentId);

      if (chunksError) {
        console.error('Error deleting document chunks:', chunksError);
        return false;
      }

      // Then delete the document itself
      const { error: documentError } = await supabase
        .from('lesson_urls')
        .delete()
        .eq('id', documentId);

      if (documentError) {
        console.error('Error deleting document:', documentError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in deleteDocument:', error);
      return false;
    }
  }

  // Get detailed document information with chunks
  static async getDocumentDetails(documentId: string): Promise<{
    document: LessonDocument;
    chunks: Array<{
      id: string;
      content: string;
      chunk_index: number;
      reference_count: number;
      metadata?: any;
    }>;
  } | null> {
    try {
      // Get document details
      const { data: document, error: documentError } = await supabase
        .from('lesson_urls')
        .select('*')
        .eq('id', documentId)
        .single();

      if (documentError || !document) {
        console.error('Error fetching document details:', documentError);
        return null;
      }

      // Get chunks with reference counts
      const { data: chunks, error: chunksError } = await supabase
        .from('url_chunks')
        .select('id, content, chunk_index, reference_count, metadata')
        .eq('lesson_url_id', documentId)
        .order('chunk_index', { ascending: true });

      if (chunksError) {
        console.error('Error fetching document chunks:', chunksError);
        return null;
      }

      return {
        document: {
          ...document,
          status: document.processing_status
        },
        chunks: chunks || []
      };
    } catch (error) {
      console.error('Exception in getDocumentDetails:', error);
      return null;
    }
  }

  // Get document chunks with reference counts
  static async getDocumentChunks(documentId: string) {
    try {
      const { data: chunks, error } = await supabase
        .from('url_chunks')
        .select('id, content, chunk_index, reference_count, metadata')
        .eq('lesson_url_id', documentId)
        .order('chunk_index');

      if (error) {
        console.error('Error fetching document chunks:', error);
        throw error;
      }

      return chunks || [];
    } catch (error) {
      console.error('Error in getDocumentChunks:', error);
      throw error;
    }
  }

  // Delete a single chunk from a document
  static async deleteChunk(chunkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('url_chunks')
        .delete()
        .eq('id', chunkId);

      if (error) {
        console.error('Error deleting chunk:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in deleteChunk:', error);
      return false;
    }
  }
} 