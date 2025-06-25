import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/utils';

interface GSLoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export const GSLoadingSpinner = ({ 
  size = 'small', 
  color = '#3B82F6',
  className 
}: GSLoadingSpinnerProps) => {
  return (
    <View className={cn("items-center justify-center", className)}>
      <ActivityIndicator 
        size={size} 
        color={color}
      />
    </View>
  );
};