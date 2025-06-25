import React, { useState, useEffect } from 'react';
import { Pressable, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface GSCheckboxProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  animated?: boolean;
  disabled?: boolean;
  className?: string;
}

export const GSCheckbox: React.FC<GSCheckboxProps> = ({
  checked,
  onCheckedChange,
  animated = true,
  disabled = false,
  className
}) => {
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [fadeAnimation] = useState(new Animated.Value(checked ? 1 : 0));

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: checked ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: checked ? 1.2 : 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      fadeAnimation.setValue(checked ? 1 : 0);
    }
  }, [checked, animated]);

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        "items-center justify-center",
        className
      )}
    >
      <Animated.View
        style={{ transform: [{ scale: scaleAnimation }] }}
        className={cn(
          "w-5 h-5 rounded border-2 items-center justify-center",
          checked ? "bg-primary border-primary" : "bg-background border-border",
          disabled && "opacity-50"
        )}
      >
        <Animated.View style={{ opacity: fadeAnimation }}>
          <Check size={14} color="white" strokeWidth={3} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};