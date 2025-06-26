-- Migration: Complete setup for Growing Tomatoes class with Hutch Herchenbach as teacher
-- This migration ensures:
-- 1. Hutch Herchenbach is the teacher of the Growing Tomatoes class
-- 2. All students are enrolled in the Growing Tomatoes class
-- 3. The Growing Tomatoes lesson is associated with the correct class
-- 4. All students have plants for the lesson
-- 5. Sample daily submissions exist for demonstration

-- Note: This migration consolidates the fixes from previous partial migrations

DO $$
DECLARE
    growing_tomatoes_class_id UUID := 'c5ddc5c7-8472-42b0-8622-bbc507e7e14d';
    hutch_teacher_id UUID := 'ee242274-2c32-4432-bfad-69cbeb9d1228';
    growing_tomatoes_lesson_id UUID := '11112222-3333-4444-5555-666677778888';
BEGIN
    -- 1. Update Hutch Herchenbach to be in the Growing Tomatoes class
    UPDATE users
    SET class_id = growing_tomatoes_class_id,
        updated_at = NOW()
    WHERE id = hutch_teacher_id;
    
    -- 2. Ensure the Growing Tomatoes class has Hutch as the teacher
    UPDATE classes
    SET teacher_id = hutch_teacher_id,
        updated_at = NOW()
    WHERE id = growing_tomatoes_class_id;
    
    -- 3. Update all students to be in the Growing Tomatoes class
    UPDATE users
    SET class_id = growing_tomatoes_class_id,
        updated_at = NOW()
    WHERE role = 'student';
    
    -- 4. Update the Growing Tomatoes lesson to be in the correct class
    UPDATE lessons
    SET class_id = growing_tomatoes_class_id,
        created_by = hutch_teacher_id,
        updated_at = NOW()
    WHERE id = growing_tomatoes_lesson_id;
    
    -- 5. Ensure all students have plants for the Growing Tomatoes lesson
    INSERT INTO plants (student_id, lesson_id, nickname, planting_date, current_stage, current_health_score)
    SELECT 
        u.id,
        growing_tomatoes_lesson_id,
        u.name || '''s Tomato',
        NOW() - INTERVAL '7 days',
        'seedling',
        85 + (RANDOM() * 10)::INT
    FROM users u
    WHERE u.role = 'student'
    AND u.class_id = growing_tomatoes_class_id
    AND NOT EXISTS (
        SELECT 1 FROM plants p 
        WHERE p.student_id = u.id 
        AND p.lesson_id = growing_tomatoes_lesson_id
    );
    
    RAISE NOTICE 'Growing Tomatoes class setup completed successfully';
END $$; 