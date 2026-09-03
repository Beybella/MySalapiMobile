-- ============================================================
-- Add Contacts Directory for Non-MySalapi Users
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one user can't have duplicate emails in their contacts
  UNIQUE(user_id, email)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_user_email ON public.contacts(user_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own contacts
CREATE POLICY "Users manage own contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'contacts'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'contacts'
ORDER BY policyname;

COMMENT ON TABLE public.contacts IS 'Personal contact directory for non-MySalapi users (for loans and ambagan)';
