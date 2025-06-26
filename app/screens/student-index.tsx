import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useMode } from '@/contexts/ModeContext';
import PlantStories from '@/components/PlantStories';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ImageAnalysisService, ImageAnalysisRecord } from '@/services/image-analysis-service';

import {
  GSModeToggle,
  GSIconButton,
  GSHealthBadge,
  GSStatCard,
  GSButton,
  GSGuidanceCard,
  GSCollapsible,
  GSChip,
  GSTaskChecklist,
  GSProgressIndicator,
  GSPlantCard,
  GSCard,
  GSFAB,
  Text
} from '@/components/ui';

export default function StudentIndexScreen() {
  const router = useRouter();
  const { plants } = usePlantStore();
  const { tasks } = useTaskStore();
  const { isTeacherMode } = useMode();
  const { user } = useAuth();
  
  const activePlant = plants[0];

  const [plantProgress, setPlantProgress] = React.useState<any>(null);
  const [yesterdaysFeedback, setYesterdaysFeedback] = React.useState<ImageAnalysisRecord | null>(null);
  const [latestAnalysis, setLatestAnalysis] = React.useState<ImageAnalysisRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedTipIndex, setExpandedTipIndex] = React.useState<number | null>(null);

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
        // Calculate day number
        const plantingDate = new Date(plantData.planting_date);
        const dayNumber = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Get latest health score from image analysis
        const healthScore = await ImageAnalysisService.getLatestHealthScore(user.id) || plantData.current_health_score || 0;
        
        setPlantProgress({
          currentStage: plantData.current_stage,
          dayNumber,
          healthScore,
          height: plantData.predictions?.current_height || '0',
          streak: 7, // TODO: Calculate actual streak
          imageUrl: 'https://picsum.photos/400/300?random=plant'
        });
      }
      
      // Fetch latest analysis for current stage info
      const latestAnalysisData = await ImageAnalysisService.getLatestAnalysis(user.id);
      setLatestAnalysis(latestAnalysisData);
      
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

  const completedTasksPercentage = todaysTasks.length > 0 
    ? Math.round((todaysTasks.filter(t => t.isCompleted).length / todaysTasks.length) * 100)
    : 0;

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/screens/teacher-index');
    } else if (user?.id) {
      fetchStudentData();
    }
  }, [isTeacherMode, user?.id]);

  const handleTaskToggle = async (taskId: string) => {
    if (!user?.id || !activePlant) return;

    const task = todaysTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const plantingDate = new Date(activePlant.plantedDate || Date.now());
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
        await supabase
          .from('student_daily_tasks')
          .update({ 
            completed: newCompletedState,
            completed_at: newCompletedState ? new Date().toISOString() : null
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
            completed: newCompletedState,
            completed_at: newCompletedState ? new Date().toISOString() : null,
            task_date: new Date().toISOString().split('T')[0]
          });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        {/* Fixed Mode Toggle at the top */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: 'white' }}>
          <GSModeToggle />
        </View>
        
        {/* Scrollable Content */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          

          {/* Plant Stories Section */}
          <View style={{ marginBottom: 24, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>Class Gardens</Text>
            </View>
            
            <PlantStories 
              onAddPhoto={() => router.push('/(tabs)/camera')}
              onStoryPress={(story) => console.log('View story:', story.id)}
            />
          </View>

          {/* My Plant Progress Section with GSPlantCard */}
          {activePlant && plantProgress && (
            <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>My Plant Progress</Text>
              
              <View style={{ marginTop: 12 }}>
                <GSPlantCard
                  imageUrl={plantProgress.imageUrl || null}
                  studentName="My Plant"
                  plantName={activePlant.name}
                  dayNumber={plantProgress.dayNumber || 1}
                  healthScore={plantProgress.healthScore || 0}
                  analysis="Thriving! Your plant is showing excellent growth patterns."
                />
              </View>

              {/* Horizontal scrollable stats */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <GSStatCard 
                    label="Stage" 
                    value={plantProgress.currentStage} 
                    icon="sprout" 
                  />
                  <GSStatCard 
                    label="Streak" 
                    value={`${plantProgress.streak} days`} 
                    icon="flame" 
                  />
                  <GSStatCard 
                    label="Health" 
                    value={`${plantProgress.healthScore}%`} 
                    icon="heart" 
                  />
                </View>
              </ScrollView>

              {/* Today's Photo CTA */}
              <View style={{ marginTop: 16 }}>
                <GSButton 
                  variant="secondary" 
                  icon="camera" 
                  fullWidth
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  Today's Photo
                </GSButton>
              </View>
            </View>
          )}

          {/* Yesterday's Feedback Section with proper GSGuidanceCard */}
          {yesterdaysFeedback && (
            <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Yesterday's Feedback</Text>
              
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
                  <Text style={{ fontWeight: '500', fontSize: 16, color: '#000' }}>Health Assessment</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#4CAF50' }}>{yesterdaysFeedback.health_rating}</Text>
                </View>

                {/* Positive Signs */}
                {yesterdaysFeedback.positive_signs && yesterdaysFeedback.positive_signs.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Positive Signs:</Text>
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
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Areas for Improvement:</Text>
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
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#000', marginBottom: 4 }}>{tip.title}</Text>
                        <Text style={{ fontSize: 12, color: '#666', lineHeight: 16 }}>{tip.description}</Text>
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
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Today's Tasks</Text>
              {todaysTasks.length > 0 && <GSProgressIndicator progress={completedTasksPercentage / 100} size="small" />}
            </View>
            
            <View style={{ marginTop: 12 }}>
              {todaysTasks.length > 0 ? (
                <GSTaskChecklist 
                  tasks={todaysTasks}
                  onTaskToggle={handleTaskToggle}
                />
              ) : (
                <GSCard variant="elevated" padding="large" style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>No active lesson</Text>
                  <Text style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
                    It looks like you are not currently enrolled in an active lesson. Please contact your teacher to get started.
                  </Text>
                </GSCard>
              )}
            </View>
          </View>

          {/* Tips & Reminders Section */}
          <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Tips & Reminders</Text>
            
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
                          <GSIconButton icon={tip.icon} onPress={() => {}} size={22} color="#4CAF50" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '500', fontSize: 15, color: '#000', lineHeight: 20, flexWrap: 'wrap' }}>{tip.title}</Text>
                          </View>
                          <View style={{ marginLeft: 4 }}>
                            <GSIconButton 
                              icon={isExpanded ? "chevron-up" : "chevron-down"} 
                              onPress={() => setExpandedTipIndex(isExpanded ? null : index)} 
                              size={18} 
                              color="#666" 
                            />
                          </View>
                        </View>
                        <Text 
                          style={{ fontSize: 13, color: '#666', lineHeight: 18 }} 
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
        </ScrollView>

        {/* AI Chat FAB - Always visible in Student Mode */}
        <GSFAB
          icon="message-text"
          onPress={() => router.push('/ai-chat')}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}