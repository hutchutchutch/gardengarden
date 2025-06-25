import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Pressable, ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, RotateCw, Grid3x3, Ghost, Check, X, Grid, Focus, PartyPopper } from 'lucide-react-native';
import { Camera, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { usePlantStore } from '@/store/plant-store';
import { uploadPlantPhoto } from '@/services/photo-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { plants } from '@/mocks/plants';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { plants, updatePlant } = usePlantStore();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.3);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  
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
    if (!capturedImage || !activePlant) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      const mockResult = {
        healthScore: Math.min(100, activePlant.healthScore + Math.floor(Math.random() * 10) - 3),
        issues: Math.random() > 0.7 ? ['Yellow leaves detected on lower stem'] : [],
        growthProgress: 'Normal growth for day ' + plantAge,
        recommendations: [
          'Continue current watering schedule',
          'Rotate plant 1/4 turn for even light exposure'
        ]
      };
      
      setAnalysisResult(mockResult);
      
      // Update plant with new data
      await updatePlant(activePlant.id, {
        healthScore: mockResult.healthScore,
        lastPhotoDate: new Date().toISOString()
      });
      
      // In real app, upload photo and save analysis
      // await uploadPlantPhoto(capturedImage, activePlant.id);
      
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const continueToHome = () => {
    router.push('/(tabs)');
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-center mb-4">Camera permission is required to take plant photos</Text>
        <Button onPress={handlePermissions}>
          <Text>Grant Permission</Text>
        </Button>
      </SafeAreaView>
    );
  }

  // Analysis Results Screen
  if (analysisResult) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Text>Analysis Complete</Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              {/* Health Score */}
              <View className="items-center py-4">
                <View className={cn(
                  "h-24 w-24 rounded-full items-center justify-center",
                  analysisResult.healthScore >= 80 ? "bg-health-excellent/20" :
                  analysisResult.healthScore >= 70 ? "bg-health-good/20" :
                  analysisResult.healthScore >= 60 ? "bg-health-warning/20" : "bg-health-danger/20"
                )}>
                  <Text className={cn(
                    "text-3xl font-bold",
                    analysisResult.healthScore >= 80 ? "text-health-excellent" :
                    analysisResult.healthScore >= 70 ? "text-health-good" :
                    analysisResult.healthScore >= 60 ? "text-health-warning" : "text-health-danger"
                  )}>
                    {analysisResult.healthScore}%
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground mt-2">
                  {analysisResult.healthScore > activePlant.healthScore ? '↑' : '↓'} 
                  {Math.abs(analysisResult.healthScore - activePlant.healthScore)}% from yesterday
                </Text>
              </View>

              {/* Issues Detected */}
              {analysisResult.issues.length > 0 && (
                <View>
                  <Text className="font-semibold mb-2">Issues Detected</Text>
                  {analysisResult.issues.map((issue: string, index: number) => (
                    <View key={index} className="flex-row items-start gap-2 mb-1">
                      <Text className="text-health-warning">•</Text>
                      <Text className="flex-1 text-sm">{issue}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Growth Progress */}
              <View>
                <Text className="font-semibold mb-2">Growth Progress</Text>
                <Text className="text-sm text-muted-foreground">{analysisResult.growthProgress}</Text>
              </View>

              {/* Recommendations */}
              <View>
                <Text className="font-semibold mb-2">Today's Care Tips</Text>
                {analysisResult.recommendations.map((tip: string, index: number) => (
                  <View key={index} className="flex-row items-start gap-2 mb-1">
                    <Text className="text-primary">•</Text>
                    <Text className="flex-1 text-sm">{tip}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          <View className="flex-row gap-3 mt-4">
            <Button variant="outline" className="flex-1" onPress={retakePicture}>
              <Text>Retake Photo</Text>
            </Button>
            <Button className="flex-1" onPress={continueToHome}>
              <Text>Continue</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Photo Preview Screen
  if (capturedImage) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1">
          <Image source={{ uri: capturedImage }} className="flex-1" resizeMode="contain" />
          
          {isAnalyzing && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white mt-4">Analyzing your plant...</Text>
              <Progress value={66} className="w-48 mt-2" />
            </View>
          )}
          
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <View className="flex-row gap-4">
              <Button 
                variant="outline" 
                className="flex-1 bg-white/20" 
                onPress={retakePicture}
                disabled={isAnalyzing}
              >
                <X size={20} color="white" />
                <Text className="text-white ml-2">Retake</Text>
              </Button>
              <Button 
                className="flex-1" 
                onPress={analyzeImage}
                disabled={isAnalyzing}
              >
                <Check size={20} color="white" />
                <Text className="text-white ml-2">Use Photo</Text>
              </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera View
  return (
    <SafeAreaView className="flex-1 bg-black">
      <CameraView ref={cameraRef} className="flex-1" facing={facing}>
        {/* Ghost Image Overlay */}
        {showGhost && previousImage && (
          <Image 
            source={{ uri: previousImage }} 
            className="absolute inset-0"
            style={{ opacity: ghostOpacity }}
            resizeMode="cover"
          />
        )}
        
        {/* Grid Overlay */}
        {showGrid && (
          <View className="absolute inset-0" pointerEvents="none">
            <View className="flex-1 flex-row">
              <View className="flex-1 border-r border-white/30" />
              <View className="flex-1 border-r border-white/30" />
              <View className="flex-1" />
            </View>
            <View className="absolute inset-0 flex-col">
              <View className="flex-1 border-b border-white/30" />
              <View className="flex-1 border-b border-white/30" />
              <View className="flex-1" />
            </View>
          </View>
        )}
        
        {/* Top Controls */}
        <View className="absolute top-4 left-4 right-4">
          <View className="flex-row justify-between items-center">
            <Badge className="bg-black/50">
              <Text className="text-white">Day {plantAge} - {activePlant?.growthStage || 'Unknown'}</Text>
            </Badge>
            
            <View className="flex-row gap-2">
              <Pressable 
                className={cn(
                  "h-10 w-10 rounded-full items-center justify-center",
                  showGrid ? "bg-white/20" : "bg-black/20"
                )}
                onPress={() => setShowGrid(!showGrid)}
              >
                <Grid3x3 size={20} color="white" />
              </Pressable>
              <Pressable 
                className={cn(
                  "h-10 w-10 rounded-full items-center justify-center",
                  showGhost ? "bg-white/20" : "bg-black/20"
                )}
                onPress={() => setShowGhost(!showGhost)}
              >
                <Ghost size={20} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
        
        {/* Helper Text */}
        <View className="absolute top-32 left-0 right-0 items-center">
          <View className="bg-black/50 px-4 py-2 rounded-full">
            <Text className="text-white text-sm">Align your plant with yesterday's photo</Text>
          </View>
        </View>
        
        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/50">
          <View className="flex-row justify-around items-center">
            <TouchableOpacity onPress={() => setShowGrid(!showGrid)}>
              <Grid size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePicture} className="w-20 h-20 rounded-full bg-white justify-center items-center">
              <CameraIcon size={40} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGhost(!showGhost)}>
              <Focus size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <RotateCw size={28} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 8,
  },
});