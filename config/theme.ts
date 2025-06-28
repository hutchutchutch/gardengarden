import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { DESIGN_TOKENS, SYSTEM_COLORS } from '@/constants/colors';
import colors from '@/constants/colors';

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

// Extended theme type with minimal custom properties
export interface AppTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    // Minimal design tokens (imported from constants/colors.ts)
    background: string;
    muted: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    
    // Legacy support for gradual migration
    textLight: string;
    backgroundLight: string;
    
    // Health/status colors (mapped to minimal tokens)
    excellent: string;
    good: string;
    fair: string;
    poor: string;
    critical: string;
    gray: string;
    textHint: string;
    
    // Legacy AI colors (mapped to minimal tokens)
    aiPrimary: string;
    onAiPrimary: string;
    brandSecondary: string;
  };
  spacing: {
    xxs: number;  // 4px
    xs: number;   // 6px  
    sm: number;   // 8px - tight spacing
    md: number;   // 16px - default spacing  
    lg: number;   // 24px - section spacing
    xl: number;   // 32px - major spacing
  };
  borderRadius: {
    xs: number;   // 4px
    sm: number;   // 8px
    md: number;   // 12px
    lg: number;   // 16px
    xl: number;   // 24px
  };
  elevation: {
    level0: number;
    level1: number;
    level2: number;
  };
}

// Light theme configuration with minimal tokens
export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: 3, // 12px border radius (4px * 3)
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    
    // Map React Native Paper colors to our minimal design system
    primary: DESIGN_TOKENS.primary,
    primaryContainer: DESIGN_TOKENS.primaryLight,
    onPrimary: SYSTEM_COLORS.white,
    onPrimaryContainer: DESIGN_TOKENS.primaryDark,
    
    secondary: DESIGN_TOKENS.secondary,
    secondaryContainer: DESIGN_TOKENS.secondaryLight,
    onSecondary: SYSTEM_COLORS.white,
    onSecondaryContainer: SYSTEM_COLORS.white,
    
    surface: DESIGN_TOKENS.background,
    surfaceVariant: DESIGN_TOKENS.background,
    onSurface: DESIGN_TOKENS.primaryDark,
    onSurfaceVariant: DESIGN_TOKENS.muted,
    
    background: DESIGN_TOKENS.background,
    onBackground: DESIGN_TOKENS.primaryDark,
    
    outline: DESIGN_TOKENS.muted,
    outlineVariant: DESIGN_TOKENS.muted + '40', // 25% opacity
    
    error: SYSTEM_COLORS.error,
    
    // Our minimal design tokens (matching constants/colors.ts)
    muted: DESIGN_TOKENS.muted,
    primaryLight: DESIGN_TOKENS.primaryLight,
    primaryDark: DESIGN_TOKENS.primaryDark,
    secondaryLight: DESIGN_TOKENS.secondaryLight,
    secondaryDark: DESIGN_TOKENS.secondaryDark,
    
    // Legacy support for gradual migration
    textLight: DESIGN_TOKENS.muted,
    backgroundLight: DESIGN_TOKENS.background,
    
    // Health/status colors (mapped to minimal tokens)
    excellent: colors.excellent,
    good: colors.good,
    fair: colors.fair,
    poor: colors.poor,
    critical: colors.critical,
    gray: colors.gray,
    textHint: colors.textHint,
    
    // Legacy AI colors (mapped to minimal tokens)
    aiPrimary: colors.aiPrimary,
    onAiPrimary: colors.onAiPrimary,
    brandSecondary: colors.brandSecondary,
  },
  spacing: {
    xxs: 4,   // 4px
    xs: 6,    // 6px  
    sm: 8,    // tight spacing
    md: 16,   // default spacing  
    lg: 24,   // section spacing
    xl: 32,   // major spacing
  },
  borderRadius: {
    xs: 4,    // 4px
    sm: 8,    // 8px
    md: 12,   // 12px
    lg: 16,   // 16px
    xl: 24,   // 24px
  },
  elevation: {
    level0: 0,
    level1: 1,
    level2: 2,
  },
};

// Dark theme uses same token structure with adjusted values
export const darkTheme: AppTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    // Dark mode adjustments (keeping same token structure)
    background: '#121212',
    surface: '#1E1E1E',
    onBackground: SYSTEM_COLORS.white,
    onSurface: SYSTEM_COLORS.white,
  },
};

// Export typed theme hook
import { useTheme as useRNPTheme } from 'react-native-paper';
export const useAppTheme = () => useRNPTheme<AppTheme>(); 