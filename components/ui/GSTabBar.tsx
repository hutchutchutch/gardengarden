import React from 'react';
import { BottomNavigation, Badge, Icon } from 'react-native-paper';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../config/theme';

export interface GSTabBarRoute {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon?: string;
  badge?: number | boolean;
}

interface GSTabBarProps {
  routes: GSTabBarRoute[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  testID?: string;
}

export const GSTabBar: React.FC<GSTabBarProps> = ({
  routes,
  activeIndex,
  onIndexChange,
  testID = 'gs-tab-bar',
}) => {
  const theme = useAppTheme();
  const [animatedValues] = React.useState(
    routes.map(() => new Animated.Value(0))
  );

  React.useEffect(() => {
    animatedValues.forEach((value, index) => {
      Animated.spring(value, {
        toValue: index === activeIndex ? 1 : 0,
        useNativeDriver: true,
        tension: 30,
        friction: 7,
      }).start();
    });
  }, [activeIndex, animatedValues]);

  const renderIcon = ({ route, focused, color }: any) => {
    const index = routes.findIndex((r) => r.key === route.key);
    const scale = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const translateY = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, -2],
    });

    return (
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <Icon
          source={focused ? route.focusedIcon : (route.unfocusedIcon || route.focusedIcon)}
          color={color}
          size={24}
        />
        {route.badge !== undefined && (
          <Badge
            visible={route.badge !== false && route.badge !== 0}
            size={16}
            style={[
              styles.badge,
              { 
                backgroundColor: theme.colors.secondary,
                color: theme.colors.onSecondary,
              },
            ]}
            testID={`${testID}-badge-${route.key}`}
          >
            {typeof route.badge === 'number' ? (route.badge > 99 ? '99+' : route.badge) : ''}
          </Badge>
        )}
      </Animated.View>
    );
  };

  return (
    <BottomNavigation
      navigationState={{ index: activeIndex, routes }}
      onIndexChange={onIndexChange}
      renderScene={() => null}
      renderIcon={renderIcon}
      labeled={true}
      shifting={false}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={{
        backgroundColor: theme.colors.surface,
        elevation: theme.elevation.level2,
        ...styles.bar,
      }}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingBottom: 0,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
  },
}); 