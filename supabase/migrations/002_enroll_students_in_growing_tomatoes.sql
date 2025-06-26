-- Migration: Enroll all students in the Growing Tomatoes class
-- This migration ensures all students are enrolled in the same class as Hutch Herchenbach
-- If Hutch doesn't have a class or doesn't exist, it creates/uses the "Growing Tomatoes" class

-- First, find the class that Hutch Herchenbach is enrolled in
DO $$
DECLARE
    target_class_id UUID;
BEGIN
    -- Get the class_id for Hutch Herchenbach
    SELECT class_id INTO target_class_id
    FROM users
    WHERE name = 'Hutch Herchenbach' AND role = 'student'
    LIMIT 1;
    
    -- If Hutch is found and has a class
    IF target_class_id IS NOT NULL THEN
        -- Update all students to be in the same class
        UPDATE users
        SET class_id = target_class_id,
            updated_at = NOW()
        WHERE role = 'student' 
        AND (class_id IS NULL OR class_id != target_class_id);
        
        RAISE NOTICE 'Updated all students to class_id: %', target_class_id;
    ELSE
        -- If Hutch is not found or doesn't have a class, create/use Growing Tomatoes class
        -- First check if Growing Tomatoes class exists
        SELECT id INTO target_class_id
        FROM classes
        WHERE name = 'Growing Tomatoes'
        LIMIT 1;
        
        -- If not, create it
        IF target_class_id IS NULL THEN
            INSERT INTO classes (name, code, settings)
            VALUES ('Growing Tomatoes', 'TOMATO001', '{"subject": "horticulture", "grade": "5-8"}')
            RETURNING id INTO target_class_id;
        END IF;
        
        -- Update all students including Hutch to be in Growing Tomatoes class
        UPDATE users
        SET class_id = target_class_id,
            updated_at = NOW()
        WHERE role = 'student';
        
        RAISE NOTICE 'Created/used Growing Tomatoes class and updated all students to class_id: %', target_class_id;
    END IF;
END $$;

-- Also ensure the teacher (if exists) is assigned to the Growing Tomatoes class
UPDATE classes
SET teacher_id = (
    SELECT id FROM users 
    WHERE email = 'herchenbach.hutch@gmail.com' 
    AND role = 'teacher'
    LIMIT 1
),
updated_at = NOW()
WHERE name = 'Growing Tomatoes'; 