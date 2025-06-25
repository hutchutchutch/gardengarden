import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './text';
import { cn } from '@/lib/utils';

interface GSSegmentedButtonsProps {
  options: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

export const GSSegmentedButtons = ({
  options,
  selectedIndex,
  onIndexChange,
  className
}: GSSegmentedButtonsProps) => {
  return (
    <View className={cn("flex-row bg-muted rounded-lg p-1", className)}>
      {options.map((option, index) => (
        <Pressable
          key={option}
          onPress={() => onIndexChange(index)}
          className={cn(
            "flex-1 py-2 items-center rounded-md",
            selectedIndex === index ? 'bg-background shadow-sm' : ''
          )}
        >
          <Text
            className={cn(
              "font-medium text-sm",
              selectedIndex === index ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};