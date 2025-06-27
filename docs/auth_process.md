# Authentication Process & Mode Switching Documentation

## Overview
GardenSnap implements a dual-mode authentication system where users can switch between Student and Teacher modes without requiring separate login credentials. This creates a seamless experience for educators who need to demonstrate both perspectives of the application.

## Architecture Components

### 1. Authentication Context (`contexts/AuthContext.tsx`)
**Purpose**: Manages user authentication state and Supabase session handling.

**Key Features**:
- Session persistence and validation
- User profile loading from database
- Role-based authentication (student/teacher)
- Account switching capabilities

**Design Decisions**:
- **Session clearing on app load**: We force a fresh sign-in on each app load (`hasCleared` flag) to ensure clean state and prevent stale authentication issues.
- **Profile loading by email**: Since Supabase auth IDs may not match our users table IDs, we lookup users by email for consistent data.
- **Error handling**: If profile loading fails, we sign out the user to force fresh authentication rather than leaving them in an inconsistent state.

### 2. Mode Context (`contexts/ModeContext.tsx`)
**Purpose**: Manages the student/teacher mode switching state independently of authentication.

**Key Features**:
- `isTeacherMode`: Boolean indicating current mode
- `isSwitchingMode`: Boolean indicating when mode transition is in progress
- Global state management for mode transitions

**Design Decisions**:
- **Separated from auth**: Mode switching is separate from authentication to prevent auth state conflicts
- **Global switching state**: `isSwitchingMode` prevents navigation bouncing during transitions
- **React Context**: Ensures all components have access to mode state without prop drilling

### 3. Protected Route Logic (`app/_layout.tsx`)
**Purpose**: Handles navigation protection and prevents unauthorized access.

**Key Features**:
- Monitors authentication state changes
- Prevents navigation during mode switching
- Redirects unauthenticated users to sign-in

**Design Decisions**:
- **Mode switching bypass**: Auth protection is disabled during `isSwitchingMode` to prevent navigation conflicts
- **Segment-based routing**: Uses expo-router segments to determine current route context
- **Loading state handling**: Prevents premature redirects during auth loading

## Mode Switching Process

### Problem Statement
Initially, mode switching caused jarring user experience issues:
1. **Navigation bouncing**: Users saw sign-in screen briefly during mode switches
2. **Multiple redirects**: Auth protection triggered during navigation causing loops
3. **Inconsistent loading**: Different loading states across screens created confusion

### Solution Architecture

#### 1. Coordinated State Management
```typescript
// Global mode switching state
const { isSwitchingMode, setIsSwitchingMode } = useMode();

// Prevents auth protection during transitions
if (!isLoading && !isSwitchingMode) {
  // Apply auth protection logic
}
```

**Justification**: By coordinating the switching state globally, we ensure all components and protection logic are aware of ongoing transitions.

#### 2. Skeleton Loading During Transitions
```typescript
// Student to Teacher transition
if (isTeacherMode) {
  setIsSwitchingMode(true);
  setTimeout(() => {
    router.replace('/screens/teacher-index');
    setTimeout(() => setIsSwitchingMode(false), 100);
  }, 500);
}
```

**Justification**: 
- **500ms delay**: Provides sufficient time for skeleton animations to display
- **Nested timeout**: Ensures navigation completes before resetting switching state
- **Immediate skeleton**: Users see loading feedback instantly on mode toggle

#### 3. Screen-Specific Skeleton Components
Each screen implements skeleton loading components that mirror the actual content structure:
- `ClassGardensSkeleton`: Mimics student plant stories section
- `PlantProgressSkeleton`: Matches plant card layout
- `TasksSkeleton`: Replicates task list structure
- `CurrentLessonSkeleton`: Mirrors teacher lesson progress

**Justification**: Screen-specific skeletons provide users with visual context about what content is loading, reducing perceived loading time.

## Authentication Flow

### 1. Initial App Load
```
App Start → Clear Session → Force Fresh Sign-in → Load User Profile → Set User State
```

**Why force fresh sign-in?**
- Prevents stale session issues
- Ensures consistent user state
- Simplifies debugging during development
- Avoids edge cases with Supabase session persistence

### 2. Sign-in Process
```
User Credentials → Supabase Auth → Session Created → Profile Lookup → Mode Setting → Navigation
```

**Special handling for master teacher**:
```typescript
if (lowerEmail === 'herchenbach.hutch@gmail.com') {
  setIsTeacherMode(true);
} else {
  setIsTeacherMode(false);
}
```

**Justification**: Automatic mode detection based on email reduces friction for the primary teacher user.

### 3. Mode Switching Flow
```
Mode Toggle → Set isSwitchingMode(true) → Show Skeleton → Navigate → Reset isSwitchingMode(false)
```

**Critical timing**:
- Skeleton shows immediately (no delay)
- Navigation happens after 500ms
- Switching state resets 100ms after navigation
- Auth protection is bypassed during switching

## Screen-Specific Implementation

### Student Index (`app/screens/student-index.tsx`)
**Mode switching logic**:
```typescript
useEffect(() => {
  if (isTeacherMode) {
    setIsSwitchingMode(true);
    const timer = setTimeout(() => {
      router.replace('/screens/teacher-index');
      setTimeout(() => setIsSwitchingMode(false), 100);
    }, 500);
    return () => clearTimeout(timer);
  } else if (user?.id) {
    setIsSwitchingMode(false);
    fetchStudentData();
  }
}, [isTeacherMode, user?.id]);
```

**Justification**: 
- Dependencies on `isTeacherMode` and `user?.id` ensure proper timing
- Cleanup function prevents memory leaks from pending timeouts
- Data fetching only occurs when not switching modes

### Teacher Index (`app/screens/teacher-index.tsx`)
**Similar pattern with teacher-specific data loading**:
```typescript
useEffect(() => {
  if (!isTeacherMode) {
    setIsSwitchingMode(true);
    // ... navigation logic
  } else {
    setIsSwitchingMode(false);
  }
}, [isTeacherMode]);
```

**Key difference**: Teacher screen only depends on `isTeacherMode` since it doesn't need user-specific data for the switching decision.

## Error Handling & Edge Cases

### 1. Network Failures
- Auth failures trigger error alerts
- Profile loading failures force re-authentication
- Session timeouts redirect to sign-in

### 2. Navigation Conflicts
- `isSwitchingMode` prevents auth protection interference
- Cleanup functions prevent race conditions
- Router guards ensure valid navigation paths

### 3. State Inconsistencies
- Mode context resets prevent stuck states
- Loading states prevent premature actions
- Fallback skeletons handle missing data

## Security Considerations

### 1. Role-Based Access
- User roles stored in database, not client state
- Server-side validation through Supabase RLS
- Mode switching doesn't change underlying permissions

### 2. Session Management
- Sessions cleared on app load for security
- Profile validation on every session
- Automatic sign-out on profile loading failures

### 3. Development vs Production
- Quick-fill buttons only in development
- Hardcoded credentials for demo purposes only
- Production should implement proper password management

## Performance Optimizations

### 1. Skeleton Loading
- Reduces perceived loading time
- Prevents layout shifts
- Provides immediate user feedback

### 2. State Management
- Global contexts prevent prop drilling
- Minimal re-renders through careful dependencies
- Cleanup prevents memory leaks

### 3. Navigation Timing
- Coordinated timeouts prevent race conditions
- Debounced state changes reduce flicker
- Strategic delays balance UX and performance

## Future Improvements

### 1. Enhanced Security
- Implement proper password rotation
- Add multi-factor authentication
- Improve session encryption

### 2. User Experience
- Add transition animations
- Implement offline mode support
- Enhance error messaging

### 3. Scalability
- Support multiple teacher accounts
- Add role-based permissions system
- Implement audit logging

## Debugging Guide

### Common Issues
1. **Stuck in switching state**: Check timeout cleanup
2. **Navigation loops**: Verify auth protection bypass
3. **Missing skeletons**: Ensure screen-specific components exist
4. **Profile loading failures**: Check database user records

### Debug Logs
Key console logs to monitor:
- `ProtectedRoute: isLoading = ... isSwitchingMode = ...`
- `✅ Loaded user from session: ...`
- `Auth state changed: ...`

### Testing Scenarios
1. Mode switching while offline
2. Rapid mode toggle clicks
3. App backgrounding during transition
4. Network failure during switch

This documentation should be updated as the authentication system evolves to maintain accuracy and help future developers understand the complex interaction between authentication, navigation, and mode switching. 