import { supabase } from '@/config/supabase';

export interface PlantStoryData {
  id: string;
  student_id: string;
  student_name: string;
  photo_url: string;
  thumbnail_url?: string;
  health_score: number;
  health_badge: 'green' | 'yellow' | 'red';
  reaction_count: number;
  reactions: {
    thumbs_up?: number;
    seedling?: number;
    strong?: number;
    celebrate?: number;
    idea?: number;
  };
  submission_date: string;
  expires_at: string;
  isCurrentUser: boolean;
  hasSubmittedToday: boolean;
}

export class PlantStoriesService {
  /**
   * Fetch daily plant stories for students in the same class
   * Ensures current user's story appears first
   */
  static async fetchClassPlantStories(currentUserId: string): Promise<PlantStoryData[]> {
    try {
      // Ensure all classmates have plant story entries
      await this.ensureClassPlantStoriesExist(currentUserId);

      // First, get the current user's class_id
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('class_id')
        .eq('id', currentUserId)
        .single();

      if (userError || !currentUser?.class_id) {
        throw new Error('Unable to find user class information');
      }

      // Get today's date for filtering recent submissions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Query for plant stories from classmates (including empty ones)
      const { data: storyData, error: storyError } = await supabase
        .from('plant_stories')
        .select(`
          id,
          student_id,
          submission_id,
          health_badge,
          reaction_count,
          reactions,
          created_at,
          expires_at
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (storyError) {
        throw storyError;
      }

      // Get all student IDs from the stories
      const studentIds = storyData?.map(s => s.student_id) || [];
      
      // Fetch user details for these students in the same class
      const { data: classmates, error: classmatesError } = await supabase
        .from('users')
        .select('id, name, class_id')
        .in('id', studentIds)
        .eq('class_id', currentUser.class_id);

      if (classmatesError) {
        throw classmatesError;
      }

      // Create a map for quick user lookup
      const userMap = new Map(classmates?.map(u => [u.id, u]) || []);

      // Get submission data for stories that have submissions
      const submissionIds = storyData?.filter(s => s.submission_id).map(s => s.submission_id) || [];
      let submissionMap = new Map();
      
      if (submissionIds.length > 0) {
        const { data: submissions, error: submissionError } = await supabase
          .from('daily_submissions')
          .select('id, photo_url, health_score')
          .in('id', submissionIds);

        if (!submissionError && submissions) {
          submissionMap = new Map(submissions.map(s => [s.id, s]));
        }
      }

      // Transform the data
      const stories: PlantStoryData[] = [];

      if (storyData) {
        for (const story of storyData) {
          const user = userMap.get(story.student_id);
          
          // Only include if user is in the same class
          if (!user) continue;
          
          const submission = story.submission_id ? submissionMap.get(story.submission_id) : null;
          const healthScore = submission?.health_score || 50; // Default to neutral score
          
          stories.push({
            id: story.id,
            student_id: story.student_id,
            student_name: user.name,
            photo_url: submission?.photo_url || '', // Empty string for no photo
            thumbnail_url: undefined,
            health_score: healthScore,
            health_badge: story.health_badge as 'green' | 'yellow' | 'red',
            reaction_count: story.reaction_count || 0,
            reactions: story.reactions || {},
            submission_date: story.created_at,
            expires_at: story.expires_at,
            isCurrentUser: story.student_id === currentUserId,
            hasSubmittedToday: !!submission
          });
        }
      }

      // Sort stories: current user first, then by most recent
      const sortedStories = stories.sort((a, b) => {
        if (a.isCurrentUser && !b.isCurrentUser) return -1;
        if (!a.isCurrentUser && b.isCurrentUser) return 1;
        return new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime();
      });

      return sortedStories;

    } catch (error) {
      console.error('Error fetching class plant stories:', error);
      throw error;
    }
  }

  /**
   * Create a plant story for a daily submission
   */
  static async createPlantStory(submissionId: string, studentId: string): Promise<void> {
    try {
      // Get submission details
      const { data: submission, error: submissionError } = await supabase
        .from('daily_submissions')
        .select('health_score')
        .eq('id', submissionId)
        .single();

      if (submissionError || !submission) {
        throw new Error('Submission not found');
      }

      const healthScore = Number(submission.health_score) || 0;
      const healthBadge = this.getHealthBadge(healthScore);

      // Create the plant story
      const { error: insertError } = await supabase
        .from('plant_stories')
        .insert({
          submission_id: submissionId,
          student_id: studentId,
          health_badge: healthBadge,
          reactions: {
            thumbs_up: 0,
            seedling: 0,
            strong: 0,
            celebrate: 0,
            idea: 0
          },
          reaction_count: 0,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        });

      if (insertError) {
        throw insertError;
      }
    } catch (error) {
      console.error('Error creating plant story:', error);
      throw error;
    }
  }

  /**
   * Get storage URL for a photo path
   */
  static getPhotoUrl(path: string): string {
    if (path.startsWith('http')) {
      return path; // Already a full URL
    }
    
    // For storage bucket paths, get the public URL
    const { data } = supabase.storage
      .from('plant-photos')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Convert health rating text to numeric score
   */
  private static getHealthScoreFromRating(rating: string | null): number {
    const ratingMap: Record<string, number> = {
      'Excellent': 95,
      'Good': 80,
      'Fair': 65,
      'Poor': 40,
      'Critical': 20
    };
    return ratingMap[rating || ''] || 0;
  }

  /**
   * Determine health badge color based on health score
   */
  private static getHealthBadge(healthScore: number): 'green' | 'yellow' | 'red' {
    if (healthScore >= 80) return 'green';
    if (healthScore >= 60) return 'yellow';
    return 'red';
  }

  /**
   * Check if current user has submitted today
   */
  static async hasUserSubmittedToday(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('image_analysis')
        .select('id')
        .eq('student_id', userId)
        .eq('processing_status', 'completed')
        .gte('created_at', today.toISOString())
        .limit(1);

      if (error) {
        console.error('Error checking user submission:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking user submission:', error);
      return false;
    }
  }

  /**
   * Ensure all students in the same class have plant story entries
   * Creates empty plant stories for students who haven't submitted yet
   */
  static async ensureClassPlantStoriesExist(currentUserId: string): Promise<void> {
    try {
      // First, get the current user's class_id
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('class_id')
        .eq('id', currentUserId)
        .single();

      if (userError || !currentUser?.class_id) {
        throw new Error('Unable to find user class information');
      }

      // Get all students in the same class
      const { data: classmates, error: classmatesError } = await supabase
        .from('users')
        .select('id, name')
        .eq('class_id', currentUser.class_id)
        .eq('role', 'student');

      if (classmatesError || !classmates) {
        throw classmatesError || new Error('No classmates found');
      }

      // Check which students already have plant stories today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existingStories, error: storiesError } = await supabase
        .from('plant_stories')
        .select('student_id')
        .gte('created_at', today.toISOString())
        .in('student_id', classmates.map(c => c.id));

      if (storiesError) {
        console.error('Error checking existing stories:', storiesError);
        return;
      }

      // Find students without stories today
      const existingStudentIds = new Set(existingStories?.map(s => s.student_id) || []);
      const studentsWithoutStories = classmates.filter(student => 
        !existingStudentIds.has(student.id)
      );

      // Create empty plant stories for students without submissions
      if (studentsWithoutStories.length > 0) {
        const emptyStories = studentsWithoutStories.map(student => ({
          student_id: student.id,
          health_badge: 'yellow' as const, // Default to neutral badge
          reactions: {
            thumbs_up: 0,
            seedling: 0,
            strong: 0,
            celebrate: 0,
            idea: 0
          },
          reaction_count: 0,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          submission_id: null // No actual submission yet
        }));

        const { error: insertError } = await supabase
          .from('plant_stories')
          .insert(emptyStories);

        if (insertError) {
          console.error('Error creating empty plant stories:', insertError);
        } else {
          console.log(`Created ${emptyStories.length} empty plant stories for class`);
        }
      }
    } catch (error) {
      console.error('Error ensuring plant stories exist:', error);
    }
  }
} 