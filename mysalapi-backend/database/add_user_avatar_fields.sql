-- =====================================================================
-- Add Avatar and Username Fields to Users Table
-- =====================================================================
-- Description: Adds avatar_id, username, and profile_completed fields
--              for the Avatar Picker component
-- Author: MySalapi Team
-- Date: 2026-08-29
-- Version: 1.0.0
-- =====================================================================

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_id INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add unique constraint to username (allow NULL for users who haven't set it yet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_unique'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
END
$$;

-- Add check constraint for avatar_id (1-12 avatars available)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_avatar_id_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_avatar_id_check CHECK (avatar_id >= 1 AND avatar_id <= 12);
    END IF;
END
$$;

-- Add check constraint for username length (3-20 characters)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_length_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_username_length_check 
        CHECK (username IS NULL OR (LENGTH(username) >= 3 AND LENGTH(username) <= 20));
    END IF;
END
$$;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index for avatar_id (if you want to query by avatar)
CREATE INDEX IF NOT EXISTS idx_users_avatar_id ON users(avatar_id);

-- Add comment to document the columns
COMMENT ON COLUMN users.username IS 'User-chosen username (3-20 characters, unique)';
COMMENT ON COLUMN users.avatar_id IS 'Selected avatar ID (1-12), corresponds to avatar picker options';
COMMENT ON COLUMN users.profile_completed IS 'Whether user has completed profile setup with avatar and username';

-- =====================================================================
-- Optional: Create user_profiles view for easy access
-- =====================================================================

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    email,
    username,
    avatar_id,
    profile_completed,
    created_at,
    updated_at
FROM users;

COMMENT ON VIEW user_profiles IS 'Convenient view of user profile information';

-- =====================================================================
-- Optional: Function to check username availability
-- =====================================================================

CREATE OR REPLACE FUNCTION check_username_available(
    p_username TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if username is taken by another user
    RETURN NOT EXISTS (
        SELECT 1 
        FROM users 
        WHERE LOWER(username) = LOWER(p_username)
        AND (p_user_id IS NULL OR id != p_user_id)
    );
END;
$$;

COMMENT ON FUNCTION check_username_available IS 'Check if a username is available (case-insensitive)';

-- =====================================================================
-- Optional: Function to validate username format
-- =====================================================================

CREATE OR REPLACE FUNCTION is_valid_username(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Username must:
    -- - Be 3-20 characters long
    -- - Contain only letters, numbers, and underscores
    -- - Not start or end with underscore
    RETURN p_username ~ '^[a-zA-Z0-9][a-zA-Z0-9_]{1,18}[a-zA-Z0-9]$';
END;
$$;

COMMENT ON FUNCTION is_valid_username IS 'Validate username format (alphanumeric + underscores, 3-20 chars)';

-- =====================================================================
-- Optional: Trigger to update updated_at when profile is modified
-- =====================================================================

CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_profile_timestamp ON users;

CREATE TRIGGER trigger_update_user_profile_timestamp
    BEFORE UPDATE OF username, avatar_id, profile_completed ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_timestamp();

COMMENT ON TRIGGER trigger_update_user_profile_timestamp ON users IS 'Automatically update updated_at when profile fields change';

-- =====================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view other profiles" ON users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own username and avatar
CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Allow users to view other users' usernames and avatars (for mentions, searches, etc.)
CREATE POLICY "Users can view other profiles"
    ON users
    FOR SELECT
    USING (true); -- Public read access to username and avatar

-- =====================================================================
-- Sample Data / Test
-- =====================================================================

-- You can test the new fields with a query like:
-- SELECT id, email, username, avatar_id, profile_completed FROM users LIMIT 5;

-- Test username availability function:
-- SELECT check_username_available('test_user');

-- Test username validation function:
-- SELECT is_valid_username('john_doe'); -- Should return true
-- SELECT is_valid_username('ab'); -- Should return false (too short)
-- SELECT is_valid_username('_username'); -- Should return false (starts with underscore)

-- =====================================================================
-- Rollback Script (if needed)
-- =====================================================================

/*
-- To rollback these changes, run:

-- Drop indexes
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_avatar_id;

-- Drop constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_avatar_id_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_length_check;

-- Drop columns
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_id;
ALTER TABLE users DROP COLUMN IF EXISTS profile_completed;

-- Drop view
DROP VIEW IF EXISTS user_profiles;

-- Drop functions
DROP FUNCTION IF EXISTS check_username_available(TEXT, UUID);
DROP FUNCTION IF EXISTS is_valid_username(TEXT);
DROP FUNCTION IF EXISTS update_user_profile_timestamp();

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_user_profile_timestamp ON users;

-- Drop policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view other profiles" ON users;
*/

-- =====================================================================
-- End of Migration
-- =====================================================================

COMMIT;
