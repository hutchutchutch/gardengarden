import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import AIChat from '@/components/AIChat';
import colors from '@/constants/colors';
import { analyzePhoto } from '@/services/ai-service';
import { AIPlantAnalysis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { GSAuthDebug } from '@/components/ui/GSAuthDebug';
import { testThreadCreation, refreshAuthSession, checkRLSContext } from '@/utils/debug-utils';

// Expose debug functions globally for testing
if (typeof window !== 'undefined' && __DEV__) {
  (window as any).testThreadCreation = testThreadCreation;
  (window as any).refreshAuthSession = refreshAuthSession;
  (window as any).checkRLSContext = checkRLSContext;
}

export default function AIChatScreen() {
  const { photoUri, plantId, mode, threadId, studentId } = useLocalSearchParams<{ 
    photoUri: string; 
    plantId: string; 
    mode: string;
    threadId: string;
    studentId: string;
  }>();
  const [analysis, setAnalysis] = useState<AIPlantAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentName, setStudentName] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { setShowFAB, user } = useAuth();

  useEffect(() => {
    // Hide FAB on chat screen to avoid overlap
    setShowFAB(false);
    return () => setShowFAB(true);
  }, [setShowFAB]);

  useEffect(() => {
    if (photoUri && mode !== 'teacher') {
      analyzePhotoAndUpdate();
    }
  }, [photoUri, mode]);

  // Fetch student information when in teacher mode
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (mode === 'teacher' && studentId) {
        try {
          const { data: student, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', studentId)
            .single();

          if (student && !error) {
            // Extract first name from full name
            const firstName = student.name.split(' ')[0];
            setStudentName(firstName);
          }
        } catch (error) {
          console.error('Error fetching student info:', error);
        }
      }
    };

    fetchStudentInfo();
  }, [mode, studentId]);

  // Collect debug info
  useEffect(() => {
    const collectDebugInfo = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setDebugInfo({
        params: { photoUri: !!photoUri, plantId, mode, threadId, studentId },
        contextUser: user ? { id: user.id, role: user.role, email: user.email } : null,
        authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
        timestamp: new Date().toISOString()
      });
    };
    collectDebugInfo();
  }, [photoUri, plantId, mode, threadId, studentId, user]);

  const analyzePhotoAndUpdate = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePhoto(photoUri);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to get the header title
  const getHeaderTitle = () => {
    if (mode === 'teacher') {
      return studentName ? `Chat with ${studentName}` : 'Chat with Student';
    }
    return 'Garden Mentor AI';
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: getHeaderTitle(),
          headerBackTitle: mode === 'teacher' ? 'Messages' : undefined,
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          headerTintColor: colors.primary,
        }} 
      />
      {/* Temporary debug info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{JSON.stringify(debugInfo, null, 2)}</Text>
          <View style={styles.debugButtons}>
            <Pressable style={styles.debugButton} onPress={testThreadCreation}>
              <Text style={styles.debugButtonText}>Test Thread Creation</Text>
            </Pressable>
            <Pressable style={styles.debugButton} onPress={refreshAuthSession}>
              <Text style={styles.debugButtonText}>Refresh Auth</Text>
            </Pressable>
            <Pressable style={styles.debugButton} onPress={checkRLSContext}>
              <Text style={styles.debugButtonText}>Check RLS</Text>
            </Pressable>
          </View>
          <GSAuthDebug />
        </View>
      )}
      {photoUri && mode !== 'teacher' && (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.analyzingText}>Analyzing your plant...</Text>
            </View>
          )}
        </View>
      )}
      <AIChat 
        analysis={analysis} 
        photoUri={photoUri} 
        plantId={plantId} 
        initialMode={mode as 'ai' | 'teacher' || 'ai'}
        threadId={threadId}
        studentId={studentId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  photoContainer: {
    height: 200,
    backgroundColor: colors.black,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: colors.white,
    marginTop: 8,
    fontSize: 16,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: colors.grayLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  debugButtons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  debugButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginRight: 8,
  },
  debugButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});