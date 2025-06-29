import React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

export interface GSCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  isLoading?: boolean;
  shimmerHeight?: number;
  style?: ViewStyle;
  testID?: string;
}

export const GSCard: React.FC<GSCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  margin = 'small',
  onPress,
  isLoading = false,
  shimmerHeight = 200,
  style,
  testID = 'gs-card',
}) => {
  const theme = useAppTheme();

  // Safely render children, wrapping strings in Text components
  const renderSafeChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return <Text>{child}</Text>;
      }
      return child;
    });
  };

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return theme.spacing.sm;
      case 'medium': return theme.spacing.md;
      case 'large': return theme.spacing.lg;
      default: return theme.spacing.md;
    }
  };

  const getMargin = () => {
    switch (margin) {
      case 'none': return 0;
      case 'small': return theme.spacing.xs;
      case 'medium': return theme.spacing.sm;
      case 'large': return theme.spacing.md;
      default: return theme.spacing.xs;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: theme.elevation.level1,
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surfaceVariant,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: theme.elevation.level1,
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
        };
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: theme.borderRadius.md,
    padding: getPadding(),
    marginHorizontal: theme.spacing.xxs,
    marginVertical: getMargin(),
    ...getVariantStyles(),
    ...style,
  };

  if (isLoading) {
    return (
      <View style={cardStyle}>
        <ShimmerPlaceholder 
          width="100%" 
          height={shimmerHeight} 
          borderRadius={theme.borderRadius.sm}
        />
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
        ]}
        testID={testID}
      >
        {renderSafeChildren(children)}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {renderSafeChildren(children)}
    </View>
  );
}; 