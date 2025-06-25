import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Camera, MessageCircle, Users, User, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { useAIStore } from '@/store/ai-store';
import { useWeatherStore } from '@/store/weather-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import PlantStories from '@/components/PlantStories';
import { useMode } from '@/contexts/ModeContext';

export default function StudentIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const { plants, fetchPlants } = usePlantStore();
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { messages, fetchMessages } = useAIStore();
  const { currentWeather, fetchWeather } = useWeatherStore();
  
  const [greeting, setGreeting] = useState('');
  const [showPreviousTips, setShowPreviousTips] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Get active plant (first plant for now)
  const activePlant = plants[0];
  const todaysTasks = tasks.filter(task => 
    new Date(task.dueDate).toDateString() === new Date().toDateString()
  );
  const completedTasks = todaysTasks.filter(task => task.completed).length;
  
  // Get AI tips from messages (filter assistant messages)
  const tips = messages.filter(msg => msg.role === 'assistant');
  const latestTip = tips[0];

  // Calculate plant age from planted date
  const plantAge = activePlant ? 
    Math.floor((new Date().getTime() - new Date(activePlant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch data
    fetchPlants();
    fetchTasks();
    fetchMessages();
    fetchWeather();
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'health-excellent';
    if (score >= 70) return 'health-good';
    if (score >= 60) return 'health-warning';
    return 'health-danger';
  };

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom', 'left', 'right']}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        onScroll={() => setShowNotificationMenu(false)}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Plant Stories Section */}
        <PlantStories 
          onAddPhoto={() => router.push('/(tabs)/camera')}
          onStoryPress={(story) => {
            // TODO: Implement story viewer modal
            console.log('Story pressed:', story);
          }}
        />

        {/* Header Section */}
                  <View className="px-4 pt-2 pb-2">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold">{greeting}, {user?.name || 'Gardener'}!</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                {currentWeather && (
                  <Text className="text-muted-foreground text-sm">
                    {currentWeather.condition} • {currentWeather.precipitation}% rain
                  </Text>
                )}
              </View>
            </View>
            <View className="relative ml-4">
              <Pressable 
                className="relative"
                onPress={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <Bell size={24} color="#64748B" />
                <View className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
              </Pressable>
              
              {/* Notification Dropdown Menu */}
              {showNotificationMenu && (
                <View className="absolute top-8 right-0 bg-card border border-border rounded-lg shadow-lg min-w-48 z-50">
                  <View className="p-1">
                    <Pressable 
                      className="flex-row items-center gap-3 px-3 py-2 rounded-md"
                      onPress={() => {
                        setShowNotificationMenu(false);
                        // Switch to teacher mode via context
                      }}
                    >
                      <User size={16} color="#64748B" />
                      <Text className="text-sm">Switch to Teacher View</Text>
                    </Pressable>
                    <Pressable 
                      className="flex-row items-center gap-3 px-3 py-2 rounded-md"
                      onPress={() => {
                        setShowNotificationMenu(false);
                        // TODO: Implement notifications view
                      }}
                    >
                      <Bell size={16} color="#64748B" />
                      <Text className="text-sm">View Notifications</Text>
                    </Pressable>
                    <Pressable 
                      className="flex-row items-center gap-3 px-3 py-2 rounded-md"
                      onPress={() => {
                        setShowNotificationMenu(false);
                        // TODO: Implement settings
                      }}
                    >
                      <Settings size={16} color="#64748B" />
                      <Text className="text-sm">Settings</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="px-4 gap-4">
          {/* Active Lesson Card */}
          {activePlant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex-row items-center justify-between">
                  <Text>Growing {activePlant.species}</Text>
                  <Badge variant="secondary">
                    <Text>{activePlant.growthStage}</Text>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  <Text>{activePlant.name || 'My Plant'}</Text>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">Day {plantAge} of 75</Text>
                  <Text className="text-sm font-medium">{Math.round((plantAge / 75) * 100)}%</Text>
                </View>
                <Progress value={(plantAge / 75) * 100} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Today's Plant Status */}
          {activePlant && (
            <Card className={cn("border-l-4", `border-l-${getHealthColor(activePlant.healthScore)}`)}>
              <CardHeader>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <CardTitle>
                      <Text>Plant Health</Text>
                    </CardTitle>
                    <CardDescription>
                      <Text>Last photo: {activePlant.lastPhotoDate ? new Date(activePlant.lastPhotoDate).toLocaleTimeString() : 'Not yet'}</Text>
                    </CardDescription>
                  </View>
                  <View className={cn(
                    "h-16 w-16 rounded-full items-center justify-center",
                    `bg-${getHealthColor(activePlant.healthScore)}/20`
                  )}>
                    <Text className={cn(
                      "text-2xl font-bold",
                      `text-${getHealthColor(activePlant.healthScore)}`
                    )}>
                      {activePlant.healthScore}%
                    </Text>
                  </View>
                </View>
              </CardHeader>
              {activePlant.images.length > 0 && (
                <CardContent>
                  <Pressable onPress={() => router.push(`/plant/${activePlant.id}`)}>
                    <Image 
                      source={{ uri: activePlant.images[0].uri }} 
                      className="w-full h-32 rounded-lg"
                      resizeMode="cover"
                    />
                  </Pressable>
                </CardContent>
              )}
              <CardFooter>
                <Button 
                  className="w-full"
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  <Camera size={16} color="white" />
                  <Text className="text-primary-foreground ml-2">Take Today's Photo</Text>
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* AI Daily Guidance */}
          {latestTip && (
            <Card>
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Text>🌱 Day {plantAge} Guidance</Text>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-base leading-relaxed mb-2">{latestTip.content}</Text>
                <Pressable onPress={() => router.push('/ai-chat')}>
                  <Text className="text-sm text-primary">View Sources →</Text>
                </Pressable>
                
                {tips.length > 1 && (
                                  <Pressable 
                  className="mt-4"
                  onPress={() => setShowPreviousTips(!showPreviousTips)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text className="text-sm text-muted-foreground">
                      {showPreviousTips ? 'Hide' : 'Show'} previous tips ({tips.length - 1})
                    </Text>
                  </Pressable>
                )}
                
                {showPreviousTips && (
                  <View className="mt-3 gap-2">
                    {tips.slice(1, 6).map((tip, index) => (
                      <View key={tip.id} className="p-3 bg-muted rounded-lg">
                        <Text className="text-xs text-muted-foreground mb-1">
                          {new Date(tip.timestamp).toLocaleDateString()}
                        </Text>
                        <Text className="text-sm">{tip.content}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* Daily Tasks Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <Text>Today's Tasks</Text>
                <Badge variant={completedTasks === todaysTasks.length ? "default" : "secondary"}>
                  <Text>{completedTasks}/{todaysTasks.length}</Text>
                </Badge>
              </CardTitle>
              {completedTasks > 0 && (
                <CardDescription>
                  <Text>+{completedTasks * 5} points earned</Text>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="gap-3">
              {todaysTasks.map(task => (
                <Pressable
                  key={task.id}
                  className="flex-row items-center gap-3"
                  onPress={() => handleTaskToggle(task.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View className={cn(
                    "h-5 w-5 rounded border-2",
                    task.completed 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground"
                  )} />
                  <Text className={cn(
                    "flex-1",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </Text>
                </Pressable>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-6">
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