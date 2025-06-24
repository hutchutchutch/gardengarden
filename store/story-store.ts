import { create } from 'zustand';
import { classStories as mockStories } from '@/mocks/stories';
import { ClassStory } from '@/types';

interface StoryState {
  stories: ClassStory[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStories: () => Promise<void>;
  addStory: (story: Omit<ClassStory, 'id' | 'likes' | 'comments'>) => Promise<void>;
  likeStory: (id: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  isLoading: false,
  error: null,

  fetchStories: async () => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would be an API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ stories: mockStories, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch stories', isLoading: false });
    }
  },

  addStory: async (story) => {
    set({ isLoading: true, error: null });
    try {
      const newStory: ClassStory = {
        ...story,
        id: Date.now().toString(),
        likes: 0,
        comments: [],
        likedBy: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        classId: 'TEST123'
      };
      
      set(state => ({
        stories: [newStory, ...state.stories],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to add story', isLoading: false });
    }
  },

  likeStory: async (id) => {
    try {
      set(state => ({
        stories: state.stories.map(story => 
          story.id === id 
            ? { ...story, likes: story.likes + 1 } 
            : story
        )
      }));
    } catch (error) {
      set({ error: 'Failed to like story' });
    }
  },

  deleteStory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        stories: state.stories.filter(story => story.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete story', isLoading: false });
    }
  }
}));