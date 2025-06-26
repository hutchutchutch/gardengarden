import React from 'react';
import { Button, ActivityIndicator } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

interface GSButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export const GSButton: React.FC<GSButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  isLoading = false,
  testID = 'gs-button',
}) => {
  const theme = useAppTheme();

  if (isLoading) {
    const sizeMap = {
      small: { width: 80, height: 32 },
      medium: { width: 100, height: 40 },
      large: { width: 120, height: 48 },
    };
    
    const dimensions = sizeMap[size];
    
    return (
      <ShimmerPlaceholder 
        width={fullWidth ? '100%' : dimensions.width}
        height={dimensions.height}
        borderRadius={8}
      />
    );
  }

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          textColor: theme.colors.onPrimary,
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'secondary':
        return {
          backgroundColor: '#64B5F6',
          textColor: '#FFFFFF',
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          textColor: theme.colors.onError,
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'success':
        return {
          backgroundColor: theme.colors.excellent,
          textColor: '#FFFFFF',
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 32,
          paddingHorizontal: 16,
          fontSize: 14,
        };
      case 'medium':
        return {
          height: 40,
          paddingHorizontal: 24,
          fontSize: 16,
        };
      case 'large':
        return {
          height: 48,
          paddingHorizontal: 32,
          fontSize: 18,
        };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled || loading}
      icon={loading ? () => (
        <ActivityIndicator
          animating
          color={variantColors.textColor}
          size={sizeStyles.fontSize}
        />
      ) : icon}
      style={[
        styles.button,
        {
          backgroundColor: disabled
            ? theme.colors.surfaceDisabled
            : variantColors.backgroundColor,
          height: sizeStyles.height,
          width: fullWidth ? '100%' : undefined,
        },
      ]}
      contentStyle={[
        styles.content,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
      ]}
      labelStyle={[
        styles.label,
        {
          fontSize: sizeStyles.fontSize,
          color: disabled
            ? theme.colors.onSurfaceDisabled
            : variantColors.textColor,
        },
      ]}
      rippleColor={variantColors.rippleColor}
      uppercase={false}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading && !icon ? '' : children}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
  },
  label: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
}); 