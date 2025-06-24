import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  TrendingUp, 
  Droplets, 
  Sun, 
  MessageCircle, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Lightbulb,
  Target,
  HelpCircle
} from 'lucide-react-native';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    icon: '💧',
    priority: 'high'
  },
  {
    id: '2',
    category: 'Growth',
    tip: 'At 3 weeks old, your plant should start showing its second set of true leaves.',
    icon: '🌱',
    priority: 'medium'
  },
  {
    id: '3',
    category: 'Light',
    tip: 'Tomatoes need 6-8 hours of direct sunlight. Consider rotating your plant for even growth.',
    icon: '☀️',
    priority: 'medium'
  },
  {
    id: '4',
    category: 'Problem',
    tip: 'Yellow lower leaves are normal as your plant grows. Remove them to encourage new growth.',
    icon: '🍃',
    priority: 'low'
  }
];

export default function StudentProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants, fetchPlants } = usePlantStore();
  
  const activePlant = plants[0];
  const plantAge = activePlant ? 
    Math.floor((new Date().getTime() - new Date(activePlant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const completedDays = weeklyTasks.filter(day => day.completed).length;
  const completionRate = Math.round((completedDays / weeklyTasks.length) * 100);

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleAskQuestion = (context?: string) => {
    router.push({
      pathname: '/ai-chat',
      params: { context: context || 'general' }
    });
  };

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
          
          {/* Weekly Progress Calendar */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <View>
                  <CardTitle className="flex-row items-center gap-2">
                    <Calendar size={20} color="#10B981" />
                    <Text>This Week's Progress</Text>
                  </CardTitle>
                  <CardDescription>
                    <Text>{completedDays}/7 days completed ({completionRate}%)</Text>
                  </CardDescription>
                </View>
                <Badge className={cn(
                  completionRate >= 80 ? "bg-green-500" :
                  completionRate >= 60 ? "bg-amber-500" : "bg-red-500"
                )}>
                  <Text className="text-white">{completionRate}%</Text>
                </Badge>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row justify-between">
                {weeklyTasks.map((day, index) => (
                  <View key={index} className="items-center">
                    <Text className="text-xs text-muted-foreground mb-1">{day.day}</Text>
                    <View className={cn(
                      "h-10 w-10 rounded-full items-center justify-center mb-1",
                      day.completed ? "bg-green-100" : "bg-red-100"
                    )}>
                      {day.completed ? (
                        <CheckCircle size={24} color="#10B981" />
                      ) : (
                        <AlertTriangle size={24} color="#EF4444" />
                      )}
                    </View>
                    <Text className="text-xs font-medium">{day.date}</Text>
                  </View>
                ))}
              </View>
              <Progress value={completionRate} className="mt-4" />
            </CardContent>
          </Card>

          {/* Plant Status Card */}
          <Card>
            <CardHeader>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <CardTitle>
                    <Text>{activePlant.name || 'My Plant'}</Text>
                  </CardTitle>
                  <CardDescription>
                    <Text>{activePlant.species} • {plantAge} days old</Text>
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
              <View className="gap-4">
                {/* Health Status */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium">Plant Health</Text>
                    <Text className="text-sm font-bold">{activePlant.healthScore}%</Text>
                  </View>
                  <Progress value={activePlant.healthScore} className="mb-1" />
                  <Text className="text-xs text-muted-foreground">
                    {activePlant.healthScore >= 80 ? 'Excellent condition!' : 
                     activePlant.healthScore >= 70 ? 'Good health' : 
                     activePlant.healthScore >= 60 ? 'Needs attention' : 'Requires immediate care'}
                  </Text>
                </View>

                {/* Growth Comparison */}
                <View>
                  <Text className="text-sm font-medium mb-2">Growth vs Expected</Text>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">Height</Text>
                      <Text className="font-semibold">15 inches</Text>
                      <Text className="text-xs text-green-600">+2" ahead</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">Leaves</Text>
                      <Text className="font-semibold">12 leaves</Text>
                      <Text className="text-xs text-amber-600">On track</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">Stage</Text>
                      <Text className="font-semibold">Vegetative</Text>
                      <Text className="text-xs text-green-600">Early</Text>
                    </View>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Plant-Specific Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2">
                <Lightbulb size={20} color="#EAB308" />
                <Text>Tips for Your {activePlant.species}</Text>
              </CardTitle>
              <CardDescription>
                <Text>Personalized advice based on your plant's progress</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="gap-3">
                {plantTips.map((tip) => (
                  <View key={tip.id} className={cn(
                    "p-3 rounded-lg border-l-4",
                    tip.priority === 'high' ? "bg-red-50 border-red-500" :
                    tip.priority === 'medium' ? "bg-amber-50 border-amber-500" : 
                    "bg-blue-50 border-blue-500"
                  )}>
                    <View className="flex-row items-start gap-3">
                      <Text className="text-lg">{tip.icon}</Text>
                      <View className="flex-1">
                        <Text className="font-medium text-sm mb-1">{tip.category}</Text>
                        <Text className="text-sm text-muted-foreground">{tip.tip}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Ask Questions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2">
                <HelpCircle size={20} color="#3B82F6" />
                <Text>Need Help?</Text>
              </CardTitle>
              <CardDescription>
                <Text>Ask questions about your plant or assignments</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="gap-3">
                <Button 
                  className="flex-row items-center gap-2"
                  onPress={() => handleAskQuestion('plant-care')}
                >
                  <MessageCircle size={16} color="white" />
                  <Text className="text-white">Ask About Plant Care</Text>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-row items-center gap-2"
                  onPress={() => handleAskQuestion('assignments')}
                >
                  <Target size={16} color="#3B82F6" />
                  <Text>Help with Assignments</Text>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-row items-center gap-2"
                  onPress={() => handleAskQuestion('general')}
                >
                  <HelpCircle size={16} color="#3B82F6" />
                  <Text>General Questions</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 