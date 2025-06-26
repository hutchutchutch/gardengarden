import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../config/theme';
import { Text } from './text';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

interface GSMilestoneProps {
  icon: string;
  title: string;
  description: string;
  date?: string;
  isLoading?: boolean;
  testID?: string;
}

export const GSMilestone: React.FC<GSMilestoneProps> = ({
  icon,
  title,
  description,
  date,
  isLoading = false,
  testID = 'gs-milestone',
}) => {
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ShimmerPlaceholder 
          width={32} 
          height={32} 
          borderRadius={16}
        />
        <View style={styles.content}>
          <ShimmerPlaceholder 
            width={80} 
            height={16} 
            borderRadius={4}
            style={{ marginBottom: 4 }}
          />
          <ShimmerPlaceholder 
            width={120} 
            height={14} 
            borderRadius={4}
          />
        </View>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: theme.colors.primaryContainer }
      ]}
      testID={testID}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: theme.colors.primary }
      ]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={theme.colors.onPrimary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: theme.colors.onPrimaryContainer }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.description,
          { color: theme.colors.onPrimaryContainer }
        ]}>
          {description}
        </Text>
        {date && (
          <Text style={[
            styles.date,
            { color: theme.colors.primary }
          ]}>
            {date}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});