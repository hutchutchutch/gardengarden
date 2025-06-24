export type PlantAnalysis = {
  id: string;
  imageUri: string;
  timestamp: number;
  results?: {
    plantName?: string;
    healthStatus?: string;
    careInstructions?: string[];
    issues?: string[];
    confidence?: number;
  };
  isProcessing?: boolean;
  error?: string;
};

export type UserProfile = {
  name: string;
  email: string;
  avatar?: string;
  gardenType?: string;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  plantCount?: number;
};