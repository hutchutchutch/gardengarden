import React from 'react';
import { Card, Avatar, Text, IconButton } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { GSHealthBadge } from './GSHealthBadge';

interface GSStudentCardProps {
  name: string;
  avatar?: string;
  plantName?: string;
  healthScore: number;
  lastSubmission?: Date;
  onMessage?: () => void;
  onViewDetails?: () => void;
  onPress?: () => void;
  testID?: string;
}

export const GSStudentCard: React.FC<GSStudentCardProps> = ({
  name,
  avatar,
  plantName = 'Plant',
  healthScore,
  lastSubmission,
  onMessage,
  onViewDetails,
  onPress,
  testID = 'gs-student-card',
}) => {
  const theme = useAppTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSubmission = (date?: Date) => {
    if (!date) return 'No submissions yet';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Card.Content style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.avatarSection}>
            {avatar ? (
              <Avatar.Image
                size={48}
                source={{ uri: avatar }}
                testID={`${testID}-avatar`}
              />
            ) : (
              <Avatar.Text
                size={48}
                label={getInitials(name)}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{ color: theme.colors.onPrimaryContainer }}
                testID={`${testID}-avatar`}
              />
            )}
            <View style={styles.healthBadgeContainer}>
              <GSHealthBadge
                score={healthScore}
                size="small"
                showLabel={false}
                testID={`${testID}-health`}
              />
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text 
              variant="titleMedium" 
              style={[styles.name, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text 
              variant="bodySmall" 
              style={[styles.plantName, { color: theme.colors.textLight }]}
            >
              {plantName} • {formatLastSubmission(lastSubmission)}
            </Text>
          </View>

          <View style={styles.actionSection}>
            {onMessage && (
              <IconButton
                icon="message"
                size={20}
                onPress={onMessage}
                style={styles.actionButton}
                testID={`${testID}-message`}
              />
            )}
            {onViewDetails && (
              <IconButton
                icon="chevron-right"
                size={20}
                onPress={onViewDetails}
                style={styles.actionButton}
                testID={`${testID}-details`}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
    borderWidth: 1,
  },
  content: {
    padding: 12,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  healthBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  plantName: {
    lineHeight: 16,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 4,
  },
}); 