import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useAppTheme } from '@/config/theme';
import { SegmentedButtons as PaperSegmentedButtons } from 'react-native-paper';
import { 
  GSafeScreen,
  GSModeToggle,
  GSIconButton,
  GSBadge,
  GSBottomSheet,
  GSChip,
  GSCollapsible,
  GSLoadingSpinner,
  GSButton,
  GSEmptyState,
  GSFAB,
  GSProgressIndicator,
  GSCard,
  GSDocumentItem,
  GSStatCard,
  Text,
  MenuItem
} from '@/components/ui';
import { LessonService, Lesson, LessonDocument } from '@/services/lesson-service';
import { format } from 'date-fns';

export default function TeacherLessons() {
  const router = useRouter();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const theme = useAppTheme();
  const [selectedTab, setSelectedTab] = useState('current');
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  
  // State for lesson data
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Lesson[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Load lesson data
  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('No user ID available for loading lessons');
        return;
      }

      // Only load teacher data if user is actually a teacher
      if (user.role !== 'teacher') {
        console.log('User is not a teacher, skipping teacher lesson data load');
        setLoading(false);
        return;
      }

      const [current, completed, upcoming] = await Promise.all([
        LessonService.getCurrentLesson(user.id),
        LessonService.getCompletedLessons(user.id),
        LessonService.getUpcomingLessons(user.id)
      ]);
      setCurrentLesson(current);
      setCompletedLessons(completed);
      setUpcomingLessons(upcoming);
    } catch (error) {
      console.error('Error loading lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isTeacherMode) {
      router.replace('/screens/student-lessons');
    } else if (user?.id) {
      loadLessonData();
    }
  }, [isTeacherMode, user?.id]);

  const handleCreateLesson = () => {
    router.push({
      pathname: '/modal',
      params: { type: 'create-lesson' }
    });
  };

  const handleAIChat = () => {
    router.push('/ai-chat');
  };

  const handleEditLesson = () => {
    setBottomSheetVisible(false);
    if (currentLesson) {
      router.push({
        pathname: '/modal',
        params: { type: 'edit-lesson', lessonId: currentLesson.id }
      });
    }
  };

  const handleViewAnalytics = () => {
    setBottomSheetVisible(false);
    if (currentLesson) {
      router.push({
        pathname: '/modal',
        params: { lessonId: currentLesson.id }
      });
    }
  };

  const handleEndLesson = async () => {
    setBottomSheetVisible(false);
    if (currentLesson) {
      const success = await LessonService.completeLesson(currentLesson.id);
      if (success) {
        loadLessonData(); // Refresh data
      }
    }
  };

  const menuOptions: MenuItem[] = [
    {
      label: 'Edit Lesson',
      icon: 'pencil',
      onPress: handleEditLesson
    },
    {
      label: 'View Analytics',
      icon: 'chart-bar',
      onPress: handleViewAnalytics
    },
    {
      label: 'End Lesson',
      icon: 'stop-circle',
      variant: 'danger',
      onPress: handleEndLesson
    }
  ];

  const getDocumentStats = () => {
    if (!currentLesson?.lesson_urls) {
      return { completed: 0, pending: 0, failed: 0 };
    }
    const completed = currentLesson.lesson_urls.filter(d => d.status === 'completed').length;
    const pending = currentLesson.lesson_urls.filter(d => d.status === 'processing').length;
    const failed = currentLesson.lesson_urls.filter(d => d.status === 'failed').length;
    return { completed, pending, failed };
  };

  const renderCurrentLessonTab = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <GSLoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading lesson data...
          </Text>
        </View>
      );
    }

    if (!currentLesson) {
      return (
        <GSEmptyState
          icon="book-open"
          title="No active lesson"
          description="Create a new lesson to get started"
          actionLabel="Create Lesson"
          onAction={handleCreateLesson}
        />
      );
    }

    const { completed, pending, failed } = getDocumentStats();
    const daysSinceStart = currentLesson.start_date 
      ? Math.floor((Date.now() - new Date(currentLesson.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <GSCard variant="elevated" padding="large">
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={[styles.lessonTitle, { color: theme.colors.onSurface }]}>
                  {currentLesson.name}
                </Text>
                <View style={styles.badgeContainer}>
                  <GSBadge label="ACTIVE" variant="primary" />
                </View>
              </View>
              <GSIconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setBottomSheetVisible(true)}
              />
            </View>

            <View style={styles.statsGrid}>
              <GSStatCard
                label="Duration"
                value={`Day ${daysSinceStart} of ${currentLesson.expected_duration_days}`}
                icon="calendar"
              />
              <GSStatCard
                label="Students"
                value={`${7} active`}
                icon="account-group"
              />
              <GSStatCard
                label="Avg Health"
                value={`${83}%`}
                icon="heart"
              />
            </View>

            <GSCard variant="filled" padding="medium" margin="none" style={styles.documentsCard}>
              <View style={styles.documentsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Lesson Resources
                </Text>
                <View style={styles.chipContainer}>
                  {completed > 0 && (
                    <GSChip
                      label={`${completed} Completed`}
                      variant="success"
                      size="small"
                    />
                  )}
                  {pending > 0 && (
                    <GSChip
                      label={`${pending} Pending`}
                      variant="warning"
                      size="small"
                    />
                  )}
                  {failed > 0 && (
                    <GSChip
                      label={`${failed} Failed`}
                      variant="destructive"
                      size="small"
                    />
                  )}
                </View>
              </View>

              <GSCollapsible
                label={`Documents (${currentLesson.lesson_urls?.length || 0})`}
                defaultOpen={documentsExpanded}
              >
                <View style={styles.documentsList}>
                  <Text style={[styles.totalReferences, { color: theme.colors.onSurfaceVariant }]}>
                    Total References: {currentLesson.lesson_urls?.reduce((sum: number, doc: LessonDocument) => sum + doc.rag_references, 0) || 0}
                  </Text>
                  <FlatList
                    data={currentLesson.lesson_urls || []}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <GSDocumentItem
                        title={item.title}
                        url={item.url}
                        status={item.status}
                        sections={item.sections}
                        processingProgress={item.processing_progress}
                        errorMessage={item.error_message}
                        ragReferences={item.rag_references}
                        onRetry={() => console.log('Retry document:', item.id)}
                      />
                    )}
                    scrollEnabled={false}
                  />
                </View>
              </GSCollapsible>
            </GSCard>

            <View style={styles.actionContainer}>
              <GSButton
                variant="primary"
                fullWidth
                onPress={handleViewAnalytics}
              >
                View Full Analytics
              </GSButton>
            </View>
          </GSCard>
        </View>
      </ScrollView>
    );
  };

  const renderCompletedLessonsTab = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <GSLoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading completed lessons...
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <FlatList
          data={completedLessons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const startDate = item.start_date ? new Date(item.start_date) : null;
            const endDate = item.end_date ? new Date(item.end_date) : null;
            const dateRange = startDate && endDate 
              ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
              : 'No date range';
            
            return (
              <View style={styles.listContainer}>
                <GSCard variant="elevated" padding="medium">
                  <View style={styles.completedHeader}>
                    <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                      {dateRange}
                    </Text>
                    {item.plant_type && (
                      <View style={styles.chipWrapper}>
                        <GSChip label={item.plant_type} size="small" />
                      </View>
                    )}
                  </View>

                  <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Students
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                        {7}
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Avg Health
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                        {85}%
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Completion
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                        {92}%
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                        Duration
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {item.expected_duration_days} days
                      </Text>
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <GSButton
                      variant="secondary"
                      size="small"
                      onPress={() => console.log('View Report')}
                    >
                      View Report
                    </GSButton>
                    <GSButton
                      variant="secondary"
                      size="small"
                      onPress={() => console.log('Duplicate')}
                    >
                      Duplicate
                    </GSButton>
                  </View>
                </GSCard>
              </View>
            );
          }}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      </ScrollView>
    );
  };

  const renderUpcomingLessonsTab = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <GSLoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading upcoming lessons...
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {upcomingLessons.length > 0 ? (
          <FlatList
            data={upcomingLessons}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const scheduledDate = item.start_date 
                ? format(new Date(item.start_date), 'MMM d, yyyy')
                : 'No date set';
              
              const isReady = item.lesson_urls && item.lesson_urls.length > 0 
                && item.lesson_urls.every(doc => doc.status === 'completed');
              const processingProgress = item.lesson_urls && item.lesson_urls.length > 0
                ? Math.round(item.lesson_urls.filter(doc => doc.status === 'completed').length / item.lesson_urls.length * 100)
                : 0;
              
              return (
                <View style={styles.listContainer}>
                  <GSCard variant="elevated" padding="medium">
                    <View style={styles.upcomingHeader}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.cardTitle, { color: theme.colors.onSurface, flex: 1 }]}>
                          {item.name}
                        </Text>
                        <GSBadge label={scheduledDate} variant="secondary" />
                      </View>
                      <View style={styles.metaRow}>
                        {item.plant_type && <GSChip label={item.plant_type} size="small" />}
                        <Text style={[styles.durationText, { color: theme.colors.onSurfaceVariant }]}>
                          {item.expected_duration_days} days
                        </Text>
                      </View>
                    </View>

                    <View style={styles.resourceRow}>
                      <View style={styles.resourceInfo}>
                        <Text style={[styles.resourceText, { color: theme.colors.onSurfaceVariant }]}>
                          {item.lesson_urls?.length || 0} resources
                        </Text>
                        {isReady ? (
                          <GSBadge label="Ready" variant="primary" />
                        ) : (
                          <GSProgressIndicator
                            type="linear"
                            progress={processingProgress / 100}
                          />
                        )}
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <GSButton
                        variant="secondary"
                        size="small"
                        onPress={() => console.log('Edit')}
                      >
                        Edit
                      </GSButton>
                      <GSButton
                        variant="primary"
                        size="small"
                        onPress={async () => {
                          if (isReady) {
                            const success = await LessonService.activateLesson(item.id);
                            if (success) {
                              loadLessonData(); // Refresh data
                            }
                          }
                        }}
                        disabled={!isReady}
                      >
                        Activate
                      </GSButton>
                      <GSIconButton
                        icon="delete"
                        size={20}
                        onPress={() => console.log('Delete')}
                        color={theme.colors.error}
                      />
                    </View>
                  </GSCard>
                </View>
              );
            }}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <GSEmptyState
            icon="book-open"
            title="No upcoming lessons"
            description="Create a new lesson to get started"
            actionLabel="Create Lesson"
            onAction={handleCreateLesson}
          />
        )}
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'current':
        return renderCurrentLessonTab();
      case 'completed':
        return renderCompletedLessonsTab();
      case 'upcoming':
        return renderUpcomingLessonsTab();
      default:
        return null;
    }
  };

  return (
    <GSafeScreen>
      <View style={[styles.modeToggleContainer, { backgroundColor: theme.colors.background }]}>
        <GSModeToggle />
      </View>

      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.outline }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.onSurface }]}>Lessons</Text>
          </View>
          <View style={styles.headerRight}>
            <GSIconButton
              icon="plus"
              size={24}
              onPress={handleCreateLesson}
            />
          </View>
        </View>

        <View style={styles.segmentedContainer}>
          <PaperSegmentedButtons
            value={selectedTab}
            onValueChange={setSelectedTab}
            buttons={[
              { value: 'current', label: 'Current' },
              { value: 'completed', label: 'Completed' },
              { value: 'upcoming', label: 'Upcoming' },
            ]}
          />
        </View>
      </View>

      {renderContent()}

      <GSFAB
        icon="robot"
        onPress={handleAIChat}
        variant="secondary"
        label="AI Assistant"
      />

      <GSBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        options={menuOptions}
      />
    </GSafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  modeToggleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  badgeContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  documentsCard: {
    marginTop: 16,
  },
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 1,
  },
  documentsList: {
    paddingTop: 12,
  },
  totalReferences: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  actionContainer: {
    marginTop: 24,
  },
  listContainer: {
    paddingBottom: 16,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  completedHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
  },
  chipWrapper: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    borderRadius: 8,
    padding: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  upcomingHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 14,
  },
  resourceRow: {
    marginBottom: 12,
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceText: {
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
