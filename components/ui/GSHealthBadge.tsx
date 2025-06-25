import React from 'react';
import { Badge, Icon } from 'react-native-paper';
import { View, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

type BadgeSize = 'small' | 'medium' | 'large';

interface GSHealthBadgeProps {
  score: number; // 0-100
  size?: BadgeSize;
  showLabel?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export const GSHealthBadge: React.FC<GSHealthBadgeProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  isLoading = false,
  testID = 'gs-health-badge',
}) => {
  const theme = useAppTheme();

  if (isLoading) {
    const sizeMap = {
      small: { width: 60, height: 24 },
      medium: { width: 80, height: 32 },
      large: { width: 100, height: 40 },
    };
    
    const dimensions = sizeMap[size];
    
    return (
      <ShimmerPlaceholder 
        width={dimensions.width}
        height={dimensions.height}
        borderRadius={dimensions.height / 2}
      />
    );
  }

  const getHealthLevel = () => {
    if (score >= 80) return { level: 'excellent', icon: 'emoticon-happy', label: 'Thriving!' };
    if (score >= 60) return { level: 'good', icon: 'emoticon', label: 'Healthy' };
    if (score >= 40) return { level: 'fair', icon: 'emoticon-sad', label: 'Needs Care' };
    if (score >= 20) return { level: 'poor', icon: 'alert-circle', label: 'Struggling' };
    return { level: 'critical', icon: 'alert-circle', label: 'Critical' };
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { badgeSize: 24, iconSize: 16, fontSize: 10 };
      case 'medium':
        return { badgeSize: 32, iconSize: 20, fontSize: 12 };
      case 'large':
        return { badgeSize: 48, iconSize: 28, fontSize: 14 };
    }
  };

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return theme.colors.excellent;
      case 'good':
        return theme.colors.good;
      case 'fair':
        return theme.colors.fair;
      case 'poor':
        return theme.colors.poor;
      case 'critical':
        return theme.colors.critical;
      default:
        return theme.colors.gray;
    }
  };

  const health = getHealthLevel();
  const sizeStyles = getSizeStyles();
  const color = getHealthColor(health.level);

  return (
    <View style={styles.container} testID={testID}>
      <View
        style={[
          styles.badge,
          {
            width: sizeStyles.badgeSize,
            height: sizeStyles.badgeSize,
            backgroundColor: color,
            borderRadius: sizeStyles.badgeSize / 2,
          },
        ]}
      >
        <Icon
          source={health.icon}
          size={sizeStyles.iconSize}
          color="#FFFFFF"
        />
      </View>
      
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: sizeStyles.fontSize,
              color: color,
            },
          ]}
          testID={`${testID}-label`}
        >
          {health.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
}); 