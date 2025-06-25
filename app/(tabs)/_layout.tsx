import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Home, Sprout, Camera, Bot, TrendingUp, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={100}
            style={{ flex: 1 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          tabBarIcon: ({ color, focused }) => (
            <Sprout size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, focused }) => (
            <Camera size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, focused }) => (
            <Bot size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}