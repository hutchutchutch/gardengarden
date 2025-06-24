import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { takePicture, pickImage } from '@/utils/imageUtils';
import { useAnalysisStore } from '@/store/analysisStore';

export default function IdentifyScreen() {
  const router = useRouter();
  const { addAnalysis } = useAnalysisStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTakePicture = async () => {
    try {
      const imageUri = await takePicture();
      if (imageUri) {
        setSelectedImage(imageUri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        setSelectedImage(imageUri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Create a new analysis entry
      const analysisId = Date.now().toString();
      const newAnalysis = {
        id: analysisId,
        imageUri: selectedImage,
        timestamp: Date.now(),
        isProcessing: true,
      };
      
      // Add to store
      addAnalysis(newAnalysis);
      
      // Navigate to analysis screen
      router.push(`/analysis/${analysisId}`);
      
      // Reset state
      setSelectedImage(null);
    } catch (error) {
      console.error('Error starting analysis:', error);
      Alert.alert('Error', 'Failed to start analysis. Please try again.');
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Identification</Text>
        <Text style={styles.subtitle}>
          Take a photo or upload an image of a plant to identify it and get care instructions
        </Text>
      </View>

      <View style={styles.imageContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Take or select a photo to analyze
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {selectedImage ? (
          <>
            <Button
              title="Analyze Plant"
              onPress={handleAnalyze}
              loading={isLoading}
              style={styles.analyzeButton}
            />
            <Button
              title="Reset"
              onPress={handleReset}
              variant="outline"
              style={styles.resetButton}
            />
          </>
        ) : (
          <>
            <Button
              title="Take Photo"
              onPress={handleTakePicture}
              icon={<Camera size={20} color="white" />}
              style={styles.cameraButton}
            />
            <Button
              title="Upload Image"
              onPress={handlePickImage}
              variant="outline"
              icon={<ImageIcon size={20} color={colors.primary} />}
              style={styles.uploadButton}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 24,
    gap: 12,
  },
  cameraButton: {
    marginBottom: 12,
  },
  uploadButton: {},
  analyzeButton: {
    marginBottom: 12,
  },
  resetButton: {},
});