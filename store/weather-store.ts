import { create } from 'zustand';
import { currentWeather as mockWeather, forecast as mockForecast } from '@/mocks/weather';
import { Weather } from '@/types';
import { Platform } from 'react-native';

interface WeatherState {
  currentWeather: Weather | null;
  forecast: Weather[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWeather: (latitude?: number, longitude?: number) => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  currentWeather: null,
  forecast: [],
  isLoading: false,
  error: null,

  fetchWeather: async (latitude, longitude) => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would fetch from a weather API using the coordinates
      // For now, we'll use mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ 
        currentWeather: mockWeather, 
        forecast: mockForecast,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: 'Failed to fetch weather data', 
        isLoading: false 
      });
    }
  }
}));