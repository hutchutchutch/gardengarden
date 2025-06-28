-- Migration: Fix messages table to support AI messages
-- This allows AI messages to have null sender_id and updates RLS policies

-- Make sender_id nullable for AI messages
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

-- Update RLS policy to allow messages with null sender_id (AI messages)
DROP POLICY IF EXISTS "Users can create messages in their threads" ON messages;
CREATE POLICY "Users can create messages in their threads" ON messages
    FOR INSERT WITH CHECK (
        (sender_id = auth.uid() OR sender_id IS NULL) AND
        EXISTS (
            SELECT 1 FROM message_threads 
            WHERE message_threads.id = messages.thread_id 
            AND (message_threads.student_id = auth.uid() OR message_threads.teacher_id = auth.uid())
        )
    );

-- Ensure AI messages policy exists
DROP POLICY IF EXISTS "AI can create messages" ON messages;
CREATE POLICY "AI can create messages" ON messages
    FOR INSERT WITH CHECK (sender_id IS NULL);

-- Add comment
COMMENT ON COLUMN messages.sender_id IS 'User ID of the message sender. NULL for AI assistant messages.'; 