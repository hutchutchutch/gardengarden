import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock lesson data
const mockLessons = [
  {
    id: '1',
    title: 'Understanding Plant Growth Stages',
    description: 'Learn about the different stages of plant development from seed to maturity.',
    duration: '15 min',
    progress: 65,
    status: 'active',
    imageUri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    category: 'Botany Basics',
    difficulty: 'Beginner',
    completedAt: null,
    dueDate: '2024-02-15',
  },
  {
    id: '2',
    title: 'Soil Composition and pH',
    description: 'Discover how soil composition affects plant health and growth.',
    duration: '12 min',
    progress: 100,
    status: 'completed',
    imageUri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    category: 'Soil Science',
    difficulty: 'Intermediate',
    completedAt: '2024-01-28',
    dueDate: null,
  },
  {
    id: '3',
    title: 'Plant Identification Techniques',
    description: 'Master the art of identifying plants using key characteristics.',
    duration: '20 min',
    progress: 0,
    status: 'upcoming',
    imageUri: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    category: 'Plant ID',
    difficulty: 'Advanced',
    completedAt: null,
    dueDate: '2024-02-20',
  },
  {
    id: '4',
    title: 'Watering Techniques',
    description: 'Learn proper watering methods for different plant types.',
    duration: '10 min',
    progress: 100,
    status: 'completed',
    imageUri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    category: 'Plant Care',
    difficulty: 'Beginner',
    completedAt: '2024-01-25',
    dueDate: null,
  },
  {
    id: '5',
    title: 'Pest Management Strategies',
    description: 'Identify and manage common plant pests naturally.',
    duration: '18 min',
    progress: 0,
    status: 'upcoming',
    imageUri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400',
    category: 'Plant Health',
    difficulty: 'Intermediate',
    completedAt: null,
    dueDate: '2024-02-25',
  },
];

interface LessonCardProps {
  lesson: any;
  onPress: () => void;
  showProgress?: boolean;
}

const LessonCard = ({ lesson, onPress, showProgress = false }: LessonCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (lesson.status) {
      case 'completed':
        return <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />;
      case 'active':
        return <MaterialCommunityIcons name="play" size={20} color="#3B82F6" />;
      case 'upcoming':
        return <MaterialCommunityIcons name="clock" size={20} color="#64748B" />;
      default:
        return <MaterialCommunityIcons name="book-open" size={20} color="#64748B" />;
    }
  };

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex-row gap-3">
            <Image 
              source={{ uri: lesson.imageUri }} 
              className="w-16 h-16 rounded-lg"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-semibold flex-1" numberOfLines={1}>
                  {lesson.title}
                </Text>
                {getStatusIcon()}
              </View>
              <Text className="text-sm text-muted-foreground mb-2" numberOfLines={2}>
                {lesson.description}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Badge variant="secondary" className={cn("text-xs", getDifficultyColor(lesson.difficulty))}>
                    <Text className="text-xs">{lesson.difficulty}</Text>
                  </Badge>
                  <Text className="text-xs text-muted-foreground">{lesson.duration}</Text>
                </View>
                {lesson.status === 'completed' && lesson.completedAt && (
                  <Text className="text-xs text-green-600">
                    Completed {new Date(lesson.completedAt).toLocaleDateString()}
                  </Text>
                )}
                {lesson.status === 'upcoming' && lesson.dueDate && (
                  <Text className="text-xs text-orange-600">
                    Due {new Date(lesson.dueDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {showProgress && lesson.progress > 0 && lesson.progress < 100 && (
                <View className="mt-2">
                  <View className="h-2 bg-gray-200 rounded-full">
                    <View 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: `${lesson.progress}%` }}
                    />
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1">{lesson.progress}% complete</Text>
                </View>
              )}
            </View>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
};

export default function StudentLessons() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'completed' | 'upcoming'>('upcoming');
  
  // Get active lesson (first lesson with progress > 0 and < 100)
  const activeLesson = mockLessons.find(lesson => 
    lesson.progress > 0 && lesson.progress < 100
  );
  
  // Filter lessons by status
  const completedLessons = mockLessons.filter(lesson => lesson.status === 'completed');
  const upcomingLessons = mockLessons.filter(lesson => lesson.status === 'upcoming');

  const handleLessonPress = (lessonId: string) => {
    // Navigate to lesson detail or player
    router.push({
      pathname: '/modal',
      params: { type: 'lesson', lessonId }
    });
  };

  const handleContinueLesson = () => {
    if (activeLesson) {
      handleLessonPress(activeLesson.id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Active Lesson Section - Top Half */}
      <View className="flex-1">
        {activeLesson ? (
          <View className="p-4">
            <Text className="text-xl font-bold mb-4">Continue Learning</Text>
            <Card>
              <CardContent className="p-0">
                <Image 
                  source={{ uri: activeLesson.imageUri }} 
                  className="w-full h-48 rounded-t-lg"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Text className="text-primary">{activeLesson.category}</Text>
                    </Badge>
                    <Text className="text-sm text-muted-foreground">{activeLesson.duration}</Text>
                  </View>
                  <Text className="text-lg font-semibold mb-2">{activeLesson.title}</Text>
                  <Text className="text-muted-foreground mb-4">{activeLesson.description}</Text>
                  
                  {/* Progress Bar */}
                  <View className="mb-4">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-muted-foreground">Progress</Text>
                      <Text className="text-sm font-medium">{activeLesson.progress}%</Text>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full">
                      <View 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${activeLesson.progress}%` }}
                      />
                    </View>
                  </View>
                  
                  <Button onPress={handleContinueLesson} className="w-full">
                    <MaterialCommunityIcons name="play" size={16} color="white" />
                    <Text className="text-primary-foreground ml-2">Continue Lesson</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View className="p-4 items-center justify-center flex-1">
            <MaterialCommunityIcons name="book-open" size={48} color="#64748B" />
            <Text className="text-lg font-semibold mt-4 mb-2">All caught up!</Text>
            <Text className="text-muted-foreground text-center">
              You've completed all available lessons. Check back later for new content.
            </Text>
          </View>
        )}
      </View>

      {/* Tab Section - Bottom Half */}
      <View className="flex-1 border-t border-border">
        <View className="flex-row bg-muted">
          <Pressable
            onPress={() => setSelectedTab('upcoming')}
            className={cn(
              "flex-1 py-3 items-center",
              selectedTab === 'upcoming' ? 'bg-background border-t-2 border-primary' : ''
            )}
          >
            <Text className={cn(
              "font-medium",
              selectedTab === 'upcoming' ? 'text-primary' : 'text-muted-foreground'
            )}>
              Upcoming ({upcomingLessons.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab('completed')}
            className={cn(
              "flex-1 py-3 items-center",
              selectedTab === 'completed' ? 'bg-background border-t-2 border-primary' : ''
            )}
          >
            <Text className={cn(
              "font-medium",
              selectedTab === 'completed' ? 'text-primary' : 'text-muted-foreground'
            )}>
              Completed ({completedLessons.length})
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={selectedTab === 'upcoming' ? upcomingLessons : completedLessons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LessonCard 
              lesson={item} 
              onPress={() => handleLessonPress(item.id)}
              showProgress={selectedTab === 'upcoming'}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
} 