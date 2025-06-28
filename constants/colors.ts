// GardenSnap Minimal Design System - Single Source of Truth
// 8 Core Design Tokens + Essential System Colors

// CORE DESIGN TOKENS (8 colors - never add more!)
export const DESIGN_TOKENS = {
  // Background & Surface
  background: '#FAFAFA',      // Main app background, card backgrounds
  
  // Text & Borders  
  muted: '#6B7280',           // Subtle elements, borders, disabled states, secondary text
  
  // Primary Brand (Green - for plant/garden features)
  primary: '#4CAF50',         // Main green brand color (buttons, highlights, success)
  primaryLight: '#81C784',    // Hover states, light green elements
  primaryDark: '#2E7D32',     // Pressed states, emphasis, dark green, primary text
  
  // Secondary Brand (Purple - for AI features only)
  secondary: '#7C3AED',       // AI buttons, AI highlights
  secondaryLight: '#A78BFA',  // AI chat bubbles, AI containers
  secondaryDark: '#6D28D9',   // AI emphasis, AI pressed states
} as const;

// ESSENTIAL SYSTEM COLORS
export const SYSTEM_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  error: '#EF4444',          // Error states, critical alerts
  warning: '#F59E0B',        // Warning states, caution
  transparent: 'transparent',
} as const;

// CONSOLIDATED EXPORT - Use this throughout the app
export default {
  // Core tokens (primary interface)
  ...DESIGN_TOKENS,
  ...SYSTEM_COLORS,
  
  // Legacy aliases for gradual migration (DEPRECATED - use DESIGN_TOKENS instead)
  text: DESIGN_TOKENS.primaryDark,
  textLight: DESIGN_TOKENS.muted,
  backgroundLight: DESIGN_TOKENS.background,
  success: DESIGN_TOKENS.primary,
  gray: DESIGN_TOKENS.muted,
  grayLight: DESIGN_TOKENS.muted + '40', // 25% opacity
  
  // Legacy health/status colors (map to minimal tokens)
  excellent: DESIGN_TOKENS.primary,      // Use primary green for excellent
  good: DESIGN_TOKENS.primaryLight,      // Use light green for good
  fair: DESIGN_TOKENS.secondary,         // Use secondary purple for fair/medium
  poor: SYSTEM_COLORS.warning,           // Use warning color for poor
  critical: SYSTEM_COLORS.error,         // Use error color for critical
  textHint: DESIGN_TOKENS.muted,         // Use muted for hint text
  
  // Legacy AI colors (map to minimal tokens)
  aiPrimary: DESIGN_TOKENS.secondary,       // AI uses secondary (purple)
  onAiPrimary: SYSTEM_COLORS.white,         // White text on AI purple
  brandSecondary: DESIGN_TOKENS.secondary,  // Brand secondary is our purple
} as const;

// USAGE GUIDELINES
// ✅ DO: Use DESIGN_TOKENS.primary for plant-related features
// ✅ DO: Use DESIGN_TOKENS.secondary for AI features  
// ✅ DO: Use DESIGN_TOKENS.muted for borders, disabled states
// ✅ DO: Use DESIGN_TOKENS.background for surfaces
// ❌ DON'T: Create new color tokens outside this system
// ❌ DON'T: Use hardcoded hex values in components