-- Migration: Setup messaging system with proper RLS policies
-- This creates message_threads and messages tables with appropriate access controls

-- Create message_threads table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_type TEXT DEFAULT 'student_teacher',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, teacher_id)
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    ai_sources JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_message_threads_updated_at ON message_threads;
CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own threads" ON message_threads;
DROP POLICY IF EXISTS "Teachers can view their own threads" ON message_threads;
DROP POLICY IF EXISTS "Students can create threads with their teacher" ON message_threads;
DROP POLICY IF EXISTS "Teachers can create threads with their students" ON message_threads;
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- RLS Policies for message_threads table

-- Students can view threads they are part of
CREATE POLICY "Students can view their own threads" ON message_threads
    FOR SELECT USING (
        student_id = auth.uid() OR teacher_id = auth.uid()
    );

-- Teachers can view threads they are part of
CREATE POLICY "Teachers can view their own threads" ON message_threads
    FOR SELECT USING (
        teacher_id = auth.uid() OR 
        (student_id = auth.uid() AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'
        ))
    );

-- Students can create threads with their class teacher
CREATE POLICY "Students can create threads with their teacher" ON message_threads
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users AS student
            JOIN classes ON classes.id = student.class_id
            WHERE student.id = auth.uid() 
            AND student.role = 'student'
            AND classes.teacher_id = message_threads.teacher_id
        )
    );

-- Teachers can create threads with their students
CREATE POLICY "Teachers can create threads with their students" ON message_threads
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users AS teacher
            JOIN classes ON classes.teacher_id = teacher.id
            JOIN users AS student ON student.class_id = classes.id
            WHERE teacher.id = auth.uid() 
            AND teacher.role = 'teacher'
            AND student.id = message_threads.student_id
            AND student.role = 'student'
        )
    );

-- Allow updates to threads for participants
CREATE POLICY "Participants can update threads" ON message_threads
    FOR UPDATE USING (
        student_id = auth.uid() OR teacher_id = auth.uid()
    );

-- RLS Policies for messages table

-- Users can view messages in threads they participate in
CREATE POLICY "Users can view messages in their threads" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM message_threads 
            WHERE message_threads.id = messages.thread_id 
            AND (message_threads.student_id = auth.uid() OR message_threads.teacher_id = auth.uid())
        )
    );

-- Users can create messages in threads they participate in
CREATE POLICY "Users can create messages in their threads" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM message_threads 
            WHERE message_threads.id = messages.thread_id 
            AND (message_threads.student_id = auth.uid() OR message_threads.teacher_id = auth.uid())
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_threads_student_id ON message_threads(student_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_teacher_id ON message_threads(teacher_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message_at ON message_threads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Function to update last_message_at when a message is added
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE message_threads 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at
DROP TRIGGER IF EXISTS update_thread_last_message_trigger ON messages;
CREATE TRIGGER update_thread_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_last_message(); 