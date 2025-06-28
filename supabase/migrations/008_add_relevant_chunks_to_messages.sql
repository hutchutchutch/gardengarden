-- Migration: Add relevant_chunks column to messages table
-- This adds support for storing which lesson content chunks are relevant to each message

-- Add relevant_chunks column as an array of UUIDs
ALTER TABLE messages ADD COLUMN IF NOT EXISTS relevant_chunks UUID[] DEFAULT '{}';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_relevant_chunks ON messages USING GIN(relevant_chunks);

-- Update RLS policies to allow AI assistant (null sender_id) to create messages with relevant chunks
DROP POLICY IF EXISTS "AI can create messages" ON messages;
CREATE POLICY "AI can create messages" ON messages
    FOR INSERT WITH CHECK (sender_id IS NULL);

-- Comment on the new column
COMMENT ON COLUMN messages.relevant_chunks IS 'Array of lesson_content chunk IDs that are relevant to this message'; 