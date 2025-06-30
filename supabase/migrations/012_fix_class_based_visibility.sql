-- Migration: Fix class-based visibility for plant stories and submissions
-- This allows students to see data from classmates in the same class

-- Make submission_id nullable to allow empty plant stories for students who haven't submitted
ALTER TABLE plant_stories 
ALTER COLUMN submission_id DROP NOT NULL;

-- Add RLS policies for plant_stories to allow class-based visibility
ALTER TABLE plant_stories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own plant stories" ON plant_stories;
DROP POLICY IF EXISTS "Students can create own plant stories" ON plant_stories;
DROP POLICY IF EXISTS "Students can view classmates plant stories" ON plant_stories;
DROP POLICY IF EXISTS "Students can create classmates plant stories" ON plant_stories;

-- Allow students to view plant stories from classmates in the same class
CREATE POLICY "Students can view classmates plant stories" ON plant_stories
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2 
    WHERE u1.id = auth.uid() 
    AND u2.id = plant_stories.student_id 
    AND u1.class_id = u2.class_id
    AND u1.class_id IS NOT NULL
  )
);

-- Allow students to create plant stories for classmates in the same class
CREATE POLICY "Students can create classmates plant stories" ON plant_stories
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u1, users u2 
    WHERE u1.id = auth.uid() 
    AND u2.id = plant_stories.student_id 
    AND u1.class_id = u2.class_id
    AND u1.class_id IS NOT NULL
  )
);

-- Allow students to update their own plant stories (for reactions)
CREATE POLICY "Students can update own plant stories" ON plant_stories
FOR UPDATE TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Update daily_submissions policies to allow class-based visibility
DROP POLICY IF EXISTS "Students can view classmates submissions" ON daily_submissions;

CREATE POLICY "Students can view classmates submissions" ON daily_submissions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2 
    WHERE u1.id = auth.uid() 
    AND u2.id = daily_submissions.student_id 
    AND u1.class_id = u2.class_id
    AND u1.class_id IS NOT NULL
  )
);

-- Update image_analysis policies to allow class-based visibility  
DROP POLICY IF EXISTS "Students can view classmates image analysis" ON image_analysis;

CREATE POLICY "Students can view classmates image analysis" ON image_analysis
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2 
    WHERE u1.id = auth.uid() 
    AND u2.id = image_analysis.student_id 
    AND u1.class_id = u2.class_id
    AND u1.class_id IS NOT NULL
  )
);

-- Create helper function to get classmates
CREATE OR REPLACE FUNCTION get_classmates(user_id UUID)
RETURNS TABLE(classmate_id UUID, classmate_name TEXT) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    user_class_id UUID;
BEGIN
    -- Get the user's class_id
    SELECT class_id INTO user_class_id 
    FROM users 
    WHERE id = user_id AND role = 'student';
    
    -- Return empty if no class found
    IF user_class_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Return all students in the same class
    RETURN QUERY
    SELECT u.id, u.name
    FROM users u
    WHERE u.class_id = user_class_id 
    AND u.role = 'student'
    ORDER BY u.name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_classmates TO authenticated; 