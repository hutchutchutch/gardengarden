import React, { useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';
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
  GSPlantCard,
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
    <GSafeScreen scrollable>
      {/* Mode Toggle - Sticky top */}
      <View className="sticky top-0 z-10 bg-background pb-2">
        <GSModeToggle />
      </View>

      {/* Header with hamburger menu and notification bell */}
      <GSHeader 
        variant="menu" 
        title="My Garden"
        onMenu={() => {
          // Open drawer navigation or menu
          console.log('Open menu');
        }}
        actions={[
          {
            icon: 'bell',
            onPress: () => router.push('/notifications' as any)
          },
          {
            icon: 'settings',
            onPress: () => router.push('/settings' as any)
          }
        ]}
      />

      {/* Plant Stories Section */}
      <View className="mb-6 mt-6">
        <SectionHeader title="Class Gardens">
          <GSIconButton icon="info" onPress={() => {}} size={20} />
        </SectionHeader>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 16 }}
          style={{ marginHorizontal: -16, marginTop: 12 }}
        >
          {/* Add Story Card */}
          {activePlant && (
            <View className="items-center mr-3">
              <Pressable 
                onPress={() => router.push('/(tabs)/camera')}
                className="w-20 h-20 bg-primary/10 rounded-2xl items-center justify-center border-2 border-dashed border-primary"
              >
                <GSIconButton icon="camera" onPress={() => router.push('/(tabs)/camera')} size={24} />
              </Pressable>
              <Text className="text-xs mt-2 text-center text-primary font-medium">Share Today</Text>
            </View>
          )}
          
          {/* Story Thumbnails with proper spacing */}
          {classStories.map((story, index) => (
            <View key={story.id} className={cn("mr-3", index === classStories.length - 1 && "mr-0")}>
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
        <View className="mb-6 mt-6">
          <SectionHeader title="My Plant Progress" />
          
          <View className="mt-3">
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-4 px-4">
            <View className="flex-row gap-3">
              <GSStatCard 
                label="Height" 
                value={`${plantProgress.height}"`} 
                icon="ruler" 
              />
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
          <View className="mt-4">
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
      <View className="mb-6 mt-6">
        <SectionHeader title="Yesterday's Feedback" />
        
        <View className="mt-3">
          <GSGuidanceCard
            emoji="📊"
            title={`Day ${plantProgress.dayNumber - 1} Analysis`}
            content={yesterdaysFeedback.guidanceText}
          />
        </View>

        {/* Additional feedback details */}
        <View className="bg-card rounded-lg p-4 mt-3 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-medium text-base">Health Score</Text>
            <GSHealthBadge size="small" score={yesterdaysFeedback.score} />
          </View>

          {/* Issues */}
          {yesterdaysFeedback.issues.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm font-medium mb-2">Issues Detected:</Text>
              <View className="flex-row flex-wrap gap-2">
                {yesterdaysFeedback.issues.map((issue, index) => (
                  <GSChip key={index} label={issue} variant="warning" />
                ))}
              </View>
            </View>
          )}

          {/* Sources */}
          <GSCollapsible label="View Sources">
            {yesterdaysFeedback.sources.map((source, index) => (
              <View key={index} className="flex-row items-center gap-2 py-2">
                <GSIconButton icon="link-2" onPress={() => {}} size={16} />
                <View className="flex-1">
                  <Text className="text-sm font-medium">{source.title}</Text>
                  <Text className="text-xs text-muted-foreground">{source.domain}</Text>
                </View>
              </View>
            ))}
          </GSCollapsible>
        </View>
      </View>

      {/* Today's Tasks Section */}
      <View className="mb-6 mt-6">
        <SectionHeader title="Today's Tasks">
          <GSProgressIndicator progress={completedTasksPercentage / 100} size="small" />
        </SectionHeader>
        
        <View className="mt-3">
          <GSTaskChecklist 
            tasks={todaysTasks}
            onTaskToggle={handleTaskToggle}
          />
        </View>
      </View>

      {/* Tips & Reminders Section */}
      <View className="mb-6 mt-6">
        <SectionHeader title="Tips & Reminders" />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 mt-3">
          <View className="flex-row gap-3">
            {tips.map((tip, index) => (
              <View key={index} className="bg-card rounded-lg p-4 min-w-[200px] border border-border">
                <View className="flex-row items-center gap-2 mb-2">
                  <GSIconButton icon={tip.icon} onPress={() => {}} size={20} />
                  <Text className="font-medium text-base">{tip.title}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">{tip.description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Need Help Section */}
      <View className="mb-20 mt-6">
        <SectionHeader title="Need Help?" />
        <View className="mt-3">
          <GSButton 
            variant="primary" 
            fullWidth 
            icon="message-circle"
            onPress={() => router.push('/ai-chat')}
          >
            Ask AI Assistant
          </GSButton>
        </View>
      </View>

      {/* Tab Bar Navigation with correct Lucide icons */}
      <GSTabBar 
        routes={[
          { key: 'index', title: 'Home', focusedIcon: 'home' },
          { key: 'lessons', title: 'Learn', focusedIcon: 'book' },
          { key: 'camera', title: 'Camera', focusedIcon: 'camera', badge: true },
          { key: 'progress', title: 'Progress', focusedIcon: 'message-circle' },
          { key: 'profile', title: 'Profile', focusedIcon: 'user' }
        ]}
        activeIndex={0}
        onIndexChange={(index) => {
          const routes = ['index', 'lessons', 'camera', 'progress', 'profile'];
          if (index === 0) return;
          router.push(`/(tabs)/${routes[index]}` as any);
        }}
      />
    </GSafeScreen>
  );
}