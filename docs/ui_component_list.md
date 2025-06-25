Core Layout Components
1. GSafeScreen

Wrapper component with SafeAreaView and PaperProvider integration
Props: scrollable, backgroundColor, padding, isLoading
Handles keyboard avoiding behavior for forms
Shimmer Loading State: When isLoading=true, renders full-screen shimmer with appropriate content layout

2. GSHeader

Customized Appbar with consistent styling
Variants: default, back, menu, action
Includes notification badge support
Shimmer Loading State: Title shows as 120px wide shimmer block, badge shows as circular shimmer (20x20px)

3. GSTabBar

Bottom navigation with 5 tabs (Home, Camera, Stories, Chat, Progress)
Active state animations
Badge support for notifications
Shimmer Loading State: Not applicable - navigation always visible

Input Components
4. GSTextInput

Extended TextInput with validation states
Props: error, maxLength, showCounter, isLoading
Includes character counter for messages (500 char limit)
Shimmer Loading State: Input field shows as full-width shimmer block (56px height), label as 80px shimmer above

5. GSURLInput

Specialized TextInput for URL validation
Built-in URL format checking
Add/Remove button integration
Shimmer Loading State: Same as GSTextInput, add button shows as 40px circular shimmer

6. GSSearchBar

Searchbar with filter chips below
Used in teacher dashboard for student filtering
Shimmer Loading State: Search bar as full-width shimmer (48px height), filter chips as 60px wide shimmer blocks below

Button Components
7. GSButton

Primary action button with loading states
Variants: primary, secondary, danger, success
Sizes: small, medium, large
Shimmer Loading State: Button-shaped shimmer matching size prop (small: 32px, medium: 40px, large: 48px height)

8. GSFAB

Floating Action Button for camera access
Animated expand/collapse for multiple actions
Shimmer Loading State: Circular shimmer (56px diameter) with subtle pulse animation

9. GSIconButton

Consistent icon buttons with ripple effects
Used for reactions, settings, etc.
Shimmer Loading State: Circular shimmer (40px diameter)

Card Components
10. GSLessonCard

Display lesson information with stats
Shows URL count, student progress
"Set as Active" toggle integration
Shimmer Loading State:

Title: 180px x 20px shimmer
Subtitle: 120px x 16px shimmer
Stats row: 3 blocks of 60px x 40px shimmer
Toggle: 48px x 24px shimmer



11. GSStudentCard

Student profile card with plant health indicator
Quick action buttons (message, view details)
Health score color coding
Shimmer Loading State:

Avatar: 48px circular shimmer
Name: 120px x 18px shimmer
Health badge: 80px x 24px shimmer
Action button: 40px circular shimmer



12. GSPlantCard

Daily submission display card
Includes photo, health badge, day counter
Expandable for detailed analysis
Shimmer Loading State:

Photo: Full card width, 4:3 aspect ratio shimmer
Health badge overlay: 60px x 24px shimmer (top-right)
Student name: 100px x 16px shimmer
Day counter: 60px x 14px shimmer



13. GSGuidanceCard

Styled card for daily AI tips
Emoji indicators, formatted text
Source expansion capability
Shimmer Loading State:

Header: 150px x 20px shimmer
Content: 3 lines of full-width shimmer (varying lengths: 100%, 90%, 60%)
Source link: 120px x 16px shimmer



Display Components
14. GSHealthBadge

Visual health indicator (green/yellow/red)
Props: score (0-100), size, showLabel, isLoading
Animated transitions between states
Shimmer Loading State: Pill-shaped shimmer matching size (small: 60x24px, medium: 80x32px, large: 100x40px)

15. GSProgressIndicator

Circular progress for photo uploads
Linear progress for URL processing
Includes percentage text
Shimmer Loading State: Not applicable - shows actual progress

16. GSStoryThumbnail

Square image with health badge overlay
Student name and day counter
24-hour countdown timer
Shimmer Loading State:

Square shimmer (1:1 aspect ratio)
Name below: 80px x 14px shimmer
Badge overlay: 40px circular shimmer



17. GSEmptyState

Placeholder for empty lists
Customizable icon, title, description
Optional action button
Shimmer Loading State: Not applicable - only shows when data is empty

Chat Components
18. GSChatBubble

Message bubbles with sender distinction
Props: type (ai/teacher/student), showSources, isLoading
Timestamp and read receipts
Shimmer Loading State:

Bubble: 200px x 60px shimmer (aligned based on sender)
Typing indicator: 3 animated dots



19. GSChatInput

Text input with photo attachment button
Character limit indicator
Send button with disabled state
Shimmer Loading State: Not applicable - always interactive

20. GSModeToggle

Switch between AI Assistant and Teacher
Animated toggle with labels
Visual indication of current mode
Shimmer Loading State: Not applicable - always interactive

Modal Components
21. GSConfirmDialog

Consistent confirmation dialogs
Used for lesson switching, deletions
Customizable actions
Shimmer Loading State: Not applicable - appears instantly

22. GSBottomSheet

Reaction picker for stories
Filter options for dashboard
Smooth animations
Shimmer Loading State: Content-specific shimmers based on items

List Components
23. GSStudentList

Optimized FlatList for student roster
Pull-to-refresh capability
Section headers for organization
Shimmer Loading State:

Shows 5-7 GSStudentCard shimmers
Staggered fade-in animation



24. GSMessageThread

Conversation list with unread indicators
Last message preview
Timestamp formatting
Shimmer Loading State:

Avatar: 40px circular shimmer
Name: 100px x 16px shimmer
Message preview: 200px x 14px shimmer
Timestamp: 40px x 12px shimmer



Analytics Components
25. GSStatCard

Dashboard metric display
Props: value, label, trend, icon, isLoading
Animated number transitions
Shimmer Loading State:

Icon: 24px circular shimmer
Value: 80px x 32px shimmer
Label: 100px x 14px shimmer
Trend: 60px x 12px shimmer



26. GSChart

Wrapper for common chart types
Line chart for trends
Bar chart for comparisons
Shimmer Loading State:

Chart area: Full width x 200px shimmer
Axis labels: Small rectangular shimmers



Camera Components
27. GSCameraView

Camera interface with alignment overlay
Previous photo ghost image
Capture button with disabled state
Shimmer Loading State: Not applicable - camera view or permission prompt

28. GSPhotoPreview

Post-capture preview screen
Retake and confirm actions
Compression indicator
Shimmer Loading State: Full-screen image shimmer while processing

Notification Components
29. GSSnackbar

Consistent snackbar styling
Success/error/info variants
Action button support
Shimmer Loading State: Not applicable - appears with content

30. GSBanner

Persistent notifications
Used for critical alerts
Dismissible with memory
Shimmer Loading State: Not applicable - appears with content

Form Components
31. GSLessonForm

Multi-step lesson creation
URL list management
Validation indicators
Shimmer Loading State:

Each form field shows appropriate input shimmer
Step indicator shows as segmented shimmer



32. GSTaskChecklist

Daily task display with checkboxes
Point values and completion state
Animated check transitions
Shimmer Loading State:

Checkbox: 24px square shimmer
Task text: 150px x 16px shimmer
Points: 40px x 14px shimmer



Navigation Components
33. GSBackButton

Consistent back navigation
Handles unsaved changes
Platform-specific styling
Shimmer Loading State: Not applicable - always visible

34. GSSegmentedButtons

Tab-like navigation within screens
Used for filtering views
Shimmer Loading State: Shows shimmer blocks for each segment

Utility Components
35. GSLoadingScreen

Full-screen loading state
Branded with app logo
Loading tips rotation
Shimmer Loading State: Custom full-screen shimmer layout

36. GSErrorBoundary

Graceful error handling
User-friendly error messages
Retry capabilities
Shimmer Loading State: Not applicable

37. GSOfflineNotice

Network status indicator
Appears when offline
Auto-dismiss on reconnection
Shimmer Loading State: Not applicable

Achievement Components
38. GSBadge

Achievement badge display
Locked/unlocked states
Progress indicators
Shimmer Loading State:

Icon area: 48px circular shimmer
Title: 80px x 14px shimmer
Progress: Linear shimmer bar



39. GSMilestone

Plant growth milestone cards
Prediction display
Celebration animations
Shimmer Loading State:

Icon: 32px circular shimmer
Date: 80px x 16px shimmer
Description: 120px x 14px shimmer



Social Components
40. GSReactionBar

Emoji reaction selector
Animated reaction counts
User reaction state
Shimmer Loading State: 5 circular shimmers (32px each) in a row


Updated Design System with Shimmer Loading States
🌟 Shimmer Loading States
Design Principles
The shimmer loading state provides visual feedback during data fetching, creating a smooth, premium experience that maintains layout stability and reduces perceived loading time.
Shimmer Specifications
Base Shimmer Properties
javascriptconst shimmerConfig = {
  baseColor: '#E0E0E0',      // Light mode
  highlightColor: '#F5F5F5', // Light mode
  darkBaseColor: '#2A2A2A',  // Dark mode
  darkHighlightColor: '#3A3A3A', // Dark mode
  animationDuration: 1500,   // 1.5 seconds
  animationEasing: 'ease-in-out',
  gradientWidth: '150px',
  angle: '105deg',
};
Shimmer Animation
css@keyframes shimmer {
  0% {
    background-position: -150px 0;
  }
  100% {
    background-position: calc(100% + 150px) 0;
  }
}

.shimmer {
  background: linear-gradient(
    105deg,
    var(--base-color) 40%,
    var(--highlight-color) 50%,
    var(--base-color) 60%
  );
  background-size: 300% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
Component-Specific Shimmer Patterns
Text Shimmers

Single line: Width varies (60-180px) x line height
Multi-line: Decreasing widths (100%, 90%, 60%)
Headers: Wider blocks (150-200px)
Captions: Narrower blocks (60-100px)

Shape Shimmers

Circular: Perfect circles for avatars, badges
Rectangular: Cards, buttons, inputs
Square: Thumbnails, checkboxes
Pill: Badges, tags, toggles

Layout Shimmers

Staggered entry: 50ms delay between items
Fade in/out: 200ms transition
Preserve spacing: Match actual content dimensions
Responsive: Adapt to container width

Implementation Guidelines
React Native Implementation
javascriptconst ShimmerPlaceholder = {
  // Base shimmer component
  container: {
    overflow: 'hidden',
    backgroundColor: colors.shimmer.base,
  },
  
  // Animated gradient overlay
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  
  // Common shapes
  shapes: {
    text: { height: 16, borderRadius: 4 },
    title: { height: 24, borderRadius: 4 },
    circle: { aspectRatio: 1, borderRadius: 999 },
    card: { borderRadius: 12 },
    button: { borderRadius: 8 },
  },
};
Best Practices
Do's ✅

Match skeleton to actual content layout
Use consistent animation timing
Provide immediate visual feedback
Maintain component dimensions
Show 3-7 placeholder items in lists
Use subtle animation (not distracting)

Don'ts ❌

Don't change layout when content loads
Avoid too many shimmer elements
Don't use shimmer for < 300ms loads
Avoid bright/high contrast colors
Don't animate multiple properties
Never show shimmer indefinitely

Accessibility Considerations

Add aria-busy="true" during loading
Provide screen reader announcements
Ensure sufficient contrast ratios
Respect reduced motion preferences
Include loading state descriptions

Performance Optimization

Use native driver for animations
Limit number of animated elements
Reuse shimmer components
Implement view recycling for lists
Cancel animations when unmounted


Shimmer loading states ensure a polished, professional feel throughout the GardenSnap experience, maintaining visual consistency while data loads.