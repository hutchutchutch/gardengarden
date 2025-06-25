import React from 'react';
import { Text, Icon } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { GSButton } from './GSButton';

interface GSEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export const GSEmptyState: React.FC<GSEmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  testID = 'gs-empty-state',
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.container} testID={testID}>
      <View 
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Icon
          source={icon}
          size={48}
          color={theme.colors.onSurfaceVariant}
        />
      </View>

      <Text 
        variant="titleLarge" 
        style={[
          styles.title,
          { color: theme.colors.onSurface },
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text 
          variant="bodyMedium" 
          style={[
            styles.description,
            { color: theme.colors.textLight },
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <GSButton
            variant="primary"
            onPress={onAction}
            testID={`${testID}-action`}
          >
            {actionLabel}
          </GSButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: 24,
  },
}); 