-- Migration: Fix message content length limitation
-- Changes the content column from VARCHAR(500) to TEXT to support longer messages

-- Alter the content column to TEXT type
ALTER TABLE messages ALTER COLUMN content TYPE TEXT;

-- Add comment
COMMENT ON COLUMN messages.content IS 'Message content with no length restriction. Supports long AI responses and references.'; 