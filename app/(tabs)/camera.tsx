import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Pressable, ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, RotateCw, Grid3x3, Ghost, Check, X, Grid, Focus, PartyPopper } from 'lucide-react-native';
import { Camera, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { usePlantStore } from '@/store/plant-store';
import { uploadPlantPhoto, PhotoService } from '@/services/photo-service';
import { ImageAnalysisService } from '@/services/image-analysis-service';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { plants } from '@/mocks/plants';
import TeacherMessagesScreen from '@/app/screens/teacher-messages';
import {
  GSButton,
  GSCard,
  Text,
  Badge,
  Progress,
  Button
} from '@/components/ui';



export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { plants, updatePlant } = usePlantStore();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.3);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  
  const activePlant = plants[0];
  const previousImage = activePlant?.images[0]?.uri;
  const plantAge = activePlant ? 
    Math.floor((new Date().getTime() - new Date(activePlant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const [permission, requestPermission] = useCameraPermissions();



  const handlePermissions = async () => {
    try {
      // Request camera permissions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      
      if (cameraStatus === 'granted') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
        Alert.alert(
          'Camera Permission Required',
          'GardenSnap needs camera access to take photos of your plants for growth tracking and AI analysis. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handlePermissions }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    handlePermissions();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setCapturedImage(photo.uri);
      }
    }
  };

  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'GardenSnap needs access to your photo library to select plant photos for analysis.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage || !user?.id) return;
    
    setIsAnalyzing(true);
    try {
      // Upload photo and trigger AI analysis (compression is handled automatically)
      const result = await PhotoService.uploadAndAnalyze(capturedImage, user.id);
      
      if (result.success && result.analysisId) {
        // Poll for analysis completion
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait
        
        while (attempts < maxAttempts) {
          const analysisData = await ImageAnalysisService.getAnalysisStatus(result.analysisId);
          
          if (analysisData?.processing_status === 'completed') {
            // Convert to display format
            const displayResult = {
              healthScore: getHealthScoreFromRating(analysisData.health_rating),
              issues: analysisData.areas_for_improvement || [],
              growthProgress: `${analysisData.current_stage_name}: ${analysisData.current_stage_description}`,
              recommendations: analysisData.tips?.map(tip => tip.title) || []
            };
            
            setAnalysisResult(displayResult);
            
            // Update plant with new data
            if (activePlant) {
              await updatePlant(activePlant.id, {
                healthScore: displayResult.healthScore,
                lastPhotoDate: new Date().toISOString()
              });
            }
            break;
          } else if (analysisData?.processing_status === 'failed') {
            throw new Error(analysisData.error_message || 'Analysis failed');
          }
          
          // Wait 1 second before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Analysis timed out');
        }
      } else {
        throw new Error(result.error || 'Failed to upload and analyze image');
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze your plant photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to convert rating to numeric score
  const getHealthScoreFromRating = (rating: string): number => {
    const ratingMap: Record<string, number> = {
      'Excellent': 95,
      'Good': 80,
      'Fair': 65,
      'Poor': 40,
      'Critical': 20
    };
    return ratingMap[rating] || 70;
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const continueToHome = () => {
    router.push('/(tabs)');
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Filter messages based on search and filter


  // Show teacher messages if in teacher mode
  if (isTeacherMode) {
    return <TeacherMessagesScreen />;
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.centerContainer, styles.paddingHorizontal]}>
        <Text style={styles.centerText}>Camera permission is required to take plant photos</Text>
        <GSButton onPress={handlePermissions}>
          Grant Permission
        </GSButton>
      </SafeAreaView>
    );
  }

  // Analysis Results Screen
  if (analysisResult) {
    const healthColor = analysisResult.healthScore >= 80 ? '#10B981' :
                       analysisResult.healthScore >= 70 ? '#059669' :
                       analysisResult.healthScore >= 60 ? '#F59E0B' : '#EF4444';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentPadding}>
          <GSCard variant="elevated" padding="large">
            <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#000' }}>Analysis Complete</Text>
              {/* Health Score */}
              <View style={styles.healthScoreContainer}>
                <View style={[styles.healthScoreCircle, { backgroundColor: `${healthColor}20` }]}>
                  <Text variant="headlineMedium" style={[styles.healthScoreText, { color: healthColor }]}>
                    {analysisResult.healthScore}%
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.healthScoreChange}>
                  {analysisResult.healthScore > activePlant.healthScore ? '↑' : '↓'} 
                  {Math.abs(analysisResult.healthScore - activePlant.healthScore)}% from yesterday
                </Text>
              </View>

              {/* Issues Detected */}
              {analysisResult.issues.length > 0 && (
                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>Issues Detected</Text>
                  {analysisResult.issues.map((issue: string, index: number) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text variant="bodySmall" style={styles.listText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Growth Progress */}
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>Growth Progress</Text>
                <Text variant="bodySmall" style={styles.mutedText}>{analysisResult.growthProgress}</Text>
              </View>

              {/* Recommendations */}
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>Today's Care Tips</Text>
                {analysisResult.recommendations.map((tip: string, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={[styles.bulletPoint, { color: '#10B981' }]}>•</Text>
                    <Text variant="bodySmall" style={styles.listText}>{tip}</Text>
                  </View>
                ))}
              </View>
          </GSCard>

          <View style={styles.buttonRow}>
            <GSButton variant="secondary" onPress={retakePicture}>
              Retake Photo
            </GSButton>
            <GSButton variant="primary" onPress={continueToHome}>
              Continue
            </GSButton>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Photo Preview Screen
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.blackContainer}>
        <View style={styles.flex}>
          <Image source={{ uri: capturedImage }} style={styles.flex} resizeMode="contain" />
          
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.analyzingText}>Analyzing your plant...</Text>
              <Progress value={66} style={styles.progressBar} />
            </View>
          )}
          
          <View style={styles.bottomControls}>
            <View style={styles.buttonRow}>
              <Button 
                variant="outline" 
                style={[styles.flexButton, styles.transparentButton]}
                onPress={retakePicture}
                disabled={isAnalyzing}
              >
                <X size={20} color="white" />
                <Text style={styles.whiteText}>Retake</Text>
              </Button>
              <Button 
                style={styles.flexButton}
                onPress={analyzeImage}
                disabled={isAnalyzing}
              >
                <Check size={20} color="white" />
                <Text style={styles.whiteText}>Use Photo</Text>
              </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera View
  return (
    <SafeAreaView style={styles.blackContainer}>
      <CameraView ref={cameraRef} style={styles.flex} facing={facing}>
        {/* Ghost Image Overlay */}
        {showGhost && previousImage && (
          <Image 
            source={{ uri: previousImage }} 
            style={[styles.absoluteFill, { opacity: ghostOpacity }]}
            resizeMode="cover"
          />
        )}
        
        {/* Grid Overlay */}
        {showGrid && (
          <View style={styles.absoluteFill} pointerEvents="none">
            <View style={styles.gridRow}>
              <View style={styles.gridColumn} />
              <View style={styles.gridColumn} />
              <View style={styles.gridColumnLast} />
            </View>
            <View style={[styles.absoluteFill, styles.gridVertical]}>
              <View style={styles.gridRow} />
              <View style={styles.gridRow} />
              <View style={styles.gridRowLast} />
            </View>
          </View>
        )}
        
        {/* Top Controls */}
        <View style={styles.topControls}>
          <View style={styles.topControlsRow}>
            <Badge style={styles.dayBadge}>
              <Text style={styles.whiteText}>Day {plantAge} - {activePlant?.growthStage || 'Unknown'}</Text>
            </Badge>
            
            <View style={styles.controlButtons}>
              <Pressable 
                style={[styles.controlButton, showGrid && styles.controlButtonActive]}
                onPress={() => setShowGrid(!showGrid)}
              >
                <Grid3x3 size={20} color="white" />
              </Pressable>
              <Pressable 
                style={[styles.controlButton, showGhost && styles.controlButtonActive]}
                onPress={() => setShowGhost(!showGhost)}
              >
                <Ghost size={20} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
        
        {/* Helper Text */}
        <View style={styles.helperTextContainer}>
          <View style={styles.helperTextBadge}>
            <Text style={styles.helperText}>Align your plant with yesterday's photo</Text>
          </View>
        </View>
        
        {/* Bottom Controls */}
        <View style={styles.cameraControls}>
          <View style={styles.cameraControlsRow}>
            <TouchableOpacity onPress={() => setShowGrid(!showGrid)}>
              <Grid size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
              <CameraIcon size={40} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGhost(!showGhost)}>
              <Focus size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.flipButtonContainer}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <RotateCw size={28} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blackContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
  },
  centerText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  contentPadding: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  flex: {
    flex: 1,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  healthScoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  healthScoreCircle: {
    height: 96,
    width: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreText: {
    fontWeight: 'bold',
  },
  healthScoreChange: {
    color: '#64748B',
    marginTop: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  bulletPoint: {
    color: '#F59E0B',
  },
  listText: {
    flex: 1,
  },
  mutedText: {
    color: '#64748B',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  flexButton: {
    flex: 1,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    color: 'white',
    marginTop: 16,
  },
  progressBar: {
    width: 192,
    marginTop: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  transparentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  whiteText: {
    color: 'white',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridColumnLast: {
    flex: 1,
  },
  gridVertical: {
    flexDirection: 'column',
  },
  gridRowLast: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  topControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  helperTextContainer: {
    position: 'absolute',
    top: 128,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helperTextBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helperText: {
    color: 'white',
    fontSize: 14,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 8,
  },
});