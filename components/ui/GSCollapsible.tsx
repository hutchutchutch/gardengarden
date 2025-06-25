import React, { useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Text } from './text';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface GSCollapsibleProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const GSCollapsible: React.FC<GSCollapsibleProps> = ({
  label,
  children,
  defaultOpen = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [animation] = useState(new Animated.Value(defaultOpen ? 1 : 0));

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    Animated.timing(animation, {
      toValue: isOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View className={cn("", className)}>
      <Pressable
        onPress={toggleOpen}
        className="flex-row items-center justify-between py-2"
      >
        <Text className="text-sm font-medium">{label}</Text>
        {isOpen ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </Pressable>
      <Animated.View
        style={{
          maxHeight: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
          opacity: animation,
          overflow: 'hidden',
        }}
      >
        <View className="pb-2">
          {children}
        </View>
      </Animated.View>
    </View>
  );
};