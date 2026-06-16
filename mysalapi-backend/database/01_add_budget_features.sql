-- ============================================================================
-- Phase 1: Enhanced Budget Features - Database Schema
-- ============================================================================
-- This migration adds support for:
-- - Recurring bills
-- - Bill categories
-- - Savings goals
-- - Spending limits
-- - Bill splitting across multiple fund sources
-- ============================================================================

-- Step 1: Add columns to bill_reminders table
-- ============================================================================
ALTER TABLE bill_reminders 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Other',
ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(20) DEFAULT NULL, -- 'monthly', 'weekly', 'yearly', 'custom'
ADD COLUMN IF NOT EXISTS next_due_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_create BOOLEAN DEFAULT false; -- Auto-create next bill when marked paid

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bill_reminders_category ON bill_reminders(category);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_recurring ON bill_reminders(is_recurring);

-- Step 2: Create budget_goals table
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  category VARCHAR(50) DEFAULT 'Savings',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_budget_goals_user ON budget_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_goals_status ON budget_goals(status);

-- Enable RLS
ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_goals
CREATE POLICY "Users can view their own goals" ON budget_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" ON budget_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON budget_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON budget_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Step 3: Create spending_limits table
-- ============================================================================
CREATE TABLE IF NOT EXISTS spending_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
  alert_threshold DECIMAL(5, 2) DEFAULT 80.00, -- Alert when reaching X% of limit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_spending_limits_user ON spending_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_limits_category ON spending_limits(category);

-- Enable RLS
ALTER TABLE spending_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spending_limits
CREATE POLICY "Users can view their own limits" ON spending_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own limits" ON spending_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own limits" ON spending_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own limits" ON spending_limits
  FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Create bill_splits table (for splitting bills across multiple funds)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_reminder_id UUID NOT NULL REFERENCES bill_reminders(id) ON DELETE CASCADE,
  fund_source_id UUID NOT NULL REFERENCES fund_sources(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  percentage DECIMAL(5, 2) DEFAULT NULL, -- Optional: store percentage for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bill_splits_unique UNIQUE (bill_reminder_id, fund_source_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bill_splits_bill ON bill_splits(bill_reminder_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_fund ON bill_splits(fund_source_id);

-- Enable RLS
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_splits (inherit from bill_reminders)
CREATE POLICY "Users can view splits for their bills" ON bill_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bill_reminders 
      WHERE bill_reminders.id = bill_splits.bill_reminder_id 
      AND bill_reminders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create splits for their bills" ON bill_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bill_reminders 
      WHERE bill_reminders.id = bill_splits.bill_reminder_id 
      AND bill_reminders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update splits for their bills" ON bill_splits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bill_reminders 
      WHERE bill_reminders.id = bill_splits.bill_reminder_id 
      AND bill_reminders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete splits for their bills" ON bill_splits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bill_reminders 
      WHERE bill_reminders.id = bill_splits.bill_reminder_id 
      AND bill_reminders.user_id = auth.uid()
    )
  );

-- Step 5: Create bill_payment_history table (for tracking payment patterns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bill_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_reminder_id UUID NOT NULL REFERENCES bill_reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paid DECIMAL(12, 2) NOT NULL,
  paid_date DATE NOT NULL,
  due_date DATE NOT NULL,
  fund_source_id UUID REFERENCES fund_sources(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'on_time', -- 'on_time', 'late', 'partial'
  days_late INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_bill ON bill_payment_history(bill_reminder_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON bill_payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON bill_payment_history(paid_date);

-- Enable RLS
ALTER TABLE bill_payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_payment_history
CREATE POLICY "Users can view their payment history" ON bill_payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their payment history" ON bill_payment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 6: Create budget_vs_actual table (for budget tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_vs_actual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month
  category VARCHAR(50) NOT NULL,
  planned_amount DECIMAL(12, 2) DEFAULT 0,
  actual_amount DECIMAL(12, 2) DEFAULT 0,
  variance DECIMAL(12, 2) DEFAULT 0, -- actual - planned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT budget_vs_actual_unique UNIQUE (user_id, month, category)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_budget_vs_actual_user ON budget_vs_actual(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_vs_actual_month ON budget_vs_actual(month);

-- Enable RLS
ALTER TABLE budget_vs_actual ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_vs_actual
CREATE POLICY "Users can view their budget tracking" ON budget_vs_actual
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their budget tracking" ON budget_vs_actual
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their budget tracking" ON budget_vs_actual
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their budget tracking" ON budget_vs_actual
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Predefined Bill Categories
-- ============================================================================
-- These are the default categories users can choose from
-- Categories: Housing, Utilities, Transportation, Food, Healthcare, 
--             Entertainment, Insurance, Education, Subscriptions, Other

-- ============================================================================
-- Done! Migration Complete
-- ============================================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables were created: Check Table Editor
-- 3. Test RLS policies work correctly
-- ============================================================================
