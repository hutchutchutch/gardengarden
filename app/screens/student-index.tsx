import React, { useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useMode } from '@/contexts/ModeContext';
import {
  GSafeScreen,
  GSModeToggle,
  GSHeader,
  GSIconButton,
  GSStoryThumbnail,
  GSHealthBadge,
  GSStatCard,
  GSButton,
  GSGuidanceCard,
  GSCollapsible,
  GSChip,
  GSTaskChecklist,
  GSBadge,
  GSProgressIndicator,
  GSTabBar,
  SectionHeader,
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
    currentStage: 'seedling',
    dayNumber: 12,
    healthScore: 88,
    height: '3.2',
    streak: 7
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
      // This would typically call a method from your task store
      console.log('Toggle task:', taskId);
    }
  };

  return (
    <GSafeScreen scrollable>
      {/* Mode Toggle - Sticky top */}
      <View className="sticky top-0 z-10 bg-background">
        <GSModeToggle />
      </View>

      {/* Header */}
      <GSHeader 
        variant="menu" 
        title="My Garden"
        actions={[
          {
            icon: 'settings',
            onPress: () => router.push('/settings' as any)
          }
        ]}
      />

      {/* Plant Stories Section */}
      <View className="mb-6">
        <SectionHeader title="Class Gardens">
          <GSIconButton icon="info" onPress={() => {}} size={20} />
        </SectionHeader>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 -mx-4">
          {/* Add Story Card */}
          {activePlant && (
            <View className="mr-3">
              <Pressable 
                onPress={() => router.push('/(tabs)/camera')}
                className="w-20 h-20 bg-primary/10 rounded-lg items-center justify-center border-2 border-dashed border-primary"
              >
                <GSIconButton icon="camera" onPress={() => {}} size={24} />
              </Pressable>
              <Text className="text-xs mt-1 text-center text-primary font-medium">Share Today</Text>
            </View>
          )}
          
          {/* Story Thumbnails */}
          {classStories.map((story) => (
            <View key={story.id} className="mr-3">
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

      {/* My Plant Progress Section */}
      {activePlant && (
        <View className="mb-6">
          <SectionHeader title="My Plant Progress" />
          
          {/* Using individual components instead of GSPlantCard since it doesn't accept children */}
          <View className="bg-card rounded-lg p-4 border border-border">
            {/* Plant Visualization */}
            <View className="items-center mb-4">
              <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center mb-2">
                <Text className="text-4xl">🌱</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <GSBadge label={`Day ${plantProgress.dayNumber}`} variant="primary" />
                <GSHealthBadge size="large" score={plantProgress.healthScore} />
              </View>
            </View>

            {/* Stats Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                <GSStatCard label="Height" value={`${plantProgress.height} inches`} icon="ruler" />
                <GSStatCard label="Stage" value={plantProgress.currentStage} icon="sprout" />
                <GSStatCard label="Health" value={`${plantProgress.healthScore}%`} icon="heart" />
                <GSStatCard label="Streak" value={`${plantProgress.streak} days`} icon="flame" />
              </View>
            </ScrollView>

            {/* Camera Button */}
            <GSButton 
              variant="secondary" 
              icon="camera" 
              onPress={() => router.push('/(tabs)/camera')}
            >
              Today's Photo
            </GSButton>
          </View>
        </View>
      )}

      {/* Yesterday's Feedback Section */}
      <View className="mb-6">
        <SectionHeader title="Yesterday's Feedback" />
        
        <GSGuidanceCard
          emoji="📊"
          title={`Day ${plantProgress.dayNumber - 1} Analysis`}
          content={yesterdaysFeedback.guidanceText}
        />

        {/* Additional feedback details */}
        <View className="bg-card rounded-lg p-4 mt-3 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-medium">Health Score</Text>
            <GSHealthBadge size="small" score={yesterdaysFeedback.score} />
          </View>

          {/* Sources */}
          <GSCollapsible label="View Sources">
            {yesterdaysFeedback.sources.map((source, index) => (
              <View key={index} className="flex-row items-center gap-2 py-2">
                <GSIconButton icon="link" onPress={() => {}} size={16} />
                <View className="flex-1">
                  <Text className="text-sm font-medium">{source.title}</Text>
                  <Text className="text-xs text-muted-foreground">{source.domain}</Text>
                </View>
              </View>
            ))}
          </GSCollapsible>

          {/* Issues */}
          {yesterdaysFeedback.issues.length > 0 && (
            <View className="mt-3">
              <Text className="text-sm font-medium mb-2">Issues Detected:</Text>
              <View className="flex-row flex-wrap gap-2">
                {yesterdaysFeedback.issues.map((issue, index) => (
                  <GSChip key={index} label={issue} variant="warning" />
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Today's Tasks Section */}
      <View className="mb-6">
        <SectionHeader title="Daily Care">
          <GSProgressIndicator progress={completedTasksPercentage / 100} size="small" />
        </SectionHeader>
        
        <GSTaskChecklist 
          tasks={todaysTasks}
          onTaskToggle={handleTaskToggle}
        />
      </View>

      {/* Tips & Reminders Section */}
      <View className="mb-6">
        <SectionHeader title="Tips & Reminders" />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tips.map((tip, index) => (
            <View key={index} className="bg-card rounded-lg p-4 mr-3 min-w-[200px]">
              <View className="flex-row items-center gap-2 mb-2">
                <GSIconButton icon={tip.icon} onPress={() => {}} size={20} />
                <Text className="font-medium">{tip.title}</Text>
              </View>
              <Text className="text-sm text-muted-foreground">{tip.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Need Help Section */}
      <View className="mb-6">
        <SectionHeader title="Need Help?" />
        <GSButton 
          variant="primary" 
          fullWidth 
          icon="message-circle"
          onPress={() => router.push('/ai-chat')}
        >
          Ask AI Assistant
        </GSButton>
      </View>

      {/* Tab Bar Navigation */}
      <GSTabBar 
        routes={[
          { key: 'home', title: 'Home', focusedIcon: 'home' },
          { key: 'lessons', title: 'Lessons', focusedIcon: 'book' },
          { key: 'camera', title: 'Camera', focusedIcon: 'camera', badge: true },
          { key: 'messages', title: 'Messages', focusedIcon: 'message-circle' },
          { key: 'profile', title: 'Profile', focusedIcon: 'user' }
        ]}
        activeIndex={0}
        onIndexChange={(index) => {
          const routes = ['home', 'lessons', 'camera', 'messages', 'profile'];
          if (index === 0) return;
          router.push(`/(tabs)/${routes[index]}` as any);
        }}
      />
    </GSafeScreen>
  );
}