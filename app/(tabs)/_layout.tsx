import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Sprout, Camera, MessageCircle, TrendingUp, Grid, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';
import { 
  BottomNavigation, 
  BottomNavigationItem, 
  BottomNavigationIcon, 
  BottomNavigationLabel 
} from '@/components/ui/bottom-navigation';
import { HeaderWithToggle } from '@/components/ui/header-with-toggle';
import { FAB } from '@/components/ui/fab';

// Custom Tab Bar Component using BottomNavigation
function TabBar({ state, descriptors, navigation }: any) {

  return (
    <BottomNavigation>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Special styling for camera button
        const isCamera = route.name === 'camera';

        if (isCamera) {
          return (
            <BottomNavigationItem
              key={route.key}
              onPress={onPress}
              isActive={isFocused}
            >
              <BottomNavigationIcon>
                <View className="h-12 w-12 bg-primary rounded-full items-center justify-center shadow-lg">
                  <Camera size={24} color="white" />
                </View>
              </BottomNavigationIcon>
            </BottomNavigationItem>
          );
        }

        return (
          <BottomNavigationItem
            key={route.key}
            onPress={onPress}
            isActive={isFocused}
          >
            <BottomNavigationIcon>
              {options.tabBarIcon({ 
                color: isFocused ? '#10B981' : '#64748B', 
                size: 20 
              })}
            </BottomNavigationIcon>
            <BottomNavigationLabel className={cn(
              isFocused ? 'text-primary' : 'text-muted-foreground'
            )}>
              {options.title}
            </BottomNavigationLabel>
          </BottomNavigationItem>
        );
      })}
    </BottomNavigation>
  );
}

export default function TabLayout() {
  const { isTeacherMode, setIsTeacherMode } = useMode();

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            color: '#020817',
            fontWeight: '600',
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => (
            <HeaderWithToggle 
              title={isTeacherMode ? "Teacher Dashboard" : "Home"}
              isTeacherMode={isTeacherMode}
              onToggle={setIsTeacherMode}
            />
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          headerTitle: () => (
            <HeaderWithToggle 
              title={isTeacherMode ? "Lesson Management" : "Lessons"}
              isTeacherMode={isTeacherMode}
              onToggle={setIsTeacherMode}
            />
          ),
          tabBarIcon: ({ color, size }) => <Sprout size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          headerTitle: () => (
            <HeaderWithToggle 
              title="Camera"
              isTeacherMode={isTeacherMode}
              onToggle={setIsTeacherMode}
            />
          ),
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerTitle: () => (
            <HeaderWithToggle 
              title="Progress"
              isTeacherMode={isTeacherMode}
              onToggle={setIsTeacherMode}
            />
          ),
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: () => (
            <HeaderWithToggle 
              title="Profile"
              isTeacherMode={isTeacherMode}
              onToggle={setIsTeacherMode}
            />
          ),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
    
    {/* FAB positioned above bottom navigation */}
    <FAB />
  </View>
  );
}