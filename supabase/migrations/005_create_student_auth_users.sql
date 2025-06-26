-- Create auth users for all students in the users table
-- This migration creates Supabase Auth accounts for students with standardized password

-- First, let's create a function to safely create auth users
CREATE OR REPLACE FUNCTION create_student_auth_user(user_email text, user_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        -- Create the auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            user_email,
            crypt(user_password, gen_salt('bf')),
            NOW(),
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'Created auth user for: %', user_email;
    ELSE
        RAISE NOTICE 'Auth user already exists for: %', user_email;
    END IF;
END;
$$;

-- Create auth users for all students with password "Donatello"
DO $$
DECLARE
    student_record RECORD;
BEGIN
    FOR student_record IN 
        SELECT email, name 
        FROM users 
        WHERE role = 'student' 
        AND email NOT IN ('hutchenbach@gmail.com') -- Skip if already exists
        ORDER BY email
    LOOP
        PERFORM create_student_auth_user(student_record.email, 'Donatello');
    END LOOP;
END;
$$;

-- Clean up the function
DROP FUNCTION create_student_auth_user(text, text);

-- Verify the results
SELECT 'Auth users created. Total count:' as message, COUNT(*) as count FROM auth.users;
SELECT 'Student users in database:' as message, COUNT(*) as count FROM users WHERE role = 'student'; 