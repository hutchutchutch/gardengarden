import React from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { cn } from '@/lib/utils';

interface GSBadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const GSBadge: React.FC<GSBadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  className
}) => {
  const variantStyles = {
    default: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-border bg-background text-foreground',
  };

  const sizeStyles = {
    small: 'px-2 py-0.5',
    medium: 'px-2.5 py-1',
    large: 'px-3 py-1.5',
  };

  const textSizeStyles = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <View className={cn(
      "rounded-full items-center justify-center",
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      <Text className={cn(
        "font-medium",
        textSizeStyles[size],
        variant === 'outline' ? 'text-foreground' : ''
      )}>
        {label}
      </Text>
    </View>
  );
};