import React from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  children,
  className
}) => {
  return (
    <View className={cn(
      "flex-row items-center justify-between mb-3",
      className
    )}>
      <Text className="text-lg font-semibold">{title}</Text>
      {children && (
        <View className="flex-row items-center gap-2">
          {children}
        </View>
      )}
    </View>
  );
};