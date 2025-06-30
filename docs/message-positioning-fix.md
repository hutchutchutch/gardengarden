# Message Positioning Fix

## Problem
Messages in the chat were initially appearing on the wrong side (left/blue) and then "glitching" to flip to the correct side (right/grey) after a few seconds. This happened for both teachers viewing student messages and students viewing their own messages.

## Root Cause
The issue was in the message role detection logic in `store/ai-store.ts`. The code was using simplified logic to determine message roles based only on comparing sender IDs, without actually checking the sender's role in the database. This caused incorrect role assignments when messages were first loaded.

## Solution
1. **Added sender_id to AIMessage type** (`types/index.ts`):
   - Added `sender_id?: string` field to track the actual sender of each message

2. **Updated message fetching logic** (`store/ai-store.ts`):
   - Fetch user roles from the database for all message senders
   - Create a map of sender_id → role for proper role detection
   - Use actual database roles instead of assumptions

3. **Updated message positioning logic** (`components/AIChat.tsx`):
   - Use `sender_id` to determine if current user sent the message
   - Simplified positioning: current user's messages go right, others go left
   - AI messages follow special rules (left for students, right for teachers)

4. **Updated message bubble colors** (`components/AIChat.tsx`):
   - Current user's messages: gray (#E5E7EB)
   - AI messages: purple (#8B5CF6)
   - Other user's messages: blue (#3B82F6)

## Testing
The fix ensures that:
- Messages appear in the correct position immediately on load
- No "glitching" or position changes after initial render
- Colors are consistent with the sender's role
- Works correctly for both teacher and student views 