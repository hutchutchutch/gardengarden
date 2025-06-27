# Authentication Process & Mode Switching Documentation

## Overview
GardenSnap implements a dual-mode authentication system where users can switch between Student and Teacher modes without requiring separate login credentials. This creates a seamless experience for educators who need to demonstrate both perspectives of the application.

## Critical Issue: Database Query Timeout Causing isLoading Hang (Fixed)

### Problem Analysis
When rebundling the iOS app with `npx expo start --clear`, users experienced hanging on the loading screen despite successful authentication. The logs initially showed:

```
LOG  ProtectedRoute: isLoading = true user = undefined isSwitchingMode = false
LOG  🔄 App load - clearing session to force fresh sign-in
LOG  Auth state changed: SIGNED_IN herchenbach.hutch@gmail.com
```

**Initial Hypothesis**: Race condition in `AuthContext.tsx` where `setIsLoading(false)` was called before user profile loading completed.

**Actual Root Cause**: Database query timeout in `loadUserFromSession()` function was causing the function to hang without reaching the `finally` block that sets `isLoading = false`.

### Debugging Process
1. **Step 1**: Added logging to track auth state changes and function calls
2. **Step 2**: Identified that `loadUserFromSession` was being called but not completing
3. **Step 3**: Added comprehensive logging around the database query
4. **Step 4**: Discovered the Supabase query was hanging indefinitely
5. **Step 5**: Added timeout handling and discovered 10-second timeouts
6. **Step 6**: Found that `supabase.auth.signOut()` calls during timeout errors were causing hanging states

**Final Logs Showing the Issue**:
```
LOG  Auth state changed: SIGNED_IN herchenbach.hutch@gmail.com
LOG  🔄 Session exists, calling loadUserFromSession...
LOG  🔄 loadUserFromSession called for: herchenbach.hutch@gmail.com
LOG  🔄 Set isLoading = true, querying database for user profile...
LOG  🔄 About to query users table for email: herchenbach.hutch@gmail.com
LOG  🔄 Supabase URL configured: true
LOG  🔄 Supabase Anon Key configured: true
ERROR  🚨 Database query timed out: [Error: Database query timeout after 10 seconds]
LOG  🔄 Database query completed. Profile: null Error: [Error: Database query timeout after 10 seconds]
ERROR  ❌ Failed to load user profile: [Error: Database query timeout after 10 seconds]
```

**Root Cause**: The function was hanging after the timeout error because:
1. Database query times out after 10 seconds
2. Error handling calls `await supabase.auth.signOut()` 
3. The `signOut()` call itself hangs or creates a loop
4. The `finally` block never executes, so `isLoading` stays `true`

### Solution Implementation
**Fixed in AuthContext.tsx**:

```typescript
// 1. Fixed onAuthStateChange to not set isLoading prematurely
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  if (session?.user) {
    console.log('🔄 Session exists, calling loadUserFromSession...');
    await loadUserFromSession(session);
  } else {
    console.log('🔄 No session, setting user to null and isLoading to false');
    setUser(null);
    setIsLoading(false); // Only set loading false when no session
  }
  // REMOVED: setIsLoading(false) that was causing race condition
});

// 2. Enhanced loadUserFromSession with timeout handling and better error handling
const loadUserFromSession = async (session: Session) => {
  console.log('🔄 loadUserFromSession called for:', session.user.email);
  try {
    setIsLoading(true); // Ensure loading state during profile fetch
    console.log('🔄 Set isLoading = true, querying database for user profile...');
    
    // Check Supabase configuration
    console.log('🔄 Supabase URL configured:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('🔄 Supabase Anon Key configured:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    // Add timeout to prevent hanging queries
    let profile: any = null;
    let error: any = null;
    
    try {
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      if (result && typeof result === 'object' && 'data' in result) {
        profile = (result as any).data;
        error = (result as any).error;
      }
    } catch (timeoutError) {
      console.error('🚨 Database query timed out:', timeoutError);
      error = timeoutError;
    }

    console.log('🔄 Database query completed. Profile:', profile, 'Error:', error);
    console.log('🔄 Processing query result...');
    
    if (profile && !error) {
      console.log('🔄 Profile found, creating user data...');
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
      console.log('🔄 Setting user to null and signing out...');
      setUser(null);
      // CRITICAL FIX: Skip sign out for timeout errors to prevent infinite loops
      if (error && !error.message?.includes('timeout')) {
        await supabase.auth.signOut();
      }
    }
  } catch (error) {
    console.error('Error loading user from session:', error);
    setUser(null);
    // Skip sign out for errors that might cause loops
    if (error && !error.message?.includes('timeout')) {
      await supabase.auth.signOut();
    }
  } finally {
    console.log('🔄 loadUserFromSession finally block - setting isLoading = false');
    setIsLoading(false); // Always clear loading state
  }
};
```

**Key Changes**:
1. **Fixed race condition**: Removed `setIsLoading(false)` from `onAuthStateChange` handler
2. **Added database query timeout**: 10-second timeout prevents indefinite hanging
3. **Enhanced error handling**: Skip `signOut()` calls for timeout errors to prevent loops
4. **Comprehensive logging**: Track every step of the auth flow for debugging
5. **Configuration validation**: Log whether Supabase environment variables are configured
6. **Guaranteed cleanup**: `finally` block ensures `isLoading` is always cleared

### Prevention Measures
- **Single source of truth**: Only `onAuthStateChange` and `loadUserFromSession` manage loading state
- **Database query timeouts**: 10-second timeout prevents indefinite hanging on network issues
- **Smart error handling**: Skip `signOut()` calls for timeout errors to prevent infinite loops
- **Comprehensive logging**: Track auth flow progression for easier debugging
- **Guaranteed cleanup**: `finally` block ensures `isLoading` is always cleared
- **Configuration validation**: Verify Supabase environment variables are loaded
- **Error isolation**: Network errors don't affect navigation flow

### Debugging Methodology for Future Issues
1. **Add step-by-step logging** throughout the auth flow
2. **Check network connectivity** and Supabase configuration first
3. **Add timeouts** to any database queries that could hang
4. **Avoid recursive `signOut()` calls** in error handlers
5. **Always use `finally` blocks** for cleanup in async functions
6. **Test with network timeouts** and poor connectivity scenarios

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
5. **isLoading hang due to race condition (FIXED)**: Was caused by premature `setIsLoading(false)` calls
6. **isLoading hang due to database timeout (FIXED)**: Database queries hanging without timeout handling
7. **Infinite auth loops**: `signOut()` calls in error handlers causing recursive loops

### Debug Logs
Key console logs to monitor:
- `ProtectedRoute: isLoading = ... isSwitchingMode = ...`
- `✅ Loaded user from session: ...`
- `Auth state changed: ...`
- `❌ Failed to load user profile:` (indicates database issues)
- `🔄 App load - clearing session to force fresh sign-in`
- `🔄 Session exists, calling loadUserFromSession...` (confirms auth state handler works)
- `🔄 loadUserFromSession called for: ...` (confirms function is called)
- `🔄 Set isLoading = true, querying database for user profile...` (confirms loading state set)
- `🔄 Supabase URL configured: true/false` (validates environment variables)
- `🚨 Database query timed out:` (indicates network/database issues)
- `🔄 loadUserFromSession finally block - setting isLoading = false` (confirms cleanup)

### Testing the Fix
After applying the AuthContext timeout and error handling fix, test various scenarios:

**Normal Operation (Good Network)**:
1. Run `npx expo start --clear`
2. Log should show successful progression:
   ```
   LOG  🔄 App load - clearing session to force fresh sign-in
   LOG  Auth state changed: SIGNED_IN user@email.com
   LOG  🔄 Session exists, calling loadUserFromSession...
   LOG  🔄 loadUserFromSession called for: user@email.com
   LOG  🔄 Set isLoading = true, querying database for user profile...
   LOG  🔄 About to query users table for email: user@email.com
   LOG  🔄 Supabase URL configured: true
   LOG  🔄 Supabase Anon Key configured: true
   LOG  🔄 Database query completed. Profile: {...} Error: null
   LOG  🔄 Processing query result...
   LOG  🔄 Profile found, creating user data...
   LOG  ✅ Loaded user from session: user@email.com student/teacher
   LOG  🔄 loadUserFromSession finally block - setting isLoading = false
   LOG  ProtectedRoute: isLoading = false user = user@email.com
   ```

**Timeout Scenario (Poor Network)**:
1. Simulate poor network or database issues
2. Log should show timeout handling:
   ```
   LOG  🔄 Set isLoading = true, querying database for user profile...
   ERROR  🚨 Database query timed out: [Error: Database query timeout after 10 seconds]
   LOG  🔄 Database query completed. Profile: null Error: [Error: Database query timeout after 10 seconds]
   ERROR  ❌ Failed to load user profile: [Error: Database query timeout after 10 seconds]
   LOG  🔄 Setting user to null and signing out...
   LOG  🔄 loadUserFromSession finally block - setting isLoading = false
   ```
3. App should navigate to sign-in screen without hanging

**Key Success Criteria**:
- ✅ `finally` block always executes (shows "setting isLoading = false")
- ✅ No infinite hanging on loading screen
- ✅ Proper error handling for network timeouts
- ✅ Graceful fallback to sign-in screen on errors

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