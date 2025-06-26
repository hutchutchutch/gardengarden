import React, { useState } from 'react';
import { Card, Text, Surface, IconButton } from 'react-native-paper';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { GSHealthBadge } from './GSHealthBadge';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';
import { GSIconButton } from './GSIconButton';
import { GSChip } from './GSChip';

interface GSPlantCardProps {
  imageUrl?: string | null;
  studentName: string;
  plantName: string;
  dayNumber: number;
  healthScore: number;
  currentStage?: string;
  streak?: number;
  height?: string;
  positiveSigns?: string[];
  areasForImprovement?: string[];
  onExpand?: () => void;
  isLoading?: boolean;
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
  currentStage,
  streak,
  height,
  positiveSigns = [],
  areasForImprovement = [],
  onExpand,
  isLoading = false,
  testID = 'gs-plant-card',
}) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            width: cardWidth,
          },
        ]}
      >
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <ShimmerPlaceholder width={100} height={18} borderRadius={4} />
                <View style={styles.badgeContainer}>
                  <ShimmerPlaceholder width={50} height={20} borderRadius={10} />
                  <ShimmerPlaceholder width={40} height={20} borderRadius={10} />
                </View>
              </View>
              <ShimmerPlaceholder width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <ShimmerPlaceholder width={60} height={40} borderRadius={8} />
            <ShimmerPlaceholder width={60} height={40} borderRadius={8} />
            <ShimmerPlaceholder width={60} height={40} borderRadius={8} />
          </View>
        </Card.Content>
      </Card>
    );
  }

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


      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text 
                variant="titleMedium" 
                style={[styles.studentName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {studentName}
              </Text>
              <View style={styles.badgeContainer}>
                <Surface style={[styles.dayBadgeCompact, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text 
                    variant="labelSmall" 
                    style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}
                  >
                    Day {dayNumber}
                  </Text>
                </Surface>
                <GSHealthBadge
                  score={healthScore}
                  size="small"
                  showLabel={false}
                  testID={`${testID}-health`}
                />
              </View>
            </View>
            <Text 
              variant="bodySmall" 
              style={[styles.plantName, { color: theme.colors.textLight }]}
            >
              {plantName}
            </Text>
          </View>

          {(positiveSigns.length > 0 || areasForImprovement.length > 0) && (
            <IconButton
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              onPress={handleExpand}
              testID={`${testID}-expand`}
            />
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {currentStage && (
            <View style={styles.statItem}>
              <GSIconButton icon="sprout" onPress={() => {}} size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Stage</Text>
              <Text variant="labelMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{currentStage}</Text>
            </View>
          )}
          {streak && (
            <View style={styles.statItem}>
              <GSIconButton icon="flame" onPress={() => {}} size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Streak</Text>
              <Text variant="labelMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{streak} days</Text>
            </View>
          )}
          {height && (
            <View style={styles.statItem}>
              <GSIconButton icon="ruler" onPress={() => {}} size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Height</Text>
              <Text variant="labelMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{height}cm</Text>
            </View>
          )}
        </View>

        {expanded && (positiveSigns.length > 0 || areasForImprovement.length > 0) && (
          <View style={styles.analysisContainer}>
            {positiveSigns.length > 0 && (
              <View style={styles.signSection}>
                <Text variant="labelMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Positive Signs
                </Text>
                <View style={styles.chipContainer}>
                  {positiveSigns.map((sign, index) => (
                    <GSChip key={index} label={sign} variant="success" />
                  ))}
                </View>
              </View>
            )}
            
            {areasForImprovement.length > 0 && (
              <View style={[styles.signSection, positiveSigns.length > 0 && { marginTop: 12 }]}>
                <Text variant="labelMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Areas for Improvement
                </Text>
                <View style={styles.chipContainer}>
                  {areasForImprovement.map((area, index) => (
                    <GSChip key={index} label={area} variant="warning" />
                  ))}
                </View>
              </View>
            )}
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
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentName: {
    fontWeight: '600',
    flex: 1,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 10,
  },
  statValue: {
    marginTop: 2,
    fontWeight: '600',
  },
  signSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
}); 