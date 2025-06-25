import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import {
  GSModeToggle,
  GSCard,
  GSButton,
  GSChip,
  GSProgressIndicator,
  GSIconButton,
  GSSegmentedButtons,
  Text
} from '@/components/ui';

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

// Helper function to get difficulty variant
const getDifficultyVariant = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'success';
    case 'Intermediate': return 'warning';
    case 'Advanced': return 'destructive';
    default: return 'default';
  }
};

// Helper function to get status variant
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'active': return 'primary';
    case 'upcoming': return 'default';
    default: return 'default';
  }
};

export default function StudentLessons() {
  const router = useRouter();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'completed'>('upcoming');
  
  // Get active lesson (first lesson with progress > 0 and < 100)
  const activeLesson = mockLessons.find(lesson => 
    lesson.progress > 0 && lesson.progress < 100
  );
  
  // Filter lessons by status
  const completedLessons = mockLessons.filter(lesson => lesson.status === 'completed');
  const upcomingLessons = mockLessons.filter(lesson => lesson.status === 'upcoming');
  const currentLessons = selectedTab === 'upcoming' ? upcomingLessons : completedLessons;

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

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/screens/teacher-lessons');
    }
  }, [isTeacherMode]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Fixed Mode Toggle at the top */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: 'white' }}>
        <GSModeToggle />
      </View>
      
      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Continue Learning Section */}
        {activeLesson ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#000' }}>Continue Learning</Text>
            
            <GSCard variant="elevated" padding="none">
              <Image 
                source={{ uri: activeLesson.imageUri }} 
                style={{ width: '100%', height: 192, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                resizeMode="cover"
              />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <GSChip label={activeLesson.category} variant="primary" />
                  <Text style={{ fontSize: 14, color: '#666' }}>{activeLesson.duration}</Text>
                </View>
                
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#000' }}>{activeLesson.title}</Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{activeLesson.description}</Text>
                
                {/* Progress */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: '#666' }}>Progress</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#000' }}>{activeLesson.progress}%</Text>
                  </View>
                  <GSProgressIndicator progress={activeLesson.progress / 100} size="medium" />
                </View>
                
                <GSButton 
                  variant="primary" 
                  icon="play" 
                  fullWidth
                  onPress={handleContinueLesson}
                >
                  Continue Lesson
                </GSButton>
              </View>
            </GSCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 24, alignItems: 'center', paddingVertical: 48 }}>
            <GSIconButton icon="book-open" onPress={() => {}} size={48} />
            <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#000' }}>All caught up!</Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              You've completed all available lessons. Check back later for new content.
            </Text>
          </View>
        )}

        {/* Tab Selection */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <GSSegmentedButtons
            options={[`Upcoming (${upcomingLessons.length})`, `Completed (${completedLessons.length})`]}
            selectedIndex={selectedTab === 'upcoming' ? 0 : 1}
            onIndexChange={(index) => setSelectedTab(index === 0 ? 'upcoming' : 'completed')}
          />
        </View>

        {/* Lessons List */}
        <View style={{ paddingHorizontal: 16 }}>
          {currentLessons.map((lesson) => (
            <Pressable key={lesson.id} onPress={() => handleLessonPress(lesson.id)}>
              <GSCard variant="elevated" padding="medium" margin="none" style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Image 
                    source={{ uri: lesson.imageUri }} 
                    style={{ width: 64, height: 64, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '600', flex: 1, color: '#000' }} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      <GSIconButton 
                        icon={lesson.status === 'completed' ? 'check-circle' : lesson.status === 'active' ? 'play' : 'clock'} 
                        onPress={() => {}} 
                        size={20} 
                      />
                    </View>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }} numberOfLines={2}>
                      {lesson.description}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <GSChip label={lesson.difficulty} variant={getDifficultyVariant(lesson.difficulty)} />
                        <Text style={{ fontSize: 12, color: '#666' }}>{lesson.duration}</Text>
                      </View>
                      {lesson.status === 'completed' && lesson.completedAt && (
                        <Text style={{ fontSize: 12, color: '#10B981' }}>
                          Completed {new Date(lesson.completedAt).toLocaleDateString()}
                        </Text>
                      )}
                      {lesson.status === 'upcoming' && lesson.dueDate && (
                        <Text style={{ fontSize: 12, color: '#F97316' }}>
                          Due {new Date(lesson.dueDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    {selectedTab === 'upcoming' && lesson.progress > 0 && lesson.progress < 100 && (
                      <View style={{ marginTop: 8 }}>
                        <GSProgressIndicator progress={lesson.progress / 100} size="small" />
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          {lesson.progress}% complete
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </GSCard>
            </Pressable>
          ))}
          
          {currentLessons.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <GSIconButton icon="book" onPress={() => {}} size={48} />
              <Text style={{ fontSize: 16, fontWeight: '500', marginTop: 16, marginBottom: 8, color: '#000' }}>
                No {selectedTab} lessons
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                {selectedTab === 'upcoming' 
                  ? 'All lessons are complete or in progress!' 
                  : 'Complete some lessons to see them here.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

 