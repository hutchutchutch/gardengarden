import React, { useState } from 'react';
import { Card, Text, Surface, IconButton } from 'react-native-paper';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
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
                <ShimmerPlaceholder width={120} height={18} borderRadius={4} />
                <View style={styles.badgeContainer}>
                  <ShimmerPlaceholder width={50} height={20} borderRadius={10} />
                  <ShimmerPlaceholder width={40} height={20} borderRadius={10} />
                </View>
              </View>
              <View style={styles.firstSignRow}>
                <ShimmerPlaceholder width={16} height={16} borderRadius={8} />
                <ShimmerPlaceholder width={100} height={14} borderRadius={4} />
              </View>
            </View>
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
      <View style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text 
                  variant="titleMedium" 
                  style={[styles.plantName, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {plantName}
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
              {/* First Positive Sign */}
              {positiveSigns.length > 0 && (
                <View style={styles.firstSignRow}>
                  <GSIconButton icon="check-circle" onPress={() => {}} size={16} color="#4CAF50" />
                  <Text 
                    variant="bodySmall" 
                    style={[styles.firstSignText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {positiveSigns[0]}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Row with Stage and More Details */}
          <View style={styles.bottomRow}>
            {/* Stage on the left */}
            {currentStage && (
              <View style={styles.stageBottomRow}>
                <GSIconButton icon="sprout" onPress={() => {}} size={16} color={theme.colors.primary} />
                <Text 
                  variant="labelMedium" 
                  style={[styles.stageBottomText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {currentStage}
                </Text>
              </View>
            )}
            
            {/* More Details on the right */}
            {(positiveSigns.length > 1 || areasForImprovement.length > 0) && (
              <Pressable onPress={handleExpand} style={styles.moreDetailsButton}>
                <Text 
                  variant="labelMedium" 
                  style={[styles.moreDetailsText, { color: theme.colors.primary }]}
                >
                  More details
                </Text>
                <IconButton
                  icon={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  onPress={handleExpand}
                  testID={`${testID}-expand`}
                  style={styles.moreDetailsIcon}
                />
              </Pressable>
            )}
          </View>



          {expanded && (positiveSigns.length > 1 || areasForImprovement.length > 0) && (
            <View style={styles.analysisContainer}>
              {positiveSigns.length > 1 && (
                <View style={styles.signSection}>
                  <Text variant="labelMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Additional Positive Signs
                  </Text>
                  <View style={styles.chipContainer}>
                    {positiveSigns.slice(1).map((sign, index) => (
                      <GSChip key={index} label={sign} variant="success" />
                    ))}
                  </View>
                </View>
              )}
              
              {areasForImprovement.length > 0 && (
                <View style={[styles.signSection, positiveSigns.length > 1 && { marginTop: 12 }]}>
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
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
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
    fontWeight: '600',
    flex: 1,
  },
  firstSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  firstSignText: {
    lineHeight: 16,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  stageBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageBottomText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreDetailsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreDetailsIcon: {
    margin: 0,
    marginLeft: -4,
  },
  analysisContainer: {
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
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