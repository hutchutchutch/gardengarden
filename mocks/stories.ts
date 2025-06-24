import { ClassStory } from '@/types';

export const classStories: ClassStory[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Emma',
    plantId: 'plant1',
    plantName: 'Tomato',
    imageUri: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=2787&auto=format&fit=crop',
    caption: "My tomato plant is growing so fast! I can't wait for the first fruit.",
    date: '2025-06-22',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    likes: 12,
    likedBy: ['user2', 'user3', 'user4'],
    comments: [
      { id: 'c1', userId: 'user2', userName: 'Noah', content: 'Looking great!', timestamp: '2025-06-22T10:00:00Z' }
    ],
    aiInsight: '🌱 Your tomato shows healthy growth patterns!',
    classId: 'TEST123'
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Noah',
    plantId: 'plant2',
    plantName: 'Sunflower',
    imageUri: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=2835&auto=format&fit=crop',
    caption: "My sunflower is already taller than me! It's reaching for the sky.",
    date: '2025-06-21',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    likes: 15,
    likedBy: ['user1', 'user3', 'user4', 'user5'],
    comments: [
      { id: 'c2', userId: 'user1', userName: 'Emma', content: 'Wow, so tall!', timestamp: '2025-06-21T11:00:00Z' },
      { id: 'c3', userId: 'user3', userName: 'Olivia', content: 'Amazing growth!', timestamp: '2025-06-21T11:30:00Z' }
    ],
    aiInsight: '🌻 Your sunflower is showing excellent vertical growth!',
    classId: 'TEST123'
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Olivia',
    plantId: 'plant3',
    plantName: 'Basil',
    imageUri: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?q=80&w=2787&auto=format&fit=crop',
    caption: "Made my first pesto with homegrown basil today! So fresh and delicious.",
    date: '2025-06-20',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    likes: 18,
    likedBy: ['user1', 'user2', 'user4', 'user5'],
    comments: [
      { id: 'c4', userId: 'user5', userName: 'Sophia', content: 'Recipe please!', timestamp: '2025-06-20T14:00:00Z' }
    ],
    aiInsight: '🌿 Perfect timing for harvesting basil leaves!',
    classId: 'TEST123'
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Liam',
    plantId: 'plant4',
    plantName: 'Carrot',
    imageUri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=2787&auto=format&fit=crop',
    caption: "Just harvested my first carrots! They're smaller than expected but still tasty.",
    date: '2025-06-19',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    likes: 10,
    likedBy: ['user1', 'user2', 'user3'],
    comments: [],
    aiInsight: '🥕 Smaller carrots often have more concentrated flavor!',
    classId: 'TEST123'
  },
  {
    id: '5',
    userId: 'user5',
    userName: 'Sophia',
    plantId: 'plant5',
    plantName: 'Strawberry',
    imageUri: 'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?q=80&w=2787&auto=format&fit=crop',
    caption: "My strawberry plants are flowering! Can't wait for sweet berries soon.",
    date: '2025-06-18',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    likes: 14,
    likedBy: ['user1', 'user2'],
    comments: [
      { id: 'c5', userId: 'user4', userName: 'Liam', content: 'Those flowers look perfect!', timestamp: '2025-06-18T16:00:00Z' }
    ],
    aiInsight: '🍓 Flowers indicate fruit in 4-6 weeks!',
    classId: 'TEST123'
  }
];