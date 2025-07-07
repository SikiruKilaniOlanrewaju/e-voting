-- Migration: Update students table for Firebase phone OTP and Supabase data
-- Only run these if the column does not already exist or needs updating

ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text unique;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure phone, email, and matric_no are unique and not null
ALTER TABLE students ALTER COLUMN phone SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_phone_key ON students(phone);

ALTER TABLE students ALTER COLUMN email SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_email_key ON students(email);

ALTER TABLE students ALTER COLUMN matric_no SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_matric_no_key ON students(matric_no);

-- Add name column if missing
ALTER TABLE students ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';

-- Add created_at if missing
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
