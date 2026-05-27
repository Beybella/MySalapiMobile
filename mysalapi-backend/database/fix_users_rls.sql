-- ============================================================
-- Fix: Allow users to search other users by email
-- (needed for creating loans and group expenses)
-- ============================================================

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can search others by email" ON public.users;

-- Allow any authenticated user to READ any user profile
-- (needed to look up borrowers/participants by email)
CREATE POLICY "Authenticated users can read all profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow the trigger to insert new users on signup
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert their own profile
-- (fallback in case trigger runs as authenticated)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
