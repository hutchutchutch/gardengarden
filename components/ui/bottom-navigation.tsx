import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './text';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomNavigationItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  className?: string;
  testID?: string;
}

interface BottomNavigationIconProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomNavigationLabelProps {
  children: React.ReactNode;
  className?: string;
}

const BottomNavigation = React.forwardRef<
  React.ElementRef<typeof View>,
  BottomNavigationProps
>(({ children, className, ...props }, ref) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      ref={ref}
      className={cn(
        'flex-row bg-background border-t border-border',
        Platform.OS === 'ios' && 'pb-safe',
        className
      )}
      style={{
        paddingBottom: Platform.OS === 'android' ? insets.bottom : undefined,
      }}
      {...props}
    >
      {children}
    </View>
  );
});

const BottomNavigationItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  BottomNavigationItemProps
>(({ children, onPress, isActive = false, className, ...props }, ref) => (
  <Pressable
    ref={ref}
    onPress={onPress}
    className={cn(
      'flex-1 items-center justify-center py-2 px-1 min-h-[64px]',
      'active:bg-accent/50',
      Platform.OS === 'web' && 'hover:bg-accent/30',
      className
    )}
    {...props}
  >
    {children}
  </Pressable>
));

const BottomNavigationIcon = React.forwardRef<
  React.ElementRef<typeof View>,
  BottomNavigationIconProps
>(({ children, className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn('items-center justify-center mb-1', className)}
    {...props}
  >
    {children}
  </View>
));

const BottomNavigationLabel = React.forwardRef<
  React.ElementRef<typeof Text>,
  BottomNavigationLabelProps
>(({ children, className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      'text-xs text-center',
      'native:text-sm',
      className
    )}
    {...props}
  >
    {children}
  </Text>
));

BottomNavigation.displayName = 'BottomNavigation';
BottomNavigationItem.displayName = 'BottomNavigationItem';
BottomNavigationIcon.displayName = 'BottomNavigationIcon';
BottomNavigationLabel.displayName = 'BottomNavigationLabel';

export {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationIcon,
  BottomNavigationLabel,
}; 