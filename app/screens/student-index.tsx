import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Checkbox } from 'react-native-paper';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useMode } from '@/contexts/ModeContext';
import PlantStories from '@/components/PlantStories';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ImageAnalysisService, ImageAnalysisRecord } from '@/services/image-analysis-service';
import colors, { DESIGN_TOKENS } from '@/constants/colors';

import {
  GSModeToggle,
  GSIconButton,
  GSHealthBadge,
  GSButton,
  GSGuidanceCard,
  GSCollapsible,
  GSChip,
  GSTaskChecklist,
  GSProgressIndicator,
  GSPlantCard,
  GSCard,
  GSFAB,
  GSSnackbar,
  Text
} from '@/components/ui';
import { ShimmerPlaceholder } from '@/components/ui/ShimmerPlaceholder';

export default function StudentIndexScreen() {
  const router = useRouter();
  const { plants } = usePlantStore();
  const { tasks } = useTaskStore();
  const { isTeacherMode, isSwitchingMode, setIsSwitchingMode } = useMode();
  const { user } = useAuth();
  
  const [activePlant, setActivePlant] = React.useState<any>(null);
  const [plantProgress, setPlantProgress] = React.useState<any>(null);
  const [yesterdaysFeedback, setYesterdaysFeedback] = React.useState<ImageAnalysisRecord | null>(null);
  const [latestAnalysis, setLatestAnalysis] = React.useState<ImageAnalysisRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedTipIndex, setExpandedTipIndex] = React.useState<number | null>(null);
  const [expandedTaskIndex, setExpandedTaskIndex] = React.useState<number | null>(null);
  const [lessonData, setLessonData] = React.useState<any>(null);
  const [pendingPhotoTaskId, setPendingPhotoTaskId] = React.useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState(false);
  const [verificationSnackbar, setVerificationSnackbar] = React.useState<{
    visible: boolean;
    message: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    variant: 'info'
  });

  // Create skeleton components for student view
  const ClassGardensSkeleton = () => (
    <View style={{ paddingHorizontal: 16 }}>
      <ShimmerPlaceholder width="30%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <ShimmerPlaceholder width={80} height={80} borderRadius={40} style={{ marginBottom: 8 }} />
          <ShimmerPlaceholder width={60} height={12} borderRadius={4} />
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <ShimmerPlaceholder width={80} height={80} borderRadius={40} style={{ marginBottom: 8 }} />
            <ShimmerPlaceholder width={50} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );

  const PlantProgressSkeleton = () => (
    <View style={{ paddingHorizontal: 16 }}>
      <ShimmerPlaceholder width="50%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
      <GSCard variant="elevated" padding="large">
        <ShimmerPlaceholder width="100%" height={200} borderRadius={8} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <ShimmerPlaceholder width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerPlaceholder width="40%" height={14} borderRadius={4} />
          </View>
          <ShimmerPlaceholder width={60} height={24} borderRadius={12} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <ShimmerPlaceholder width={80} height={24} borderRadius={12} />
          <ShimmerPlaceholder width={100} height={24} borderRadius={12} />
        </View>
      </GSCard>
      <View style={{ marginTop: 16 }}>
        <ShimmerPlaceholder width="100%" height={40} borderRadius={8} />
      </View>
    </View>
  );

  const TasksSkeleton = () => (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <ShimmerPlaceholder width="40%" height={20} borderRadius={4} />
        <ShimmerPlaceholder width={60} height={16} borderRadius={8} />
      </View>
      <GSCard variant="elevated" padding="none">
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 16, 
            paddingVertical: 12,
            borderBottomWidth: i < 3 ? 1 : 0,
            borderBottomColor: colors.muted + '40'
          }}>
            <ShimmerPlaceholder width={24} height={24} borderRadius={3} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <ShimmerPlaceholder width="80%" height={16} borderRadius={4} />
            </View>
            <ShimmerPlaceholder width={40} height={20} borderRadius={10} />
          </View>
        ))}
      </GSCard>
    </View>
  );

  const TipsSkeleton = () => (
    <View style={{ paddingHorizontal: 16 }}>
      <ShimmerPlaceholder width="50%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <GSCard key={i} variant="elevated" padding="medium" style={{ width: 320 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
              <ShimmerPlaceholder width={22} height={22} borderRadius={11} />
              <View style={{ flex: 1 }}>
                <ShimmerPlaceholder width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <ShimmerPlaceholder width="70%" height={14} borderRadius={4} />
              </View>
            </View>
            <ShimmerPlaceholder width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerPlaceholder width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerPlaceholder width="80%" height={14} borderRadius={4} />
          </GSCard>
        ))}
      </View>
    </View>
  );

  // Fetch plant and submission data from Supabase
  const fetchStudentData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch student's plant for active lesson
      const { data: plantData, error: plantError } = await supabase
        .from('plants')
        .select(`
          *,
          lesson:lessons(*)
        `)
        .eq('student_id', user.id)
        .eq('lesson.status', 'active')
        .single();
        
      if (plantData) {
        // Store the plant data for task operations
        setActivePlant({
          id: plantData.id,
          name: plantData.nickname || 'My Plant',
          lessonId: plantData.lesson_id,
          plantingDate: plantData.planting_date,
          currentStage: plantData.current_stage,
          currentHealthScore: plantData.current_health_score
        });
        
        // Calculate day number
        const plantingDate = new Date(plantData.planting_date);
        const dayNumber = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Fetch latest analysis for current stage info
        const latestAnalysisData = await ImageAnalysisService.getLatestAnalysis(user.id);
        setLatestAnalysis(latestAnalysisData);
        
        // Get latest health score from image analysis
        const healthScore = await ImageAnalysisService.getLatestHealthScore(user.id) || plantData.current_health_score || 0;
        
        // Get the latest image URL from analysis if available
        const latestImageUrl = latestAnalysisData?.image_url || plantData.latest_photo_url || null;
        
        setPlantProgress({
          currentStage: latestAnalysisData?.current_stage_name || plantData.current_stage,
          dayNumber,
          healthScore,
          height: plantData.predictions?.current_height || '0',
          streak: 7, // TODO: Calculate actual streak
          imageUrl: latestImageUrl
        });
        
        // Store lesson data
        if (plantData.lesson) {
          setLessonData(plantData.lesson);
        }
      }
      
      // Fetch yesterday's analysis for feedback
      const yesterdayAnalysisData = await ImageAnalysisService.getYesterdayAnalysis(user.id);
      setYesterdaysFeedback(yesterdayAnalysisData);

      // Fetch today's tasks from lesson_task_templates
      if (plantData) {
        const plantingDate = new Date(plantData.planting_date);
        const currentDayNumber = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const { data: taskTemplates, error: taskError } = await supabase
          .from('lesson_task_templates')
          .select('*')
          .eq('lesson_id', plantData.lesson_id)
          .lte('day_number', currentDayNumber)
          .order('day_number', { ascending: false })
          .order('created_at');

        if (taskTemplates && !taskError) {
          // Get all submitted tasks for this plant to check completion status
          const { data: completedTasks } = await supabase
            .from('student_daily_tasks')
            .select('template_id, completed, day_number')
            .eq('student_id', user.id)
            .eq('plant_id', plantData.id);

          const completedTaskMap = new Map(
            completedTasks?.map(task => [`${task.template_id}-${task.day_number}`, task.completed]) || []
          );

          // Filter for today's tasks + incomplete past tasks
          const allTasks = taskTemplates.map(template => ({
            id: template.id,
            name: template.task_name,
            description: template.task_description,
            instructions: template.instructions,
            taskType: template.task_type,
            isCompleted: completedTaskMap.get(`${template.id}-${template.day_number}`) || false,
            points: template.points || 10,
            isRequired: template.is_required,
            dayNumber: template.day_number
          }));

          const todaysOrIncompleteTasks = allTasks.filter(task => 
            task.dayNumber === currentDayNumber || (!task.isCompleted && task.isRequired)
          );

          setTodaysTasks(todaysOrIncompleteTasks);
        }
      }
      
      // If no active plant/lesson, provide fallback content
      if (!plantData) {
        setActivePlant(null);
        setTodaysTasks([]);
        setPlantProgress(null);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Today's tasks from lesson_task_templates
  const [todaysTasks, setTodaysTasks] = React.useState<any[]>([]);

  // Get tips from latest analysis, fallback to default tips if no analysis available
  const getAnalysisTips = () => {
    if (latestAnalysis?.tips && latestAnalysis.tips.length > 0) {
      return latestAnalysis.tips.map((tip: any) => ({
        icon: getTipIcon(tip.title),
        title: tip.title,
        description: tip.description
      }));
    }
    
    // Fallback tips if no analysis available
    return [
      { icon: 'water', title: 'Watering Tip', description: 'Check soil moisture before watering' },
      { icon: 'white-balance-sunny', title: 'Light Check', description: 'Ensure 6-8 hours of indirect sunlight' },
      { icon: 'thermometer', title: 'Temperature', description: 'Keep between 65-75°F for optimal growth' }
    ];
  };

  // Helper function to assign appropriate icons based on tip content
  const getTipIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('water') || titleLower.includes('irrigation')) return 'water';
    if (titleLower.includes('nutrient') || titleLower.includes('fertiliz') || titleLower.includes('deficien')) return 'leaf';
    if (titleLower.includes('prun') || titleLower.includes('air') || titleLower.includes('circulation')) return 'content-cut';
    if (titleLower.includes('support') || titleLower.includes('cage') || titleLower.includes('tie')) return 'format-vertical-align-center';
    if (titleLower.includes('pest') || titleLower.includes('disease') || titleLower.includes('monitor')) return 'bug-outline';
    if (titleLower.includes('harvest') || titleLower.includes('fruit')) return 'fruit-grapes';
    if (titleLower.includes('light') || titleLower.includes('sun')) return 'white-balance-sunny';
    if (titleLower.includes('temperature') || titleLower.includes('heat')) return 'thermometer';
    if (titleLower.includes('soil') || titleLower.includes('root')) return 'shovel';
    
    // Default icon
    return 'lightbulb-outline';
  };

  const tips = getAnalysisTips();

  // Get current day analysis data (prefer latest analysis, fallback to yesterday's feedback)
  const getCurrentAnalysisData = () => {
    if (latestAnalysis) {
      return latestAnalysis;
    }
    return yesterdaysFeedback;
  };

  // Calculate progress based on points earned vs total points
  const totalPoints = todaysTasks.reduce((sum, task) => sum + (task.points || 0), 0);
  const earnedPoints = todaysTasks.filter(t => t.isCompleted).reduce((sum, task) => sum + (task.points || 0), 0);
  const completedTasksPercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  // Check for completed photo submissions when returning from camera
  const checkForPhotoSubmission = React.useCallback(async () => {
    if (!pendingPhotoTaskId || !user?.id || !activePlant) return;

    try {
      // Check if there's a recent photo submission (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const { data: recentSubmission } = await supabase
        .from('daily_submissions')
        .select('*')
        .eq('student_id', user.id)
        .eq('plant_id', activePlant.id)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentSubmission) {
        // Mark the photo task as completed
        await markTaskAsCompleted(pendingPhotoTaskId);
        setPendingPhotoTaskId(null);
      }
    } catch (error) {
      console.error('Error checking photo submission:', error);
    }
  }, [pendingPhotoTaskId, user?.id, activePlant]);

  // Check for ongoing photo analysis
  const checkAnalysisStatus = React.useCallback(async () => {
    if (!user?.id || !activePlant) return;

    try {
      // Check for recent submissions that might be processing
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const { data: recentSubmissions } = await supabase
        .from('daily_submissions')
        .select(`
          id, 
          processing_status, 
          error_message,
          image_analysis!daily_submissions_analysis_id_fkey(
            verification_status,
            expected_finger_count,
            detected_finger_count
          )
        `)
        .eq('student_id', user.id)
        .eq('plant_id', activePlant.id)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentSubmissions && recentSubmissions.length > 0) {
        const submission = recentSubmissions[0];
        
        if (submission.processing_status === 'processing') {
          setIsAnalyzingPhoto(true);
          setAnalysisError(false);
        } else if (submission.processing_status === 'failed') {
          setIsAnalyzingPhoto(false);
          setAnalysisError(true);
        } else if (submission.processing_status === 'completed') {
          setIsAnalyzingPhoto(false);
          setAnalysisError(false);
          
          // Check verification status and show feedback
          if (submission.image_analysis?.verification_status) {
            const verificationStatus = submission.image_analysis.verification_status;
            const expectedCount = submission.image_analysis.expected_finger_count;
            const detectedCount = submission.image_analysis.detected_finger_count;
            
            if (verificationStatus === 'verified') {
              setVerificationSnackbar({
                visible: true,
                message: '✅ Photo verified! Great job showing the correct number of fingers.',
                variant: 'success'
              });
            } else if (verificationStatus === 'unverified') {
              setVerificationSnackbar({
                visible: true,
                message: `⚠️ Verification failed. Expected ${expectedCount} finger${expectedCount > 1 ? 's' : ''} but detected ${detectedCount || 'none'}.`,
                variant: 'warning'
              });
            } else if (verificationStatus === 'suspicious') {
              setVerificationSnackbar({
                visible: true,
                message: '❌ Photo could not be verified. Please ensure your fingers are clearly visible.',
                variant: 'error'
              });
            }
          }
          
          // Refresh the data to show updated plant info
          fetchStudentData();
        }
      } else {
        setIsAnalyzingPhoto(false);
        setAnalysisError(false);
      }
    } catch (error) {
      console.error('Error checking analysis status:', error);
      setIsAnalyzingPhoto(false);
      setAnalysisError(true);
    }
  }, [user?.id, activePlant, fetchStudentData]);

  // Function to mark a task as completed
  const markTaskAsCompleted = async (taskId: string) => {
    if (!user?.id || !activePlant) return;

    const task = todaysTasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return;

    try {
      const plantingDate = new Date(activePlant.plantingDate || Date.now());
      const currentDayNumber = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Check if task record exists in student_daily_tasks
      const { data: existingTask } = await supabase
        .from('student_daily_tasks')
        .select('*')
        .eq('student_id', user.id)
        .eq('plant_id', activePlant.id)
        .eq('template_id', taskId)
        .eq('day_number', currentDayNumber)
        .single();

      if (existingTask) {
        // Update existing task
        await supabase
          .from('student_daily_tasks')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingTask.id);
      } else {
        // Create new task record
        await supabase
          .from('student_daily_tasks')
          .insert({
            student_id: user.id,
            plant_id: activePlant.id,
            lesson_id: activePlant.lessonId,
            template_id: taskId,
            task_name: task.name,
            task_type: task.taskType,
            points: task.points,
            day_number: currentDayNumber,
            completed: true,
            completed_at: new Date().toISOString(),
            task_date: new Date().toISOString().split('T')[0]
          });
      }

      // Update local state
      setTodaysTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? { ...t, isCompleted: true }
            : t
        )
      );

      console.log('Photo task marked as completed:', taskId);
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
  };

  useEffect(() => {
    if (isTeacherMode) {
      // Show loading state instead of immediate navigation
      setIsSwitchingMode(true);
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
        // Reset switching mode after navigation
        setTimeout(() => setIsSwitchingMode(false), 100);
      }, 500); // Brief delay to show skeleton
      return () => clearTimeout(timer);
    } else if (user?.id) {
      setIsSwitchingMode(false);
      fetchStudentData();
    }
  }, [isTeacherMode, user?.id]);

  // Check for photo submission when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh data when screen comes into focus
      if (user?.id && !isTeacherMode) {
        fetchStudentData();
      }
      
      if (pendingPhotoTaskId) {
        // Small delay to ensure photo processing is complete
        const timer = setTimeout(() => {
          checkForPhotoSubmission();
        }, 1000);
        return () => clearTimeout(timer);
      }
      
      // Also check analysis status when screen comes into focus
      checkAnalysisStatus();
      
      // Set up polling for analysis status if analyzing
      let pollInterval: ReturnType<typeof setInterval> | undefined;
      if (isAnalyzingPhoto) {
        pollInterval = setInterval(() => {
          checkAnalysisStatus();
        }, 3000); // Check every 3 seconds
      }
      
      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }, [checkForPhotoSubmission, checkAnalysisStatus, pendingPhotoTaskId, isAnalyzingPhoto, user?.id, isTeacherMode, fetchStudentData])
  );

  const handleTaskToggle = async (taskId: string) => {
    if (!user?.id || !activePlant) return;

    const task = todaysTasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if this is a photo task and it's currently unchecked
    const isPhotoTask = task.name.toLowerCase().includes('take') && task.name.toLowerCase().includes('photo') ||
                       task.name.toLowerCase().includes('photo');
    
    if (isPhotoTask && !task.isCompleted) {
      // Set pending photo task and navigate to camera screen
      setPendingPhotoTaskId(taskId);
      router.push('/(tabs)/camera');
      return;
    }

    try {
      const plantingDate = new Date(activePlant.plantingDate || Date.now());
      const currentDayNumber = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Check if task record exists in student_daily_tasks
      const { data: existingTask } = await supabase
        .from('student_daily_tasks')
        .select('*')
        .eq('student_id', user.id)
        .eq('plant_id', activePlant.id)
        .eq('template_id', taskId)
        .eq('day_number', currentDayNumber)
        .single();

      const newCompletedState = !task.isCompleted;

      if (existingTask) {
        // Update existing task
        const { error: updateError } = await supabase
          .from('student_daily_tasks')
          .update({ 
            completed: newCompletedState,
            completed_at: newCompletedState ? new Date().toISOString() : null
          })
          .eq('id', existingTask.id);
        
        if (updateError) {
          console.error('Error updating task:', updateError);
          return;
        }
        console.log('Task updated successfully:', taskId, newCompletedState);
      } else {
        // Create new task record
        const { error: insertError } = await supabase
          .from('student_daily_tasks')
          .insert({
            student_id: user.id,
            plant_id: activePlant.id,
            lesson_id: activePlant.lessonId,
            template_id: taskId,
            task_name: task.name,
            task_type: task.taskType,
            points: task.points,
            day_number: currentDayNumber,
            completed: newCompletedState,
            completed_at: newCompletedState ? new Date().toISOString() : null,
            task_date: new Date().toISOString().split('T')[0]
          });
        
        if (insertError) {
          console.error('Error creating task:', insertError);
          return;
        }
        console.log('Task created successfully:', taskId, newCompletedState);
      }

      // Update local state
      setTodaysTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? { ...t, isCompleted: newCompletedState }
            : t
        )
      );

    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {/* Fixed Mode Toggle at the top */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.background }}>
          <GSModeToggle />
        </View>
        
        {/* Scrollable Content */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {isSwitchingMode ? (
            <>
              {/* Skeleton loading while switching modes */}
              <View style={{ marginBottom: 16, marginTop: 24 }}>
                <ClassGardensSkeleton />
              </View>

              <View style={{ marginBottom: 24, marginTop: 8 }}>
                <PlantProgressSkeleton />
              </View>
            </>
          ) : (
            <>
              {/* Plant Stories Section */}
              <View style={{ marginBottom: 16, marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primaryDark }}>Class Gardens</Text>
                </View>
                
                <PlantStories 
                  onAddPhoto={() => {
                    setAnalysisError(false);
                    router.push('/(tabs)/camera');
                  }}
                  onStoryPress={(story) => {
                    console.log('View story:', story.id);
                    // TODO: Navigate to story detail view or show story modal
                  }}
                  isAnalyzing={isAnalyzingPhoto}
                  analysisError={analysisError}
                />
              </View>

              {/* My Plant Progress Section with GSPlantCard */}
              {activePlant && plantProgress && (
                <View style={{ marginBottom: 24, marginTop: 8, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.primaryDark }}>My Plant Progress</Text>
                  
                  <View style={{ marginTop: 12 }}>
                    <GSPlantCard
                      imageUrl={plantProgress.imageUrl || null}
                      studentName="My Plant"
                      plantName={activePlant.name}
                      dayNumber={plantProgress.dayNumber || 1}
                      healthScore={plantProgress.healthScore || 0}
                      currentStage={plantProgress.currentStage}
                      positiveSigns={getCurrentAnalysisData()?.positive_signs || []}
                      areasForImprovement={getCurrentAnalysisData()?.areas_for_improvement || []}
                    />
                  </View>

                  {/* Today's Photo CTA */}
                  <View style={{ marginTop: 16 }}>
                    <GSButton 
                      variant="primary" 
                      icon="camera" 
                      fullWidth
                      onPress={() => router.push('/(tabs)/camera')}
                    >
                      Today's Photo
                    </GSButton>
                  </View>
                </View>
              )}
            </>
          )}

          {isSwitchingMode ? (
            <>
              <View style={{ marginBottom: 24, marginTop: 24 }}>
                <TasksSkeleton />
              </View>

              <View style={{ marginBottom: 24, marginTop: 24 }}>
                <TipsSkeleton />
              </View>
            </>
          ) : (
            <>
              {/* Yesterday's Feedback Section - Show Welcome on Day 1 */}
              {(plantProgress?.dayNumber === 1 && lessonData) ? (
                <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.primaryDark }}>Welcome to Your Garden Journey</Text>
                  
                  <View style={{ marginTop: 12 }}>
                    <GSGuidanceCard
                      emoji="🌱"
                      title={`Welcome to ${lessonData.name || 'Your Lesson'}`}
                      content={lessonData.description || 'Start your exciting journey of growing and learning with plants!'}
                    />
                  </View>
                </View>
              ) : yesterdaysFeedback && (
            <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.primaryDark }}>Yesterday's Feedback</Text>
              
              <View style={{ marginTop: 12 }}>
                <GSGuidanceCard
                  emoji="📊"
                  title={`Day ${plantProgress?.dayNumber - 1} Analysis`}
                  content={yesterdaysFeedback.current_stage_description || 'Analysis completed for your plant.'}
                />
              </View>

              {/* Additional feedback details */}
              <GSCard variant="elevated" padding="medium" margin="none" style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontWeight: '500', fontSize: 16, color: colors.primaryDark }}>Health Assessment</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{yesterdaysFeedback.health_rating}</Text>
                </View>

                {/* Positive Signs */}
                {yesterdaysFeedback.positive_signs && yesterdaysFeedback.positive_signs.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.primaryDark }}>Positive Signs:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {yesterdaysFeedback.positive_signs.map((sign: string, index: number) => (
                        <GSChip key={index} label={sign} variant="success" />
                      ))}
                    </View>
                  </View>
                )}

                {/* Areas for Improvement */}
                {yesterdaysFeedback.areas_for_improvement && yesterdaysFeedback.areas_for_improvement.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.primaryDark }}>Areas for Improvement:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {yesterdaysFeedback.areas_for_improvement.map((area: string, index: number) => (
                        <GSChip key={index} label={area} variant="warning" />
                      ))}
                    </View>
                  </View>
                )}

                {/* Tips */}
                {yesterdaysFeedback.tips && yesterdaysFeedback.tips.length > 0 && (
                  <GSCollapsible label="View Tips">
                    {yesterdaysFeedback.tips.map((tip: any, index: number) => (
                      <View key={index} style={{ paddingVertical: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.primaryDark, marginBottom: 4 }}>{tip.title}</Text>
                        <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>{tip.description}</Text>
                      </View>
                    ))}
                  </GSCollapsible>
                )}
              </GSCard>
            </View>
          )}

          {/* Today's Tasks Section */}
          <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primaryDark }}>Today's Tasks</Text>
              {todaysTasks.length > 0 && (
                <View style={{ alignItems: 'flex-end' }}>
                  <GSProgressIndicator progress={completedTasksPercentage / 100} size="small" />
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {earnedPoints}/{totalPoints} points
                  </Text>
                </View>
              )}
            </View>
            
            <View style={{ marginTop: 12 }}>
              {todaysTasks.length > 0 ? (
                <GSCard variant="elevated" padding="none">
                  {todaysTasks.map((task, index) => {
                    const isExpanded = expandedTaskIndex === index;
                    return (
                      <View key={task.id}>
                        {/* Task Row */}
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          paddingHorizontal: 16, 
                          paddingVertical: 12,
                          borderBottomWidth: index < todaysTasks.length - 1 || isExpanded ? 1 : 0,
                          borderBottomColor: colors.muted + '40'
                        }}>
                          {/* Checkbox */}
                          <View style={{
                            borderWidth: 1,
                            borderColor: task.isCompleted ? colors.primary : colors.muted,
                            borderRadius: 3,
                            padding: 1,
                            backgroundColor: task.isCompleted ? colors.primary + '08' : 'transparent'
                          }}>
                            <Checkbox
                              status={task.isCompleted ? 'checked' : 'unchecked'}
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
                              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
                              opacity: task.isCompleted ? 0.6 : 1
                            }}>
                              {task.name}
                            </Text>
                          </Pressable>
                          
                          {/* Task Points - Clickable */}
                          <Pressable 
                            onPress={() => setExpandedTaskIndex(isExpanded ? null : index)}
                            style={{ 
                              backgroundColor: task.isCompleted ? colors.primary : colors.background,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12,
                              marginLeft: 8,
                              borderWidth: task.isCompleted ? 0 : 1,
                              borderColor: colors.muted + '40'
                            }}
                          >
                            <Text style={{ 
                              fontSize: 12, 
                              fontWeight: '600',
                              color: task.isCompleted ? colors.white : colors.muted
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
                            borderBottomWidth: index < todaysTasks.length - 1 ? 1 : 0,
                            borderBottomColor: colors.muted + '40'
                          }}>
                            {task.description && (
                              <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 8 }}>
                                {task.description}
                              </Text>
                            )}
                            {task.instructions && (
                              <View>
                                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.primaryDark, marginBottom: 4 }}>
                                  Instructions:
                                </Text>
                                <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>
                                  {task.instructions}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </GSCard>
              ) : (
                <GSCard variant="elevated" padding="large" style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.primaryDark }}>No active lesson</Text>
                  <Text style={{ textAlign: 'center', marginTop: 8, color: colors.muted }}>
                    It looks like you are not currently enrolled in an active lesson. Please contact your teacher to get started.
                  </Text>
                </GSCard>
              )}
            </View>
          </View>

              {/* Tips & Reminders Section */}
              <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.primaryDark }}>Tips & Reminders</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 12, paddingRight: 16 }}>
                    {tips.map((tip, index) => {
                      const isExpanded = expandedTipIndex === index;
                      return (
                        <Pressable
                          key={index}
                          onPress={() => setExpandedTipIndex(isExpanded ? null : index)}
                          style={{ width: 320 }}
                        >
                          <GSCard 
                            variant="elevated" 
                            padding="medium" 
                            style={{ 
                              minHeight: isExpanded ? undefined : 220,
                              height: isExpanded ? 'auto' : undefined
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                              <GSIconButton icon={tip.icon} onPress={() => {}} size={22} color={colors.primary} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '500', fontSize: 15, color: colors.primaryDark, lineHeight: 20, flexWrap: 'wrap' }}>{tip.title}</Text>
                              </View>
                              <View style={{ marginLeft: 4 }}>
                                <GSIconButton 
                                  icon={isExpanded ? "chevron-up" : "chevron-down"} 
                                  onPress={() => setExpandedTipIndex(isExpanded ? null : index)} 
                                  size={18} 
                                  color={colors.muted} 
                                />
                              </View>
                            </View>
                            <Text 
                              style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }} 
                              numberOfLines={isExpanded ? undefined : 7}
                            >
                              {tip.description}
                            </Text>
                          </GSCard>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        {/* AI Chat FAB - Always visible in Student Mode */}
        <GSFAB
          icon="message-text"
          onPress={() => router.push('/ai-chat')}
          variant="ai"
        />
        
        {/* Verification Feedback Snackbar */}
        <GSSnackbar
          visible={verificationSnackbar.visible}
          onDismiss={() => setVerificationSnackbar(prev => ({ ...prev, visible: false }))}
          message={verificationSnackbar.message}
          variant={verificationSnackbar.variant}
          duration={5000}
        />
      </View>
    </SafeAreaView>
  );
}