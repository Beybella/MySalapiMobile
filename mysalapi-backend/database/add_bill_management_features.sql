-- ============================================
-- Migration: Add Bill Management Features
-- Date: 2024
-- Description: Adds recurring bills, categories, and bill splitting
-- ============================================

-- Step 1: Add columns to bill_reminders for recurring bills and categories
ALTER TABLE bill_reminders 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_frequency VARCHAR(20) DEFAULT NULL, -- 'monthly', 'weekly', 'yearly'
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS next_due_date DATE DEFAULT NULL;

-- Add comment to columns
COMMENT ON COLUMN bill_reminders.is_recurring IS 'Whether this bill repeats automatically';
COMMENT ON COLUMN bill_reminders.recurrence_frequency IS 'How often the bill recurs: monthly, weekly, yearly';
COMMENT ON COLUMN bill_reminders.category IS 'Bill category: Housing, Utilities, Subscriptions, etc.';
COMMENT ON COLUMN bill_reminders.next_due_date IS 'Next scheduled due date for recurring bills';

-- Step 2: Create bill_splits table for splitting bills across multiple fund sources
CREATE TABLE IF NOT EXISTS bill_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_reminder_id UUID NOT NULL REFERENCES bill_reminders(id) ON DELETE CASCADE,
    fund_source_id UUID NOT NULL REFERENCES fund_sources(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    percentage DECIMAL(5, 2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure amount is positive
    CONSTRAINT positive_split_amount CHECK (amount > 0),
    -- Ensure percentage is between 0 and 100
    CONSTRAINT valid_percentage CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bill_splits_bill ON bill_splits(bill_reminder_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_fund ON bill_splits(fund_source_id);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_recurring ON bill_reminders(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_bill_reminders_category ON bill_reminders(category);
CREATE INDEX IF NOT EXISTS idx_bill_reminders_next_due ON bill_reminders(next_due_date) WHERE next_due_date IS NOT NULL;

-- Step 3: Enable Row Level Security (RLS) on bill_splits
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own bill splits
CREATE POLICY "Users can view their own bill splits" ON bill_splits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bill_reminders br
            WHERE br.id = bill_splits.bill_reminder_id
            AND br.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert their own bill splits
CREATE POLICY "Users can insert their own bill splits" ON bill_splits
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bill_reminders br
            WHERE br.id = bill_splits.bill_reminder_id
            AND br.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update their own bill splits
CREATE POLICY "Users can update their own bill splits" ON bill_splits
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bill_reminders br
            WHERE br.id = bill_splits.bill_reminder_id
            AND br.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete their own bill splits
CREATE POLICY "Users can delete their own bill splits" ON bill_splits
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bill_reminders br
            WHERE br.id = bill_splits.bill_reminder_id
            AND br.user_id = auth.uid()
        )
    );

-- Step 4: Create function to auto-generate next recurring bill
CREATE OR REPLACE FUNCTION generate_next_recurring_bill()
RETURNS TRIGGER AS $$
BEGIN
    -- When a recurring bill is marked as paid, create the next one
    IF NEW.is_paid = TRUE AND OLD.is_paid = FALSE AND NEW.is_recurring = TRUE THEN
        -- Calculate next due date based on frequency
        IF NEW.recurrence_frequency = 'monthly' THEN
            NEW.next_due_date := NEW.due_date + INTERVAL '1 month';
        ELSIF NEW.recurrence_frequency = 'weekly' THEN
            NEW.next_due_date := NEW.due_date + INTERVAL '1 week';
        ELSIF NEW.recurrence_frequency = 'yearly' THEN
            NEW.next_due_date := NEW.due_date + INTERVAL '1 year';
        END IF;
        
        -- Insert new bill for next period
        IF NEW.next_due_date IS NOT NULL THEN
            INSERT INTO bill_reminders (
                user_id, 
                title, 
                amount, 
                due_date, 
                reminder_days_before,
                is_recurring,
                recurrence_frequency,
                category,
                is_paid
            ) VALUES (
                NEW.user_id,
                NEW.title,
                NEW.amount,
                NEW.next_due_date,
                NEW.reminder_days_before,
                NEW.is_recurring,
                NEW.recurrence_frequency,
                NEW.category,
                FALSE
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating recurring bills
DROP TRIGGER IF EXISTS trigger_generate_recurring_bill ON bill_reminders;
CREATE TRIGGER trigger_generate_recurring_bill
    BEFORE UPDATE ON bill_reminders
    FOR EACH ROW
    EXECUTE FUNCTION generate_next_recurring_bill();

-- Step 5: Add some default categories (optional - can be customized later)
-- This just ensures the category column has valid data
UPDATE bill_reminders 
SET category = 'General' 
WHERE category IS NULL OR category = '';

COMMENT ON TABLE bill_splits IS 'Allows splitting a single bill across multiple fund sources';

-- Done! 
-- To verify, run: SELECT * FROM bill_reminders LIMIT 5;
-- To verify splits: SELECT * FROM bill_splits LIMIT 5;
