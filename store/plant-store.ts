import { create } from 'zustand';
import { plants as mockPlants } from '@/mocks/plants';
import { Plant, PlantImage } from '@/types';
import { storage } from '@/utils/storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PlantState {
  plants: Plant[];
  selectedPlantId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPlants: () => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id' | 'images'>) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  addPlantImage: (plantId: string, image: Omit<PlantImage, 'id'>) => Promise<void>;
  selectPlant: (id: string | null) => void;
}

export const usePlantStore = create<PlantState>()(
  persist(
    (set, get) => ({
      plants: [],
      selectedPlantId: null,
      isLoading: false,
      error: null,

      fetchPlants: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // For now, we'll use mock data
          set({ plants: mockPlants, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch plants', isLoading: false });
        }
      },

      addPlant: async (plant) => {
        set({ isLoading: true, error: null });
        try {
          const newPlant: Plant = {
            ...plant,
            id: Date.now().toString(),
            images: []
          };
          
          set(state => ({
            plants: [...state.plants, newPlant],
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to add plant', isLoading: false });
        }
      },

      updatePlant: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            plants: state.plants.map(plant => 
              plant.id === id ? { ...plant, ...updates } : plant
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to update plant', isLoading: false });
        }
      },

      deletePlant: async (id) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            plants: state.plants.filter(plant => plant.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete plant', isLoading: false });
        }
      },

      addPlantImage: async (plantId, image) => {
        set({ isLoading: true, error: null });
        try {
          const newImage: PlantImage = {
            ...image,
            id: Date.now().toString()
          };
          
          set(state => ({
            plants: state.plants.map(plant => 
              plant.id === plantId 
                ? { ...plant, images: [newImage, ...plant.images] } 
                : plant
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to add image', isLoading: false });
        }
      },

      selectPlant: (id) => {
        set({ selectedPlantId: id });
      }
    }),
    {
      name: 'plant-storage',
      storage: createJSONStorage(() => storage)
    }
  )
);