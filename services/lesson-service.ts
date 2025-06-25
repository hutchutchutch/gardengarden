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

export interface LessonStats {
  id: string;
  lesson_id: string;
  status: 'active' | 'completed' | 'upcoming' | 'draft';
  days_completed: number;
  total_days: number;
  active_students: number;
  average_health: number;
  completion_rate: number;
  scheduled_date?: string;
  date_range?: string;
  plant_type?: string;
  top_resource?: string;
  is_ready: boolean;
  processing_progress: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  lesson_id: string;
  lesson_name: string;
  lesson_description?: string;
  teacher_id?: string;
  class_id: string;
  created_at: string;
  updated_at: string;
  lesson_stats?: LessonStats | LessonStats[];
  lesson_documents?: LessonDocument[];
}

export class LessonService {
  // Helper function to normalize lesson stats (handle array vs single object)
  static normalizeStats(stats?: LessonStats | LessonStats[]): LessonStats | undefined {
    if (!stats) return undefined;
    return Array.isArray(stats) ? stats[0] : stats;
  }
  // Get current active lesson with stats and documents
  static async getCurrentLesson(): Promise<Lesson | null> {
    try {
      console.log('Fetching current lesson...');
      
      // First get the active lesson stats
      const { data: activeStats, error: statsError } = await supabase
        .from('lesson_stats')
        .select('lesson_id')
        .eq('status', 'active')
        .single();

      console.log('Active stats query result:', { activeStats, statsError });

      if (statsError || !activeStats) {
        console.error('No active lesson found:', statsError);
        return null;
      }

      // Then get the full lesson with stats and documents
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_stats(*),
          lesson_documents(*)
        `)
        .eq('lesson_id', activeStats.lesson_id)
        .single();

      console.log('Full lesson query result:', { data, error });

      if (error) {
        console.error('Error fetching current lesson:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentLesson:', error);
      return null;
    }
  }

  // Get completed lessons with stats
  static async getCompletedLessons(): Promise<Lesson[]> {
    try {
      // First get completed lesson IDs
      const { data: completedStats, error: statsError } = await supabase
        .from('lesson_stats')
        .select('lesson_id')
        .eq('status', 'completed');

      if (statsError) {
        console.error('Error fetching completed lesson stats:', statsError);
        return [];
      }

      if (!completedStats || completedStats.length === 0) {
        return [];
      }

      const lessonIds = completedStats.map(stat => stat.lesson_id);

      // Then get the full lessons with stats
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_stats(*)
        `)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

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

  // Get upcoming lessons with stats
  static async getUpcomingLessons(): Promise<Lesson[]> {
    try {
      // First get upcoming lesson IDs
      const { data: upcomingStats, error: statsError } = await supabase
        .from('lesson_stats')
        .select('lesson_id, scheduled_date')
        .eq('status', 'upcoming')
        .order('scheduled_date', { ascending: true, nullsFirst: false });

      if (statsError) {
        console.error('Error fetching upcoming lesson stats:', statsError);
        return [];
      }

      if (!upcomingStats || upcomingStats.length === 0) {
        return [];
      }

      const lessonIds = upcomingStats.map(stat => stat.lesson_id);

      // Then get the full lessons with stats
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_stats(*),
          lesson_documents(*)
        `)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

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
    lesson_name: string;
    lesson_description?: string;
    teacher_id?: string;
    class_id?: string;
    stats?: Partial<LessonStats>;
  }): Promise<Lesson | null> {
    try {
      // First create the lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          lesson_name: lessonData.lesson_name,
          lesson_description: lessonData.lesson_description,
          teacher_id: lessonData.teacher_id,
          class_id: lessonData.class_id || 'default'
        })
        .select()
        .single();

      if (lessonError) {
        console.error('Error creating lesson:', lessonError);
        return null;
      }

      // Then create the lesson stats
      if (lessonData.stats) {
        const { error: statsError } = await supabase
          .from('lesson_stats')
          .insert({
            lesson_id: lesson.lesson_id,
            ...lessonData.stats
          });

        if (statsError) {
          console.error('Error creating lesson stats:', statsError);
          // Continue anyway, stats can be added later
        }
      }

      return lesson;
    } catch (error) {
      console.error('Error in createLesson:', error);
      return null;
    }
  }

  // Update lesson stats
  static async updateLessonStats(lessonId: string, stats: Partial<LessonStats>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lesson_stats')
        .update({
          ...stats,
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId);

      if (error) {
        console.error('Error updating lesson stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLessonStats:', error);
      return false;
    }
  }

  // Add document to lesson
  static async addLessonDocument(lessonId: string, document: Omit<LessonDocument, 'id' | 'lesson_id' | 'created_at' | 'updated_at'>): Promise<LessonDocument | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_documents')
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
        .from('lesson_documents')
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

  // Delete lesson (cascades to stats and documents)
  static async deleteLesson(lessonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('lesson_id', lessonId);

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
          lesson_stats(*),
          lesson_documents(*)
        `)
        .eq('teacher_id', teacherId)
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
          lesson_stats(*),
          lesson_documents(*)
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

  // Activate a lesson (change status from upcoming to active)
  static async activateLesson(lessonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lesson_stats')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId);

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
        .from('lesson_stats')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId);

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
          lesson_stats(*),
          lesson_documents(*)
        `)
        .eq('lesson_id', lessonId)
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