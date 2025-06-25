import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { usePlantStore } from '@/store/plant-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import PlantStories from '@/components/PlantStories';
import { useMode } from '@/contexts/ModeContext';

export default function StudentIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants, loading } = usePlantStore();
  const { isTeacherMode, setIsTeacherMode } = useMode();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showPreviousTips, setShowPreviousTips] = useState(false);
  
  const activePlant = plants[0];
  const tips = [
    "Keep the soil consistently moist but not waterlogged.",
    "Your plant is getting optimal light. Keep it up!",
    "A new leaf is unfurling. Great progress!"
  ];

  if (isTeacherMode) {
    router.replace('/teacher-index');
    return null;
  }
  
  if (loading) {
    return <SafeAreaView className="flex-1 justify-center items-center"><Text>Loading...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        <View className="px-4 pt-2 pb-2">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Welcome back,</Text>
              <Text className="text-2xl font-bold text-foreground">{user?.email}</Text>
            </View>
            <View>
              <Pressable 
                className="relative"
                onPress={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <Feather name="bell" size={24} color="#64748B" />
                <View className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
              </Pressable>
              
              {showNotificationMenu && (
                <View className="absolute right-0 top-8 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                  <Pressable 
                    className="flex-row items-center p-2" 
                    onPress={() => {
                      setIsTeacherMode(true);
                      setShowNotificationMenu(false);
                    }}
                  >
                    <Feather name="user" size={16} color="#64748B" />
                    <Text className="text-sm">Switch to Teacher View</Text>
                  </Pressable>
                  <Pressable className="flex-row items-center p-2" onPress={() => {/* Handle notifications */}}>
                    <Feather name="bell" size={16} color="#64748B" />
                    <Text className="text-sm">View Notifications</Text>
                  </Pressable>
                   <Pressable className="flex-row items-center p-2" onPress={() => router.push('/(tabs)/profile')}>
                    <Feather name="settings" size={16} color="#64748B" />
                    <Text className="text-sm">Settings</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {activePlant && (
            <Card>
              <CardHeader>
                <CardTitle>{activePlant.name}</CardTitle>
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
                    className="mt-4"
                    onPress={() => setShowPreviousTips(!showPreviousTips)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text className="text-sm text-muted-foreground">
                      {showPreviousTips ? 'Hide' : 'Show'} previous tips ({tips.length - 1})
                    </Text>
                  </Pressable>
                )}

                <Button 
                  className="mt-4"
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  <Feather name="camera" size={16} color="white" />
                  <Text className="text-primary-foreground ml-2">Take Today's Photo</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          <View className="mt-4">
            <PlantStories />
          </View>
          
          <View className="flex-row mt-4 gap-4">
             <Button 
                variant="outline" 
                className="flex-1"
                onPress={() => router.push('/ai-chat')}
              >
                <Feather name="message-circle" size={16} />
                <Text className="ml-2">Ask AI</Text>
              </Button>
               <Button 
                variant="outline" 
                className="flex-1"
                onPress={() => router.push('/(tabs)/progress')}
              >
                <Feather name="users" size={16} />
                <Text className="ml-2">Class Plants</Text>
              </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}