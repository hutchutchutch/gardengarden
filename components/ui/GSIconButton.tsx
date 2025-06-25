import React from 'react';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '../../config/theme';

interface GSIconButtonProps {
  icon: string;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  mode?: 'outlined' | 'contained' | 'contained-tonal';
  selected?: boolean;
  animated?: boolean;
  testID?: string;
}

export const GSIconButton: React.FC<GSIconButtonProps> = ({
  icon,
  onPress,
  size = 24,
  color,
  disabled = false,
  mode,
  selected = false,
  animated = true,
  testID = 'gs-icon-button',
}) => {
  const theme = useAppTheme();

  const getColor = () => {
    if (disabled) return theme.colors.onSurfaceDisabled;
    if (color) return color;
    if (selected) return theme.colors.primary;
    return theme.colors.onSurfaceVariant;
  };

  const getBackgroundColor = () => {
    if (!mode) return undefined;
    
    switch (mode) {
      case 'contained':
        return selected ? theme.colors.primary : theme.colors.surface;
      case 'contained-tonal':
        return selected 
          ? theme.colors.primaryContainer 
          : theme.colors.surfaceVariant;
      case 'outlined':
        return 'transparent';
      default:
        return undefined;
    }
  };

  const getRippleColor = () => {
    if (mode === 'contained' && selected) {
      return 'rgba(255, 255, 255, 0.32)';
    }
    return theme.colors.primary + '20'; // 20% opacity
  };

  return (
    <IconButton
      icon={icon}
      iconColor={getColor()}
      size={size}
      onPress={onPress}
      disabled={disabled}
      mode={mode}
      selected={selected}
      animated={animated}
      style={mode ? {
        backgroundColor: getBackgroundColor(),
        borderColor: mode === 'outlined' 
          ? (selected ? theme.colors.primary : theme.colors.outline) 
          : undefined,
        borderWidth: mode === 'outlined' ? 1 : 0,
      } : undefined}
      rippleColor={getRippleColor()}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
    />
  );
}; 