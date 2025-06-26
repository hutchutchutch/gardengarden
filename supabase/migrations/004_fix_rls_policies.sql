-- Migration: Fix RLS policies for teacher/student switching functionality
-- This allows teachers to read class data and student data for the switching functionality

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view students in their class" ON users;

-- Create more permissive policies for classes table
-- Master teacher can read all classes
CREATE POLICY "Master teacher can view all classes" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'herchenbach.hutch@gmail.com'
            AND users.role = 'teacher'
        )
    );

-- Students can view their own class
CREATE POLICY "Students can view their class" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.class_id = classes.id
        )
    );

-- Teachers can manage their own classes
CREATE POLICY "Teachers can manage own classes" ON classes
    FOR ALL USING (teacher_id = auth.uid());

-- Create more permissive policies for users table
-- Master teacher can view all students
CREATE POLICY "Master teacher can view all students" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS teacher
            WHERE teacher.id = auth.uid() 
            AND teacher.email = 'herchenbach.hutch@gmail.com'
            AND teacher.role = 'teacher'
        )
    );

-- Students can view other students in their class
CREATE POLICY "Students can view classmates" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS current_user
            WHERE current_user.id = auth.uid() 
            AND current_user.class_id = users.class_id
        )
    ); 