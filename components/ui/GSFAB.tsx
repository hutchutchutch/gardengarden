import React, { useState, useRef } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

export interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}

export type { FABVariant, FABSize, FABPosition };

type FABVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type FABSize = 'small' | 'medium' | 'large';
type FABPosition = 'bottom-right' | 'bottom-left' | 'bottom-center';

interface GSFABProps {
  icon: string;
  onPress?: () => void;
  actions?: FABAction[];
  visible?: boolean;
  isLoading?: boolean;
  variant?: FABVariant;
  size?: FABSize;
  position?: FABPosition;
  label?: string;
  elevation?: number;
  offsetBottom?: number; // Additional offset from bottom (default: 24px above tab bar)
  testID?: string;
}

export const GSFAB: React.FC<GSFABProps> = ({
  icon,
  onPress,
  actions = [],
  visible = true,
  isLoading = false,
  variant = 'primary',
  size = 'medium',
  position = 'bottom-right',
  label,
  elevation = 6,
  offsetBottom,
  testID = 'gs-fab',
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  // Get variant-specific colors
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          iconColor: theme.colors.onPrimary,
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          iconColor: theme.colors.onSecondary,
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'success':
        return {
          backgroundColor: theme.colors.excellent,
          iconColor: '#FFFFFF',
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'warning':
        return {
          backgroundColor: '#FF9500',
          iconColor: '#FFFFFF',
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          iconColor: theme.colors.onError,
          rippleColor: 'rgba(255, 255, 255, 0.32)',
        };
    }
  };

  // Get size-specific dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, borderRadius: 20 };
      case 'medium':
        return { width: 56, height: 56, borderRadius: 28 };
      case 'large':
        return { width: 72, height: 72, borderRadius: 36 };
    }
  };

  // Get position-specific styles with dynamic bottom positioning
  const getPositionStyles = () => {
          // Calculate bottom offset: 16px above bottom navigation (56px) + safe area + custom offset
      const tabBarHeight = 56;
      const defaultOffset = 16;
      const totalBottomOffset = tabBarHeight + defaultOffset + insets.bottom + (offsetBottom || 0);
    
    const base = { position: 'absolute' as const, margin: 16 };
    switch (position) {
      case 'bottom-right':
        return { ...base, right: 0, bottom: totalBottomOffset };
      case 'bottom-left':
        return { ...base, left: 0, bottom: totalBottomOffset };
      case 'bottom-center':
        return { ...base, alignSelf: 'center' as const, bottom: totalBottomOffset };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();

  if (isLoading) {
    return (
      <View style={[positionStyles, sizeStyles]}>
        <ShimmerPlaceholder 
          width={sizeStyles.width} 
          height={sizeStyles.height} 
          borderRadius={sizeStyles.borderRadius}
        />
      </View>
    );
  }

  const toggleMenu = () => {
    const toValue = open ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 30,
      friction: 7,
    }).start();
    
    setOpen(!open);
  };

  const handleMainPress = () => {
    if (actions.length > 0) {
      toggleMenu();
    } else if (onPress) {
      onPress();
    }
  };

  const handleActionPress = (action: FABAction) => {
    toggleMenu();
    action.onPress();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  if (!visible) return null;

  if (actions.length === 0) {
    return (
      <FAB
        icon={icon}
        label={label}
        style={[
          positionStyles,
          sizeStyles,
          { 
            backgroundColor: variantColors.backgroundColor,
            elevation: elevation,
          },
        ]}
        color={variantColors.iconColor}
        rippleColor={variantColors.rippleColor}
        onPress={onPress}
        visible={visible}
        testID={testID}
      />
    );
  }

  return (
    <Portal>
      <FAB.Group
        open={open}
        icon={open ? 'close' : icon}
        actions={actions.map((action) => ({
          ...action,
          testID: action.testID || `${testID}-action-${action.icon}`,
          onPress: () => handleActionPress(action),
        }))}
        onStateChange={({ open }) => setOpen(open)}
        onPress={handleMainPress}
        visible={visible}
        fabStyle={[
          positionStyles,
          sizeStyles,
          { 
            backgroundColor: open 
              ? theme.colors.secondaryContainer 
              : variantColors.backgroundColor,
            elevation: elevation,
          },
        ]}
        label={label}
        color={open ? theme.colors.onSecondaryContainer : variantColors.iconColor}
        backdropColor="rgba(0, 0, 0, 0.5)"
        testID={testID}
      />
    </Portal>
  );
};

// No longer need static styles since everything is dynamic now 