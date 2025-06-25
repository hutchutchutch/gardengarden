import React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

interface BottomNavigationProps {
  children: React.ReactNode;
  style?: any;
}

interface BottomNavigationItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  style?: any;
  testID?: string;
}

interface BottomNavigationIconProps {
  children: React.ReactNode;
  style?: any;
}

interface BottomNavigationLabelProps {
  children: React.ReactNode;
  style?: any;
}

const BottomNavigation = React.forwardRef<
  React.ElementRef<typeof View>,
  BottomNavigationProps
>(({ children, style, ...props }, ref) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      ref={ref}
      style={[
        styles.bottomNavigation,
        Platform.OS === 'ios' && { paddingBottom: insets.bottom },
        Platform.OS === 'android' && { paddingBottom: insets.bottom },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
});

const BottomNavigationItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  BottomNavigationItemProps
>(({ children, onPress, isActive = false, style, ...props }, ref) => (
  <Pressable
    ref={ref}
    onPress={onPress}
    style={({ pressed }) => [
      styles.bottomNavigationItem,
      pressed && styles.bottomNavigationItemPressed,
      style
    ]}
    {...props}
  >
    {children}
  </Pressable>
));

const BottomNavigationIcon = React.forwardRef<
  React.ElementRef<typeof View>,
  BottomNavigationIconProps
>(({ children, style, ...props }, ref) => (
  <View
    ref={ref}
    style={[styles.bottomNavigationIcon, style]}
    {...props}
  >
    {children}
  </View>
));

const BottomNavigationLabel = React.forwardRef<
  React.ElementRef<typeof View>,
  BottomNavigationLabelProps
>(({ children, style, ...props }, ref) => (
  <View ref={ref} {...props}>
    <Text 
      variant="labelSmall" 
      style={[
        styles.label,
        style
      ]}
    >
      {children}
    </Text>
  </View>
));

BottomNavigation.displayName = 'BottomNavigation';
BottomNavigationItem.displayName = 'BottomNavigationItem';
BottomNavigationIcon.displayName = 'BottomNavigationIcon';
BottomNavigationLabel.displayName = 'BottomNavigationLabel';

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomNavigationItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 64,
  },
  bottomNavigationItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  bottomNavigationIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bottomNavigationLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationIcon,
  BottomNavigationLabel,
}; 