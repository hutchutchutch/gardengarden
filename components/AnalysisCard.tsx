import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { PlantAnalysis } from '@/types';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/dateUtils';

interface AnalysisCardProps {
  analysis: PlantAnalysis;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/analysis/${analysis.id}`);
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <Image 
        source={{ uri: analysis.imageUri }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {analysis.results?.plantName || 'Unknown Plant'}
          </Text>
          <Text style={styles.date}>{formatDate(analysis.timestamp)}</Text>
        </View>
        
        {analysis.isProcessing ? (
          <View style={styles.statusContainer}>
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        ) : analysis.error ? (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>Analysis failed</Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <Text 
              style={[
                styles.statusText, 
                { 
                  color: analysis.results?.healthStatus === 'Healthy' 
                    ? colors.success 
                    : colors.warning 
                }
              ]}
            >
              {analysis.results?.healthStatus || 'No status'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  processingText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.accent,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.error,
  },
});