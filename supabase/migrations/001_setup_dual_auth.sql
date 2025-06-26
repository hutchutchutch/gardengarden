-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('teacher', 'student')) NOT NULL,
    class_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    streak INTEGER DEFAULT 0,
    profile_image TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    teacher_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to users table for class_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_class' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_class 
        FOREIGN KEY (class_id) 
        REFERENCES classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Teachers can view students in their class" ON users;
DROP POLICY IF EXISTS "Anyone can view master teacher" ON users;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage own classes" ON classes;

-- Create policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Anyone authenticated can view the master teacher
CREATE POLICY "Anyone can view master teacher" ON users
    FOR SELECT USING (
        email = 'herchenbach.hutch@gmail.com' AND 
        auth.uid() IS NOT NULL
    );

-- Teachers can view students in their class
CREATE POLICY "Teachers can view students in their class" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM classes 
            WHERE classes.teacher_id = auth.uid() 
            AND classes.id = users.class_id
        )
    );

-- Create policies for classes table
-- Anyone authenticated can view classes
CREATE POLICY "Authenticated users can view classes" ON classes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Teachers can manage their own classes
CREATE POLICY "Teachers can manage own classes" ON classes
    FOR ALL USING (teacher_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);

-- Create default class if it doesn't exist
INSERT INTO classes (id, name, code) 
VALUES ('e1a2b3c4-d5e6-7890-abcd-ef1234567890', 'Default Class', 'DEFAULT001')
ON CONFLICT (id) DO NOTHING;

-- Note: The master teacher account must be created in Supabase Auth first
-- with email: herchenbach.hutch@gmail.com
-- Then update this script with the actual auth UID

-- Create or update master teacher (replace with actual auth UID after creating in Supabase Auth)
-- Example:
/*
DO $$ 
DECLARE
    teacher_auth_id UUID := 'YOUR-TEACHER-AUTH-UID-HERE';
BEGIN
    -- Update the class with teacher reference
    UPDATE classes 
    SET teacher_id = teacher_auth_id
    WHERE id = 'e1a2b3c4-d5e6-7890-abcd-ef1234567890';
    
    -- Insert or update the master teacher
    INSERT INTO users (id, email, name, role, class_id) 
    VALUES (
        teacher_auth_id,
        'herchenbach.hutch@gmail.com', 
        'Hutch Herchenbach', 
        'teacher', 
        'e1a2b3c4-d5e6-7890-abcd-ef1234567890'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        class_id = EXCLUDED.class_id;
END $$;
*/ 