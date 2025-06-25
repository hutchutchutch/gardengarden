import React from 'react';
import { Card, Switch, Text, Chip } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

interface GSLessonCardProps {
  title: string;
  description?: string;
  urlCount: number;
  studentCount: number;
  completionRate?: number;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  onPress?: () => void;
  isLoading?: boolean;
  testID?: string;
}

export const GSLessonCard: React.FC<GSLessonCardProps> = ({
  title,
  description,
  urlCount,
  studentCount,
  completionRate = 0,
  isActive,
  onToggleActive,
  onPress,
  isLoading = false,
  testID = 'gs-lesson-card',
}) => {
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
            borderWidth: 1,
          },
        ]}
      >
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <ShimmerPlaceholder width={180} height={20} borderRadius={4} />
            </View>
            <ShimmerPlaceholder width={48} height={24} borderRadius={12} />
          </View>
          
          <ShimmerPlaceholder width={120} height={16} borderRadius={4} style={{ marginBottom: 16 }} />
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <ShimmerPlaceholder width={60} height={40} borderRadius={4} />
            </View>
            <View style={[styles.stat, styles.statDivider]}>
              <ShimmerPlaceholder width={60} height={40} borderRadius={4} />
            </View>
            <View style={[styles.stat, styles.statDivider]}>
              <ShimmerPlaceholder width={60} height={40} borderRadius={4} />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isActive ? theme.colors.primary : theme.colors.outline,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text 
              variant="titleMedium" 
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isActive && (
              <Chip
                mode="flat"
                compact
                style={[
                  styles.activeBadge,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
                textStyle={{ 
                  color: theme.colors.onPrimaryContainer,
                  fontSize: 12,
                }}
                testID={`${testID}-active-badge`}
              >
                Active
              </Chip>
            )}
          </View>
          <Switch
            value={isActive}
            onValueChange={onToggleActive}
            color={theme.colors.primary}
            testID={`${testID}-toggle`}
          />
        </View>

        {description && (
          <Text 
            variant="bodyMedium" 
            style={[styles.description, { color: theme.colors.textLight }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text 
              variant="bodySmall" 
              style={[styles.statLabel, { color: theme.colors.textHint }]}
            >
              URLs
            </Text>
            <Text 
              variant="titleSmall" 
              style={[styles.statValue, { color: theme.colors.onSurface }]}
            >
              {urlCount}
            </Text>
          </View>

          <View style={[styles.stat, styles.statDivider]}>
            <Text 
              variant="bodySmall" 
              style={[styles.statLabel, { color: theme.colors.textHint }]}
            >
              Students
            </Text>
            <Text 
              variant="titleSmall" 
              style={[styles.statValue, { color: theme.colors.onSurface }]}
            >
              {studentCount}
            </Text>
          </View>

          <View style={[styles.stat, styles.statDivider]}>
            <Text 
              variant="bodySmall" 
              style={[styles.statLabel, { color: theme.colors.textHint }]}
            >
              Progress
            </Text>
            <Text 
              variant="titleSmall" 
              style={[
                styles.statValue, 
                { 
                  color: completionRate >= 80 
                    ? theme.colors.excellent 
                    : completionRate >= 50 
                      ? theme.colors.good 
                      : theme.colors.fair 
                },
              ]}
            >
              {Math.round(completionRate)}%
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
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
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontWeight: '600',
  },
  activeBadge: {
    marginLeft: 8,
    height: 24,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.08)',
  },
  statLabel: {
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  statValue: {
    fontWeight: '600',
  },
}); 