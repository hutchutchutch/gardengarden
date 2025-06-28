import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet, Animated } from 'react-native';
import { Camera, Plus, Loader, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from 'react-native-paper';
import { PlantStoriesService, PlantStoryData } from '@/services/plant-stories-service';

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
  isAnalyzing?: boolean;
  analysisError?: boolean;
}

export default function PlantStories({ onAddPhoto, onStoryPress, isAnalyzing = false, analysisError = false }: PlantStoriesProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<PlantStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUserSubmittedToday, setHasUserSubmittedToday] = useState(false);

  // Convert PlantStoryData to PlantStory format for compatibility
  const convertToPlantStory = (storyData: PlantStoryData): PlantStory => ({
    id: storyData.id,
    studentName: storyData.student_name,
    healthScore: storyData.health_score,
    photoUrl: PlantStoriesService.getPhotoUrl(storyData.photo_url),
    hasSubmittedToday: storyData.hasSubmittedToday,
    isCurrentUser: storyData.isCurrentUser,
    reactions: {
      heart: storyData.reactions.celebrate || 0,
      thumbsUp: storyData.reactions.thumbs_up || 0,
      sparkles: storyData.reactions.strong || 0,
      trophy: storyData.reactions.seedling || 0,
      lightbulb: storyData.reactions.idea || 0,
    }
  });

  const fetchStories = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stories and check if user submitted today
      const [storiesData, userSubmittedToday] = await Promise.all([
        PlantStoriesService.fetchClassPlantStories(user.id),
        PlantStoriesService.hasUserSubmittedToday(user.id)
      ]);
      
      const convertedStories = storiesData.map(convertToPlantStory);
      setStories(convertedStories);
      setHasUserSubmittedToday(userSubmittedToday);
      
    } catch (err) {
      console.error('Error fetching plant stories:', err);
      setError('Unable to load class gardens');
      // Fallback to mock data in case of error
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStories();
    }
  }, [user?.id]);

  // Refresh stories when coming back from camera (if user was analyzing)
  useEffect(() => {
    if (!isAnalyzing && user?.id) {
      // Small delay to allow for processing
      const timer = setTimeout(() => {
        fetchStories();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, user?.id]);

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

  const AddStoryButton = () => {
    const spinValue = useRef(new Animated.Value(0)).current;

    // Spinning animation for loading state
    useEffect(() => {
      if (isAnalyzing) {
        const spin = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        );
        spin.start();
        return () => spin.stop();
      }
    }, [isAnalyzing, spinValue]);

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const getButtonContent = () => {
      if (isAnalyzing) {
        return {
          icon: <Animated.View style={{ transform: [{ rotate: spin }] }}><Loader size={24} color="#4CAF50" /></Animated.View>,
          text: 'Analyzing...',
          circleStyle: [styles.addPhotoCircle, styles.analyzingCircle]
        };
      } else if (analysisError) {
        return {
          icon: <AlertTriangle size={24} color="#EF4444" />,
          text: 'Try Again',
          circleStyle: [styles.addPhotoCircle, styles.errorCircle]
        };
      } else if (hasUserSubmittedToday) {
        return {
          icon: <Camera size={24} color="#4CAF50" />,
          text: 'Submitted',
          circleStyle: [styles.addPhotoCircle, styles.submittedCircle]
        };
      } else {
        return {
          icon: <Plus size={24} color="#64748B" />,
          text: 'Add Photo',
          circleStyle: styles.addPhotoCircle
        };
      }
    };

    const { icon, text, circleStyle } = getButtonContent();

    return (
      <Pressable 
        style={styles.storyItem}
        onPress={handleAddPhoto}
        disabled={isAnalyzing}
      >
        <View style={styles.relative}>
          <View style={circleStyle}>
            {icon}
          </View>
        </View>
        <View style={styles.storyTextContainer}>
          <Text variant="labelSmall" style={styles.storyName}>{text}</Text>
        </View>
      </Pressable>
    );
  };

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
                  <Camera size={30} color="#64748B" />
                </View>
              )}
            </View>
          </View>
          
          {/* Health score badge */}
          <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
            <Text style={styles.healthScore}>{Math.round(story.healthScore)}</Text>
          </View>
        </View>
        
        <View style={styles.storyTextContainer}>
          <Text variant="labelSmall" style={styles.storyName}>
            {story.isCurrentUser ? 'You' : formatName(story.studentName)}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
        <View style={styles.content}>
          <AddStoryButton />
          {/* Loading skeleton */}
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.storyItem}>
              <View style={styles.relative}>
                <View style={[styles.addPhotoCircle, styles.skeleton]}>
                  <View style={[styles.storyImage, styles.skeleton]} />
                </View>
              </View>
              <View style={styles.storyTextContainer}>
                <View style={[styles.skeleton, { width: 50, height: 12, borderRadius: 6 }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
        <View style={styles.content}>
          <AddStoryButton />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      <View style={styles.content}>
        <AddStoryButton />
        {stories.map((story) => (
          <StoryItem key={story.id} story={story} />
        ))}
      </View>
    </ScrollView>
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
  analyzingCircle: {
    borderColor: '#4CAF50',
    borderStyle: 'solid',
  },
  errorCircle: {
    borderColor: '#EF4444',
    borderStyle: 'solid',
  },
  submittedCircle: {
    borderColor: '#4CAF50',
    borderStyle: 'solid',
  },
  healthScore: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  content: {
    flexDirection: 'row',
    paddingLeft: 16,
    alignItems: 'center',
  },
}); 