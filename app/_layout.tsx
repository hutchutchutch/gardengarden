import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from '@/config/theme';

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
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const paperTheme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <ModeProvider>
            <View style={{ flex: 1 }}>
              <StatusBar style="auto" />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
                <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="ai-chat" options={{ title: 'AI Assistant' }} />
                <Stack.Screen name="plant/[id]" options={{ title: 'Plant Details' }} />
              </Stack>
            </View>
          </ModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}