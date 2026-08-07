-- ============================================================
-- MySalapi Full Database Schema (Clean Version)
-- Run this in Supabase SQL Editor
-- Safe to re-run — drops and recreates everything cleanly
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP ALL EXISTING TABLES (clean slate)
-- ============================================================
DROP TABLE IF EXISTS public.budget_allocations CASCADE;
DROP TABLE IF EXISTS public.spending_limits CASCADE;
DROP TABLE IF EXISTS public.budget_goals CASCADE;
DROP TABLE IF EXISTS public.fund_sources CASCADE;
DROP TABLE IF EXISTS public.email_notifications CASCADE;
DROP TABLE IF EXISTS public.group_participants CASCADE;
DROP TABLE IF EXISTS public.group_expenses CASCADE;
DROP TABLE IF EXISTS public.loan_payments CASCADE;
DROP TABLE IF EXISTS public.loans CASCADE;
DROP TABLE IF EXISTS public.bill_reminders CASCADE;
DROP TABLE IF EXISTS public.personal_expenses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop helper function if it exists from a previous run
DROP FUNCTION IF EXISTS public.is_group_payer(UUID);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = CASE WHEN EXCLUDED.full_name = '' THEN public.users.full_name ELSE EXCLUDED.full_name END,
        updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Copy existing auth users into public.users
INSERT INTO public.users (id, full_name, email, phone)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.email,
  COALESCE(au.raw_user_meta_data->>'phone', '')
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PERSONAL EXPENSES (Ledger 1)
-- ============================================================
CREATE TABLE public.personal_expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category     TEXT NOT NULL DEFAULT 'Others',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BILL REMINDERS (Ledger 1)
-- ============================================================
CREATE TABLE public.bill_reminders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  amount               NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date             DATE NOT NULL,
  reminder_days_before INT NOT NULL DEFAULT 3,
  is_recurring         BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid              BOOLEAN NOT NULL DEFAULT FALSE,
  category             TEXT NOT NULL DEFAULT 'Other',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOANS (Ledger 2 - Pautang)
-- ============================================================
CREATE TABLE public.loans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  borrower_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  amount_remaining NUMERIC(12,2) NOT NULL,
  purpose          TEXT,
  loan_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE NOT NULL,
  payment_method   TEXT NOT NULL DEFAULT 'GCash',
  payment_details  TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','partial','paid')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOAN PAYMENTS
-- ============================================================
CREATE TABLE public.loan_payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id        UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'GCash',
  recorded_by    UUID NOT NULL REFERENCES public.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GROUP EXPENSES (Ledger 3 - Ambagan)
-- ============================================================
CREATE TABLE public.group_expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payer_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  total_amount   NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  expense_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  category       TEXT NOT NULL DEFAULT 'Others',
  split_method   TEXT NOT NULL DEFAULT 'equal' CHECK (split_method IN ('equal','custom')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','settled')),
  payment_method TEXT NOT NULL DEFAULT 'GCash',
  payment_details TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GROUP PARTICIPANTS
-- ============================================================
CREATE TABLE public.group_participants (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_expense_id UUID NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  participant_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  share_amount     NUMERIC(12,2) NOT NULL CHECK (share_amount > 0),
  is_paid          BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMAIL NOTIFICATIONS
-- ============================================================
CREATE TABLE public.email_notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email   TEXT NOT NULL,
  subject_email     TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject_cost_id   UUID,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUND SOURCES (Smart Budget Planner)
-- ============================================================
CREATE TABLE public.fund_sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('credit_card','savings_account','cash')),
  credit_limit    NUMERIC(12,2),
  initial_balance NUMERIC(12,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name),
  CHECK (
    (type = 'credit_card' AND credit_limit IS NOT NULL AND credit_limit > 0) OR
    (type != 'credit_card' AND initial_balance IS NOT NULL AND initial_balance > 0)
  )
);

-- ============================================================
-- BUDGET ALLOCATIONS (Smart Budget Planner)
-- ============================================================
CREATE TABLE public.budget_allocations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bill_reminder_id UUID NOT NULL REFERENCES public.bill_reminders(id) ON DELETE CASCADE,
  fund_source_id   UUID NOT NULL REFERENCES public.fund_sources(id) ON DELETE CASCADE,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bill_reminder_id)
);

-- ============================================================
-- BUDGET GOALS (Smart Budget Planner — Goals Tab)
-- ============================================================
CREATE TABLE public.budget_goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category       TEXT NOT NULL DEFAULT 'Savings',
  deadline       DATE,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPENDING LIMITS (Smart Budget Planner — Goals Tab)
-- ============================================================
CREATE TABLE public.spending_limits (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  limit_amount     NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),
  period           TEXT NOT NULL DEFAULT 'monthly',
  alert_threshold  INT NOT NULL DEFAULT 80,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

-- ── USERS ────────────────────────────────────────────────────────────────
CREATE POLICY "Anyone authenticated can read users"
  ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role inserts users"
  ON public.users FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Users insert own profile"
  ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ── PERSONAL EXPENSES ────────────────────────────────────────────────────
CREATE POLICY "Own expenses"
  ON public.personal_expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ── BILL REMINDERS ───────────────────────────────────────────────────────
CREATE POLICY "Own bills"
  ON public.bill_reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ── LOANS ────────────────────────────────────────────────────────────────
CREATE POLICY "Loans visible to lender or borrower"
  ON public.loans FOR SELECT TO authenticated
  USING (auth.uid() = lender_id OR auth.uid() = borrower_id);
CREATE POLICY "Lender creates loans"
  ON public.loans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = lender_id);
CREATE POLICY "Lender updates loans"
  ON public.loans FOR UPDATE TO authenticated
  USING (auth.uid() = lender_id);

-- ── LOAN PAYMENTS ────────────────────────────────────────────────────────
CREATE POLICY "Loan payments visible to parties"
  ON public.loan_payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_id
      AND (l.lender_id = auth.uid() OR l.borrower_id = auth.uid())
  ));
CREATE POLICY "Lender records payments"
  ON public.loan_payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recorded_by);

-- ── GROUP EXPENSES ───────────────────────────────────────────────────────
-- Split into two policies to avoid circular reference with group_participants.
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

CREATE POLICY "Payer creates group"
  ON public.group_expenses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Payer updates group"
  ON public.group_expenses FOR UPDATE TO authenticated
  USING (auth.uid() = payer_id);

-- ── HELPER FUNCTION (breaks RLS recursion) ───────────────────────────────
-- Checks if the calling user is the payer of a group expense.
-- SECURITY DEFINER bypasses RLS on group_expenses so there is no
-- circular reference when group_participants policies call this.
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

-- ── GROUP PARTICIPANTS ───────────────────────────────────────────────────
-- Uses is_group_payer() to avoid circular RLS reference.
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

-- ── EMAIL NOTIFICATIONS ──────────────────────────────────────────────────
CREATE POLICY "Anyone authenticated can manage notifications"
  ON public.email_notifications FOR ALL TO authenticated USING (true);

-- ── FUND SOURCES ─────────────────────────────────────────────────────────
CREATE POLICY "Own fund sources"
  ON public.fund_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ── BUDGET ALLOCATIONS ───────────────────────────────────────────────────
CREATE POLICY "Own allocations"
  ON public.budget_allocations FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ── BUDGET GOALS ─────────────────────────────────────────────────────────
CREATE POLICY "Own budget goals"
  ON public.budget_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ── SPENDING LIMITS ───────────────────────────────────────────────────────
CREATE POLICY "Own spending limits"
  ON public.spending_limits FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'users'              AS table_name, count(*) FROM public.users
UNION ALL SELECT 'personal_expenses',      count(*) FROM public.personal_expenses
UNION ALL SELECT 'bill_reminders',         count(*) FROM public.bill_reminders
UNION ALL SELECT 'loans',                  count(*) FROM public.loans
UNION ALL SELECT 'group_expenses',         count(*) FROM public.group_expenses
UNION ALL SELECT 'group_participants',     count(*) FROM public.group_participants
UNION ALL SELECT 'fund_sources',           count(*) FROM public.fund_sources
UNION ALL SELECT 'email_notifications',    count(*) FROM public.email_notifications
UNION ALL SELECT 'budget_allocations',     count(*) FROM public.budget_allocations
UNION ALL SELECT 'budget_goals',           count(*) FROM public.budget_goals
UNION ALL SELECT 'spending_limits',        count(*) FROM public.spending_limits;
