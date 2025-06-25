import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Pressable, FlatList, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle, Play, Clock, BookOpen } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text, Button } from 'react-native-paper';
import { Progress } from '@/components/ui/progress';

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
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return styles.difficultyBeginner;
      case 'Intermediate': return styles.difficultyIntermediate;
      case 'Advanced': return styles.difficultyAdvanced;
      default: return styles.difficultyDefault;
    }
  };

  const getStatusIcon = () => {
    switch (lesson.status) {
      case 'completed':
        return <CheckCircle size={20} color="#10B981" />;
      case 'active':
        return <Play size={20} color="#3B82F6" />;
      case 'upcoming':
        return <Clock size={20} color="#64748B" />;
      default:
        return <BookOpen size={20} color="#64748B" />;
    }
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.lessonCard}>
        <CardContent style={styles.cardContent}>
          <View style={styles.lessonRow}>
            <Image 
              source={{ uri: lesson.imageUri }} 
              style={styles.lessonImage}
              resizeMode="cover"
            />
            <View style={styles.lessonInfo}>
              <View style={styles.lessonHeader}>
                <Text style={styles.lessonTitle} numberOfLines={1}>
                  {lesson.title}
                </Text>
                {getStatusIcon()}
              </View>
              <Text style={styles.lessonDescription} numberOfLines={2}>
                {lesson.description}
              </Text>
              <View style={styles.lessonMeta}>
                <View style={styles.lessonTags}>
                  <Badge variant="secondary" style={getDifficultyStyle(lesson.difficulty)}>
                    <Text style={styles.difficultyText}>{lesson.difficulty}</Text>
                  </Badge>
                  <Text style={styles.durationText}>{lesson.duration}</Text>
                </View>
                {lesson.status === 'completed' && lesson.completedAt && (
                  <Text style={styles.completedText}>
                    Completed {new Date(lesson.completedAt).toLocaleDateString()}
                  </Text>
                )}
                {lesson.status === 'upcoming' && lesson.dueDate && (
                  <Text style={styles.dueText}>
                    Due {new Date(lesson.dueDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {showProgress && lesson.progress > 0 && lesson.progress < 100 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${lesson.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{lesson.progress}% complete</Text>
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
    <SafeAreaView style={styles.container}>
      {/* Active Lesson Section - Top Half */}
      <View style={styles.flex}>
        {activeLesson ? (
          <View style={styles.activeSection}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <Card>
              <CardContent style={styles.activeCardContent}>
                <Image 
                  source={{ uri: activeLesson.imageUri }} 
                  style={styles.activeImage}
                  resizeMode="cover"
                />
                <View style={styles.activeInfo}>
                  <View style={styles.activeMeta}>
                    <Badge variant="secondary" style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{activeLesson.category}</Text>
                    </Badge>
                    <Text style={styles.activeDuration}>{activeLesson.duration}</Text>
                  </View>
                  <Text style={styles.activeTitle}>{activeLesson.title}</Text>
                  <Text style={styles.activeDescription}>{activeLesson.description}</Text>
                  
                  {/* Progress Bar */}
                  <View style={styles.activeProgressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{activeLesson.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { width: `${activeLesson.progress}%` }]}
                      />
                    </View>
                  </View>
                  
                  <Button 
                    mode="contained"
                    onPress={handleContinueLesson}
                    icon={() => <Play size={16} color="white" />}
                    style={styles.continueButton}
                  >
                    Continue Lesson
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>
              You've completed all available lessons. Check back later for new content.
            </Text>
          </View>
        )}
      </View>

      {/* Tab Section - Bottom Half */}
      <View style={styles.tabSection}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setSelectedTab('upcoming')}
            style={[
              styles.tab,
              selectedTab === 'upcoming' && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'upcoming' && styles.activeTabText
            ]}>
              Upcoming ({upcomingLessons.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab('completed')}
            style={[
              styles.tab,
              selectedTab === 'completed' && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'completed' && styles.activeTabText
            ]}>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  activeSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activeCardContent: {
    padding: 0,
  },
  activeImage: {
    width: '100%',
    height: 192,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  activeInfo: {
    padding: 16,
  },
  activeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  categoryText: {
    color: '#3B82F6',
  },
  activeDuration: {
    fontSize: 14,
    color: '#64748B',
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeDescription: {
    color: '#64748B',
    marginBottom: 16,
  },
  activeProgressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  continueButton: {
    width: '100%',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
  },
  tabSection: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
  },
  tabText: {
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  listContent: {
    padding: 16,
  },
  lessonCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  lessonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  lessonImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lessonTitle: {
    fontWeight: '600',
    flex: 1,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBeginner: {
    backgroundColor: '#D1FAE5',
  },
  difficultyIntermediate: {
    backgroundColor: '#FEF3C7',
  },
  difficultyAdvanced: {
    backgroundColor: '#FEE2E2',
  },
  difficultyDefault: {
    backgroundColor: '#F3F4F6',
  },
  difficultyText: {
    fontSize: 12,
    color: '#374151',
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
  },
  dueText: {
    fontSize: 12,
    color: '#F97316',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
}); 