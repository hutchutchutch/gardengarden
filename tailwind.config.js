const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Base colors from react-native-reusables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        backgroundLight: 'hsl(var(--backgroundLight))',
        foreground: 'hsl(var(--foreground))',
        
        // Brand Colors
        primary: {
          DEFAULT: '#10B981', // Emerald-500 - Growth/Plant theme
          foreground: '#FFFFFF',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        
        // Semantic Colors for Plant Health
        health: {
          excellent: '#10B981', // Green - 80-100%
          good: '#84CC16',      // Lime - 70-79%
          warning: '#EAB308',   // Yellow - 60-69%
          danger: '#EF4444',    // Red - Below 60%
        },
        
        // Role-based Colors
        student: {
          DEFAULT: '#3B82F6', // Blue for student UI elements
          light: '#DBEAFE',
        },
        teacher: {
          DEFAULT: '#8B5CF6', // Purple for teacher UI elements
          light: '#EDE9FE',
        },
        
        // UI Colors
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  corePlugins: {
    // Disable animations to avoid Reanimated dependency
    animation: false,
    transition: false,
    transform: false,
    // Disable aspect-ratio to prevent parsing conflicts with ImagePicker
    aspectRatio: false,
    // Disable container queries that might conflict
    container: false,
    // Disable other plugins that might cause parsing issues
    backgroundOpacity: false,
    borderOpacity: false,
    divideOpacity: false,
    placeholderOpacity: false,
    textOpacity: false,
  },
}; 