-- ============================================================
-- MySalapi - Email Notifications RLS Security Fix
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the old insecure policy
DROP POLICY IF EXISTS "Anyone authenticated can manage notifications" ON public.email_notifications;

-- Create new secure policies

-- Users can only see their own notifications
CREATE POLICY "Users see own notifications"
  ON public.email_notifications FOR SELECT TO authenticated
  USING (
    recipient_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Backend service role (Laravel) can manage all notifications
CREATE POLICY "Service role manages notifications"
  ON public.email_notifications FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify the policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'email_notifications'
ORDER BY policyname;
