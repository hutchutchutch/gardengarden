-- Migration: Fix auth ID mapping for message threads
-- This creates a function to map auth.uid() to the database user ID

-- Create a function to get the database user ID from the auth user
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID AS $$
DECLARE
    db_user_id UUID;
    auth_id UUID;
BEGIN
    auth_id := auth.uid();
    
    -- First, check if auth ID exists directly in users table (for users where auth ID = database ID)
    SELECT id INTO db_user_id
    FROM users
    WHERE id = auth_id
    LIMIT 1;
    
    -- If not found by ID, try email lookup (for users where auth ID ≠ database ID)
    IF db_user_id IS NULL THEN
        SELECT id INTO db_user_id
        FROM users
        WHERE email = auth.jwt() ->> 'email'
        LIMIT 1;
    END IF;
    
    -- If still not found, return NULL (will cause RLS to deny access)
    RETURN db_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the current user is a participant in a thread
CREATE OR REPLACE FUNCTION is_thread_participant(thread_student_id UUID, thread_teacher_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_db_user_id UUID;
BEGIN
    current_db_user_id := get_user_id_from_auth();
    
    -- Return false if user not found
    IF current_db_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN current_db_user_id = thread_student_id OR current_db_user_id = thread_teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own threads" ON message_threads;
DROP POLICY IF EXISTS "Teachers can view their own threads" ON message_threads;
DROP POLICY IF EXISTS "Students can create threads with their teacher" ON message_threads;
DROP POLICY IF EXISTS "Teachers can create threads with their students" ON message_threads;
DROP POLICY IF EXISTS "Participants can update threads" ON message_threads;
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Recreate policies using the mapping function

-- Policy for viewing threads
CREATE POLICY "Users can view their own threads" ON message_threads
    FOR SELECT USING (
        is_thread_participant(student_id, teacher_id)
    );

-- Policy for creating threads - students can create with their teacher
CREATE POLICY "Students can create threads with their teacher" ON message_threads
    FOR INSERT WITH CHECK (
        get_user_id_from_auth() = student_id AND
        EXISTS (
            SELECT 1 FROM users AS student
            JOIN classes ON classes.id = student.class_id
            WHERE student.id = student_id 
            AND student.role = 'student'
            AND classes.teacher_id = teacher_id
        )
    );

-- Policy for creating threads - teachers can create with their students
CREATE POLICY "Teachers can create threads with their students" ON message_threads
    FOR INSERT WITH CHECK (
        get_user_id_from_auth() = teacher_id AND
        EXISTS (
            SELECT 1 FROM users AS teacher
            JOIN classes ON classes.teacher_id = teacher.id
            JOIN users AS student ON student.class_id = classes.id
            WHERE teacher.id = teacher_id 
            AND teacher.role = 'teacher'
            AND student.id = student_id
            AND student.role = 'student'
        )
    );

-- Policy for updating threads
CREATE POLICY "Participants can update threads" ON message_threads
    FOR UPDATE USING (
        is_thread_participant(student_id, teacher_id)
    );

-- Policies for messages table

-- Users can view messages in threads they participate in
CREATE POLICY "Users can view messages in their threads" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM message_threads 
            WHERE message_threads.id = messages.thread_id 
            AND is_thread_participant(message_threads.student_id, message_threads.teacher_id)
        )
    );

-- Users can create messages in threads they participate in
CREATE POLICY "Users can create messages in their threads" ON messages
    FOR INSERT WITH CHECK (
        (sender_id = get_user_id_from_auth() OR sender_id = '00000000-0000-0000-0000-000000000000') AND
        EXISTS (
            SELECT 1 FROM message_threads 
            WHERE message_threads.id = messages.thread_id 
            AND is_thread_participant(message_threads.student_id, message_threads.teacher_id)
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = get_user_id_from_auth());

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_user_id_from_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION is_thread_participant(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_user_id_from_auth() IS 'Maps authenticated user to database user ID, handling both direct ID match and email lookup'; 