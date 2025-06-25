import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Heart, MessageCircle, Camera, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import StoryCard from './StoryCard';

export interface PlantStory {
  id: string;
  studentName: string;
  healthScore: number;
  photoUrl: string;
  hasSubmittedToday: boolean;
  isCurrentUser: boolean; 
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
        healthScore: 85,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: false,
        isCurrentUser: user?.id === 'user123'
      },
      {
        id: 'user456',
        studentName: 'Alex Rivera',
        healthScore: 92,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        reactions: { heart: 3, thumbsUp: 2, sparkles: 1 }
      },
      {
        id: 'user789',
        studentName: 'Maya Patel',
        healthScore: 78,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        reactions: { thumbsUp: 1, trophy: 2 }
      },
      {
        id: 'user101',
        studentName: 'Jordan Kim',
        healthScore: 65,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
        reactions: { lightbulb: 1, heart: 1 }
      },
      {
        id: 'user202',
        studentName: 'Emma Wilson',
        healthScore: 88,
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop&crop=center',
        hasSubmittedToday: true,
        isCurrentUser: false,
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
      style={styles.storyItem}
      onPress={handleAddPhoto}
    >
      <View style={styles.relative}>
        <View style={styles.addPhotoCircle}>
          <Plus size={24} color="#64748B" />
        </View>
      </View>
      <View style={styles.storyTextContainer}>
        <Text variant="labelSmall" style={styles.storyName}>Add Photo</Text>
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
        style={styles.storyItem}
        onPress={() => handleStoryPress(story)}
      >
        <View style={styles.relative}>
          {/* Health ring */}
          <View 
            style={[styles.healthRing, { backgroundColor: healthColor }]}
          >
            <View style={styles.imageContainer}>
              {story.photoUrl ? (
                <Image
                  source={{ uri: story.photoUrl }}
                  style={styles.storyImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.storyImage, styles.placeholderImage]}>
                  <Heart size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
          </View>
          
          {/* Health score badge */}
          <View 
            style={[styles.healthBadge, { backgroundColor: healthColor }]}
          >
            <Text variant="labelSmall" style={styles.healthBadgeText}>
              {story.healthScore}
            </Text>
          </View>
        </View>
        
        <View style={styles.storyTextContainer}>
          <Text variant="labelSmall" style={styles.storyName} numberOfLines={1}>
            {story.isCurrentUser ? 'You' : formatName(story.studentName)}
          </Text>
        </View>
      </Pressable>
    );
  };

  const currentUserStory = stories.find(s => s.isCurrentUser);
  const otherStories = stories
    .filter(story => !story.isCurrentUser)

  return (
    <View style={styles.container}>
      <View style={styles.header}>

        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingRight: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  relative: {
    position: 'relative',
  },
  addPhotoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  placeholderImage: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  storyTextContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  storyName: {
    fontWeight: '500',
    maxWidth: 80,
  },
}); 