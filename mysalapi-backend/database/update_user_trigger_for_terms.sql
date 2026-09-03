-- ============================================================
-- Update User Creation Trigger to Include Terms Acceptance
-- Run this in Supabase SQL Editor AFTER running add_terms_acceptance.sql
-- ============================================================

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that includes terms acceptance
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    full_name, 
    email, 
    phone,
    terms_accepted_at,
    terms_version
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'terms_accepted_at' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data->>'terms_version', '1.0')
  )
  ON CONFLICT (id) DO UPDATE
    SET email              = EXCLUDED.email,
        full_name          = CASE WHEN EXCLUDED.full_name = '' THEN public.users.full_name ELSE EXCLUDED.full_name END,
        terms_accepted_at  = COALESCE(EXCLUDED.terms_accepted_at, public.users.terms_accepted_at),
        terms_version      = COALESCE(EXCLUDED.terms_version, public.users.terms_version),
        updated_at         = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

COMMENT ON FUNCTION public.handle_new_user() IS 'Syncs auth.users to public.users including terms acceptance tracking';
