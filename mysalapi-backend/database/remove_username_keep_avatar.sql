-- =====================================================================
-- Remove Username, Keep Avatar ID Only
-- =====================================================================
-- Description: Removes username field, keeps only avatar_id
-- Date: 2026-09-03
-- =====================================================================

-- Remove username column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS username CASCADE;

-- Remove username-related constraints and indexes
DROP INDEX IF EXISTS idx_users_username;

-- Remove username-related functions
DROP FUNCTION IF EXISTS check_username_available(TEXT, UUID);
DROP FUNCTION IF EXISTS is_valid_username(TEXT);

-- Update the view to remove username
DROP VIEW IF EXISTS user_profiles;

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    email,
    avatar_id,
    profile_completed,
    created_at,
    updated_at
FROM users;

COMMENT ON VIEW user_profiles IS 'User profile information with avatar';

-- Update trigger to only watch avatar_id changes
DROP TRIGGER IF EXISTS trigger_update_user_profile_timestamp ON users;

CREATE TRIGGER trigger_update_user_profile_timestamp
    BEFORE UPDATE OF avatar_id, profile_completed ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_timestamp();

COMMENT ON TRIGGER trigger_update_user_profile_timestamp ON users IS 'Automatically update updated_at when avatar changes';

-- =====================================================================
-- Verify Current Schema
-- =====================================================================

-- Check what we have now:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- AND column_name IN ('first_name', 'last_name', 'avatar_id', 'profile_completed');

COMMIT;
