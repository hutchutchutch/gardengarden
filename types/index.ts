export interface Plant {
  id: string;
  userId: string;
  name: string;
  species: string;
  plantedDate: string;
  lastWatered: string;
  lastFertilized: string;
  lastPhotoDate?: string;
  growthStage: 'seed' | 'sprout' | 'growing' | 'mature';
  health: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number; // 0-100
  notes: string;
  images: PlantImage[];
  predictedHarvestDate?: string;
  classId: string;
  lessonId?: string;
}

export interface PlantImage {
  id: string;
  uri: string;
  date: string;
  notes?: string;
  aiAnalysis?: AIPlantAnalysis;
  expiresAt: string; // For 24-hour deletion
  userId: string;
  plantId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  plantId?: string;
  userId: string;
  classId: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  type: 'water' | 'fertilize' | 'prune' | 'harvest' | 'plant' | 'photo' | 'observe' | 'other';
  priority: 'high' | 'medium' | 'low';
  weatherDependent: boolean;
  points: number;
}

export interface Weather {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  humidity: number;
  precipitation: number;
}

export interface ClassStory {
  id: string;
  userId: string;
  userName: string;
  plantId: string;
  plantName: string;
  imageUri: string;
  caption: string;
  date: string;
  expiresAt: string; // 24-hour expiration
  likes: number;
  likedBy: string[];
  comments: Comment[];
  aiInsight?: string;
  classId: string;
}

export interface Source {
  url: string;
  title: string;
  snippet: string;
  similarity?: number;
  lesson_url_id?: string;
  content?: string;
  chunk_id?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'teacher';
  content: string;
  timestamp: string;
  sources?: Source[]; // For AI responses that reference lesson materials
  sender_id?: string; // Added to properly track who sent the message
}

// User authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  classId: string;
  createdAt: string;
  lastActiveAt: string;
  streak: number;
  profileImage?: string;
}

// AI Analysis result
export interface AIPlantAnalysis {
  healthScore: number;
  growthStage: string;
  issues: string[];
  recommendations: string[];
  measurements?: {
    height?: number;
    leafCount?: number;
    fruitCount?: number;
  };
  analyzedAt: string;
}

// Teacher dashboard data
export interface ClassStats {
  classId: string;
  totalStudents: number;
  activeToday: number;
  plantsHealthy: number;
  plantsNeedingAttention: number;
  participationRate: number;
  averageHealthScore: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

