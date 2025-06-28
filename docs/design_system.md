GardenSnap Minimal Design System
🎨 Brand Identity
Design Philosophy: Super Minimal Token System for Natural Growth

Our design system uses exactly 8 core design tokens to create a beautiful, functional gardening app. Clean, purposeful, and focused.

## 🌈 8 Core Design Tokens

**Single Source of Truth: `/constants/colors.ts`**

```typescript
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
}
```

## 📋 Token Usage Guidelines

### Background & Surfaces
- **background**: Main app background, card backgrounds, input backgrounds
- Only color that can be used with opacity modifications

### Text Colors
- **primaryDark**: Primary text on light backgrounds
- **muted**: Secondary text, placeholder text, disabled states
- **white**: Text on colored backgrounds (primary, secondary colors)

### Primary Brand (Green) 
Use for plant/garden-related features:
- **primary**: Main buttons, success states, healthy plants
- **primaryLight**: Hover states, light accents, good plant health
- **primaryDark**: Pressed states, headings, emphasis, primary text

### Secondary Brand (Purple)
Use ONLY for AI features:
- **secondary**: AI buttons, AI highlights, AI emphasis
- **secondaryLight**: AI chat bubbles, AI containers, AI backgrounds
- **secondaryDark**: AI pressed states, AI strong emphasis

### Borders & Dividers
- **muted**: All borders, dividers, disabled states
- **muted + opacity**: Subtle borders (use `muted + '40'` for 25% opacity)

## 🎯 Implementation

### Using in Components
```typescript
// ✅ CORRECT - Import from single source
import colors, { DESIGN_TOKENS } from '@/constants/colors';

// Use via colors object (recommended)
backgroundColor: colors.background
color: colors.primary

// Or use via DESIGN_TOKENS (for clarity)
backgroundColor: DESIGN_TOKENS.background
color: DESIGN_TOKENS.primary
```

### Using with Theme
```typescript
// ✅ CORRECT - Use theme colors
import { useAppTheme } from '@/config/theme';

const theme = useAppTheme();
backgroundColor: theme.colors.primary
color: theme.colors.muted
```

### Component-Specific Usage

**Buttons**
- Primary Button: `background: primary`, `text: white`
- AI Button: `background: secondary`, `text: white`  
- Outline Button: `border: primary/secondary`, `text: primary/secondary`

**Cards**
- Background: `background`
- Border: `muted` at 25% opacity
- Border Radius: 12px

**Inputs**
- Background: `background`
- Border: `muted`
- Focus Border: `primary` (2px)
- Text: `primaryDark`
- Placeholder: `muted`

**AI Chat Elements**
- AI Bubbles: `background: secondaryLight`, `text: white`
- AI Buttons: `background: secondary`, `text: white`
- AI Containers: `background: secondaryLight` at 10% opacity

## 📏 Spacing System

**Base Unit: 8px grid**

```typescript
// From theme.spacing
sm: 8px   // tight spacing
md: 16px  // default spacing  
lg: 24px  // section spacing
xl: 32px  // major spacing
```

## 📝 Typography Scale

- **body**: 16px/24px - Default text
- **bodySmall**: 14px/20px - Secondary text
- **title**: 20px/28px - Card titles
- **heading**: 24px/32px - Section headers

## 🎪 Interactive States

- **Hover**: Lighten color by 10%
- **Pressed**: Darken color by 15%
- **Disabled**: `muted` at 40% opacity
- **Focus**: 2px outline in `primary`/`secondary`

## ✅ Implementation Rules

### DO ✅
1. Import from `/constants/colors.ts` as single source of truth
2. Use `DESIGN_TOKENS.primary` for plant-related features
3. Use `DESIGN_TOKENS.secondary` for AI features ONLY
4. Use `DESIGN_TOKENS.muted` for borders, disabled states
5. Use `DESIGN_TOKENS.background` for surfaces
6. Follow the 8px spacing grid
7. Use semantic color names, not hex values

### DON'T ❌
1. Create new color tokens outside this 8-token system
2. Use hardcoded hex values in components  
3. Mix primary (green) and secondary (purple) in same feature
4. Use secondary colors for non-AI features
5. Use colors outside the defined tokens
6. Create custom spacing values outside the 4-token system

## 🔧 Migration Path

Legacy colors are aliased in `constants/colors.ts`:
```typescript
// DEPRECATED - migrate to DESIGN_TOKENS
text: DESIGN_TOKENS.primaryDark,      // → use primaryDark
textLight: DESIGN_TOKENS.muted,       // → use muted  
success: DESIGN_TOKENS.primary,       // → use primary
gray: DESIGN_TOKENS.muted,            // → use muted
```

## 🧪 Validation

Before shipping components:
- [ ] Uses colors from `/constants/colors.ts` only
- [ ] No hardcoded hex values
- [ ] AI features use purple (`secondary*`) tokens only
- [ ] Plant features use green (`primary*`) tokens only
- [ ] Follows 8px spacing grid
- [ ] Meets WCAG AA contrast requirements

---

**Files:**
- Design Tokens: `/constants/colors.ts`
- Theme Config: `/config/theme.ts`
- Documentation: `/docs/design_system.md`

**Version:** 2.0 - Consolidated Minimal Design Tokens