import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useMode } from '@/contexts/ModeContext';
import PlantStories from '@/components/PlantStories';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  const [yesterdaysFeedback, setYesterdaysFeedback] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

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
        
        setPlantProgress({
          currentStage: plantData.current_stage,
          dayNumber,
          healthScore: plantData.current_health_score || 0,
          height: plantData.predictions?.current_height || '0',
          streak: 7, // TODO: Calculate actual streak
          imageUrl: 'https://picsum.photos/400/300?random=plant'
        });
      }
      
      // Fetch yesterday's submission and guidance
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const { data: submissionData } = await supabase
        .from('daily_submissions')
        .select(`
          *,
          guidance_history(*)
        `)
        .eq('student_id', user.id)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .single();
        
      if (submissionData && submissionData.guidance_history?.[0]) {
        setYesterdaysFeedback({
          score: submissionData.health_score || 0,
          guidanceText: submissionData.guidance_history[0].guidance_text,
          issues: submissionData.issues || [],
          sources: submissionData.guidance_history[0].source_refs || []
        });
      }
      
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Today's tasks
  const todaysTasks = tasks
    .filter(task => {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate === today;
    })
    .map(task => ({
      id: task.id,
      name: task.title,
      description: task.description,
      isCompleted: task.completed,
      points: 10
    }));

  // Tips
  const tips = [
    { icon: 'droplets', title: 'Watering Tip', description: 'Check soil moisture before watering' },
    { icon: 'sun', title: 'Light Check', description: 'Ensure 6-8 hours of indirect sunlight' },
    { icon: 'thermometer', title: 'Temperature', description: 'Keep between 65-75°F for optimal growth' }
  ];

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

  const handleTaskToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Update task in store
      console.log('Toggle task:', taskId);
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
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Class Gardens</Text>
              <GSIconButton icon="info" onPress={() => {}} size={20} />
            </View>
            
            <PlantStories 
              onAddPhoto={() => router.push('/(tabs)/camera')}
              onStoryPress={(story) => console.log('View story:', story.id)}
            />
          </View>

          {/* My Plant Progress Section with GSPlantCard */}
          {activePlant && (
            <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>My Plant Progress</Text>
              
              <View style={{ marginTop: 12 }}>
                <GSPlantCard
                  imageUrl={plantProgress.imageUrl}
                  studentName="My Plant"
                  plantName={activePlant.name}
                  dayNumber={plantProgress.dayNumber}
                  healthScore={plantProgress.healthScore}
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
          <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Yesterday's Feedback</Text>
            
            <View style={{ marginTop: 12 }}>
              <GSGuidanceCard
                emoji="📊"
                title={`Day ${plantProgress?.dayNumber - 1} Analysis`}
                content={yesterdaysFeedback?.guidanceText}
              />
            </View>

            {/* Additional feedback details */}
            <GSCard variant="elevated" padding="medium" margin="none" style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontWeight: '500', fontSize: 16, color: '#000' }}>Health Score</Text>
                <GSHealthBadge size="small" score={yesterdaysFeedback?.score} />
              </View>

              {/* Issues */}
              {yesterdaysFeedback?.issues && yesterdaysFeedback.issues.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Issues Detected:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {yesterdaysFeedback.issues.map((issue: string, index: number) => (
                      <GSChip key={index} label={issue} variant="warning" />
                    ))}
                  </View>
                </View>
              )}

              {/* Sources */}
              <GSCollapsible label="View Sources">
                {yesterdaysFeedback?.sources?.map((source: any, index: number) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                    <GSIconButton icon="link-2" onPress={() => {}} size={16} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#000' }}>{source.title}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>{source.domain}</Text>
                    </View>
                  </View>
                ))}
              </GSCollapsible>
            </GSCard>
          </View>

          {/* Today's Tasks Section */}
          <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Today's Tasks</Text>
              <GSProgressIndicator progress={completedTasksPercentage / 100} size="small" />
            </View>
            
            <View style={{ marginTop: 12 }}>
              <GSTaskChecklist 
                tasks={todaysTasks}
                onTaskToggle={handleTaskToggle}
              />
            </View>
          </View>

          {/* Tips & Reminders Section */}
          <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Tips & Reminders</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {tips.map((tip, index) => (
                  <GSCard key={index} variant="elevated" padding="medium" style={{ minWidth: 200 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <GSIconButton icon={tip.icon} onPress={() => {}} size={20} />
                      <Text style={{ fontWeight: '500', fontSize: 16, color: '#000' }}>{tip.title}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#666' }}>{tip.description}</Text>
                  </GSCard>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* AI Chat FAB - Always visible in Student Mode */}
        <GSFAB
          icon="message-circle"
          onPress={() => router.push('/ai-chat')}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}