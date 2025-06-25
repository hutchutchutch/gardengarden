# GSFAB Design Pattern

The `GSFAB` (Garden Studio Floating Action Button) is our core design pattern for primary actions throughout the app. It provides a consistent, accessible, and visually appealing way to handle the most important user actions.

## Features ✨

- **Multiple Variants**: Primary, secondary, success, warning, danger
- **Flexible Sizing**: Small (40px), medium (56px), large (72px)
- **Smart Positioning**: Bottom-right, bottom-left, bottom-center with dynamic offset above bottom navigation
- **Expandable Actions**: Support for multiple related actions
- **Loading States**: Shimmer placeholders during async operations
- **Accessibility**: Full screen reader and keyboard support
- **Theme Integration**: Automatic color adaptation
- **Smooth Animations**: Spring-based transitions

## Usage Examples

### Basic FAB
```tsx
import { GSFAB } from '@/components/ui';

// Simple AI chat action
<GSFAB
  icon="robot"
  onPress={handleAIChat}
  variant="secondary"
  label="AI Assistant"
/>
```

### FAB with Label
```tsx
<GSFAB
  icon="camera"
  label="Take Photo"
  onPress={handleTakePhoto}
  variant="success"
  size="large"
/>
```

### Multiple Actions (Expandable)
```tsx
<GSFAB
  icon="plus"
  actions={[
    {
      icon: 'book-open',
      label: 'Create Lesson',
      onPress: handleCreateLesson,
    },
    {
      icon: 'users',
      label: 'Add Students',
      onPress: handleAddStudents,
    },
    {
      icon: 'calendar',
      label: 'Schedule Class',
      onPress: handleScheduleClass,
    },
  ]}
/>
```

### Different Variants
```tsx
// Success action (e.g., completing a task)
<GSFAB
  icon="check"
  variant="success"
  onPress={handleComplete}
/>

// AI Chat variants (popular icons)
<GSFAB
  icon="robot"           // Friendly robot for AI assistant
  variant="secondary"
  onPress={handleAIChat}
/>

<GSFAB
  icon="message-text"    // Chat bubble for messaging
  variant="primary"
  onPress={handleAIChat}
/>

<GSFAB
  icon="brain"           // Brain icon for AI intelligence
  variant="warning"
  onPress={handleAIChat}
/>

// Danger action (e.g., delete)
<GSFAB
  icon="delete"
  variant="danger"
  onPress={handleDelete}
  position="bottom-left"
/>
```

### Loading State
```tsx
<GSFAB
  icon="upload"
  onPress={handleUpload}
  isLoading={uploading}
  label="Upload Photos"
/>
```

## Props API

```tsx
interface GSFABProps {
  // Core functionality
  icon: string;                    // Material Community Icons name
  onPress?: () => void;            // Single action handler
  actions?: FABAction[];           // Multiple actions (expandable)
  
  // Appearance
  variant?: FABVariant;            // 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: FABSize;                  // 'small' | 'medium' | 'large'
  position?: FABPosition;          // 'bottom-right' | 'bottom-left' | 'bottom-center'
  label?: string;                  // Optional text label
  elevation?: number;              // Shadow depth (default: 6)
  offsetBottom?: number;           // Additional bottom offset (default: 24px above tab bar)
  
  // State
  visible?: boolean;               // Show/hide FAB
  isLoading?: boolean;             // Show shimmer placeholder
  
  // Accessibility
  testID?: string;                 // Test identifier
}

interface FABAction {
  icon: string;                    // Action icon
  label: string;                   // Action label
  onPress: () => void;             // Action handler
  testID?: string;                 // Test identifier
}
```

## Design Guidelines

### When to Use GSFAB

✅ **DO Use For:**
- Primary screen actions (create, add, capture)
- Quick access to important features
- Actions that are contextual to the current screen
- Multiple related actions (using expandable mode)

❌ **DON'T Use For:**
- Navigation between screens
- Secondary or tertiary actions
- Actions that require complex forms
- More than 5 expandable actions

### Variant Guidelines

| Variant | Use Case | Examples |
|---------|----------|----------|
| `primary` | Main positive actions | Create, Add, Start |
| `secondary` | Alternative actions | Edit, Duplicate, Share |
| `success` | Completion actions | Complete, Finish, Approve |
| `warning` | Attention-needed actions | Review, Check, Remind |
| `danger` | Destructive actions | Delete, Remove, Cancel |

### Size Guidelines

| Size | Use Case | Dimensions |
|------|----------|------------|
| `small` | Compact spaces, secondary screens | 40×40px |
| `medium` | Standard use (default) | 56×56px |
| `large` | Primary screens, emphasis | 72×72px |

### Position Guidelines

| Position | Use Case |
|----------|----------|
| `bottom-right` | Default, most common |
| `bottom-left` | When right side is occupied |
| `bottom-center` | Centered layouts, special emphasis |

## Screen-Specific Patterns

### Teacher Lessons Screen
```tsx
<GSFAB
  icon="robot"
  onPress={handleAIChat}
  variant="secondary"
  size="medium"
  position="bottom-right"
  label="AI Assistant"
/>
```

### Camera Screen
```tsx
<GSFAB
  icon="camera"
  onPress={handleCapture}
  variant="success"
  size="large"
  position="bottom-center"
/>
```

### Student Progress Screen
```tsx
<GSFAB
  icon="plus"
  actions={[
    { icon: 'camera', label: 'Take Photo', onPress: handlePhoto },
    { icon: 'note-plus', label: 'Add Note', onPress: handleNote },
    { icon: 'chart-line', label: 'Log Progress', onPress: handleProgress },
  ]}
  variant="primary"
/>
```

## Accessibility Features

- **Screen Reader**: Proper labeling and role announcements
- **Focus Management**: Keyboard navigation support
- **High Contrast**: Adapts to system accessibility settings
- **Touch Targets**: Minimum 44px touch area
- **State Announcements**: Loading and action feedback

## Animation Details

- **Spring Animation**: Tension: 30, Friction: 7
- **Rotation**: 45° when expanded
- **Backdrop**: Semi-transparent overlay for expandable actions
- **Stagger**: Sequential action appearance with 50ms delays

## Implementation Notes

- Uses React Native Paper's FAB as base
- Fully integrated with app theme system
- Portal-based rendering for expandable actions
- Optimized for performance with native driver animations
- Shimmer loading states for better UX
- Dynamic positioning using `useSafeAreaInsets` for proper placement above bottom navigation
- Automatic calculation of bottom offset (56px tab bar + 24px spacing + safe area)

## Testing

```tsx
// Test single action
await user.press(screen.getByTestId('gs-fab'));

// Test expandable actions
await user.press(screen.getByTestId('gs-fab'));
await user.press(screen.getByTestId('gs-fab-action-camera'));

// Test loading state
expect(screen.getByTestId('gs-fab')).toHaveStyle({ opacity: 0.6 });
```

This enhanced GSFAB component provides a solid foundation for consistent, accessible, and beautiful floating action buttons throughout the Garden Studio app! 🌱 