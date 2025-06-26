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
  // Get current active lesson for a specific teacher
  static async getCurrentLesson(teacherId?: string): Promise<Lesson | null> {
    try {
      console.log('=== LessonService.getCurrentLesson DEBUG ===');
      console.log('Input teacherId:', teacherId);
      
      if (!teacherId) {
        console.error('❌ No teacher ID provided');
        return null;
      }

      // First get the teacher's class
      console.log('🔍 Step 1: Looking for teacher class...');
      const { data: teacherClass, error: teacherClassError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId)
        .single();

      console.log('Teacher class query result:', { teacherClass, teacherClassError });

      if (teacherClassError || !teacherClass) {
        console.error('❌ No class found for teacher:', teacherId, 'Error:', teacherClassError);
        return null;
      }

      console.log('✅ Found teacher class:', teacherClass.id);

      // Get active lesson for the teacher's class
      console.log('🔍 Step 2: Looking for active lessons...');
      const currentDate = new Date().toISOString();
      console.log('Current date for comparison:', currentDate);
      
      // First, let's test the Supabase connection with a simple query
      const { data: testQuery, error: testError } = await supabase
        .from('lessons')
        .select('id, name, status, class_id')
        .limit(5);
      
      console.log('=== Supabase connection test ===');
      console.log('All lessons (first 5):', testQuery);
      console.log('Test error:', testError);
      
      // Now test lessons in this specific class
      const { data: allLessons, error: allError } = await supabase
        .from('lessons')
        .select('*')
        .eq('status', 'active')
        .eq('class_id', teacherClass.id);
      
      console.log('=== Active lessons in class query ===');
      console.log('Class ID being searched:', teacherClass.id);
      console.log('Class ID type:', typeof teacherClass.id);
      console.log('All lessons:', allLessons);
      console.log('All lessons error:', allError);
      
      // Also test without the status filter
      const { data: classLessons, error: classLessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('class_id', teacherClass.id);
        
      console.log('=== All lessons in class (no status filter) ===');
      console.log('Class lessons:', classLessons);
      console.log('Class error:', classLessonsError);
      
      if (allLessons && allLessons.length > 0) {
        console.log('Found lessons, checking dates manually...');
        for (const lesson of allLessons) {
          const startDate = new Date(lesson.start_date);
          const endDate = new Date(lesson.end_date);
          const now = new Date(currentDate);
          
          console.log(`Lesson "${lesson.name}":`);
          console.log(`  Start: ${lesson.start_date} (${startDate.getTime()})`);
          console.log(`  End: ${lesson.end_date} (${endDate.getTime()})`);
          console.log(`  Now: ${currentDate} (${now.getTime()})`);
          console.log(`  Start <= Now: ${startDate <= now}`);
          console.log(`  End >= Now: ${endDate >= now}`);
          console.log(`  Should match: ${startDate <= now && endDate >= now}`);
        }
      }
      
      // Now try the original query
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('status', 'active')
        .eq('class_id', teacherClass.id)
        .lte('start_date', currentDate)
        .gte('end_date', currentDate);

      console.log('=== Filtered lessons query ===');
      console.log('Query result:', { lessons, error });

      if (error) {
        console.error('❌ Supabase query error:', error);
        return null;
      }

      if (!lessons || lessons.length === 0) {
        console.log('❌ No active lesson found - lessons array:', lessons);
        return null;
      }

      console.log('✅ Found', lessons.length, 'active lesson(s)');
      
      // Get the first active lesson
      const activeLesson = lessons[0];
      console.log('Selected lesson:', activeLesson.name, '(ID:', activeLesson.id, ')');
      
      // Fetch lesson_urls separately
      console.log('🔍 Step 3: Fetching lesson URLs...');
      const { data: urls } = await supabase
        .from('lesson_urls')
        .select('*')
        .eq('lesson_id', activeLesson.id);
      
      console.log('Found', urls?.length || 0, 'lesson URLs');
      
      const result = {
        ...activeLesson,
        lesson_urls: urls || []
      };
      
      console.log('✅ Final result:', result);
      console.log('=== END LessonService.getCurrentLesson DEBUG ===');
      
      return result;
    } catch (error) {
      console.error('❌ Exception in getCurrentLesson:', error);
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

      return data || [];
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