import { supabase } from '@/config/supabase';

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
  created_at: string;
  updated_at: string;
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
  // Get current active lesson
  static async getCurrentLesson(): Promise<Lesson | null> {
    try {
      console.log('Fetching current lesson...');
      
      // Get lesson with status='active'
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('status', 'active');

      console.log('Active lessons query result:', { lessons, error });

      if (error || !lessons || lessons.length === 0) {
        console.error('No active lesson found');
        return null;
      }

      // Get the first active lesson
      const activeLesson = lessons[0];
      
      // Fetch lesson_urls separately
      const { data: urls } = await supabase
        .from('lesson_urls')
        .select('*')
        .eq('lesson_id', activeLesson.id);
      
      return {
        ...activeLesson,
        lesson_urls: urls || []
      };
    } catch (error) {
      console.error('Error in getCurrentLesson:', error);
      return null;
    }
  }

  // Get completed lessons
  static async getCompletedLessons(): Promise<Lesson[]> {
    try {
      // Get lessons where end_date is in the past
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .lt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Error fetching completed lessons:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompletedLessons:', error);
      return [];
    }
  }

  // Get upcoming lessons
  static async getUpcomingLessons(): Promise<Lesson[]> {
    try {
      // Get lessons where start_date is in the future
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(*)
        `)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming lessons:', error);
        return [];
      }

      return data || [];
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
  static async addLessonDocument(lessonId: string, document: Omit<LessonDocument, 'id' | 'lesson_id' | 'created_at' | 'updated_at'>): Promise<LessonDocument | null> {
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
          status,
          ...updates,
          updated_at: new Date().toISOString()
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
} 