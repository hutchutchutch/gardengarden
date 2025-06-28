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
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Query for recent image analyses from classmates
      const { data: analysisData, error: analysisError } = await supabase
        .from('image_analysis')
        .select(`
          id,
          student_id,
          image_url,
          health_rating,
          current_stage_name,
          processing_status,
          created_at,
          users!inner (
            id,
            name,
            class_id
          )
        `)
        .eq('users.class_id', currentUser.class_id)
        .eq('processing_status', 'completed')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (analysisError) {
        throw analysisError;
      }

      // Transform the data
      const stories: PlantStoryData[] = [];

      if (analysisData) {
        for (const analysis of analysisData) {
          const user = Array.isArray(analysis.users) ? analysis.users[0] : analysis.users;
          
          // Convert health rating to numeric score
          const healthScore = this.getHealthScoreFromRating(analysis.health_rating);
          
          if (user) {
            stories.push({
              id: analysis.id,
              student_id: analysis.student_id,
              student_name: user.name,
              photo_url: analysis.image_url,
              thumbnail_url: undefined,
              health_score: healthScore,
              health_badge: this.getHealthBadge(healthScore),
              reaction_count: 0,
              reactions: {},
              submission_date: analysis.created_at,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              isCurrentUser: analysis.student_id === currentUserId,
              hasSubmittedToday: true
            });
          }
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
} 