import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, CheckCircle, Droplet, Sun, Wind } from 'lucide-react-native';
import { useAnalysisStore } from '@/store/analysisStore';
import { analyzePlantImage } from '@/utils/aiUtils';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAnalysisById, updateAnalysis } = useAnalysisStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const analysis = getAnalysisById(id);
  
  useEffect(() => {
    if (!analysis) return;
    
    // If the analysis is marked as processing, start the analysis
    if (analysis.isProcessing) {
      performAnalysis();
    }
  }, [analysis?.id]);
  
  const performAnalysis = async () => {
    if (!analysis) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Analyze the image
      const results = await analyzePlantImage(analysis.imageUri);
      
      // Update the analysis with the results
      updateAnalysis(analysis.id, {
        results,
        isProcessing: false,
      });
      
      // Trigger haptic feedback on success
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze the image. Please try again.');
      
      // Update the analysis with the error
      updateAnalysis(analysis.id, {
        isProcessing: false,
        error: 'Analysis failed',
      });
      
      // Trigger haptic feedback on error
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    if (!analysis) return;
    
    // Reset the analysis state
    updateAnalysis(analysis.id, {
      isProcessing: true,
      error: undefined,
    });
    
    // Retry the analysis
    performAnalysis();
  };
  
  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Analysis not found</Text>
      </View>
    );
  }
  
  const isAnalysisComplete = !analysis.isProcessing && !analysis.error && analysis.results;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Image 
        source={{ uri: analysis.imageUri }} 
        style={styles.image} 
        resizeMode="cover"
      />
      
      {analysis.isProcessing || isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your plant...</Text>
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        </View>
      ) : analysis.error ? (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={colors.error} style={styles.errorIcon} />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{error || "We couldn't analyze this image. Please try again."}</Text>
          <Button 
            title="Retry Analysis" 
            onPress={handleRetry} 
            style={styles.retryButton}
          />
        </View>
      ) : isAnalysisComplete ? (
        <View style={styles.resultsContainer}>
          <View style={styles.plantNameContainer}>
            <Text style={styles.plantName}>{analysis.results?.plantName || 'Unknown Plant'}</Text>
            <View style={styles.healthStatusContainer}>
              <View 
                style={[
                  styles.healthStatusBadge,
                  { 
                    backgroundColor: analysis.results?.healthStatus === 'Healthy' 
                      ? colors.success 
                      : colors.warning 
                  }
                ]}
              >
                {analysis.results?.healthStatus === 'Healthy' ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <AlertTriangle size={16} color="white" />
                )}
                <Text style={styles.healthStatusText}>
                  {analysis.results?.healthStatus || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
          
          {analysis.results?.confidence && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(analysis.results.confidence * 100)}%
              </Text>
            </View>
          )}
          
          {analysis.results?.careInstructions && analysis.results.careInstructions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Care Instructions</Text>
              <View style={styles.careInstructionsContainer}>
                {analysis.results.careInstructions.map((instruction, index) => (
                  <View key={index} style={styles.careInstruction}>
                    {getInstructionIcon(instruction)}
                    <Text style={styles.careInstructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {analysis.results?.issues && analysis.results.issues.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Issues</Text>
              <View style={styles.issuesContainer}>
                {analysis.results.issues.map((issue, index) => (
                  <View key={index} style={styles.issue}>
                    <AlertTriangle size={20} color={colors.warning} style={styles.issueIcon} />
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

// Helper function to get an icon based on the care instruction text
const getInstructionIcon = (instruction: string) => {
  const lowerInstruction = instruction.toLowerCase();
  
  if (lowerInstruction.includes('water') || lowerInstruction.includes('moist')) {
    return <Droplet size={20} color={colors.accent} style={styles.instructionIcon} />;
  } else if (lowerInstruction.includes('sun') || lowerInstruction.includes('light')) {
    return <Sun size={20} color={colors.warning} style={styles.instructionIcon} />;
  } else if (lowerInstruction.includes('air') || lowerInstruction.includes('ventilation')) {
    return <Wind size={20} color={colors.accent} style={styles.instructionIcon} />;
  } else {
    return <CheckCircle size={20} color={colors.primary} style={styles.instructionIcon} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
  },
  retryButton: {
    marginTop: 16,
  },
  resultsContainer: {
    padding: 20,
  },
  plantNameContainer: {
    marginBottom: 16,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  healthStatusContainer: {
    flexDirection: 'row',
  },
  healthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthStatusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  confidenceContainer: {
    marginBottom: 24,
  },
  confidenceText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  careInstructionsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  careInstruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  careInstructionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  issuesContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  issue: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  issueIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  issueText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
});