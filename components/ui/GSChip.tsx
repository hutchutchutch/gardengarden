import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './text';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react-native';

interface GSChipProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'destructive';
  size?: 'small' | 'medium';
  onClose?: () => void;
  onPress?: () => void;
  className?: string;
}

export const GSChip: React.FC<GSChipProps> = ({
  label,
  variant = 'default',
  size = 'small',
  onClose,
  onPress,
  className
}) => {
  const variantStyles = {
    default: 'bg-secondary border-secondary-foreground/20',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    warning: 'bg-yellow-100 border-yellow-300',
    success: 'bg-green-100 border-green-300',
    destructive: 'bg-destructive',
  };

  const textStyles = {
    default: 'text-secondary-foreground',
    primary: 'text-primary-foreground',
    secondary: 'text-secondary-foreground',
    warning: 'text-yellow-900',
    success: 'text-green-900',
    destructive: 'text-destructive-foreground',
  };

  const sizeStyles = {
    small: 'px-2 py-1',
    medium: 'px-3 py-1.5',
  };

  const ChipContent = (
    <View className={cn(
      "flex-row items-center rounded-full border",
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      <Text className={cn(
        "text-xs",
        textStyles[variant],
        size === 'medium' && 'text-sm'
      )}>
        {label}
      </Text>
      {onClose && (
        <Pressable
          onPress={onClose}
          className="ml-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={12} className={textStyles[variant]} />
        </Pressable>
      )}
    </View>
  );

  if (onPress && !onClose) {
    return (
      <Pressable onPress={onPress}>
        {ChipContent}
      </Pressable>
    );
  }

  return ChipContent;
};