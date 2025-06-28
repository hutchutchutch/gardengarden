import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Custom font configuration following design system
const fontConfig = {
  fontFamily: 'Inter',
  web: {
    regular: {
      fontFamily: 'Inter, -apple-system, system-ui',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Inter, -apple-system, system-ui',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Inter, -apple-system, system-ui',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Inter, -apple-system, system-ui',
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'Inter',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Inter',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Inter',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Inter',
      fontWeight: '100' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'Inter',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Inter',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Inter',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Inter',
      fontWeight: '100' as const,
    },
  },
};

// Extended theme type with custom properties
export interface AppTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    brandPrimary: string;
    brandSecondary: string;
    excellent: string;
    good: string;
    fair: string;
    poor: string;
    critical: string;
    primaryLight: string;
    primaryDark: string;
    secondaryLight: string;
    secondaryDark: string;
    textLight: string;
    textHint: string;
    backgroundLight: string;
    gray: string;
    grayLight: string;
    // AI Chat Colors from design system
    aiPrimary: string;
    aiContainer: string;
    onAiPrimary: string;
    onAiContainer: string;
  };
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  elevation: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
}

// Light theme configuration
export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: 3, // multiplier for default border radius (4px * 3 = 12px)
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors from design system
    primary: '#4CAF50', // Growth Green
    primaryContainer: '#C8E6C9', // Light Sage
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1B5E20', // Midnight Forest
    
    // Secondary colors
    secondary: '#FF9800', // Harvest Orange
    secondaryContainer: '#FFE0B2', // Soft Amber
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#E65100', // Dark Amber
    
    // Tertiary colors
    tertiary: '#2196F3', // Info blue
    tertiaryContainer: '#BBDEFB',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#0D47A1',
    
    // Surface colors
    surface: '#FFFFFF', // Paper
    surfaceVariant: '#F5F5F5',
    onSurface: 'rgba(0, 0, 0, 0.87)', // text.primary
    onSurfaceVariant: 'rgba(0, 0, 0, 0.60)', // text.secondary
    surfaceDisabled: 'rgba(0, 0, 0, 0.12)',
    onSurfaceDisabled: 'rgba(0, 0, 0, 0.38)', // text.disabled
    
    // Background
    background: '#FAFAFA',
    onBackground: 'rgba(0, 0, 0, 0.87)',
    
    // Error colors
    error: '#F44336',
    errorContainer: '#FFEBEE',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    
    // Other colors
    outline: 'rgba(0, 0, 0, 0.12)',
    outlineVariant: 'rgba(0, 0, 0, 0.06)',
    inverseSurface: '#121212',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#81C784',
    scrim: 'rgba(0, 0, 0, 0.5)',
    shadow: '#000000',
    
    // Custom colors
    brandPrimary: '#4CAF50',
    brandSecondary: '#FF9800',
    excellent: '#4CAF50',
    good: '#8BC34A',
    fair: '#FFB74D',
    poor: '#FF7043',
    critical: '#F44336',
    primaryLight: '#C8E6C9',
    primaryDark: '#2E7D32',
    secondaryLight: '#FFE0B2',
    secondaryDark: '#F57C00',
    textLight: 'rgba(0, 0, 0, 0.60)',
    textHint: 'rgba(0, 0, 0, 0.38)',
    backgroundLight: '#F5F7FA',
    gray: '#9E9E9E',
    grayLight: '#EEEEEE',
    // AI Chat Colors from design system
    aiPrimary: '#7C3AED', // Deep Purple for AI emphasized elements
    aiContainer: '#A78BFA', // Gentle Purple for AI chat bubbles
    onAiPrimary: '#FFFFFF',
    onAiContainer: '#FFFFFF',
  },
  // Custom properties
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  elevation: {
    level0: 0,
    level1: 1,
    level2: 2,
    level3: 4,
    level4: 8,
    level5: 12,
  },
};

// Dark theme configuration
export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  roundness: 3,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: '#81C784', // Fresh Sage for dark mode
    primaryContainer: '#2E7D32',
    onPrimary: '#1B5E20',
    onPrimaryContainer: '#C8E6C9',
    
    // Secondary colors
    secondary: '#FFB74D', // Warm Amber for dark mode
    secondaryContainer: '#F57C00',
    onSecondary: '#E65100',
    onSecondaryContainer: '#FFE0B2',
    
    // Tertiary colors
    tertiary: '#64B5F6',
    tertiaryContainer: '#1976D2',
    onTertiary: '#0D47A1',
    onTertiaryContainer: '#BBDEFB',
    
    // Surface colors
    surface: '#1E1E1E',
    surfaceVariant: '#252525',
    onSurface: 'rgba(255, 255, 255, 0.87)',
    onSurfaceVariant: 'rgba(255, 255, 255, 0.60)',
    surfaceDisabled: 'rgba(255, 255, 255, 0.12)',
    onSurfaceDisabled: 'rgba(255, 255, 255, 0.38)',
    
    // Background
    background: '#121212',
    onBackground: 'rgba(255, 255, 255, 0.87)',
    
    // Error colors
    error: '#EF5350',
    errorContainer: '#D32F2F',
    onError: '#000000',
    onErrorContainer: '#FFCDD2',
    
    // Other colors
    outline: 'rgba(255, 255, 255, 0.12)',
    outlineVariant: 'rgba(255, 255, 255, 0.06)',
    inverseSurface: '#FAFAFA',
    inverseOnSurface: '#121212',
    inversePrimary: '#388E3C',
    scrim: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000',
    
    // Custom colors
    brandPrimary: '#81C784',
    brandSecondary: '#FFB74D',
    excellent: '#66BB6A',
    good: '#9CCC65',
    fair: '#FFCC80',
    poor: '#FF8A65',
    critical: '#EF5350',
    primaryLight: '#81C784',
    primaryDark: '#388E3C',
    secondaryLight: '#FFCC80',
    secondaryDark: '#FF8A65',
    textLight: 'rgba(255, 255, 255, 0.60)',
    textHint: 'rgba(255, 255, 255, 0.38)',
    backgroundLight: '#252525',
    gray: '#757575',
    grayLight: '#424242',
    // AI Chat Colors from design system
    aiPrimary: '#8B5CF6', // Active Purple for dark mode
    aiContainer: '#6D28D9', // Bold Purple for dark mode
    onAiPrimary: '#FFFFFF',
    onAiContainer: '#FFFFFF',
  },
  // Custom properties (same as light theme)
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  elevation: {
    level0: 0,
    level1: 1,
    level2: 2,
    level3: 4,
    level4: 8,
    level5: 12,
  },
};

// Export a hook to use the theme with TypeScript support
import { useTheme as useRNPTheme } from 'react-native-paper';

export const useAppTheme = () => useRNPTheme<AppTheme>(); 