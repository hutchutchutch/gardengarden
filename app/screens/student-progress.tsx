import React, { useEffect } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
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
} from '@/components/ui';

// Mock weekly task data
const weeklyTasks = [
  { day: 'Mon', date: 18, completed: true, tasks: ['Photo', 'Water', 'Measure'] },
  { day: 'Tue', date: 19, completed: true, tasks: ['Photo', 'Observe'] },
  { day: 'Wed', date: 20, completed: false, tasks: ['Photo', 'Water', 'Journal'] },
  { day: 'Thu', date: 21, completed: true, tasks: ['Photo', 'Measure'] },
  { day: 'Fri', date: 22, completed: false, tasks: ['Photo', 'Water', 'Quiz'] },
  { day: 'Sat', date: 23, completed: true, tasks: ['Photo', 'Observe'] },
  { day: 'Sun', date: 24, completed: true, tasks: ['Photo', 'Journal'] },
];

// Mock plant tips
const plantTips = [
  {
    id: '1',
    category: 'Watering',
    tip: 'Your tomato plant needs deep, infrequent watering. Check soil moisture 2 inches down.',
    icon: 'water',
    priority: 'high',
  },
  {
    id: '2',
    category: 'Growth',
    tip: 'At 3 weeks old, your plant should start showing its second set of true leaves.',
    icon: 'sprout',
    priority: 'medium',
  },
  {
    id: '3',
    category: 'Light',
    tip: 'Tomatoes need 6-8 hours of direct sunlight. Consider rotating your plant for even growth.',
    icon: 'white-balance-sunny',
    priority: 'medium',
  },
  {
    id: '4',
    category: 'Problem',
    tip: 'Yellow lower leaves are normal as your plant grows. Remove them to encourage new growth.',
    icon: 'leaf',
    priority: 'low',
  },
];

export default function StudentProgressScreen() {
  const router = useRouter();
  const { } = useAuth();
  const { isTeacherMode } = useMode();
  const { plants, fetchPlants } = usePlantStore();

  const activePlant = plants[0];
  const plantAge = activePlant
    ? Math.floor(
        (new Date().getTime() - new Date(activePlant.plantedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const completedDays = weeklyTasks.filter(day => day.completed).length;
  const completionRate = Math.round((completedDays / weeklyTasks.length) * 100);

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/screens/teacher-progress');
    }
  }, [isTeacherMode]);

  const handleAskQuestion = (context?: string) => {
    router.push({
      pathname: '/ai-chat',
      params: { context: context || 'general' },
    });
  };

  const getCompletionVariant = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'destructive';
  };

  const getTipPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (!activePlant) {
    return (
      <GSScreenLayout>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="p-4 space-y-6">
          {/* Header */}
          <View>
            <Text className="text-3xl font-bold text-foreground">Your Progress</Text>
            <Text className="text-base text-muted-foreground">
              Track your plant's journey
            </Text>
          </View>

          {/* Weekly Progress Calendar */}
          <GSCard padding="medium">
            <SectionHeader title="This Week's Progress">
              <GSBadge
                label={`${completionRate}%`}
                variant={getCompletionVariant(completionRate) as any}
              />
            </SectionHeader>
            <Text className="text-sm text-muted-foreground mb-4">
              {completedDays}/7 days completed
            </Text>

            <View className="flex-row justify-between mb-4">
              {weeklyTasks.map((day, index) => (
                <View key={index} className="items-center">
                  <Text className="text-xs text-muted-foreground mb-1">{day.day}</Text>
                  <GSIconButton
                    icon={day.completed ? 'check-circle' : 'alert-circle'}
                    size={24}
                    color={day.completed ? '#4CAF50' : '#F44336'}
                    onPress={() => {}}
                  />
                  <Text className="text-xs font-medium mt-1">{day.date}</Text>
                </View>
              ))}
            </View>
            <GSProgressIndicator progress={completionRate / 100} size="medium" />
          </GSCard>

          {/* Plant Status Card */}
          <GSCard padding="medium">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <SectionHeader title={activePlant.name || 'My Plant'} />
                <View className="flex-row items-center gap-2">
                  <GSChip label={activePlant.species} variant="primary" size="small" />
                  <Text className="text-sm text-muted-foreground">
                    {plantAge} days old
                  </Text>
                </View>
              </View>
              {activePlant.images.length > 0 && (
                <Image
                  source={{ uri: activePlant.images[0].uri }}
                  className="w-20 h-20 rounded-lg ml-4"
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Health Status */}
            <View className="mb-6">
              <SectionHeader title="Plant Health" />
              <View className="flex-row items-center justify-between">
                <GSHealthBadge score={activePlant.healthScore} size="medium" />
                <Text className="text-2xl font-bold text-primary">
                  {activePlant.healthScore}%
                </Text>
              </View>
              <GSProgressIndicator
                progress={activePlant.healthScore / 100}
                size="medium"
                className="mt-2"
              />
            </View>

            {/* Growth Comparison */}
            <View>
              <SectionHeader title="Growth vs Expected" />
              <View className="flex-row gap-3 mt-2">
                <GSStatCard label="Height" value="15 in" icon="ruler" className="flex-1" />
                <GSStatCard label="Leaves" value="12" icon="leaf" className="flex-1" />
                <GSStatCard
                  label="Stage"
                  value="Vegetative"
                  icon="sprout"
                  className="flex-1"
                />
              </View>
            </View>
          </GSCard>

          {/* Plant-Specific Tips */}
          <GSCard padding="medium">
            <SectionHeader title={`Tips for Your ${activePlant.species}`} />
            <Text className="text-sm text-muted-foreground mb-4">
              Personalized advice based on your plant's progress
            </Text>
            <View className="gap-3">
              {plantTips.map(tip => (
                <View
                  key={tip.id}
                  className="flex-row items-start p-3 bg-muted rounded-lg border-l-4"
                  style={{
                    borderLeftColor:
                      tip.priority === 'high'
                        ? '#F44336'
                        : tip.priority === 'medium'
                        ? '#FFB74D'
                        : '#4CAF50',
                  }}
                >
                  <GSIconButton icon={tip.icon} size={24} onPress={() => {}} />
                  <View className="flex-1 ml-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-semibold">{tip.category}</Text>
                      <GSChip
                        label={tip.priority}
                        variant={getTipPriorityVariant(tip.priority)}
                        size="small"
                      />
                    </View>
                    <Text className="text-sm text-muted-foreground">{tip.tip}</Text>
                  </View>
                </View>
              ))}
            </View>
          </GSCard>

          {/* Ask Questions Section */}
          <GSCard padding="medium">
            <SectionHeader title="Need Help?" />
            <Text className="text-sm text-muted-foreground mb-4">
              Ask questions about your plant or assignments
            </Text>
            <View className="gap-3">
              <GSButton
                variant="primary"
                icon="message-text-outline"
                fullWidth
                onPress={() => handleAskQuestion('plant-care')}
              >
                Ask About Plant Care
              </GSButton>
              <GSButton
                variant="secondary"
                icon="target-account"
                fullWidth
                onPress={() => handleAskQuestion('assignments')}
              >
                Help with Assignments
              </GSButton>
            </View>
          </GSCard>
        </View>
      </ScrollView>
    </GSScreenLayout>
  );
}
