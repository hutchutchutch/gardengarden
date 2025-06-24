import { Weather } from '@/types';

export const currentWeather: Weather = {
  temperature: 78,
  condition: 'sunny',
  humidity: 65,
  precipitation: 0
};

export const forecast: Weather[] = [
  {
    temperature: 78,
    condition: 'sunny',
    humidity: 65,
    precipitation: 0
  },
  {
    temperature: 82,
    condition: 'sunny',
    humidity: 60,
    precipitation: 0
  },
  {
    temperature: 75,
    condition: 'cloudy',
    humidity: 70,
    precipitation: 20
  },
  {
    temperature: 72,
    condition: 'rainy',
    humidity: 85,
    precipitation: 80
  },
  {
    temperature: 76,
    condition: 'cloudy',
    humidity: 75,
    precipitation: 30
  }
];