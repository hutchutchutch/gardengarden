import React from 'react';
import { Snackbar, Portal } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/config/theme';

export interface GSSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function GSSnackbar({
  visible,
  onDismiss,
  message,
  action,
  duration = 7000,
  variant = 'info'
}: GSSnackbarProps) {
  const theme = useAppTheme();

  const getVariantTheme = () => {
    switch (variant) {
      case 'success':
        return {
          colors: {
            ...theme.colors,
            surface: theme.colors.primary,
            onSurface: theme.colors.onPrimary,
            inverseSurface: theme.colors.primary,
            inverseOnSurface: theme.colors.onPrimary,
          }
        };
      case 'warning':
        return {
          colors: {
            ...theme.colors,
            surface: '#FF9800',
            onSurface: '#FFFFFF',
            inverseSurface: '#FF9800',
            inverseOnSurface: '#FFFFFF',
          }
        };
      case 'error':
        return {
          colors: {
            ...theme.colors,
            surface: theme.colors.error,
            onSurface: theme.colors.onError,
            inverseSurface: theme.colors.error,
            inverseOnSurface: theme.colors.onError,
          }
        };
      default:
        return {
          colors: {
            ...theme.colors,
            surface: theme.colors.surfaceVariant,
            onSurface: theme.colors.onSurfaceVariant,
            inverseSurface: theme.colors.surfaceVariant,
            inverseOnSurface: theme.colors.onSurfaceVariant,
          }
        };
    }
  };

  const variantTheme = getVariantTheme();

  return (
    <Portal>
      <View style={styles.container}>
        <Snackbar
          visible={visible}
          onDismiss={onDismiss}
          duration={duration}
          action={action}
          style={styles.snackbar}
          theme={variantTheme}
        >
          {message}
        </Snackbar>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  snackbar: {
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 8,
  },
}); 