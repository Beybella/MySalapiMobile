-- ============================================================
-- Add Terms & Conditions Acceptance to Users Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add terms_accepted_at column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add terms acceptance version tracking (for future T&C updates)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('terms_accepted_at', 'terms_version')
ORDER BY column_name;

-- Optional: Set existing users as having accepted terms (if upgrading)
-- Uncomment the line below if you want existing users to be grandfathered in
-- UPDATE public.users SET terms_accepted_at = created_at, terms_version = '1.0' WHERE terms_accepted_at IS NULL;
