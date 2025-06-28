import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useAppTheme } from '@/config/theme';
import { supabase } from '@/config/supabase';
import { SegmentedButtons as PaperSegmentedButtons } from 'react-native-paper';
import {
  GSModeToggle,
  GSCard,
  GSButton,
  GSChip,
  GSProgressIndicator,
  GSIconButton,
  GSEmptyState,
  GSSearchBar,
  GSFAB,
  Text,
  SectionHeader
} from '@/components/ui';

// Remove mock lesson data
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  status: 'active' | 'completed' | 'upcoming';
  imageUri: string;
  category: string;
  difficulty: string;
  completedAt: string | null;
  dueDate: string | null;
}

// Helper function to get difficulty variant
const getDifficultyVariant = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'success';
    case 'Intermediate': return 'warning';
    case 'Advanced': return 'destructive';
    default: return 'default';
  }
};

export default function StudentLessons() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const [selectedTab, setSelectedTab] = useState('0'); // Use string values for SegmentedButtons
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch lessons from Supabase
  const fetchLessons = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get all lessons accessible to the student
      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_urls(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform lessons to match our interface
      const transformedLessons = lessonsData?.map(lesson => ({
        id: lesson.id,
        title: lesson.name,
        description: lesson.description || '',
        duration: `${Math.floor(lesson.expected_duration_days / 7)} weeks`,
        progress: lesson.status === 'completed' ? 100 : lesson.status === 'active' ? 35 : 0,
        status: lesson.status as 'active' | 'completed' | 'upcoming',
        imageUri: `https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400`,
        category: lesson.plant_type || 'General',
        difficulty: 'Beginner', // TODO: Add difficulty to schema
        completedAt: lesson.status === 'completed' ? lesson.updated_at : null,
        dueDate: lesson.status === 'draft' ? lesson.start_date : null
      })) || [];
      
      setLessons(transformedLessons);
      
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isTeacherMode) {
              router.replace('/(tabs)/lessons');
    } else if (user?.id) {
      fetchLessons();
    }
  }, [isTeacherMode, user?.id]);
  
  // Get active lesson (first lesson with progress > 0 and < 100)
  const activeLesson = lessons.find(lesson => 
    lesson.progress > 0 && lesson.progress < 100
  );
  
  // Filter lessons by status
  const completedLessons = lessons.filter(lesson => lesson.status === 'completed');
  const upcomingLessons = lessons.filter(lesson => lesson.status === 'upcoming');
  
  // Apply filters
  const filterLessons = (lessonsToFilter: typeof lessons) => {
    return lessonsToFilter.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || lesson.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || lesson.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  };
  
  const currentLessons = selectedTab === '0' 
    ? filterLessons(upcomingLessons)
    : filterLessons(completedLessons);

  const handleLessonPress = (lessonId: string) => {
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

  // Get unique categories for filtering
  const getUniqueCategories = (lessonsToFilter: typeof lessons) => {
    const categories = new Set(lessonsToFilter.map(lesson => lesson.category));
    return ['All', ...Array.from(categories)];
  };

  const renderLessonCard = ({ item }: { item: typeof lessons[0] }) => (
    <Pressable onPress={() => handleLessonPress(item.id)}>
      <GSCard variant="elevated" padding="none" style={styles.lessonCard}>
        <View style={styles.lessonCardContent}>
          <Image 
            source={{ uri: item.imageUri }} 
            style={styles.lessonThumbnail}
            resizeMode="cover"
          />
          <View style={styles.lessonInfo}>
            <View style={styles.lessonHeader}>
              <Text style={[styles.lessonTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {item.title}
              </Text>
              <GSIconButton 
                icon={item.status === 'completed' ? 'check-circle' : 'clock'} 
                onPress={() => {}} 
                size={20}
              />
            </View>
            
            <Text style={[styles.lessonDescription, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={styles.lessonMeta}>
              <View style={styles.lessonTags}>
                <GSChip 
                  label={item.category} 
                  variant="primary" 
                  size="small" 
                />
                <GSChip 
                  label={item.difficulty} 
                  variant={getDifficultyVariant(item.difficulty) as any} 
                  size="small" 
                />
                <Text style={[styles.duration, { color: theme.colors.onSurfaceVariant }]}>
                  {item.duration}
                </Text>
              </View>
              
              {item.status === 'completed' && item.completedAt && (
                <Text style={[styles.completedDate, { color: theme.colors.excellent }]}>
                  {new Date(item.completedAt).toLocaleDateString()}
                </Text>
              )}
              {item.status === 'upcoming' && item.dueDate && (
                <Text style={[styles.dueDate, { color: theme.colors.onSurfaceVariant }]}>
                  Due {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
            
            {selectedTab === '0' && item.progress > 0 && item.progress < 100 && (
              <View style={styles.progressContainer}>
                <GSProgressIndicator progress={item.progress / 100} size="small" />
                <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.progress}% complete
                </Text>
              </View>
            )}
          </View>
        </View>
      </GSCard>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.modeToggleContainer}>
        <GSModeToggle />
      </View>
      
      <FlatList
        data={currentLessons}
        renderItem={renderLessonCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {activeLesson && (
              <View style={styles.continueSection}>
                <SectionHeader title="Continue Learning" />
                <GSCard variant="elevated" padding="none">
                  <Image 
                    source={{ uri: activeLesson.imageUri }} 
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <View style={styles.heroContent}>
                    <View style={styles.heroMeta}>
                      <GSChip label={activeLesson.category} variant="primary" />
                      <Text style={[styles.duration, { color: theme.colors.onSurfaceVariant }]}>
                        {activeLesson.duration}
                      </Text>
                    </View>
                    
                    <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
                      {activeLesson.title}
                    </Text>
                    <Text style={[styles.heroDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {activeLesson.description}
                    </Text>
                    
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                          Progress
                        </Text>
                        <Text style={[styles.progressValue, { color: theme.colors.onSurface }]}>
                          {activeLesson.progress}%
                        </Text>
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
            )}

            <View style={styles.filterSection}>
              <PaperSegmentedButtons
                value={selectedTab}
                onValueChange={setSelectedTab}
                buttons={[
                  { value: '0', label: `Upcoming (${upcomingLessons.length})` },
                  { value: '1', label: `Completed (${completedLessons.length})` },
                ]}
              />
              <View style={styles.searchContainer}>
                <GSSearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search lessons..."
                />
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <GSEmptyState
            icon={searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All' ? 'search-off' : 'book'}
            title={searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All' 
              ? 'No lessons found' 
              : `No ${selectedTab === '0' ? 'upcoming' : 'completed'} lessons`
            }
            description={
              searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All'
                ? 'Try adjusting your filters or search query'
                : selectedTab === '0' 
                  ? 'All lessons are complete or in progress!' 
                  : 'Complete some lessons to see them here.'
            }
            actionLabel={searchQuery ? 'Clear search' : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        }
      />
      
      {/* AI Chat FAB - Always visible in Student Mode */}
      <GSFAB
        icon="message-text"
        onPress={() => router.push('/ai-chat')}
        variant="ai"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeToggleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  listContent: {
    paddingBottom: 100,
  },
  continueSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: 192,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroContent: {
    padding: 16,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    marginTop: 16,
  },
  lessonCard: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  lessonCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  lessonThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  lessonDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
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
    flex: 1,
  },
  duration: {
    fontSize: 12,
  },
  completedDate: {
    fontSize: 12,
  },
  dueDate: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
});
