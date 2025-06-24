import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantAnalysis } from '@/types';

interface AnalysisState {
  analyses: PlantAnalysis[];
  currentAnalysis: PlantAnalysis | null;
  addAnalysis: (analysis: PlantAnalysis) => void;
  updateAnalysis: (id: string, data: Partial<PlantAnalysis>) => void;
  setCurrentAnalysis: (analysis: PlantAnalysis | null) => void;
  getAnalysisById: (id: string) => PlantAnalysis | undefined;
  clearCurrentAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      analyses: [],
      currentAnalysis: null,
      
      addAnalysis: (analysis) => {
        set((state) => ({
          analyses: [analysis, ...state.analyses],
          currentAnalysis: analysis,
        }));
      },
      
      updateAnalysis: (id, data) => {
        set((state) => ({
          analyses: state.analyses.map((analysis) => 
            analysis.id === id ? { ...analysis, ...data } : analysis
          ),
          currentAnalysis: state.currentAnalysis?.id === id 
            ? { ...state.currentAnalysis, ...data } 
            : state.currentAnalysis,
        }));
      },
      
      setCurrentAnalysis: (analysis) => {
        set({ currentAnalysis: analysis });
      },
      
      getAnalysisById: (id) => {
        return get().analyses.find((analysis) => analysis.id === id);
      },
      
      clearCurrentAnalysis: () => {
        set({ currentAnalysis: null });
      },
    }),
    {
      name: 'garden-analysis-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);