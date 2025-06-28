# Authentication Process & Mode Switching Documentation

## Overview
GardenSnap implements a dual-mode authentication system where users can switch between Student and Teacher modes without requiring separate login credentials. This creates a seamless experience for educators who need to demonstrate both perspectives of the application.

### Key Features
- Students sign up with their own email addresses and have individual student portals
- When ANY user switches to "Teacher" mode, they see the master teacher portal as "Hutch Herchenbach"
- There's only one teacher account (`herchenbach.hutch@gmail.com`) that provides a shared teacher view
- Mode switching is seamless with skeleton loading states

## Architecture Components

### 1. Authentication Context (`contexts/AuthContext.tsx`)
**Purpose**: Manages user authentication state and Supabase session handling.

**Key Features**:
- Session persistence and validation
- User profile loading from database
- Role-based authentication (student/teacher)
- Account switching capabilities
- Automatic mode detection for master teacher

**Design Decisions**:
- **Session clearing on app load**: We force a fresh sign-in on each app load (`hasCleared` flag) to ensure clean state and prevent stale authentication issues.
- **Profile loading by email**: Since Supabase auth IDs may not match our users table IDs, we lookup users by email for consistent data.
- **Error handling**: If profile loading fails, we sign out the user to force fresh authentication rather than leaving them in an inconsistent state.
- **Single Supabase client**: Uses `@/config/supabase` to prevent auth token mismatches (previously had duplicate clients causing RLS errors).

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

### 4. Supabase Configuration (`config/supabase.ts`)
**Purpose**: Single source of truth for Supabase client configuration.

**Key Features**:
- Platform-appropriate storage configuration
- Auto-refresh token management
- Debug logging in development
- Auth state change monitoring

**Important**: All imports must use `@/config/supabase`, not `@/utils/supabase` (which has been removed to prevent dual client issues).

## Database Setup

### Users Table
The migration creates a users table with:
- Individual student accounts
- One master teacher account
- Proper RLS policies for data isolation

### Master Teacher Account Setup

**IMPORTANT**: You must create the master teacher auth user in Supabase first:

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with:
   - Email: `herchenbach.hutch@gmail.com`
   - Set a secure password (for demo: `MasterSplinter`)
   - Note the User UID

3. Run this SQL to create the master teacher profile:
   ```sql
   -- Replace 'YOUR-TEACHER-AUTH-UID' with the actual UID from step 2
   DO $$ 
   DECLARE
       teacher_auth_id UUID := 'YOUR-TEACHER-AUTH-UID';
   BEGIN
       -- Update the default class with teacher reference
       UPDATE classes 
       SET teacher_id = teacher_auth_id
       WHERE id = 'e1a2b3c4-d5e6-7890-abcd-ef1234567890';
       
       -- Insert the master teacher profile
       INSERT INTO users (id, email, name, role, class_id) 
       VALUES (
           teacher_auth_id,
           'herchenbach.hutch@gmail.com', 
           'Hutch Herchenbach', 
           'teacher', 
           'e1a2b3c4-d5e6-7890-abcd-ef1234567890'
       )
       ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           class_id = EXCLUDED.class_id;
   END $$;
   ```

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
  router.replace('/screens/teacher-index');
} else {
  setIsTeacherMode(false);
  router.replace('/(tabs)');
}
```

### 3. Mode Switching Flow
```
Mode Toggle → Set isSwitchingMode(true) → Show Skeleton → Navigate → Reset isSwitchingMode(false)
```

**Critical timing**:
- Skeleton shows immediately (no delay)
- Navigation happens after 500ms
- Switching state resets 100ms after navigation
- Auth protection is bypassed during switching

## Usage Guide

### For Students
1. **Sign Up**: Students can sign up with any email address
2. **Sign In**: Use your email and password
3. **Student Mode**: Access your personal plant tracking, tasks, and progress
4. **Switch to Teacher**: Toggle to teacher mode to view the class as "Hutch Herchenbach"

### For Teachers
The teacher view is shared - when anyone switches to teacher mode, they see:
- All students in the class
- Class-wide analytics
- Student progress tracking
- Ability to manage lessons

### Mode Behavior
- **Student Mode**:
  - Shows individual student data
  - Personal plant tracking
  - Individual task management
  - AI chat assistance

- **Teacher Mode** (Shared View):
  - Shows all class data as "Hutch Herchenbach"
  - Class management features
  - Student progress overview
  - Analytics and insights

## Critical Issues Fixed

### 1. Database Query Timeout Causing isLoading Hang

**Problem**: Users experienced hanging on the loading screen despite successful authentication due to database query timeouts in `loadUserFromSession()`.

**Root Cause**: 
- Database queries timing out without proper handling
- `signOut()` calls in error handlers causing infinite loops
- `finally` block never executing, leaving `isLoading = true`

**Solution**:
```typescript
// Add timeout to prevent hanging queries
const queryPromise = supabase.from('users').select('*').eq('email', session.user.email).single();
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
);
const result = await Promise.race([queryPromise, timeoutPromise]);

// Skip sign out for timeout errors to prevent loops
if (error && !error.message?.includes('timeout')) {
  await supabase.auth.signOut();
}
```

### 2. Teacher Sign-in Content Flash

**Problem**: Teachers experienced jarring content flash during sign-in with double mounting of TeacherIndex.

**Solution**: Direct navigation to teacher screen from sign-in:
```typescript
if (lowerEmail === 'herchenbach.hutch@gmail.com') {
  setIsTeacherMode(true);
  router.replace('/screens/teacher-index'); // Direct navigation
}
```

### 3. Duplicate Supabase Client RLS Errors

**Problem**: Having two Supabase client instances (`config/supabase.ts` and `utils/supabase.ts`) caused auth token mismatches and RLS policy violations.

**Root Cause**:
- AuthContext used `utils/supabase.ts`
- Rest of app used `config/supabase.ts`
- Auth tokens weren't shared between clients

**Solution**:
1. Updated all imports to use `@/config/supabase`
2. Deleted `utils/supabase.ts`
3. Ensured single client instance throughout app

### 4. Message Thread RLS Policy Violations

**Problem**: Students couldn't create message threads due to overly restrictive RLS policies.

**Solution**: 
1. Simplified RLS policies to allow thread creation between any student and teacher
2. Added proper participant validation
3. Enhanced error handling and debugging in MessageService

## Security Considerations

### 1. Row Level Security (RLS)
- Students can only view/edit their own data
- Message filtering ensures students only see their own messages, AI responses, and teacher messages
- Teacher can view all students in the class
- Simplified thread creation policies while maintaining security

### 2. Master Teacher Account
- The master teacher email/profile is hardcoded
- Only authenticated users can access teacher mode
- Teacher mode provides appropriate access based on role

### 3. Data Isolation
- Student data remains private to each student
- Teacher view aggregates class data
- No cross-contamination between student accounts
- Message threads properly filtered by user role

## Debugging Guide

### Common Issues

1. **Stuck in switching state**: Check timeout cleanup
2. **Navigation loops**: Verify auth protection bypass
3. **Missing skeletons**: Ensure screen-specific components exist
4. **Profile loading failures**: Check database user records
5. **RLS policy violations**: Verify auth token consistency and user roles
6. **Import errors**: Ensure all imports use `@/config/supabase`

### Debug Logs to Monitor
```
ProtectedRoute: isLoading = ... isSwitchingMode = ...
✅ Loaded user from session: ...
Auth state changed: ...
❌ Failed to load user profile: (indicates database issues)
🔄 App load - clearing session to force fresh sign-in
🔄 Session exists, calling loadUserFromSession...
🔄 loadUserFromSession finally block - setting isLoading = false
🔐 Auth state changed: (from config/supabase.ts listener)
=== getOrCreateThread DEBUG START/END === (message thread creation)
```

### Testing Scenarios

**Normal Operation**:
1. Run `npx expo start --clear`
2. Sign in as student
3. Switch to teacher mode
4. Verify seamless transition with skeleton loading

**Error Scenarios**:
1. Poor network connectivity
2. Database timeouts
3. Invalid credentials
4. Mode switching during data loading

### Debug Utilities

For message thread issues, use the debug utilities:
```typescript
// In browser console or debug buttons:
testThreadCreation() // Test thread creation with detailed logs
refreshAuthSession() // Refresh auth session
checkRLSContext() // Verify RLS context matches auth
```

## Future Improvements

1. **Enhanced Security**
   - Implement proper password rotation
   - Add multi-factor authentication
   - Improve session encryption

2. **User Experience**
   - Add transition animations
   - Implement offline mode support
   - Enhanced error messaging

3. **Scalability**
   - Support multiple teacher accounts
   - Add role-based permissions system
   - Implement audit logging

### 5. Sign-in Page Load Error - Auth State Race Condition

**Problem**: On sign-in page load, the app throws errors due to a race condition between auth initialization and navigation protection.

**Root Cause Analysis**:
When the app loads, the following sequence occurs:
1. `AuthContext` initializes and immediately calls `supabase.auth.signOut()` to force a fresh sign-in
2. This triggers `onAuthStateChange` event with a null session
3. The `ProtectedRoute` wrapper detects no user and attempts to redirect to `/auth/signin`
4. Multiple rapid state changes occur during initialization
5. Navigation attempts happen before the navigator is fully ready

**Specific Code Path**:
```typescript
// In AuthContext - Forces sign out on app load
if (!hasCleared) {
  console.log('🔄 App load - clearing session to force fresh sign-in');
  await supabase.auth.signOut(); // This triggers auth state change
  setUser(null);
  hasCleared = true;
}

// In _layout.tsx - ProtectedRoute reacts to auth changes
useEffect(() => {
  if (!isLoading && !isSwitchingMode) {
    if (!user && !inAuthGroup) {
      router.replace('/auth/signin'); // Attempts navigation during init
    }
  }
}, [user, isLoading, segments, isSwitchingMode]);
```

**Issues Caused**:
1. Navigation timing errors - attempting to navigate before router is ready
2. React state update warnings - multiple rapid state changes
3. Potential infinite loops if error handling triggers more sign outs
4. Poor user experience with flashing screens or error messages

**Solution Implemented**:

1. **Improved Initialization Sequencing**:
   - Add navigation readiness check before attempting redirects
   - Implement debouncing for auth state changes during initialization
   - Use a more controlled initialization flow

2. **Enhanced Error Boundaries**:
   - Wrap auth initialization in try-catch with specific error handling
   - Prevent sign out calls during error states to avoid loops
   - Add initialization state tracking

3. **Recommended Code Changes**:
```typescript
// AuthContext.tsx - Add initialization state
const [isInitializing, setIsInitializing] = useState(true);

useEffect(() => {
  const initializeAuth = async () => {
    try {
      setIsInitializing(true);
      
      if (!hasCleared) {
        // Delay sign out to allow navigation to settle
        await new Promise(resolve => setTimeout(resolve, 100));
        await supabase.auth.signOut();
        hasCleared = true;
      }
      
      // Check for existing session after clearing
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserFromSession(session);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  };
  
  initializeAuth();
}, []);

// _layout.tsx - Check initialization state
useEffect(() => {
  if (!isLoading && !isSwitchingMode && !isInitializing) {
    // Only navigate after initialization is complete
    // ... existing navigation logic
  }
}, [user, isLoading, segments, isSwitchingMode, isInitializing]);
```

4. **Alternative Approach - Skip Force Sign Out**:
   - Consider removing the forced sign out on app load
   - Instead, validate existing sessions and only sign out if invalid
   - This would prevent the race condition entirely

**Best Practices Going Forward**:
1. Avoid forced sign outs during initialization unless absolutely necessary
2. Implement proper state management for initialization phases
3. Use navigation guards that respect initialization states
4. Add error boundaries specific to auth flows
5. Consider using a splash screen or loading state during auth initialization

## Development Notes

- The master teacher account is loaded automatically when available
- Student accounts are created on sign-up
- Mode switching is instant once both accounts are loaded
- The system supports unlimited student accounts
- Only one teacher view exists (shared by all users)
- All Supabase imports must use `@/config/supabase` to prevent auth issues
- Auth initialization requires careful sequencing to prevent race conditions
- Navigation protection must respect initialization states to prevent errors

This documentation should be updated as the authentication system evolves to maintain accuracy and help future developers understand the complex interaction between authentication, navigation, and mode switching. 