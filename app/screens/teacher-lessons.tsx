import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useAppTheme } from '@/config/theme';
import { 
  GSafeScreen,
  GSModeToggle,
  GSHeader,
  GSIconButton,
  GSSegmentedButtons,
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

export default function TeacherLessons() {
  const router = useRouter();
  const { } = useAuth();
  const { isTeacherMode } = useMode();
  const theme = useAppTheme();
  const [selectedTab, setSelectedTab] = useState(0);
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
      console.log('Loading lesson data...');
      
      const [current, completed, upcoming] = await Promise.all([
        LessonService.getCurrentLesson(),
        LessonService.getCompletedLessons(),
        LessonService.getUpcomingLessons()
      ]);

      console.log('Loaded data:', {
        current: current?.lesson_name || 'None',
        currentStats: current?.lesson_stats ? 'Has stats' : 'No stats',
        completed: completed.length,
        upcoming: upcoming.length
      });

      // Debug: Log the current lesson structure
      if (current) {
        console.log('Current lesson structure:', {
          id: current.lesson_id,
          name: current.lesson_name,
          statsType: Array.isArray(current.lesson_stats) ? 'array' : typeof current.lesson_stats,
          statsLength: Array.isArray(current.lesson_stats) ? current.lesson_stats.length : 'N/A'
        });
      }

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
    } else {
      loadLessonData();
    }
  }, [isTeacherMode]);

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
        params: { type: 'edit-lesson', lessonId: currentLesson.lesson_id }
      });
    }
  };

  const handleViewAnalytics = () => {
    setBottomSheetVisible(false);
    if (currentLesson) {
      router.push({
        pathname: '/modal',
        params: { lessonId: currentLesson.lesson_id }
      });
    }
  };

  const handleEndLesson = async () => {
    setBottomSheetVisible(false);
    if (currentLesson) {
      const success = await LessonService.completeLesson(currentLesson.lesson_id);
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
    if (!currentLesson?.lesson_documents) {
      return { completed: 0, pending: 0, failed: 0 };
    }
    const completed = currentLesson.lesson_documents.filter(d => d.status === 'completed').length;
    const pending = currentLesson.lesson_documents.filter(d => d.status === 'processing').length;
    const failed = currentLesson.lesson_documents.filter(d => d.status === 'failed').length;
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
    const stats = LessonService.normalizeStats(currentLesson.lesson_stats);

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.contentContainer}>
          {/* Main Lesson Card */}
          <GSCard variant="elevated" padding="large">
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={[styles.lessonTitle, { color: theme.colors.onSurface }]}>
                  {currentLesson.lesson_name}
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

            {/* Lesson Stats */}
            <View style={styles.statsGrid}>
              <GSStatCard
                label="Duration"
                value={`Day ${stats?.days_completed || 0} of ${stats?.total_days || 7}`}
                icon="calendar"
              />
              <GSStatCard
                label="Students"
                value={`${stats?.active_students || 0} active`}
                icon="account-group"
              />
              <GSStatCard
                label="Avg Health"
                value={`${stats?.average_health || 0}%`}
                icon="heart"
              />
            </View>

            {/* Document Status Section */}
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
                label={`Documents (${currentLesson.lesson_documents?.length || 0})`}
                defaultOpen={documentsExpanded}
              >
                <View style={styles.documentsList}>
                  <Text style={[styles.totalReferences, { color: theme.colors.onSurfaceVariant }]}>
                    Total References: {currentLesson.lesson_documents?.reduce((sum: number, doc: LessonDocument) => sum + doc.rag_references, 0) || 0}
                  </Text>
                  <FlatList
                    data={currentLesson.lesson_documents || []}
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
          keyExtractor={(item) => item.lesson_id}
          renderItem={({ item }) => {
            const stats = LessonService.normalizeStats(item.lesson_stats);
            return (
              <View style={styles.listContainer}>
                <GSCard variant="elevated" padding="medium">
                  <View style={styles.completedHeader}>
                    <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                      {item.lesson_name}
                    </Text>
                    <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                      {stats?.date_range || 'No date range'}
                    </Text>
                    {stats?.plant_type && (
                      <View style={styles.chipWrapper}>
                        <GSChip label={stats.plant_type} size="small" />
                      </View>
                    )}
                  </View>

                  <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Students
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                        {stats?.active_students || 0}
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Avg Health
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                        {stats?.average_health || 0}%
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Completion
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                        {stats?.completion_rate || 0}%
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                        Top Resource
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {stats?.top_resource || 'N/A'}
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
            keyExtractor={(item) => item.lesson_id}
            renderItem={({ item }) => {
              const stats = LessonService.normalizeStats(item.lesson_stats);
              const scheduledDate = stats?.scheduled_date 
                ? new Date(stats.scheduled_date).toLocaleDateString()
                : 'No date set';
              
              return (
                <View style={styles.listContainer}>
                  <GSCard variant="elevated" padding="medium">
                    <View style={styles.upcomingHeader}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.cardTitle, { color: theme.colors.onSurface, flex: 1 }]}>
                          {item.lesson_name}
                        </Text>
                        <GSBadge label={scheduledDate} variant="secondary" />
                      </View>
                      <View style={styles.metaRow}>
                        {stats?.plant_type && <GSChip label={stats.plant_type} size="small" />}
                        <Text style={[styles.durationText, { color: theme.colors.onSurfaceVariant }]}>
                          {stats?.total_days || 7} days
                        </Text>
                      </View>
                    </View>

                    <View style={styles.resourceRow}>
                      <View style={styles.resourceInfo}>
                        <Text style={[styles.resourceText, { color: theme.colors.onSurfaceVariant }]}>
                          {item.lesson_documents?.length || 0} resources
                        </Text>
                        {stats?.is_ready ? (
                          <GSBadge label="Ready" variant="primary" />
                        ) : (
                          <GSProgressIndicator
                            type="linear"
                            progress={(stats?.processing_progress || 0) / 100}
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
                          if (stats?.is_ready) {
                            const success = await LessonService.activateLesson(item.lesson_id);
                            if (success) {
                              loadLessonData(); // Refresh data
                            }
                          }
                        }}
                        disabled={!stats?.is_ready}
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
      case 0:
        return renderCurrentLessonTab();
      case 1:
        return renderCompletedLessonsTab();
      case 2:
        return renderUpcomingLessonsTab();
      default:
        return null;
    }
  };

  return (
    <GSafeScreen>
      {/* Fixed Mode Toggle at the top - standardized across all screens */}
      <View style={[styles.modeToggleContainer, { backgroundColor: theme.colors.background }]}>
        <GSModeToggle />
      </View>

      {/* Header with Create Button */}
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

        {/* Segmented Buttons */}
        <View style={styles.segmentedContainer}>
          <GSSegmentedButtons
            options={['Current', 'Completed', 'Upcoming']}
            selectedIndex={selectedTab}
            onIndexChange={setSelectedTab}
          />
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* AI Chat FAB */}
      <GSFAB
        icon="robot"
        onPress={handleAIChat}
        variant="secondary"
        label="AI Assistant"
      />

      {/* Bottom Sheet */}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
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
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 16,
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
  },
});