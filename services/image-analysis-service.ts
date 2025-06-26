import { supabase } from '@/config/supabase';

export interface ImageAnalysisResult {
  current_stage: {
    name: string;
    description: string;
  };
  overall_health: {
    rating: string;
    positive_signs: string[];
    areas_for_improvement: string[];
  };
  tips: Array<{
    title: string;
    description: string;
  }>;
}

export interface ImageAnalysisRecord {
  id: string;
  student_id: string;
  image_url: string;
  analysis_date: string;
  current_stage_name: string;
  current_stage_description: string;
  health_rating: string;
  positive_signs: string[];
  areas_for_improvement: string[];
  tips: Array<{
    title: string;
    description: string;
  }>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class ImageAnalysisService {
  /**
   * Trigger image analysis for a student's plant photo
   */
  static async analyzeImage(imageUrl: string, studentId: string): Promise<{
    success: boolean;
    analysisId?: string;
    analysis?: ImageAnalysisResult;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-plant-image', {
        body: {
          imageUrl,
          studentId
        }
      });

      if (error) {
        console.error('Error calling analysis function:', error);
        return {
          success: false,
          error: error.message || 'Failed to analyze image'
        };
      }

      return {
        success: true,
        analysisId: data.analysisId,
        analysis: data.analysis
      };
    } catch (error) {
      console.error('Error in analyzeImage:', error);
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  /**
   * Get the latest analysis for a student
   */
  static async getLatestAnalysis(studentId: string): Promise<ImageAnalysisRecord | null> {
    try {
      const { data, error } = await supabase
        .from('image_analysis')
        .select('*')
        .eq('student_id', studentId)
        .eq('processing_status', 'completed')
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching latest analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLatestAnalysis:', error);
      return null;
    }
  }

  /**
   * Get yesterday's analysis for feedback display
   */
  static async getYesterdayAnalysis(studentId: string): Promise<ImageAnalysisRecord | null> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(yesterday);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('image_analysis')
        .select('*')
        .eq('student_id', studentId)
        .eq('processing_status', 'completed')
        .gte('analysis_date', yesterday.toISOString())
        .lt('analysis_date', tomorrow.toISOString())
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching yesterday analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getYesterdayAnalysis:', error);
      return null;
    }
  }

  /**
   * Get all analysis history for a student
   */
  static async getAnalysisHistory(studentId: string, limit = 10): Promise<ImageAnalysisRecord[]> {
    try {
      const { data, error } = await supabase
        .from('image_analysis')
        .select('*')
        .eq('student_id', studentId)
        .eq('processing_status', 'completed')
        .order('analysis_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching analysis history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAnalysisHistory:', error);
      return [];
    }
  }

  /**
   * Check analysis status by ID
   */
  static async getAnalysisStatus(analysisId: string): Promise<ImageAnalysisRecord | null> {
    try {
      const { data, error } = await supabase
        .from('image_analysis')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Error fetching analysis status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAnalysisStatus:', error);
      return null;
    }
  }

  /**
   * Get health score from latest analysis
   */
  static async getLatestHealthScore(studentId: string): Promise<number | null> {
    const analysis = await this.getLatestAnalysis(studentId);
    if (!analysis) return null;

    // Convert rating to numeric score
    const ratingMap: Record<string, number> = {
      'Excellent': 95,
      'Good': 80,
      'Fair': 65,
      'Poor': 40,
      'Critical': 20
    };

    return ratingMap[analysis.health_rating] || null;
  }
} 