# Text Rendering Guidelines

## Overview

This document provides guidelines to prevent "text strings must be rendered within a <Text> component" errors in our React Native app.

## ✅ Best Practices

### 1. Always Wrap Text Content

```tsx
// ❌ WRONG - Direct text in JSX
<View>
  Hello World
</View>

// ✅ CORRECT - Text wrapped in Text component
<View>
  <Text>Hello World</Text>
</View>
```

### 2. Use Safe Text Utilities

```tsx
import { safeText, safeMessageContent, safeMessagePreview } from '@/utils/textUtils';

// ✅ CORRECT - For any dynamic content
<Text>{safeText(userContent)}</Text>

// ✅ CORRECT - For message content (handles DOCUMENT_REF)
<Text>{safeMessageContent(message.content)}</Text>

// ✅ CORRECT - For message previews in lists
<Text>{safeMessagePreview(message.content)}</Text>
```

### 3. Handle Null/Undefined Content

```tsx
// ❌ WRONG - Could render undefined/null
<Text>{message.content}</Text>

// ✅ CORRECT - Always provide fallback
<Text>{message.content || ''}</Text>

// ✅ BETTER - Use safe utilities
<Text>{safeMessageContent(message.content)}</Text>
```

### 4. Use SafeText Component for Complex Cases

```tsx
import { SafeText } from '@/components/ui';

// ✅ CORRECT - SafeText handles any content safely
<SafeText>{complexDynamicContent}</SafeText>

// ✅ CORRECT - With React Native Paper styling
<SafeText variant="paper" paperProps={{ variant: 'titleMedium' }}>
  {content}
</SafeText>
```

## 🚫 Common Mistakes to Avoid

### 1. Orphaned Comments

```tsx
// ❌ WRONG - Comment not properly formatted in JSX
<View>
  <Text>Some content</Text>
</View>
// This comment could cause issues  ← REMOVE THIS

// ✅ CORRECT - Comments inside JSX blocks
<View>
  <Text>Some content</Text>
  {/* This comment is safe */}
</View>
```

### 2. Direct String Rendering

```tsx
// ❌ WRONG - String variables directly in JSX
<View>
  {someString}
</View>

// ✅ CORRECT - Always wrap in Text
<View>
  <Text>{someString}</Text>
</View>
```

### 3. Conditional Text Rendering

```tsx
// ❌ WRONG - Could render naked strings
<View>
  {condition && 'Some text'}
</View>

// ✅ CORRECT - Wrap conditional text
<View>
  {condition && <Text>Some text</Text>}
</View>
```

## 🔧 Utilities Available

### Text Utilities (`utils/textUtils.ts`)

- `safeText(content)` - Safely converts any content to string
- `safeMessageContent(content)` - Handles message content including DOCUMENT_REF
- `safeMessagePreview(content)` - Creates safe preview text for lists
- `isUnsafeTextContent(content)` - Debug utility to check for unsafe content

### Components (`components/ui/`)

- `SafeText` - Wrapper component that ensures safe text rendering
- `useSafeText` - Hook for safe text handling

## 📋 Code Review Checklist

When reviewing code, check for:

- [ ] All text content is wrapped in `<Text>` components
- [ ] Dynamic content uses safe utilities or proper null checks
- [ ] No orphaned comments or strings outside JSX
- [ ] DOCUMENT_REF messages are handled properly
- [ ] Conditional text rendering is properly wrapped

## 🔍 Debugging Text Errors

1. **Check the error stack trace** - Points to exact file and line
2. **Search for orphaned text** - Look for strings outside JSX tags
3. **Verify dynamic content** - Ensure all variables are safely handled
4. **Check message handling** - Verify DOCUMENT_REF and special message types
5. **Use React Developer Tools** - Inspect component tree for issues

## 📁 Files to Watch

These files commonly need text rendering fixes:

- `app/(tabs)/camera.tsx` - Mode switching logic
- `app/screens/teacher-messages.tsx` - Message preview display  
- `components/AIChat.tsx` - Message rendering logic
- `components/ui/GSChatBubble.tsx` - Chat bubble content

## 🧪 Testing

After making changes:

1. Navigate between student and teacher modes
2. Send messages with document references
3. Check message thread previews
4. Verify no console warnings appear
5. Test with null/undefined message content 