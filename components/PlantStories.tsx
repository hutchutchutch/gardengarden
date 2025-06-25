import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { Plus, Camera, Heart, ThumbsUp, Sparkles, Trophy, Lightbulb } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface PlantStory {
  id: string;
  studentName: string;
  plantDay: number;
  healthScore: number;
  photoUrl: string;
  hasSubmittedToday: boolean;
  isCurrentUser: boolean;
  timestamp: Date;
  reactions?: {
    heart?: number;
    thumbsUp?: number;
    sparkles?: number;
    trophy?: number;
    lightbulb?: number;
  };
}

interface PlantStoriesProps {
  onAddPhoto?: () => void;
  onStoryPress?: (story: PlantStory) => void;
}

export default function PlantStories({ onAddPhoto, onStoryPress }: PlantStoriesProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<PlantStory[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockStories: PlantStory[] = [
      {
        id: 'user123',
        studentName: 'Sarah Chen',
        plantDay: 23,
        healthScore: 85,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: false,
        isCurrentUser: user?.id === 'user123',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 'user456',
        studentName: 'Alex Rivera',
        plantDay: 25,
        healthScore: 92,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        reactions: { heart: 3, thumbsUp: 2, sparkles: 1 }
      },
      {
        id: 'user789',
        studentName: 'Maya Patel',
        plantDay: 22,
        healthScore: 78,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        reactions: { thumbsUp: 1, trophy: 2 }
      },
      {
        id: 'user101',
        studentName: 'Jordan Kim',
        plantDay: 24,
        healthScore: 65,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        reactions: { lightbulb: 1, heart: 1 }
      },
      {
        id: 'user202',
        studentName: 'Emma Wilson',
        plantDay: 26,
        healthScore: 88,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        reactions: { sparkles: 2, trophy: 1, thumbsUp: 3 }
      }
    ];
    setStories(mockStories);
  }, [user?.id]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };


  const handleStoryPress = (story: PlantStory) => {
    onStoryPress?.(story);
  };

  const handleAddPhoto = () => {
    if (onAddPhoto) {
      onAddPhoto();
    } else {
      router.push('/(tabs)/camera');
    }
  };

  const AddStoryButton = () => (
    <Pressable 
      className="items-center mr-4 min-w-[90px]"
      onPress={handleAddPhoto}
    >
      <View className="relative">
        <View className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border items-center justify-center">
          <Plus size={24} color="#64748B" />
        </View>
      </View>
      <View className="items-center mt-2">
        <Text className="text-xs font-medium text-foreground">Add Photo</Text>
        <Text className="text-xs text-muted-foreground">Day 23</Text>
      </View>
    </Pressable>
  );

  const formatName = (fullName: string) => {
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1][0]}.`;
    }
    return nameParts[0];
  };

  const StoryItem = ({ story }: { story: PlantStory }) => {
    const healthColor = getHealthColor(story.healthScore);

    return (
      <Pressable 
        className="items-center mr-4 min-w-[90px]"
        onPress={() => handleStoryPress(story)}
      >
        <View className="relative">
          {/* Health ring */}
          <View 
            className="w-20 h-20 rounded-full p-0.5 items-center justify-center"
            style={{ backgroundColor: healthColor }}
          >
            <View className="w-full h-full rounded-full bg-background p-1">
              <Image
                source={{ uri: story.photoUrl }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Health score badge */}
          <View 
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background items-center justify-center"
            style={{ backgroundColor: healthColor }}
          >
            <Text className="text-xs font-bold text-white">
              {story.healthScore}
            </Text>
          </View>
        </View>
        
        <View className="items-center mt-2">
          <Text className="text-xs font-medium text-foreground max-w-[80px]" numberOfLines={1}>
            {story.isCurrentUser ? 'You' : formatName(story.studentName)}
          </Text>
          <Text className="text-xs text-muted-foreground">Day {story.plantDay}</Text>
        </View>
      </Pressable>
    );
  };

  const currentUserStory = stories.find(s => s.isCurrentUser);
  const otherStories = stories
    .filter(story => !story.isCurrentUser)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <View className="bg-background">
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground">Plant Stories</Text>
          <Text className="text-sm text-muted-foreground">24h</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={110}
          snapToAlignment="start"
        >
          {/* Current user's story or add button */}
          {currentUserStory?.hasSubmittedToday ? (
            <StoryItem story={currentUserStory} />
          ) : (
            <AddStoryButton />
          )}
          
          {/* Other students' stories */}
          {otherStories.map(story => (
            <StoryItem key={story.id} story={story} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
} 