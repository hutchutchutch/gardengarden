import React, { useState, useRef } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

export interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}

interface GSFABProps {
  icon: string;
  onPress?: () => void;
  actions?: FABAction[];
  visible?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export const GSFAB: React.FC<GSFABProps> = ({
  icon,
  onPress,
  actions = [],
  visible = true,
  isLoading = false,
  testID = 'gs-fab',
}) => {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  if (isLoading) {
    return (
      <View style={styles.fab}>
        <ShimmerPlaceholder 
          width={56} 
          height={56} 
          borderRadius={28}
        />
      </View>
    );
  }

  const toggleMenu = () => {
    const toValue = open ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 30,
      friction: 7,
    }).start();
    
    setOpen(!open);
  };

  const handleMainPress = () => {
    if (actions.length > 0) {
      toggleMenu();
    } else if (onPress) {
      onPress();
    }
  };

  const handleActionPress = (action: FABAction) => {
    toggleMenu();
    action.onPress();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  if (!visible) return null;

  if (actions.length === 0) {
    return (
      <FAB
        icon={icon}
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary },
        ]}
        color={theme.colors.onPrimary}
        onPress={onPress}
        visible={visible}
        testID={testID}
      />
    );
  }

  return (
    <Portal>
      <FAB.Group
        open={open}
        icon={open ? 'close' : icon}
        actions={actions.map((action) => ({
          ...action,
          testID: action.testID || `${testID}-action-${action.icon}`,
          onPress: () => handleActionPress(action),
        }))}
        onStateChange={({ open }) => setOpen(open)}
        onPress={handleMainPress}
        visible={visible}
        fabStyle={[
          styles.fab,
          { 
            backgroundColor: open 
              ? theme.colors.secondaryContainer 
              : theme.colors.primary,
          },
        ]}
        color={open ? theme.colors.onSecondaryContainer : theme.colors.onPrimary}
        backdropColor="rgba(0, 0, 0, 0.5)"
        testID={testID}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 