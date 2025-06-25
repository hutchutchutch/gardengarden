import React from 'react';
import { ProgressBar, Text, ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../config/theme';

type ProgressType = 'circular' | 'linear';

interface GSProgressIndicatorProps {
  type?: ProgressType;
  progress?: number; // 0 to 1
  indeterminate?: boolean;
  label?: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  testID?: string;
}

export const GSProgressIndicator: React.FC<GSProgressIndicatorProps> = ({
  type = 'linear',
  progress = 0,
  indeterminate = false,
  label,
  showPercentage = true,
  size = 'medium',
  color,
  testID = 'gs-progress-indicator',
}) => {
  const theme = useAppTheme();
  const finalColor = color || theme.colors.primary;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 4, circularSize: 24, fontSize: 12 };
      case 'medium':
        return { height: 6, circularSize: 36, fontSize: 14 };
      case 'large':
        return { height: 8, circularSize: 48, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();
  const percentage = Math.round(progress * 100);

  if (type === 'circular') {
    return (
      <View style={styles.circularContainer} testID={testID}>
        {label && (
          <Text 
            variant="labelMedium" 
            style={[
              styles.label, 
              { color: theme.colors.onSurfaceVariant, fontSize: sizeStyles.fontSize }
            ]}
          >
            {label}
          </Text>
        )}
        
        <View style={styles.circularContent}>
          {indeterminate ? (
            <ActivityIndicator
              animating
              color={finalColor}
              size={sizeStyles.circularSize}
              testID={`${testID}-spinner`}
            />
          ) : (
            <View style={[styles.circularProgress, { width: sizeStyles.circularSize, height: sizeStyles.circularSize }]}>
              <CircularProgress
                size={sizeStyles.circularSize}
                progress={progress}
                color={finalColor}
                backgroundColor={theme.colors.surfaceVariant}
                strokeWidth={size === 'small' ? 2 : size === 'medium' ? 3 : 4}
              />
              {showPercentage && (
                <View style={styles.percentageContainer}>
                  <Text 
                    variant="labelSmall" 
                    style={[
                      styles.percentageText,
                      { color: theme.colors.onSurface, fontSize: sizeStyles.fontSize - 2 }
                    ]}
                  >
                    {percentage}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.linearContainer} testID={testID}>
      {(label || showPercentage) && (
        <View style={styles.linearHeader}>
          {label && (
            <Text 
              variant="labelMedium" 
              style={[
                styles.label, 
                { color: theme.colors.onSurfaceVariant, fontSize: sizeStyles.fontSize }
              ]}
            >
              {label}
            </Text>
          )}
          {showPercentage && !indeterminate && (
            <Text 
              variant="labelSmall" 
              style={[
                styles.percentageText,
                { color: theme.colors.onSurfaceVariant, fontSize: sizeStyles.fontSize - 2 }
              ]}
            >
              {percentage}%
            </Text>
          )}
        </View>
      )}
      
      <ProgressBar
        progress={indeterminate ? undefined : progress}
        indeterminate={indeterminate}
        color={finalColor}
        style={[
          styles.linearProgress,
          { 
            height: sizeStyles.height,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: sizeStyles.height / 2,
          }
        ]}
        testID={`${testID}-bar`}
      />
    </View>
  );
};

// Custom circular progress component
const CircularProgress: React.FC<{
  size: number;
  progress: number;
  color: string;
  backgroundColor: string;
  strokeWidth: number;
}> = ({ size, progress, color, backgroundColor, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

// Placeholder imports for SVG (requires react-native-svg)
const Svg = View as any;
const Circle = View as any;

const styles = StyleSheet.create({
  circularContainer: {
    alignItems: 'center',
  },
  circularContent: {
    marginTop: 8,
  },
  circularProgress: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  linearContainer: {
    width: '100%',
  },
  linearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linearProgress: {
    overflow: 'hidden',
  },
  label: {
    letterSpacing: 0.15,
  },
  percentageText: {
    fontWeight: '500',
  },
}); 