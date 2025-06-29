import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ModeProvider, useMode } from '@/contexts/ModeContext';
import { View, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from '@/config/theme';
import { CheckCircle2 } from 'lucide-react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitializing, hasSeenOnboarding } = useAuth();
  const { isSwitchingMode } = useMode();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute: isLoading =', isLoading, 'isInitializing =', isInitializing, 'user =', user?.email, 'isSwitchingMode =', isSwitchingMode, 'hasSeenOnboarding =', hasSeenOnboarding);
    
    // Don't apply auth protection during initialization, loading, or mode switching
    if (!isLoading && !isSwitchingMode && !isInitializing) {
      const inAuthGroup = segments[0] === 'auth';
      const inOnboarding = segments[0] === 'onboarding';
      
      // If user hasn't seen onboarding and isn't on onboarding screen, redirect to onboarding
      if (!hasSeenOnboarding && !inOnboarding) {
        router.replace('/onboarding');
      }
      // If user has seen onboarding but not authenticated and not in auth group, redirect to signin
      else if (hasSeenOnboarding && !user && !inAuthGroup) {
        router.replace('/auth/signin');
      }
      // If user is authenticated and trying to access auth pages or onboarding, redirect to home
      else if (user && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, isInitializing, segments, isSwitchingMode, hasSeenOnboarding]);

  if (isLoading || isInitializing) {
    console.log('ProtectedRoute: Still loading/initializing, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <CheckCircle2 size={48} color="#4CAF50" />
        <Text style={{ marginTop: 16, fontSize: 18, color: '#333' }}>GardenSnap</Text>
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const paperTheme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ModeProvider>
          <AuthProvider>
            <ProtectedRoute>
              <View style={{ flex: 1 }}>
                <StatusBar style="auto" />
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/teacher-index" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/student-index" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/teacher-lessons" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/student-lessons" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/teacher-progress" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/student-progress" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/teacher-messages" options={{ headerShown: false }} />
                  <Stack.Screen name="ai-chat" options={{ title: 'AI Assistant' }} />
                  <Stack.Screen name="plant/[id]" options={{ title: 'Plant Details' }} />
                </Stack>
              </View>
            </ProtectedRoute>
          </AuthProvider>
        </ModeProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}