import { Plant } from '@/types';

export const plants: Plant[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Tomato Plant',
    species: 'Solanum lycopersicum',
    plantedDate: '2025-05-15',
    lastWatered: '2025-06-22',
    lastFertilized: '2025-06-15',
    lastPhotoDate: '2025-06-20',
    growthStage: 'growing',
    health: 'good',
    healthScore: 85,
    notes: 'Growing well, some yellow leaves on bottom',
    predictedHarvestDate: '2025-08-15',
    classId: 'TEST123',
    images: [
      {
        id: '1-1',
        uri: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=2787&auto=format&fit=crop',
        date: '2025-06-20',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: 'user1',
        plantId: '1',
      },
      {
        id: '1-2',
        uri: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=2787&auto=format&fit=crop',
        date: '2025-06-10',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: 'user1',
        plantId: '1',
      }
    ]
  },
  {
    id: '2',
    userId: 'user2',
    name: 'Basil',
    species: 'Ocimum basilicum',
    plantedDate: '2025-05-20',
    lastWatered: '2025-06-22',
    lastFertilized: '2025-06-10',
    lastPhotoDate: '2025-06-21',
    growthStage: 'mature',
    health: 'excellent',
    healthScore: 95,
    notes: 'Ready for first harvest',
    predictedHarvestDate: '2025-07-10',
    classId: 'TEST123',
    images: [
      {
        id: '2-1',
        uri: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?q=80&w=2787&auto=format&fit=crop',
        date: '2025-06-21',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: 'user2',
        plantId: '2',
      }
    ]
  },
  {
    id: '3',
    userId: 'user3',
    name: 'Sunflower',
    species: 'Helianthus annuus',
    plantedDate: '2025-05-01',
    lastWatered: '2025-06-21',
    lastFertilized: '2025-06-05',
    lastPhotoDate: '2025-06-19',
    growthStage: 'growing',
    health: 'good',
    healthScore: 80,
    notes: 'Growing tall, needs support soon',
    predictedHarvestDate: '2025-09-01',
    classId: 'TEST123',
    images: [
      {
        id: '3-1',
        uri: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=2835&auto=format&fit=crop',
        date: '2025-06-19',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: 'user3',
        plantId: '3',
      }
    ]
  }
];