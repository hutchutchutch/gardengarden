import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useAppTheme } from '@/config/theme';
import { ImageAnalysisService, ImageAnalysisRecord } from '@/services/image-analysis-service';
import {
  GSScreenLayout,
  GSCard,
  GSButton,
  GSBadge,
  GSChip,
  GSProgressIndicator,
  GSEmptyState,
  GSIconButton,
  GSStatCard,
  Text,
  SectionHeader,
  GSHealthBadge,
  GSGuidanceCard,
  GSTaskChecklist,
  GSMilestone,
  GSFAB,
  GSHeader,
} from '@/components/ui';

// Mock data
const growthStages = [
  { id: 'seed', name: 'Seed', days: 3, completed: true },
  { id: 'sprout', name: 'Sprout', days: 7, completed: true },
  { id: 'seedling', name: 'Seedling', days: 14, completed: true },
  { id: 'vegetative', name: 'Vegetative', days: 21, completed: false, current: true },
  { id: 'flowering', name: 'Flowering', days: 14, completed: false },
  { id: 'fruiting', name: 'Fruiting', days: 30, completed: false },
];

const todaysTasks = [
  { id: '1', name: 'Submit daily photo', description: 'Take a photo of your plant', icon: 'camera', isCompleted: false, points: 10 },
  { id: '2', name: 'Watering reminder', description: 'Check if plant needs water', icon: 'water', isCompleted: true, points: 5 },
  { id: '3', name: 'Check for changes', description: 'Look for new growth', icon: 'clipboard-text', isCompleted: false, points: 5 },
];

const achievements = [
  { id: '1', name: 'First Sprout', icon: 'sprout', unlocked: true, description: 'Your seed has sprouted!' },
  { id: '2', name: 'Week Streak', icon: 'fire', unlocked: true, description: '7 days in a row' },
  { id: '3', name: 'Healthy Plant', icon: 'heart', unlocked: true, description: 'Maintained 80%+ health' },
  { id: '4', name: 'Green Thumb', icon: 'hand-peace', unlocked: false, description: 'Complete vegetative stage' },
  { id: '5', name: 'First Flower', icon: 'flower', unlocked: false, description: 'Reach flowering stage' },
  { id: '6', name: 'Harvest Ready', icon: 'fruit-cherries', unlocked: false, description: 'First fruit appears' },
];

export default function StudentProgressScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const { plants, fetchPlants } = usePlantStore();
  const [photoTaken, setPhotoTaken] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<ImageAnalysisRecord | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<ImageAnalysisRecord[]>([]);

  const activePlant = plants[0];
  const plantAge = activePlant
    ? Math.floor(
        (new Date().getTime() - new Date(activePlant.plantedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Calculate current stage and progress
  const currentStage = growthStages.find(stage => stage.current) || growthStages[3];
  const daysInCurrentStage = 3; // Mock data
  const totalDays = growthStages.reduce((sum, stage) => sum + stage.days, 0);
  const completedDays = growthStages.filter(s => s.completed).reduce((sum, stage) => sum + stage.days, 0) + daysInCurrentStage;
  const overallProgress = Math.round((completedDays / totalDays) * 100);
  
  // Calculate streak (mock data)
  const currentStreak = 5;
  const weeklyCompletion = 85; // This week's task completion rate
  
  // Health trend
  const healthTrend = activePlant?.healthScore >= 70 ? 'improving' : 'needs-attention';

  // Fetch analysis data
  const fetchAnalysisData = async () => {
    if (!user?.id) return;
    
    try {
      const [latest, history] = await Promise.all([
        ImageAnalysisService.getLatestAnalysis(user.id),
        ImageAnalysisService.getAnalysisHistory(user.id, 5)
      ]);
      
      setLatestAnalysis(latest);
      setAnalysisHistory(history);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    }
  };

  useEffect(() => {
    fetchPlants();
    if (user?.id) {
      fetchAnalysisData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/screens/teacher-progress');
    }
  }, [isTeacherMode]);

  const handleTakePhoto = () => {
    router.push('/(tabs)/camera');
  };

  const handleAskAI = () => {
    router.push('/ai-chat');
  };

  const handleViewStories = () => {
    router.push('/(tabs)');
  };

  const handleMessageTeacher = () => {
    router.push({
      pathname: '/modal',
      params: { type: 'message-teacher' }
    });
  };

  const handleTaskToggle = (taskId: string) => {
    // Update task completion status
    console.log('Toggle task:', taskId);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return theme.colors.excellent;
    if (score >= 60) return theme.colors.good;
    if (score >= 40) return theme.colors.fair;
    if (score >= 20) return theme.colors.poor;
    return theme.colors.critical;
  };

  if (!activePlant) {
    return (
      <GSScreenLayout>
        <GSHeader
          title="Progress"
          variant="back"
          onBack={() => router.back()}
        />
        <GSEmptyState
          icon="sprout"
          title="No plant data available"
          description="Start your garden journey by taking your first photo!"
          actionLabel="Start Your Garden"
          onAction={() => router.push('/(tabs)/camera')}
        />
      </GSScreenLayout>
    );
  }

  return (
    <GSScreenLayout>
      {/* Header Section */}
      <GSHeader
        title="Progress"
        variant="back"
        onBack={() => router.back()}
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Student & Plant Info Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.studentName, { color: theme.colors.onSurface }]}>
                {user?.email?.split('@')[0] || 'Student'}
              </Text>
              <Text style={[styles.plantNickname, { color: theme.colors.primary }]}>
                {activePlant.name || 'My Plant'}
              </Text>
              <View style={styles.dayCounter}>
                <Text style={[styles.dayText, { color: theme.colors.onSurfaceVariant }]}>
                  Day {plantAge} of {totalDays}
                </Text>
                <View style={{ marginLeft: 12 }}>
                  <GSProgressIndicator 
                    progress={overallProgress / 100} 
                    size="small" 
                  />
                </View>
              </View>
            </View>
            {activePlant.images.length > 0 && (
              <Image
                source={{ uri: activePlant.images[0].uri }}
                style={styles.plantThumbnail}
                resizeMode="cover"
              />
            )}
          </View>
        </View>

        {/* Current Plant Status */}
        <View style={styles.section}>
          <GSCard variant="elevated" padding="large">
            {/* Photo Placeholder or Health Score */}
            {!photoTaken ? (
              <Pressable onPress={handleTakePhoto} style={styles.photoPlaceholder}>
                <MaterialCommunityIcons 
                  name="camera-plus" 
                  size={48} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text style={[styles.photoPlaceholderText, { color: theme.colors.onSurfaceVariant }]}>
                  Take today's photo
                </Text>
              </Pressable>
            ) : (
              <View style={styles.healthScoreContainer}>
                <Text style={[styles.healthScoreLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Plant Health
                </Text>
                <Text style={[styles.healthScore, { color: getHealthColor(activePlant.healthScore) }]}>
                  {activePlant.healthScore}%
                </Text>
                <GSHealthBadge score={activePlant.healthScore} size="large" showLabel />
              </View>
            )}
            
            {/* Growth Stage */}
            <View style={styles.stageContainer}>
              <GSBadge 
                label={currentStage.name} 
                variant="primary" 
              />
              <Text style={[styles.stageText, { color: theme.colors.onSurfaceVariant }]}>
                {currentStage.name} stage for {daysInCurrentStage} days
              </Text>
            </View>
            
            {/* Last Analysis Summary */}
            <View style={styles.analysisContainer}>
              <Text style={[styles.analysisLabel, { color: theme.colors.onSurfaceVariant }]}>
                Yesterday's Analysis
              </Text>
              <Text style={[styles.analysisText, { color: theme.colors.onSurface }]}>
                Your {activePlant.species} is showing healthy growth patterns. 
                New leaves are developing well, and the stem is strengthening.
              </Text>
            </View>
          </GSCard>
        </View>

        {/* Growth Progress */}
        <View style={styles.section}>
          <SectionHeader title="Growth Progress" />
          <GSCard variant="elevated" padding="medium">
            {/* Stage Timeline */}
            <View style={styles.stageTimeline}>
              {growthStages.map((stage, index) => (
                <View key={stage.id} style={styles.stageItem}>
                  <View style={[
                    styles.stageDot,
                    {
                      backgroundColor: stage.completed 
                        ? theme.colors.primary 
                        : stage.current 
                        ? theme.colors.secondary 
                        : theme.colors.outline,
                      borderColor: stage.current ? theme.colors.primary : 'transparent',
                    }
                  ]} />
                  {index < growthStages.length - 1 && (
                    <View style={[
                      styles.stageLine,
                      {
                        backgroundColor: stage.completed 
                          ? theme.colors.primary 
                          : theme.colors.outline,
                      }
                    ]} />
                  )}
                  <Text style={[
                    styles.stageName,
                    { 
                      color: stage.current 
                        ? theme.colors.primary 
                        : theme.colors.onSurfaceVariant,
                      fontWeight: stage.current ? '600' : '400',
                    }
                  ]}>
                    {stage.name}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Next Milestone */}
            <GSMilestone
              icon="flower"
              title="Next Milestone"
              description="Expected: First flowers in 5-7 days"
              date={new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            />
            
            {/* Overall Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Overall Progress
                </Text>
                <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
                  {overallProgress}%
                </Text>
              </View>
              <GSProgressIndicator progress={overallProgress / 100} size="medium" />
            </View>
          </GSCard>
        </View>

        {/* Daily Tasks */}
        <View style={styles.section}>
          <SectionHeader title="Daily Tasks">
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={16} color={theme.colors.secondary} />
              <Text style={[styles.streakText, { color: theme.colors.secondary }]}>
                {currentStreak} days
              </Text>
            </View>
          </SectionHeader>
          <GSCard variant="elevated" padding="medium">
            <GSTaskChecklist
              tasks={todaysTasks}
              onTaskToggle={handleTaskToggle}
            />
            
            {/* Weekly Completion */}
            <View style={styles.weeklyCompletion}>
              <Text style={[styles.weeklyLabel, { color: theme.colors.onSurfaceVariant }]}>
                This week's completion
              </Text>
              <View style={styles.weeklyProgress}>
                <Text style={[styles.weeklyValue, { color: theme.colors.onSurface }]}>
                  {weeklyCompletion}%
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <GSProgressIndicator 
                    progress={weeklyCompletion / 100} 
                    size="small" 
                  />
                </View>
              </View>
            </View>
          </GSCard>
        </View>

        {/* Latest Guidance */}
        <View style={styles.section}>
          <SectionHeader title="Latest Guidance" />
          <GSGuidanceCard
            emoji="🌱"
            title="Today's Tip"
            content="Your plant is entering a critical growth phase. Ensure consistent watering and watch for new leaf development. This is when your plant needs the most nutrients!"
          />
          <GSCard variant="filled" padding="medium" margin="none" style={{ marginTop: 12 }}>
            <Text style={[styles.learningTitle, { color: theme.colors.onSurface }]}>
              Key Learning
            </Text>
            <Text style={[styles.learningText, { color: theme.colors.onSurfaceVariant }]}>
              During the vegetative stage, plants focus on developing strong stems and leaves. 
              This is the foundation for future flowering and fruit production.
            </Text>
            <View style={{ marginTop: 12 }}>
              <GSButton
                variant="secondary"
                size="small"
                icon="message-text"
                onPress={handleAskAI}
              >
              Ask AI Assistant
            </GSButton>
            </View>
          </GSCard>
        </View>

        {/* Simple Achievements */}
        <View style={styles.section}>
          <SectionHeader title="Achievements" />
          <GSCard variant="elevated" padding="medium">
            {/* Achievement Grid */}
            <View style={styles.achievementGrid}>
              {achievements.slice(0, 6).map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked 
                        ? theme.colors.primaryContainer 
                        : theme.colors.surfaceVariant,
                      opacity: achievement.unlocked ? 1 : 0.5,
                    }
                  ]}>
                    <MaterialCommunityIcons
                      name={achievement.icon as any}
                      size={24}
                      color={achievement.unlocked 
                        ? theme.colors.primary 
                        : theme.colors.onSurfaceVariant
                      }
                    />
                  </View>
                  <Text style={[
                    styles.achievementName,
                    { 
                      color: achievement.unlocked 
                        ? theme.colors.onSurface 
                        : theme.colors.onSurfaceVariant 
                    }
                  ]}>
                    {achievement.name}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Progress Rings */}
            <View style={styles.progressRings}>
              <View style={styles.ringItem}>
                <GSProgressIndicator
                  progress={currentStreak / 30}
                  size="large"
                  type="circular"
                />
                <Text style={[styles.ringLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Consistency
                </Text>
              </View>
              <View style={styles.ringItem}>
                <GSProgressIndicator
                  progress={activePlant.healthScore / 100}
                  size="large"
                  type="circular"
                />
                <Text style={[styles.ringLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Plant Health
                </Text>
              </View>
            </View>
          </GSCard>
        </View>

        {/* Basic Analytics */}
        <View style={styles.section}>
          <SectionHeader title="Analytics" />
          <GSCard variant="elevated" padding="medium">
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsHeader}>
                  <MaterialCommunityIcons 
                    name={healthTrend === 'improving' ? 'trending-up' : 'trending-down'}
                    size={24}
                    color={healthTrend === 'improving' ? theme.colors.good : theme.colors.fair}
                  />
                  <Text style={[
                    styles.analyticsLabel,
                    { color: theme.colors.onSurfaceVariant }
                  ]}>
                    Health Trend
                  </Text>
                </View>
                <Text style={[
                  styles.analyticsValue,
                  { color: healthTrend === 'improving' ? theme.colors.good : theme.colors.fair }
                ]}>
                  {healthTrend === 'improving' ? 'Improving' : 'Needs attention'}
                </Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsHeader}>
                  <MaterialCommunityIcons 
                    name="calendar-check"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={[
                    styles.analyticsLabel,
                    { color: theme.colors.onSurfaceVariant }
                  ]}>
                    Participation
                  </Text>
                </View>
                <Text style={[styles.analyticsValue, { color: theme.colors.onSurface }]}>
                  6 of 7 days
                </Text>
              </View>
            </View>
            
            <View style={styles.learningScore}>
              <Text style={[styles.learningScoreLabel, { color: theme.colors.onSurfaceVariant }]}>
                Learning Score
              </Text>
              <View style={styles.learningScoreValue}>
                <Text style={[styles.learningScoreNumber, { color: theme.colors.primary }]}>
                  85%
                </Text>
                <Text style={[styles.learningScoreText, { color: theme.colors.onSurfaceVariant }]}>
                  Based on interactions and task completion
                </Text>
              </View>
            </View>
          </GSCard>
        </View>

        {/* Action Items */}
        <View style={styles.section}>
          <SectionHeader title="Action Items" />
          <GSCard variant="elevated" padding="medium">
            {/* Today's Priority */}
            <View style={styles.priorityItem}>
              <View style={[
                styles.priorityIcon,
                { backgroundColor: theme.colors.errorContainer }
              ]}>
                <MaterialCommunityIcons
                  name="alert"
                  size={20}
                  color={theme.colors.error}
                />
              </View>
              <View style={styles.priorityContent}>
                <Text style={[styles.priorityTitle, { color: theme.colors.onSurface }]}>
                  Today's Priority
                </Text>
                <Text style={[styles.priorityText, { color: theme.colors.onSurfaceVariant }]}>
                  Check soil moisture and water if needed
                </Text>
              </View>
            </View>
            
            {/* Tomorrow's Reminder */}
            <View style={[styles.priorityItem, { marginTop: 12 }]}>
              <View style={[
                styles.priorityIcon,
                { backgroundColor: theme.colors.secondaryContainer }
              ]}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>
              <View style={styles.priorityContent}>
                <Text style={[styles.priorityTitle, { color: theme.colors.onSurface }]}>
                  Tomorrow
                </Text>
                <Text style={[styles.priorityText, { color: theme.colors.onSurfaceVariant }]}>
                  Measure plant height for weekly tracking
                </Text>
              </View>
            </View>
          </GSCard>
        </View>
      </ScrollView>

      {/* Quick Actions FAB */}
      <GSFAB
        icon="camera"
        onPress={handleTakePhoto}
        variant="primary"
        actions={[
          { icon: 'message-text', label: 'Chat with AI', onPress: handleAskAI },
          { icon: 'image-multiple', label: 'View Stories', onPress: handleViewStories },
          { icon: 'account-tie', label: 'Message Teacher', onPress: handleMessageTeacher },
        ]}
      />
    </GSScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
  },
  plantNickname: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  dayCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dayText: {
    fontSize: 14,
  },
  plantThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginLeft: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  photoPlaceholder: {
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  healthScoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  healthScoreLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  healthScore: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 12,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  stageText: {
    fontSize: 14,
    marginLeft: 12,
  },
  analysisContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  stageTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  stageItem: {
    alignItems: 'center',
    position: 'relative',
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  stageLine: {
    position: 'absolute',
    left: 12,
    right: -24,
    height: 2,
    top: 5,
  },
  stageName: {
    fontSize: 12,
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  weeklyCompletion: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  weeklyLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  weeklyProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  learningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementItem: {
    alignItems: 'center',
    width: '30%',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementName: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  progressRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  ringItem: {
    alignItems: 'center',
  },
  ringLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    flex: 1,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  learningScore: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  learningScoreLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  learningScoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  learningScoreNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  learningScoreText: {
    fontSize: 12,
    marginLeft: 12,
    flex: 1,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityContent: {
    flex: 1,
    marginLeft: 12,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
