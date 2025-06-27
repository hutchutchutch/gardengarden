# Multi-User Message Thread Debugging

## Issue Description

Students are experiencing errors when accessing AI chat, even when existing threads are found with messages between student and teacher.

## Current State Analysis

### Working Parts
1. **Authentication**: Users can sign in successfully
2. **Thread Discovery**: Existing threads are being found
3. **User Lookup**: Both student and teacher data is retrieved correctly

### Observed Behavior
From the logs:
```
- User: hutchenbach@gmail.com (Hutch Herky) - Student
- Auth ID: 9bc5a262-f6ce-4da5-bdfc-28a9383cabb2
- Database ID: 9bc5a262-f6ce-4da5-bdfc-28a9383cabb2 (SAME!)
- Thread Found: 02dd1185-f901-488c-be26-aea1ab696461
- Teacher: ee242274-2c32-4432-bfad-69cbeb9d1228 (Hutch Herchenbach)
```

## Potential Issues

### 1. Message Fetching Errors
After thread initialization, the system needs to:
- Fetch messages from the thread
- Check RLS policies on messages table
- Handle AI system messages (sender_id: 00000000-0000-0000-0000-000000000000)

### 2. Mixed ID System
Some users have matching auth/database IDs (like Hutch Herky), while others don't (like Amelia Hill):
- Amelia Hill: Auth ID ≠ Database ID
- Hutch Herky: Auth ID = Database ID

### 3. RLS Policy Edge Cases
The new policies using `get_user_id_from_auth()` might fail for:
- Users where auth ID = database ID (no email lookup needed)
- AI system messages
- Edge function calls

## Debugging Steps

### Step 1: Check Message Fetching
```sql
-- Test message access for a specific thread
SELECT * FROM messages 
WHERE thread_id = '02dd1185-f901-488c-be26-aea1ab696461'
ORDER BY created_at DESC;
```

### Step 2: Verify RLS Function Behavior
```sql
-- Test the mapping function
SELECT get_user_id_from_auth();

-- Test thread participation
SELECT is_thread_participant(
  '9bc5a262-f6ce-4da5-bdfc-28a9383cabb2', -- student_id
  'ee242274-2c32-4432-bfad-69cbeb9d1228'  -- teacher_id
);
```

### Step 3: Check for Console Errors
Look for errors after "=== AIChat initializeChat END ===" such as:
- Message fetching failures
- AI response generation errors
- WebSocket connection issues
- Component rendering errors

### Step 4: Test Different Scenarios

#### Scenario A: Fresh Thread Creation
1. Delete existing thread
2. Open AI chat
3. Monitor thread creation and first message

#### Scenario B: Existing Thread Access
1. Use existing thread with messages
2. Check message loading
3. Verify message display

#### Scenario C: Teacher Mode Switch
1. Start in AI mode
2. Switch to Teacher mode
3. Send message to teacher

## Proposed Solutions

### Solution 1: Enhanced Error Logging
Add more detailed logging to identify exact failure point:

```typescript
// In AIChat component
try {
  await initializeThread(currentUserId, teacherId);
  console.log('✅ Thread initialized successfully');
} catch (error) {
  console.error('❌ Thread initialization failed:', {
    error,
    currentUserId,
    teacherId,
    errorMessage: error.message,
    errorCode: error.code
  });
}
```

### Solution 2: Fallback for Mixed ID System
Update `get_user_id_from_auth()` to handle both cases:

```sql
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID AS $$
DECLARE
    db_user_id UUID;
    auth_id UUID;
BEGIN
    auth_id := auth.uid();
    
    -- First, check if auth ID exists in users table
    SELECT id INTO db_user_id
    FROM users
    WHERE id = auth_id
    LIMIT 1;
    
    -- If not found, try email lookup
    IF db_user_id IS NULL THEN
        SELECT id INTO db_user_id
        FROM users
        WHERE email = auth.jwt() ->> 'email'
        LIMIT 1;
    END IF;
    
    RETURN db_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Solution 3: Message Service Error Handling
Enhance error handling in `getThreadMessages`:

```typescript
static async getThreadMessages(threadId: string): Promise<Message[]> {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('getThreadMessages error:', {
      threadId,
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details
    });
    
    // Return empty array instead of throwing
    return [];
  }
}
```

## Next Steps

1. **Immediate**: Apply enhanced logging to identify exact failure point
2. **Short-term**: Update RLS functions to handle mixed ID system
3. **Long-term**: Consider migrating to consistent ID system

## Testing Checklist

- [ ] Test with Amelia Hill (auth ID ≠ database ID)
- [ ] Test with Hutch Herky (auth ID = database ID)
- [ ] Test fresh thread creation
- [ ] Test existing thread access
- [ ] Test AI message generation
- [ ] Test teacher message sending
- [ ] Test mode switching (AI ↔ Teacher)
- [ ] Test message history loading
- [ ] Test with multiple students in same class

## Error Patterns to Watch

1. **RLS Policy Violations**: "new row violates row-level security policy"
2. **Function Errors**: "function get_user_id_from_auth() does not exist"
3. **Thread Access**: "User is not authorized to create this thread"
4. **Message Access**: "permission denied for table messages"
5. **AI Errors**: "Failed to get AI response"

## Resolution Tracking

| Date | Issue | Solution | Status |
|------|-------|----------|--------|
| 2024-12-XX | Auth ID mismatch | Created mapping functions | Partial |
| 2024-12-XX | Mixed ID system | Need fallback logic | Pending |
| 2024-12-XX | Message fetching | TBD after more logs | Investigating |

## Enhanced Logging Points

We've added detailed logging at key points to identify where errors occur:

### 1. AIChat Component (`components/AIChat.tsx`)
- Thread initialization start/end
- Success/failure for each thread operation
- Error details including message and code

### 2. AI Store (`store/ai-store.ts`)
- `initializeThread`: Thread creation/retrieval
- `fetchMessages`: Message fetching and conversion
- User role mapping and sender identification

### 3. Message Service (`services/message-service.ts`)
- `getOrCreateThread`: Auth user details and participant validation
- Thread creation parameters
- RLS policy violation details

## What to Look For in Logs

### Success Flow
```
=== AIChat initializeChat START ===
Found teacher from lesson: <teacher-id>
=== getOrCreateThread DEBUG START ===
Found existing thread: <thread-id>
=== getOrCreateThread DEBUG END (existing) ===
✅ Thread initialized successfully
=== AI Store fetchMessages START ===
Retrieved X messages
✅ Converted to X AI messages
=== AI Store fetchMessages SUCCESS ===
=== AIChat initializeChat END ===
```

### Common Error Points

1. **After Thread Found but Before Messages Load**
   - Look for: `=== AI Store fetchMessages ERROR ===`
   - Indicates: RLS policy issue with messages table

2. **Function Not Found Error**
   - Error: `function get_user_id_from_auth() does not exist`
   - Fix: Run migration 007_fix_auth_id_mapping.sql

3. **RLS Policy Violation**
   - Error: `new row violates row-level security policy`
   - Check: User participation in thread

4. **Mixed ID System Issues**
   - Compare: Auth ID vs Database ID in logs
   - Watch for: Email lookup failures 

## Deployment Checklist

To fix the multi-user message thread issues:

### 1. Apply Database Migration
```bash
# Make sure you're in the project directory
cd /Users/hutch/Documents/projects/gauntlet/p2/gardengarden

# Push the new migration to Supabase
supabase db push
```

### 2. Verify Functions Created
Check in Supabase Dashboard under Database > Functions:
- [ ] `get_user_id_from_auth()` exists
- [ ] `is_thread_participant()` exists

### 3. Test with Different Users
1. Sign in as Amelia Hill (auth ID ≠ database ID)
2. Open AI Chat
3. Check console for any errors
4. Repeat with Hutch Herky (auth ID = database ID)

### 4. Monitor Logs
With the enhanced logging, you should see:
- Thread initialization status
- Message fetching results
- Any RLS policy violations
- Specific error codes and messages

### 5. Common Fixes

If you see "function does not exist" errors:
```sql
-- Run this directly in Supabase SQL editor
DROP FUNCTION IF EXISTS get_user_id_from_auth();
DROP FUNCTION IF EXISTS is_thread_participant(UUID, UUID);

-- Then re-run the migration
```

If RLS policies are still failing:
```sql
-- Check current policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('message_threads', 'messages');
```

### 6. Emergency Rollback
If issues persist, temporarily disable RLS (NOT for production):
```sql
-- TEMPORARY ONLY - Re-enable after fixing
ALTER TABLE message_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

## Resolved Issues

### Error Display Persisting Despite Success (Fixed)

**Problem**: Even though all operations succeeded (thread found, messages fetched), error messages were still displaying in the UI.

**Root Cause**: 
1. The AIChat component wasn't importing the `error` state from the AI store
2. The AI store wasn't clearing errors when operations succeeded
3. Persisted errors from previous sessions were not being cleared

**Solution Applied**:
1. **Import error state** in AIChat component:
   ```typescript
   const { messages, isLoading, error, ... } = useAIStore();
   ```

2. **Display errors** with dismissible UI:
   ```tsx
   {error && (
     <View style={styles.errorContainer}>
       <Text style={styles.errorText}>{error}</Text>
       <Pressable onPress={clearError} style={styles.errorCloseButton}>
         <Text style={styles.errorCloseText}>×</Text>
       </Pressable>
     </View>
   )}
   ```

3. **Clear errors on success** in AI store:
   ```typescript
   set({ messages: aiMessages, isLoading: false, error: null });
   ```

4. **Clear persisted errors** on component mount:
   ```typescript
   useEffect(() => {
     clearError();
   }, [clearError]);
   ```

5. **Added clearError action** to AI store for manual error dismissal

This ensures that:
- Old errors don't persist across sessions
- Errors are cleared when operations succeed
- Users can manually dismiss errors if needed
- The UI properly reflects the current state 