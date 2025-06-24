import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import AIChat from '@/components/AIChat';
import colors from '@/constants/colors';
import { analyzePhoto } from '@/services/ai-service';
import { AIPlantAnalysis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AIChatScreen() {
  const { photoUri, plantId, mode } = useLocalSearchParams<{ photoUri: string; plantId: string; mode: string }>();
  const [analysis, setAnalysis] = useState<AIPlantAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setShowFAB } = useAuth();

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

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: mode === 'teacher' ? 'Message Teacher' : 'Garden Mentor AI',
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
});