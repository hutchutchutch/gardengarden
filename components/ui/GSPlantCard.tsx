import React, { useState } from 'react';
import { Card, Text, Surface, IconButton, ProgressBar } from 'react-native-paper';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { GSHealthBadge } from './GSHealthBadge';

interface GSPlantCardProps {
  imageUrl: string;
  studentName: string;
  plantName: string;
  dayNumber: number;
  healthScore: number;
  analysis?: string;
  onExpand?: () => void;
  testID?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // 16px padding on each side

export const GSPlantCard: React.FC<GSPlantCardProps> = ({
  imageUrl,
  studentName,
  plantName,
  dayNumber,
  healthScore,
  analysis,
  onExpand,
  testID = 'gs-plant-card',
}) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleExpand = () => {
    setExpanded(!expanded);
    onExpand?.();
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          width: cardWidth,
        },
      ]}
      testID={testID}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          testID={`${testID}-image`}
        />
        
        {imageLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceVariant }]}>
            <ProgressBar indeterminate color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.healthBadgeOverlay}>
          <GSHealthBadge
            score={healthScore}
            size="medium"
            showLabel={false}
            testID={`${testID}-health`}
          />
        </View>

        <Surface style={[styles.dayBadge, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text 
            variant="labelMedium" 
            style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}
          >
            Day {dayNumber}
          </Text>
        </Surface>
      </View>

      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text 
              variant="titleMedium" 
              style={[styles.studentName, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {studentName}
            </Text>
            <Text 
              variant="bodySmall" 
              style={[styles.plantName, { color: theme.colors.textLight }]}
            >
              {plantName}
            </Text>
          </View>

          {analysis && (
            <IconButton
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              onPress={handleExpand}
              testID={`${testID}-expand`}
            />
          )}
        </View>

        {expanded && analysis && (
          <View style={styles.analysisContainer}>
            <Text 
              variant="bodyMedium" 
              style={[styles.analysis, { color: theme.colors.onSurfaceVariant }]}
            >
              {analysis}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthBadgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  dayBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  studentName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  plantName: {
    lineHeight: 16,
  },
  analysisContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  analysis: {
    lineHeight: 20,
  },
}); 