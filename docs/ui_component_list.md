Core Layout Components
1. GSafeScreen

Wrapper component with SafeAreaView and PaperProvider integration
Props: scrollable, backgroundColor, padding
Handles keyboard avoiding behavior for forms

2. GSHeader

Customized Appbar with consistent styling
Variants: default, back, menu, action
Includes notification badge support

3. GSTabBar

Bottom navigation with 5 tabs (Home, Camera, Stories, Chat, Progress)
Active state animations
Badge support for notifications

Input Components
4. GSTextInput

Extended TextInput with validation states
Props: error, maxLength, showCounter
Includes character counter for messages (500 char limit)

5. GSURLInput

Specialized TextInput for URL validation
Built-in URL format checking
Add/Remove button integration

6. GSSearchBar

Searchbar with filter chips below
Used in teacher dashboard for student filtering

Button Components
7. GSButton

Primary action button with loading states
Variants: primary, secondary, danger, success
Sizes: small, medium, large

8. GSFAB

Floating Action Button for camera access
Animated expand/collapse for multiple actions

9. GSIconButton

Consistent icon buttons with ripple effects
Used for reactions, settings, etc.

Card Components
10. GSLessonCard

Display lesson information with stats
Shows URL count, student progress
"Set as Active" toggle integration

11. GSStudentCard

Student profile card with plant health indicator
Quick action buttons (message, view details)
Health score color coding

12. GSPlantCard

Daily submission display card
Includes photo, health badge, day counter
Expandable for detailed analysis

13. GSGuidanceCard

Styled card for daily AI tips
Emoji indicators, formatted text
Source expansion capability

Display Components
14. GSHealthBadge

Visual health indicator (green/yellow/red)
Props: score (0-100), size, showLabel
Animated transitions between states

15. GSProgressIndicator

Circular progress for photo uploads
Linear progress for URL processing
Includes percentage text

16. GSStoryThumbnail

Square image with health badge overlay
Student name and day counter
24-hour countdown timer

17. GSEmptyState

Placeholder for empty lists
Customizable icon, title, description
Optional action button

Chat Components
18. GSChatBubble

Message bubbles with sender distinction
Props: type (ai/teacher/student), showSources
Timestamp and read receipts

19. GSChatInput

Text input with photo attachment button
Character limit indicator
Send button with disabled state

20. GSModeToggle

Switch between AI Assistant and Teacher
Animated toggle with labels
Visual indication of current mode

Modal Components
21. GSConfirmDialog

Consistent confirmation dialogs
Used for lesson switching, deletions
Customizable actions

22. GSBottomSheet

Reaction picker for stories
Filter options for dashboard
Smooth animations

List Components
23. GSStudentList

Optimized FlatList for student roster
Pull-to-refresh capability
Section headers for organization

24. GSMessageThread

Conversation list with unread indicators
Last message preview
Timestamp formatting

Analytics Components
25. GSStatCard

Dashboard metric display
Props: value, label, trend, icon
Animated number transitions

26. GSChart

Wrapper for common chart types
Line chart for trends
Bar chart for comparisons

Camera Components
27. GSCameraView

Camera interface with alignment overlay
Previous photo ghost image
Capture button with disabled state

28. GSPhotoPreview

Post-capture preview screen
Retake and confirm actions
Compression indicator

Notification Components
29. GSSnackbar

Consistent snackbar styling
Success/error/info variants
Action button support

30. GSBanner

Persistent notifications
Used for critical alerts
Dismissible with memory

Form Components
31. GSLessonForm

Multi-step lesson creation
URL list management
Validation indicators

32. GSTaskChecklist

Daily task display with checkboxes
Point values and completion state
Animated check transitions

Navigation Components
33. GSBackButton

Consistent back navigation
Handles unsaved changes
Platform-specific styling

34. GSSegmentedButtons

Tab-like navigation within screens
Used for filtering views

Utility Components
35. GSLoadingScreen

Full-screen loading state
Branded with app logo
Loading tips rotation

36. GSErrorBoundary

Graceful error handling
User-friendly error messages
Retry capabilities

37. GSOfflineNotice

Network status indicator
Appears when offline
Auto-dismiss on reconnection

Achievement Components
38. GSBadge

Achievement badge display
Locked/unlocked states
Progress indicators

39. GSMilestone

Plant growth milestone cards
Prediction display
Celebration animations

Social Components
40. GSReactionBar

Emoji reaction selector
Animated reaction counts
User reaction state

Each component should:

Follow React Native Paper's theming system
Support light/dark modes
Include TypeScript definitions
Have consistent prop interfaces
Include accessibility props
Support testability with testIDs

This component library will ensure UI consistency across the GardenSnap app while leveraging React Native Paper's Material Design foundation.