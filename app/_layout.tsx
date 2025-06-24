import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { View } from 'react-native';
import { FAB } from '@/components/ui/fab';
import '../global.css';

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

export default function RootLayout() {
  // Remove font loading - use system fonts instead
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ModeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="ai-chat" options={{ presentation: 'modal' }} />
              <Stack.Screen name="plant/[id]" options={{ headerShown: false }} />
            </Stack>
            {/* FAB appears on all screens */}
            <FAB />
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ModeProvider>
    </AuthProvider>
  );
}