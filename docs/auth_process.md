# Authentication Process & Mode Switching Documentation

## Overview
GardenSnap implements a dual-mode authentication system where users can switch between Student and Teacher modes without requiring separate login credentials. This creates a seamless experience for educators who need to demonstrate both perspectives of the application.

## Critical Issue: isLoading Race Condition (Fixed)

### Problem Analysis
When rebundling the iOS app with `npx expo start --clear`, users experienced hanging on the loading screen despite successful authentication. The logs showed:

```
LOG  ProtectedRoute: isLoading = true user = undefined isSwitchingMode = false
LOG  🔄 App load - clearing session to force fresh sign-in
LOG  Auth state changed: SIGNED_IN herchenbach.hutch@gmail.com
```

**Root Cause**: Race condition in `AuthContext.tsx` where:
1. `signIn()` method sets `isLoading = false` immediately after Supabase auth
2. `onAuthStateChange` handler also sets `isLoading = false` 
3. `loadUserFromSession()` runs asynchronously AFTER both loading states are cleared
4. If profile loading fails, user remains `undefined` while `isLoading = false`
5. `ProtectedRoute` gets stuck because it only shows loading screen when `isLoading = true`

### Solution Implementation
**Fixed in AuthContext.tsx**:

```typescript
const signIn = async (email: string, password: string) => {
  try {
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // REMOVED: setIsLoading(false) - let onAuthStateChange handle this
    console.log('✅ Signed in successfully:', email);
  } catch (error) {
    console.error('Sign in error:', error);
    setIsLoading(false); // Only set false on error
    throw error;
  }
  // No finally block - loading state managed by auth state changes
};

const loadUserFromSession = async (session: Session) => {
  try {
    setIsLoading(true); // Ensure loading state during profile fetch
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (profile && !error) {
      const userData: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        classId: profile.class_id,
        createdAt: profile.created_at,
        lastActiveAt: profile.updated_at,
        streak: profile.streak || 0
      };
      
      setUser(userData);
      console.log('✅ Loaded user from session:', userData.email, userData.role);
    } else {
      console.error('❌ Failed to load user profile:', error);
      await supabase.auth.signOut();
      setUser(null);
    }
  } catch (error) {
    console.error('Error loading user from session:', error);
    await supabase.auth.signOut();
    setUser(null);
  } finally {
    setIsLoading(false); // Always clear loading state
  }
};
```

**Key Changes**:
1. **Removed premature `setIsLoading(false)`** from `signIn` success path
2. **Added `setIsLoading(true)`** at start of `loadUserFromSession` 
3. **Added `finally` block** to ensure `isLoading` is always cleared
4. **Centralized loading state management** through auth state changes only

### Prevention Measures
- **Single source of truth**: Only `onAuthStateChange` and `loadUserFromSession` manage loading state
- **Explicit loading during profile fetch**: Ensures loading screen shows during database queries
- **Guaranteed cleanup**: `finally` block prevents stuck loading states
- **Error isolation**: Sign-in errors don't affect profile loading states

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
5. **isLoading hang (FIXED)**: Was caused by race condition in loading state management

### Debug Logs
Key console logs to monitor:
- `ProtectedRoute: isLoading = ... isSwitchingMode = ...`
- `✅ Loaded user from session: ...`
- `Auth state changed: ...`
- `❌ Failed to load user profile:` (indicates database issues)
- `🔄 App load - clearing session to force fresh sign-in`

### Testing the Fix
After applying the AuthContext fix, test rebundling scenarios:
1. Run `npx expo start --clear`
2. Log should show successful progression:
   ```
   LOG  🔄 App load - clearing session to force fresh sign-in
   LOG  Auth state changed: SIGNED_IN user@email.com
   LOG  ✅ Loaded user from session: user@email.com student/teacher
   LOG  ProtectedRoute: isLoading = false user = user@email.com
   ```
3. App should navigate properly without hanging on loading screen

## Critical Issue: Teacher Sign-in Content Flash (Fixed)

### Problem Analysis
Teachers experienced jarring content flash during sign-in:
1. Sign-in → navigate to `/(tabs)` → `TeacherIndex` briefly shows
2. TeacherIndex mode switching logic → shows skeleton 
3. Navigation to `/screens/teacher-index` → new TeacherIndex mounts
4. Data loading → final content shows

**Root Cause**: Double mounting of TeacherIndex component due to navigation flow and unnecessary mode switching.

### Solution Implementation
**Fixed in signin.tsx**:
```typescript
// Check if this is the master teacher email
if (lowerEmail === 'herchenbach.hutch@gmail.com') {
  setIsTeacherMode(true);
  // Navigate directly to teacher screen to avoid flash
  router.replace('/screens/teacher-index');
} else {
  setIsTeacherMode(false);
  // Navigate to main app for students
  router.replace('/(tabs)');
}
```

**Fixed in teacher-index.tsx**:
1. **Removed skeleton delay logic** from mode switching
2. **Combined loading states** - show skeleton for both mode switching AND data loading
3. **Immediate navigation** if somehow in wrong mode

**Result**: Seamless flow: Sign-in → Skeleton → Teacher Dashboard

### Testing Scenarios
1. Mode switching while offline
2. Rapid mode toggle clicks
3. App backgrounding during transition
4. Network failure during switch

This documentation should be updated as the authentication system evolves to maintain accuracy and help future developers understand the complex interaction between authentication, navigation, and mode switching. 