import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, Droplets, Sun, Award, Edit2 } from 'lucide-react-native';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock data for achievements
const achievements = [
  { id: '1', name: 'First Sprout', description: 'Your seed sprouted!', icon: '🌱', earned: true, date: '2024-03-15' },
  { id: '2', name: 'Week Warrior', description: '7-day photo streak', icon: '📸', earned: true, date: '2024-03-20' },
  { id: '3', name: 'Flowering Expert', description: 'First flower appeared', icon: '🌸', earned: false, progress: 80 },
  { id: '4', name: 'Problem Solver', description: 'Fixed 5 plant issues', icon: '🔧', earned: false, progress: 60 },
  { id: '5', name: 'Green Thumb', description: 'Plant health above 90% for a week', icon: '👍', earned: false, progress: 40 },
];

// Timeline milestones
const milestones = [
  { stage: 'Seed', day: 0, reached: true },
  { stage: 'Sprout', day: 7, reached: true },
  { stage: 'Vegetative', day: 14, reached: true },
  { stage: 'Flowering', day: 28, reached: false, predicted: true },
  { stage: 'Fruiting', day: 45, reached: false },
  { stage: 'Harvest', day: 75, reached: false },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants, fetchPlants } = usePlantStore();
  const [editingNickname, setEditingNickname] = useState(false);
  
  const activePlant = plants[0];
  const plantAge = activePlant ? 
    Math.floor((new Date().getTime() - new Date(activePlant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    fetchPlants();
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-health-excellent';
    if (score >= 70) return 'text-health-good';
    if (score >= 60) return 'text-health-warning';
    return 'text-health-danger';
  };

  // Mock health history data
  const healthHistory = Array.from({ length: 7 }, (_, i) => ({
    day: plantAge - 6 + i,
    score: Math.max(60, Math.min(100, (activePlant?.healthScore || 75) + Math.random() * 20 - 10))
  }));

  if (!activePlant) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">No plant data available</Text>
        <Button className="mt-4" onPress={() => router.push('/(tabs)/camera')}>
          <Text>Start Your Garden</Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 gap-4">
          {/* Plant Profile Card */}
          <Card>
            <CardHeader>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <CardTitle className="flex-row items-center gap-2">
                    <Text>{activePlant.name || 'My Plant'}</Text>
                    <Pressable onPress={() => setEditingNickname(true)}>
                      <Edit2 size={16} color="#64748B" />
                    </Pressable>
                  </CardTitle>
                  <CardDescription>
                    <Text>{activePlant.species}</Text>
                  </CardDescription>
                </View>
                {activePlant.images.length > 0 && (
                  <Image 
                    source={{ uri: activePlant.images[0].uri }}
                    className="h-16 w-16 rounded-lg"
                    resizeMode="cover"
                  />
                )}
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                <Badge variant="secondary">
                  <Text>Age: {plantAge} days</Text>
                </Badge>
                <Badge variant="secondary">
                  <Text>Stage: {activePlant.growthStage}</Text>
                </Badge>
                <Badge className={cn(
                  activePlant.healthScore >= 80 ? "bg-health-excellent" :
                  activePlant.healthScore >= 70 ? "bg-health-good" :
                  activePlant.healthScore >= 60 ? "bg-health-warning" : "bg-health-danger"
                )}>
                  <Text className="text-white">Health: {activePlant.healthScore}%</Text>
                </Badge>
              </View>
            </CardContent>
          </Card>

          {/* Plant Journey Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Text>Plant Journey</Text>
              </CardTitle>
              <CardDescription>
                <Text>Track your progress from seed to harvest</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="relative">
                {/* Timeline line */}
                <View className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                
                {/* Milestones */}
                {milestones.map((milestone, index) => {
                  const isReached = plantAge >= milestone.day;
                  const isCurrent = index > 0 && plantAge >= milestones[index - 1].day && plantAge < milestone.day;
                  
                  return (
                    <View key={milestone.stage} className="flex-row items-center mb-6">
                      <View className={cn(
                        "h-8 w-8 rounded-full items-center justify-center z-10",
                        isReached ? "bg-primary" : 
                        isCurrent ? "bg-primary/50" : "bg-muted"
                      )}>
                        <Text className={cn(
                          "text-xs font-bold",
                          isReached || isCurrent ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {milestone.day}
                        </Text>
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className={cn(
                          "font-semibold",
                          isReached ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {milestone.stage}
                        </Text>
                        {milestone.predicted && !isReached && (
                          <Text className="text-xs text-muted-foreground">
                            Expected in ~{milestone.day - plantAge} days
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </CardContent>
          </Card>

          {/* Growth Metrics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Text>Growth Metrics</Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              {/* Health Trend */}
              <View>
                <Text className="text-sm font-medium mb-2">Health Trend (7 days)</Text>
                <View className="flex-row items-end justify-between h-20">
                  {healthHistory.map((data, index) => (
                    <View key={index} className="flex-1 items-center">
                      <View 
                        className={cn(
                          "w-6 rounded-t",
                          data.score >= 80 ? "bg-health-excellent" :
                          data.score >= 70 ? "bg-health-good" :
                          data.score >= 60 ? "bg-health-warning" : "bg-health-danger"
                        )}
                        style={{ height: `${(data.score / 100) * 80}%` }}
                      />
                      <Text className="text-xs text-muted-foreground mt-1">
                        {index === 6 ? 'Today' : `${6 - index}d`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Growth Stats */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <TrendingUp size={16} color="#10B981" />
                    <Text className="text-sm text-muted-foreground">Height</Text>
                  </View>
                  <Text className="text-lg font-semibold">18 inches</Text>
                  <Text className="text-xs text-muted-foreground">+1.2"/week</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Sun size={16} color="#EAB308" />
                    <Text className="text-sm text-muted-foreground">Light</Text>
                  </View>
                  <Text className="text-lg font-semibold">6-8 hrs</Text>
                  <Text className="text-xs text-muted-foreground">Optimal</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Droplets size={16} color="#3B82F6" />
                    <Text className="text-sm text-muted-foreground">Water</Text>
                  </View>
                  <Text className="text-lg font-semibold">2x/week</Text>
                  <Text className="text-xs text-muted-foreground">Good</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Achievement Center */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Text>Achievements</Text>
              </CardTitle>
              <CardDescription>
                <Text>Unlock badges as you grow</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-3">
                {achievements.map((achievement) => (
                  <Pressable
                    key={achievement.id}
                    className={cn(
                      "w-20 items-center p-3 rounded-lg",
                      achievement.earned ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <Text className="text-2xl mb-1">{achievement.icon}</Text>
                    <Text className={cn(
                      "text-xs text-center",
                      achievement.earned ? "font-semibold" : "text-muted-foreground"
                    )}>
                      {achievement.name}
                    </Text>
                    {!achievement.earned && achievement.progress && (
                      <View className="w-full mt-1">
                        <Progress value={achievement.progress} className="h-1" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Class Ranking (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Text>Class Ranking</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm">Plant Health</Text>
                  <View className="flex-row items-center gap-2">
                    <Award size={16} color="#10B981" />
                    <Text className="font-semibold">#3 of 25</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm">Photo Streak</Text>
                  <View className="flex-row items-center gap-2">
                    <Award size={16} color="#EAB308" />
                    <Text className="font-semibold">#5 of 25</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}