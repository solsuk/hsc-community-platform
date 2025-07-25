-- Fix for duplicate RLS policy errors on users table
-- The issue: User table policies already exist from previous migration attempts

-- Drop existing user table policies if they exist (no error if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;

-- Recreate all user table policies fresh
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Admin can update all users
CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Note: This script safely drops and recreates all user table RLS policies
-- to avoid "policy already exists" errors from repeated migrations 