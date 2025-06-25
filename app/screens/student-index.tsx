import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useMode } from '@/contexts/ModeContext';

import {
  GSModeToggle,
  GSIconButton,
  GSStoryThumbnail,
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
  
  const activePlant = plants[0];
  
  // Mock data for stories
  const classStories = [
    { 
      id: '1', 
      thumbnailUrl: 'https://picsum.photos/80/80?random=1', 
      healthScore: 85, 
      studentName: 'Alex M.', 
      timeAgo: '2h ago',
      viewed: false 
    },
    { 
      id: '2', 
      thumbnailUrl: 'https://picsum.photos/80/80?random=2', 
      healthScore: 92, 
      studentName: 'Sarah K.', 
      timeAgo: '5h ago',
      viewed: true 
    },
    { 
      id: '3', 
      thumbnailUrl: 'https://picsum.photos/80/80?random=3', 
      healthScore: 78, 
      studentName: 'Mike R.', 
      timeAgo: '1d ago',
      viewed: true 
    },
  ];

  // Mock plant progress data
  const plantProgress = {
    currentStage: 'Seedling',
    dayNumber: 12,
    healthScore: 88,
    height: '3.2',
    streak: 7,
    imageUrl: 'https://picsum.photos/400/300?random=plant'
  };

  // Mock yesterday's feedback
  const yesterdaysFeedback = {
    score: 82,
    guidanceText: "Your plant showed good growth yesterday! The leaves are developing nicely. Consider adjusting the watering schedule slightly - the soil moisture was a bit high. Keep up the consistent care routine.",
    issues: ['Slight overwatering', 'Minor leaf curl'],
    sources: [
      { title: 'Optimal Watering Guide', domain: 'gardening101.com' },
      { title: 'Leaf Health Indicators', domain: 'plantcare.org' }
    ]
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
    }
  }, [isTeacherMode]);

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
          <View style={{ marginBottom: 24, marginTop: 24, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Class Gardens</Text>
              <GSIconButton icon="info" onPress={() => {}} size={20} />
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16 }}
              style={{ marginHorizontal: -16, marginTop: 12 }}
            >
              {/* Add Story Card */}
              {activePlant && (
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                  <Pressable 
                    onPress={() => router.push('/(tabs)/camera')}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                      borderRadius: 16, 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      borderWidth: 2, 
                      borderStyle: 'dashed', 
                      borderColor: '#22c55e' 
                    }}
                  >
                    <GSIconButton icon="camera" onPress={() => router.push('/(tabs)/camera')} size={24} />
                  </Pressable>
                  <Text style={{ fontSize: 12, marginTop: 8, textAlign: 'center', color: '#22c55e', fontWeight: '500' }}>Share Today</Text>
                </View>
              )}
              
              {/* Story Thumbnails with proper spacing */}
              {classStories.map((story, index) => (
                <View key={story.id} style={{ marginRight: index === classStories.length - 1 ? 0 : 12 }}>
                  <GSStoryThumbnail
                    thumbnailUrl={story.thumbnailUrl}
                    healthScore={story.healthScore}
                    studentName={story.studentName}
                    timeAgo={story.timeAgo}
                    viewed={story.viewed}
                    onPress={() => console.log('View story:', story.id)}
                  />
                </View>
              ))}
            </ScrollView>
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
                title={`Day ${plantProgress.dayNumber - 1} Analysis`}
                content={yesterdaysFeedback.guidanceText}
              />
            </View>

            {/* Additional feedback details */}
            <GSCard variant="elevated" padding="medium" margin="none" style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontWeight: '500', fontSize: 16, color: '#000' }}>Health Score</Text>
                <GSHealthBadge size="small" score={yesterdaysFeedback.score} />
              </View>

              {/* Issues */}
              {yesterdaysFeedback.issues.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Issues Detected:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {yesterdaysFeedback.issues.map((issue, index) => (
                      <GSChip key={index} label={issue} variant="warning" />
                    ))}
                  </View>
                </View>
              )}

              {/* Sources */}
              <GSCollapsible label="View Sources">
                {yesterdaysFeedback.sources.map((source, index) => (
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
          label="AI Assistant"
        />
      </View>
    </SafeAreaView>
  );
}