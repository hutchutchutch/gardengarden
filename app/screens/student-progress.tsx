import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useAppTheme } from '@/config/theme';
import { supabase } from '@/config/supabase';
import colors from '@/constants/colors';
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
  GSLoadingSpinner,
  GSSnackbar,
  GSModeToggle,
  GSPlantCard,
} from '@/components/ui';

// Types for Supabase data
interface PlantData {
  id: string;
  nickname: string;
  planting_date: string;
  current_stage: string;
  current_health_score: number;
  last_photo_date: string | null;
  plant_day: number;
}

interface GuidanceRecord {
  id: string;
  guidance_text: string;
  priority: 'routine' | 'attention' | 'urgent';
  created_at: string;
  health_score: number;
  plant_day: number;
  currentStage: string;
  positiveSigns: string[];
  areasForImprovement: string[];
  imageUrl: string;
}

interface HealthTrend {
  health_score: number;
  created_at: string;
  plant_day: number;
}

interface TaskData {
  id: string;
  task_name: string;
  task_type: string;
  completed: boolean;
  points: number;
  day_number: number;
}

// Growth stages with expected duration
const growthStages = [
  { id: 'seed', name: 'Seed', days: 3, icon: 'seed' },
  { id: 'seedling', name: 'Seedling', days: 14, icon: 'sprout' },
  { id: 'vegetative', name: 'Vegetative', days: 21, icon: 'leaf' },
  { id: 'flowering', name: 'Flowering', days: 14, icon: 'flower' },
  { id: 'fruiting', name: 'Fruiting', days: 30, icon: 'fruit-cherries' },
];

export default function StudentProgressScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  
  const [loading, setLoading] = useState(true);
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [guidanceHistory, setGuidanceHistory] = useState<GuidanceRecord[]>([]);
  const [healthTrend, setHealthTrend] = useState<HealthTrend[]>([]);
  const [dailyTasks, setDailyTasks] = useState<TaskData[]>([]);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
  }>({
    visible: false,
    message: '',
    variant: 'info',
  });
  const [activePlant, setActivePlant] = useState<any>(null);
  const [expandedTaskIndex, setExpandedTaskIndex] = useState<number | null>(null);
  const [pendingPhotoTaskId, setPendingPhotoTaskId] = useState<string | null>(null);

  const showSnackbar = (message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSnackbar({ visible: true, message, variant });
  };

  // Function to mark a task as completed
  const markTaskAsCompleted = async (taskId: string) => {
    if (!user?.id || !activePlant) return;

    const task = dailyTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    try {
      // Mock implementation - in production this would update Supabase
      console.log('Photo task marked as completed:', taskId);
      
      // Update local state
      setDailyTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? { ...t, completed: true }
            : t
        )
      );
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    if (!user?.id) return;

    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if this is a photo task and it's currently unchecked
    const isPhotoTask = task.task_name.toLowerCase().includes('take') && task.task_name.toLowerCase().includes('photo') ||
                       task.task_name.toLowerCase().includes('photo');
    
    if (isPhotoTask && !task.completed) {
      // Set pending photo task and navigate to camera screen
      setPendingPhotoTaskId(taskId);
      router.push('/(tabs)/camera');
      return;
    }

    try {
      const newCompletedState = !task.completed;
      
      // Mock implementation - in production this would update Supabase
      console.log('Task toggled:', taskId, newCompletedState);

      // Update local state
      setDailyTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? { ...t, completed: newCompletedState }
            : t
        )
      );

    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Check for completed photo submissions when returning from camera
  const checkForPhotoSubmission = React.useCallback(async () => {
    if (!pendingPhotoTaskId || !user?.id) return;

    try {
      // Mock check - in production this would check Supabase for recent photo submission
      // For now, just mark as completed after a delay
      setTimeout(() => {
        markTaskAsCompleted(pendingPhotoTaskId);
        setPendingPhotoTaskId(null);
      }, 1000);
    } catch (error) {
      console.error('Error checking photo submission:', error);
    }
  }, [pendingPhotoTaskId, user?.id]);

  const loadStudentProgressData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Simulate real Growing Tomatoes lesson data (lesson started 14 days ago)
      const lessonStartDate = new Date();
      lessonStartDate.setDate(lessonStartDate.getDate() - 14); // 2 weeks ago
      
      const currentDayNumber = Math.floor((new Date().getTime() - lessonStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const plantData: PlantData = {
        id: '1',
        nickname: `${user.name || 'Student'}'s Tomato`,
        planting_date: lessonStartDate.toISOString(),
        current_stage: 'seedling',
        current_health_score: 85,
        last_photo_date: new Date().toISOString(),
        plant_day: currentDayNumber,
      };
      
      // Fetch real guidance history from image_analysis
      const { data: analysisHistory } = await supabase
        .from('image_analysis')
        .select('*')
        .eq('student_id', user.id)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(7); // Last 7 days

      const guidanceHistory: GuidanceRecord[] = [];
      
      if (analysisHistory) {
        for (const analysis of analysisHistory) {
          // Calculate plant day based on analysis date
          const analysisDate = new Date(analysis.created_at);
          const daysSinceStart = Math.floor((analysisDate.getTime() - lessonStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // Convert health rating to score
          const healthScoreMap: Record<string, number> = {
            'Excellent': 95,
            'Good': 80,
            'Fair': 65,
            'Poor': 40,
            'Critical': 20
          };
          const healthScore = healthScoreMap[analysis.health_rating] || 0;
          
          guidanceHistory.push({
            id: analysis.id,
            guidance_text: analysis.current_stage_description || '',
            priority: healthScore < 40 ? 'urgent' : healthScore < 65 ? 'attention' : 'routine',
            created_at: analysis.created_at,
            health_score: healthScore,
            plant_day: daysSinceStart,
            currentStage: analysis.current_stage_name || plantData.current_stage,
            positiveSigns: analysis.positive_signs || [],
            areasForImprovement: analysis.areas_for_improvement || [],
            imageUrl: analysis.image_url
          });
        }
      }
      
      // Mock health trend with accurate day numbers
      const mockHealthTrend: HealthTrend[] = [
        { health_score: plantData.current_health_score, created_at: new Date().toISOString(), plant_day: currentDayNumber },
        { health_score: Math.max(plantData.current_health_score - 3, 0), created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), plant_day: Math.max(currentDayNumber - 1, 1) },
        { health_score: Math.max(plantData.current_health_score - 5, 0), created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), plant_day: Math.max(currentDayNumber - 2, 1) },
      ];
      
      // Mock today's tasks with accurate day numbers
      const dailyTasks: TaskData[] = [
        { 
          id: '1', 
          task_name: 'Take daily photo', 
          task_type: 'photo', 
          completed: false, 
          points: 10, 
          day_number: currentDayNumber 
        },
        { 
          id: '2', 
          task_name: 'Check soil moisture', 
          task_type: 'observe', 
          completed: true, 
          points: 5, 
          day_number: currentDayNumber 
        },
      ];
      
      setPlantData(plantData);
      setGuidanceHistory(guidanceHistory);
      setHealthTrend(mockHealthTrend);
      setDailyTasks(dailyTasks);
      
      // Set activePlant for task operations
      setActivePlant({
        id: plantData.id,
        name: plantData.nickname,
        lessonId: 'growing-tomatoes-lesson',
        plantingDate: plantData.planting_date,
        currentStage: plantData.current_stage,
        currentHealthScore: plantData.current_health_score
      });
      
    } catch (error) {
      console.error('Failed to load progress data:', error);
      showSnackbar('Failed to load progress data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/(tabs)/progress');
      return;
    }
    loadStudentProgressData();
  }, [isTeacherMode, user?.id]);

  // Check for photo submission when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh data when screen comes into focus
      if (user?.id && !isTeacherMode) {
        loadStudentProgressData();
      }
      
      if (pendingPhotoTaskId) {
        // Small delay to ensure photo processing is complete
        const timer = setTimeout(() => {
          checkForPhotoSubmission();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [checkForPhotoSubmission, pendingPhotoTaskId, user?.id, isTeacherMode])
  );

  const getCurrentStage = () => {
    if (!plantData) return growthStages[0];
    return growthStages.find(stage => stage.id === plantData.current_stage) || growthStages[0];
  };

  const getTotalExpectedDays = () => {
    return growthStages.reduce((sum, stage) => sum + stage.days, 0);
  };

  const getCompletedDays = () => {
    return plantData?.plant_day || 0;
  };

  const getOverallProgress = () => {
    const completed = getCompletedDays();
    const total = getTotalExpectedDays();
    return Math.min(Math.round((completed / total) * 100), 100);
  };

  // FR-042: Highlight critical issues (health < 40%) with red warning banner
  const renderCriticalHealthWarning = () => {
    if (!plantData || plantData.current_health_score >= 40) return null;
    
    return (
      <GSCard 
        variant="elevated" 
        padding="medium" 
        style={[styles.criticalAlert, { borderColor: theme.colors.error }] as any}
      >
        <View style={styles.criticalAlertContent}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={24} 
            color={theme.colors.error} 
          />
          <View style={styles.criticalAlertText}>
            <Text variant="titleMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
              🚨 Critical Plant Health Alert
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              Your plant's health is critically low ({Math.round(plantData.current_health_score)}%). 
              Please review the latest guidance and contact your teacher immediately.
            </Text>
          </View>
        </View>
      </GSCard>
    );
  };

  // FR-041: Use specific format for guidance
  const formatGuidanceText = (guidance: GuidanceRecord) => {
    const emoji = guidance.priority === 'urgent' ? '🚨' : 
                 guidance.priority === 'attention' ? '⚠️' : '🌱';
    
    return `${emoji} Day ${guidance.plant_day}: ${guidance.guidance_text}`;
  };

  const renderGuidanceHistory = () => {
    if (guidanceHistory.length === 0) {
      return (
        <GSEmptyState
          icon="lightbulb-outline"
          title="No Guidance Yet"
          description="Take your first photo to receive personalized plant care guidance!"
          actionLabel="Take Photo"
          onAction={() => router.push('/(tabs)/camera')}
        />
      );
    }

    return guidanceHistory.map((guidance) => (
      <View key={guidance.id} style={{ marginBottom: 20 }}>
        {/* Day Number above card */}
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600', 
          color: colors.muted, 
          marginBottom: 8,
          marginLeft: 4
        }}>
          Day {guidance.plant_day}
        </Text>
        
        {/* GSPlantCard without plantName and studentName */}
        <GSPlantCard
          imageUrl={guidance.imageUrl}
          studentName=""
          plantName=""
          dayNumber={guidance.plant_day}
          healthScore={guidance.health_score}
          currentStage={guidance.currentStage}
          positiveSigns={guidance.positiveSigns}
          areasForImprovement={guidance.areasForImprovement}
        />
      </View>
    ));
  };

  const renderHealthTrendChart = () => {
    if (healthTrend.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <MaterialCommunityIcons name="chart-line" size={48} color={theme.colors.outline} />
          <Text style={{ color: theme.colors.outline, marginTop: 8 }}>
            No health data yet
          </Text>
        </View>
      );
    }

    // Simple visual representation of health trend
    const averageHealth = healthTrend.reduce((sum, h) => sum + h.health_score, 0) / healthTrend.length;
    const trend = healthTrend.length > 1 ? 
      healthTrend[0].health_score - healthTrend[healthTrend.length - 1].health_score : 0;

    return (
      <View style={styles.healthTrendContainer}>
        <View style={styles.healthMetric}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
            {Math.round(averageHealth)}%
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Average Health
          </Text>
        </View>
        <View style={styles.trendIndicator}>
          <MaterialCommunityIcons 
            name={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'trending-neutral'}
            size={32}
            color={trend > 0 ? theme.colors.primary : trend < 0 ? theme.colors.error : theme.colors.outline}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable'}
          </Text>
        </View>
      </View>
    );
  };

  const renderGrowthMilestones = () => {
    const currentStage = getCurrentStage();
    const completedDays = getCompletedDays();
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.milestonesContainer}>
          {growthStages.map((stage, index) => {
            const stageStartDay = growthStages.slice(0, index).reduce((sum, s) => sum + s.days, 0);
            const stageEndDay = stageStartDay + stage.days;
            const isCompleted = completedDays > stageEndDay;
            const isCurrent = currentStage.id === stage.id;
            const isUpcoming = completedDays < stageStartDay;
            
            let status = 'Upcoming';
            if (isCompleted) status = 'Completed';
            else if (isCurrent) status = `Day ${completedDays - stageStartDay + 1}/${stage.days}`;
            
            return (
              <GSMilestone
                key={stage.id}
                icon={isCompleted ? 'check-circle' : isCurrent ? 'circle-half-full' : 'circle-outline'}
                title={stage.name}
                description={`${stage.days} days`}
                date={status}
              />
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <GSScreenLayout>
        <GSLoadingSpinner />
      </GSScreenLayout>
    );
  }

  if (!plantData) {
    return (
      <GSScreenLayout>
        <GSHeader title="My Progress" variant="back" onBack={() => router.back()} />
        <GSEmptyState
          icon="sprout"
          title="No Plant Data"
          description="Start your first lesson to begin your garden journey!"
          actionLabel="Explore Lessons"
          onAction={() => router.push('/(tabs)/lessons')}
        />
      </GSScreenLayout>
    );
  }

  const currentHealth = plantData.current_health_score;
  const plantAge = plantData.plant_day;
  const overallProgress = getOverallProgress();
  const currentStage = getCurrentStage();

  return (
    <GSScreenLayout>
      {/* Fixed Mode Toggle at the top */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.background }}>
        <GSModeToggle />
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Critical Health Warning (FR-042) */}
        {renderCriticalHealthWarning()}

        {/* Hero Section */}
        <View style={styles.section}>
          <SectionHeader title="Progress Overview" />
          <GSCard variant="elevated" padding="large" style={styles.heroCard}>
            <View style={styles.heroContent}>
              <GSProgressIndicator
                type="circular"
                progress={overallProgress / 100}
                size="large"
                showPercentage={false}
              />
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroDayNumber}>{plantAge}</Text>
                <Text style={styles.heroDayLabel}>of {getTotalExpectedDays()} days</Text>
              </View>
            </View>
            <GSBadge 
              label={`Current Stage: ${currentStage.name}`} 
              variant="primary" 
              size="large" 
            />
            <GSHealthBadge 
              score={currentHealth} 
              size="large" 
              showLabel={true}
            />
          </GSCard>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.section}>
          <SectionHeader title="Your Garden Stats" />
          <View style={styles.statsGrid}>
            <GSCard variant="elevated" padding="medium" style={styles.statCard}>
              <Text variant="titleMedium">Plant Health</Text>
              <Text variant="headlineSmall">{Math.round(currentHealth)}%</Text>
            </GSCard>
            <GSCard variant="elevated" padding="medium" style={styles.statCard}>
              <Text variant="titleMedium">Current Stage</Text>
              <Text variant="headlineSmall">{currentStage.name}</Text>
            </GSCard>
            <GSCard variant="elevated" padding="medium" style={styles.statCard}>
              <Text variant="titleMedium">Days Growing</Text>
              <Text variant="headlineSmall">{plantAge}</Text>
            </GSCard>
            <GSCard variant="elevated" padding="medium" style={styles.statCard}>
              <Text variant="titleMedium">Progress</Text>
              <Text variant="headlineSmall">{overallProgress}%</Text>
            </GSCard>
          </View>
        </View>

        {/* Health Trend Chart */}
        <View style={styles.section}>
          <SectionHeader title="Health Journey" />
          <GSCard variant="elevated" padding="medium">
            {renderHealthTrendChart()}
          </GSCard>
        </View>

        {/* Growth Milestones */}
        <View style={styles.section}>
          <SectionHeader title="Growth Milestones" />
          {renderGrowthMilestones()}
        </View>

        {/* Today's Tasks Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primaryDark }}>Today's Tasks</Text>
            {dailyTasks.length > 0 && (
              <View style={{ alignItems: 'flex-end' }}>
                <GSProgressIndicator progress={dailyTasks.filter(t => t.completed).length / dailyTasks.length} size="small" />
                                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {dailyTasks.filter(t => t.completed).reduce((sum, task) => sum + (task.points || 0), 0)}/{dailyTasks.reduce((sum, task) => sum + (task.points || 0), 0)} points
                  </Text>
              </View>
            )}
          </View>
          
          <View style={{ marginTop: 12 }}>
            {dailyTasks.length > 0 ? (
              <GSCard variant="elevated" padding="none">
                {dailyTasks.map((task, index) => {
                  const isExpanded = expandedTaskIndex === index;
                  return (
                    <View key={task.id}>
                      {/* Task Row */}
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                                                  paddingHorizontal: 16, 
                          paddingVertical: 12,
                          borderBottomWidth: index < dailyTasks.length - 1 || isExpanded ? 1 : 0,
                          borderBottomColor: colors.muted + '40'
                      }}>
                        {/* Checkbox */}
                                                  <View style={{
                            borderWidth: 1,
                            borderColor: task.completed ? colors.primary : colors.muted,
                            borderRadius: 3,
                            padding: 1,
                            backgroundColor: task.completed ? colors.primary + '08' : 'transparent'
                          }}>
                            <Checkbox
                              status={task.completed ? 'checked' : 'unchecked'}
                              onPress={() => handleTaskToggle(task.id)}
                              color={colors.primary}
                              uncheckedColor={colors.muted}
                            />
                          </View>
                        
                        {/* Task Title - Clickable */}
                        <Pressable 
                          style={{ flex: 1, marginLeft: 8 }}
                          onPress={() => setExpandedTaskIndex(isExpanded ? null : index)}
                        >
                                                      <Text style={{ 
                              fontSize: 15, 
                              fontWeight: '500', 
                              color: colors.primaryDark,
                              textDecorationLine: task.completed ? 'line-through' : 'none',
                              opacity: task.completed ? 0.6 : 1
                            }}>
                              {task.task_name}
                            </Text>
                        </Pressable>
                        
                        {/* Task Points - Clickable */}
                        <Pressable 
                          onPress={() => setExpandedTaskIndex(isExpanded ? null : index)}
                          style={{ 
                            backgroundColor: task.completed ? colors.primary : colors.background,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginLeft: 8,
                            borderWidth: task.completed ? 0 : 1,
                            borderColor: colors.muted + '40'
                          }}
                        >
                                                      <Text style={{ 
                              fontSize: 12, 
                              fontWeight: '600',
                              color: task.completed ? colors.white : colors.muted
                            }}>
                              {task.points || 0}pts
                            </Text>
                        </Pressable>
                      </View>
                      
                      {/* Task Description - Expandable */}
                      {isExpanded && (
                        <View style={{ 
                                                      paddingHorizontal: 16, 
                            paddingVertical: 12, 
                            backgroundColor: colors.background,
                            borderBottomWidth: index < dailyTasks.length - 1 ? 1 : 0,
                            borderBottomColor: colors.muted + '40'
                        }}>
                                                      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 8 }}>
                              Click the task to complete it. Photo tasks will take you to the camera.
                            </Text>
                            <View>
                              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.primaryDark, marginBottom: 4 }}>
                                Task Type: {task.task_type}
                              </Text>
                              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>
                                Day {task.day_number} • {task.points} points
                              </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </GSCard>
            ) : (
              <GSCard variant="elevated" padding="large" style={{ alignItems: 'center' }}>
                                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.primaryDark }}>No tasks for today</Text>
                  <Text style={{ textAlign: 'center', marginTop: 8, color: colors.muted }}>
                    Check back tomorrow for new tasks or contact your teacher.
                  </Text>
              </GSCard>
            )}
          </View>
        </View>

        {/* Guidance History (FR-043: Store guidance history for student progress tracking) */}
        <View style={styles.section}>
          <SectionHeader title="AI Guidance History">
            <GSButton onPress={() => router.push('/ai-chat')}>View All</GSButton>
          </SectionHeader>
          {renderGuidanceHistory()}
        </View>

      </ScrollView>
      
      <GSFAB icon="camera" onPress={() => router.push('/(tabs)/camera')} />
      
      {/* AI Chat FAB positioned to the left */}
      <GSFAB
        icon="message-text"
        onPress={() => router.push('/ai-chat')}
        variant="ai"
        position="bottom-left"
      />
      
      <GSSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        variant={snackbar.variant}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
      />
    </GSScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 80,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  heroCard: {
    alignItems: 'center',
    gap: 16,
  },
  heroContent: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  heroDayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroDayLabel: {
    fontSize: 12,
  },
  criticalAlert: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  criticalAlertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  criticalAlertText: {
    flex: 1,
    gap: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  healthTrendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  healthMetric: {
    alignItems: 'center',
  },
  trendIndicator: {
    alignItems: 'center',
    gap: 4,
  },
  milestonesContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
  },
});