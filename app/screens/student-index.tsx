import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, User, Settings, Camera, MessageCircle, Users, BookOpen, CheckCircle, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';
import PlantStories from '@/components/PlantStories';
import TaskCard from '@/components/TaskCard';
import ModeToggle from '@/components/ui/mode-toggle';
import { useMode } from '@/contexts/ModeContext';

export default function StudentIndexScreen() {
  const router = useRouter();
  const { plants } = usePlantStore();
  const { tasks } = useTaskStore();
  const { user } = useAuth();
  const { isTeacherMode, setIsTeacherMode } = useMode();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showPreviousTips, setShowPreviousTips] = useState(false);
  
  const activePlant = plants[0];
  const tips = [
    "Keep the soil consistently moist but not waterlogged.",
    "Your plant is getting optimal light. Keep it up!",
    "A new leaf is unfurling. Great progress!"
  ];

  // Get user's first name
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  // Mock lesson progress data
  const lessonProgress = {
    completed: 3,
    total: 5,
    currentLesson: 'Understanding Plant Growth Stages',
    progress: 65
  };

  // Get today's tasks
  const todaysTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate === today;
  }).slice(0, 3); // Show max 3 tasks

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/screens/teacher-index');
    }
  }, [isTeacherMode]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        <View className="px-4 pb-2">
          {/* Student/Teacher Toggle */}
          <View className="mb-6">
            <ModeToggle />
          </View>

          {/* 1. Plant Stories - At the very top */}
          <View className="mb-6">
            <PlantStories />
          </View>

          {/* 2. Welcome back message */}
          <View className="mb-6">
            <Text className="text-sm text-muted-foreground">Welcome back!</Text>
          </View>

          {/* 3. Lesson Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle title="Lesson Progress" />
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Current Lesson</Text>
                <Text className="text-sm font-medium">{lessonProgress.progress}%</Text>
              </View>
              <Text className="font-medium mb-3">{lessonProgress.currentLesson}</Text>
              <Progress value={lessonProgress.progress} className="mb-3" />
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  {lessonProgress.completed} of {lessonProgress.total} lessons completed
                </Text>
                <Button 
                  size="sm"
                  onPress={() => router.push('/(tabs)/lessons')}
                >
                  <BookOpen size={14} color="white" />
                  <Text className="text-primary-foreground ml-1">Continue</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* 4. Today's Tasks */}
          <Card className="mb-6">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle title="Today's Tasks" />
                <Text className="text-sm text-muted-foreground">
                  {todaysTasks.filter(task => task.completed).length}/{todaysTasks.length}
                </Text>
              </View>
            </CardHeader>
            <CardContent>
              {todaysTasks.length > 0 ? (
                <View>
                  {todaysTasks.map((task) => (
                    <View key={task.id} className="mb-3 last:mb-0">
                      <TaskCard task={task} />
                    </View>
                  ))}
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onPress={() => router.push('/(tabs)/progress')}
                  >
                    <Text>View All Tasks</Text>
                  </Button>
                </View>
              ) : (
                <View className="items-center py-4">
                  <CheckCircle size={32} color="#10B981" />
                  <Text className="text-sm text-muted-foreground mt-2">All tasks completed!</Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* 5. Tips and Feedback */}
          {activePlant && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle title="Tips and Feedback" />
              </CardHeader>
              <CardContent>
                <Text className="text-muted-foreground mb-4">
                  {tips[tips.length - 1]}
                </Text>
                
                {showPreviousTips && (
                  <View className="mb-4">
                    {tips.slice(0, -1).map((tip, index) => (
                      <Text key={index} className="text-sm text-muted-foreground/80 mb-1">{tip}</Text>
                    ))}
                  </View>
                )}
                
                {tips.length > 1 && (
                  <Pressable 
                    className="mb-4"
                    onPress={() => setShowPreviousTips(!showPreviousTips)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text className="text-sm text-muted-foreground">
                      {showPreviousTips ? 'Hide' : 'Show'} previous tips ({tips.length - 1})
                    </Text>
                  </Pressable>
                )}

                <Button 
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  <Camera size={16} color="white" />
                  <Text className="text-primary-foreground ml-2">Take Today's Photo</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 6. Ask AI - At the bottom */}
          <View className="flex-row gap-4 mb-4">
             <Button 
                variant="outline" 
                className="flex-1"
                onPress={() => router.push('/ai-chat')}
              >
                <MessageCircle size={16} />
                <Text className="ml-2">Ask AI</Text>
              </Button>
               <Button 
                variant="outline" 
                className="flex-1"
                onPress={() => router.push('/(tabs)/progress')}
              >
                <Users size={16} />
                <Text className="ml-2">Class Plants</Text>
              </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}