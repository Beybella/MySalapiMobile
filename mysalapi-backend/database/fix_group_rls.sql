-- ============================================================
-- Fix: Infinite recursion in group_expenses / group_participants RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the circular policies
DROP POLICY IF EXISTS "Group visible to payer or participant" ON public.group_expenses;
DROP POLICY IF EXISTS "Participants visible to group members" ON public.group_participants;
DROP POLICY IF EXISTS "Payer adds participants" ON public.group_participants;
DROP POLICY IF EXISTS "Payer updates participants" ON public.group_participants;

-- ── group_expenses ────────────────────────────────────────────────────────
-- SELECT: payer can always see their own groups.
-- Participants see a group if their participant_id row exists — but we query
-- group_participants WITHOUT going through group_expenses RLS (no recursion).
CREATE POLICY "Group visible to payer"
  ON public.group_expenses FOR SELECT TO authenticated
  USING (auth.uid() = payer_id);

CREATE POLICY "Group visible to participant"
  ON public.group_expenses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_participants gp
      WHERE gp.group_expense_id = public.group_expenses.id
        AND gp.participant_id = auth.uid()
    )
  );

-- ── group_participants ────────────────────────────────────────────────────
-- SELECT: a participant can see their own row.
--         the payer can see all rows for their group — check payer_id directly
--         on group_expenses WITHOUT triggering group_expenses RLS by using
--         a security-definer helper function.

-- Helper function: returns true if the calling user is the payer of a group.
-- SECURITY DEFINER bypasses RLS on group_expenses so there is no recursion.
CREATE OR REPLACE FUNCTION public.is_group_payer(p_group_expense_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_expenses ge
    WHERE ge.id = p_group_expense_id
      AND ge.payer_id = auth.uid()
  );
$$;

CREATE POLICY "Participant sees own row"
  ON public.group_participants FOR SELECT TO authenticated
  USING (participant_id = auth.uid());

CREATE POLICY "Payer sees all participants"
  ON public.group_participants FOR SELECT TO authenticated
  USING (public.is_group_payer(group_expense_id));

CREATE POLICY "Payer adds participants"
  ON public.group_participants FOR INSERT TO authenticated
  WITH CHECK (public.is_group_payer(group_expense_id));

CREATE POLICY "Payer updates participants"
  ON public.group_participants FOR UPDATE TO authenticated
  USING (public.is_group_payer(group_expense_id));
