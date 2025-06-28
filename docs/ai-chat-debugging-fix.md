# AI Chat Debugging and Fixes

## Issue Summary
When a student sends a message to the chatbot, several issues were occurring:
1. **Database Error**: `value too long for type character varying(500)` - The AI response couldn't be stored
2. **Missing Content Retrieval**: Vector search wasn't happening for lesson content
3. **No Chunk Messages**: Top 3 relevant chunks weren't being displayed as separate messages

## Root Causes Identified

### 1. Database Schema Issue
- The `messages.content` column was VARCHAR(500) instead of TEXT
- This limited message length to 500 characters, causing AI responses to fail

### 2. Missing Lesson Context
- The edge function wasn't automatically finding the student's active lesson
- Without a lesson_id, content retrieval was being skipped

### 3. Missing Database Columns
- The `relevant_chunks` column didn't exist in the messages table
- This prevented storing which lesson chunks were relevant to each message

### 4. RLS Policy Issues
- The `sender_id` column was NOT NULL, preventing AI messages (which have null sender_id)
- RLS policies didn't allow inserting messages with null sender_id

## Fixes Applied

### 1. Edge Function Updates (`supabase/functions/ai-chat-with-storage/index.ts`)
- Added intensive debugging throughout the function
- Added `mode` parameter to distinguish between AI and teacher messages
- Implemented auto-detection of active lesson when none provided
- Added embedding creation for student messages with detailed logging
- Implemented storing top 3 chunks as separate chatbot messages
- Added comprehensive error handling and logging

### 2. Database Migrations
- **008_add_relevant_chunks_to_messages.sql**: Added `relevant_chunks` UUID array column
- **009_fix_messages_for_ai.sql**: Made `sender_id` nullable and updated RLS policies
- **010_fix_message_content_length.sql**: Changed `content` from VARCHAR(500) to TEXT

### 3. Client Updates
- **store/ai-store.ts**: 
  - Added `mode: 'ai'` parameter when calling edge function
  - Added handling for chunk messages returned from edge function
  - Fixed Source type usage to match interface definition

## Debugging Features Added

The edge function now logs:
1. **Request Details**: All parameters, auth status, mode
2. **Embedding Process**: Text being embedded, API response time, vector length
3. **Lesson Detection**: Auto-detection of active lesson for students
4. **Vector Search**: Query details, results, similarity scores
5. **Message Storage**: Each message creation with IDs and content lengths
6. **Chunk Messages**: Creation of reference messages with content
7. **Error Details**: Full error stack traces and context

## How It Works Now

1. **Student sends message** → Edge function receives it with `mode: 'ai'`
2. **Auto-detect lesson** → If no lesson_id provided, find student's active lesson
3. **Create embedding** → Generate vector embedding of student message
4. **Vector search** → Find top 3 relevant chunks from lesson content
5. **Generate AI response** → OpenAI uses lesson context to respond
6. **Store messages**:
   - Student message (with relevant_chunks array)
   - AI response (with ai_sources)
   - 3 separate chunk messages (formatted as references)
7. **Return to client** → Client displays all messages in order

## Testing the Fix

To verify the fix is working:
1. Check Supabase logs for detailed debugging output
2. Verify student messages trigger embedding creation
3. Confirm vector search returns relevant chunks
4. Check that AI response and chunk messages are stored
5. Verify all messages appear in the chat UI

## Key Log Markers to Look For

- `[3.1] Creating embedding for student message...` - Embedding is happening
- `[3.4] Retrieved X relevant chunks` - Vector search succeeded
- `[8.3] Storing X chunk messages...` - Chunk messages being created
- `[10.1] Response summary` - Final success with all IDs 