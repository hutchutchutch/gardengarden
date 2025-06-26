# Dual Authentication Setup for GardenSnap

## Overview

GardenSnap uses a unique authentication system where:
- Students sign up with their own email addresses and have individual student portals
- When ANY user switches to "Teacher" mode, they see the master teacher portal as "Hutch Herchenbach"
- There's only one teacher account (`herchenbach.hutch@gmail.com`) that provides a shared teacher view

## Architecture

### Authentication Flow

```
Student Sign Up → Create Individual Student Account → Access Student Portal
Switch to Teacher Mode → Load Master Teacher Account → View as "Hutch Herchenbach"
```

### Key Components

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Manages student sessions individually
   - Loads master teacher account when in teacher mode
   - Automatically switches between student and teacher views based on mode

2. **ModeContext** (`contexts/ModeContext.tsx`)
   - Tracks current mode (student/teacher)
   - Works in conjunction with AuthContext

3. **Mode Toggle** (`components/ui/mode-toggle.tsx`)
   - UI component for switching modes
   - Validates user is logged in before allowing mode switch
   - Seamlessly switches to master teacher view

4. **Sign In Screen** (`app/auth/signin.tsx`)
   - Students can sign in with any email
   - Shows current logged-in status
   - Explains the dual-mode system

## Setup Instructions

### 1. Database Setup

The migration has been run and creates:
- Users table with RLS policies
- Classes table with default class
- Proper indexes and triggers

### 2. Create Master Teacher Account

**IMPORTANT**: You must create the master teacher auth user in Supabase first:

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with:
   - Email: `herchenbach.hutch@gmail.com`
   - Set a secure password
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

### 3. Environment Configuration

Ensure your `.env` file has:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Usage

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

## Security Considerations

1. **Row Level Security (RLS)**:
   - Students can only view/edit their own data
   - Anyone authenticated can view the master teacher profile
   - Teacher can view all students in the class

2. **Master Teacher Account**:
   - The master teacher email/profile is hardcoded
   - Only authenticated users can access teacher mode
   - Teacher mode provides read-only view for most users

3. **Data Isolation**:
   - Student data remains private to each student
   - Teacher view aggregates class data
   - No cross-contamination between student accounts

## Troubleshooting

### "Not Logged In" Alert
- Sign in with your student account first
- Both student and teacher modes require authentication

### Master Teacher Not Loading
1. Verify the master teacher auth user exists in Supabase
2. Check that the user profile was created with the SQL above
3. Ensure the email matches exactly: `herchenbach.hutch@gmail.com`

### Cannot Create Master Teacher
- The auth user must be created first in Supabase Dashboard
- Use the exact email: `herchenbach.hutch@gmail.com`
- Run the SQL with the correct auth UID

## Development Notes

- The master teacher account is loaded automatically when available
- Student accounts are created on sign-up
- Mode switching is instant once both accounts are loaded
- The system supports unlimited student accounts
- Only one teacher view exists (shared by all users) 