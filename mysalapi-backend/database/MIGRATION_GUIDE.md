# 📚 Supabase Database Migration Guide

This guide will show you how to apply the database changes for the Enhanced Budget Features.

---

## 🎯 What We're Adding

### New Features:
1. ✅ **Recurring Bills** - Bills that repeat monthly/weekly/yearly
2. ✅ **Bill Categories** - Organize bills (Housing, Utilities, etc.)
3. ✅ **Budget Goals** - Set savings targets
4. ✅ **Spending Limits** - Set category spending limits
5. ✅ **Bill Splitting** - Split bills across multiple fund sources
6. ✅ **Payment History** - Track payment patterns and late payments
7. ✅ **Budget vs Actual** - Compare planned vs actual spending

---

## 🚀 How to Apply Migration

### **Method 1: Supabase Dashboard (Recommended)**

#### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your **MySalapi** project

#### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar (icon looks like `</>`)
2. Click **"New Query"** button (top right)

#### Step 3: Run Migration
1. Open the file: `01_add_budget_features.sql`
2. **Copy ALL the SQL code** (Ctrl+A, then Ctrl+C)
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

#### Step 4: Verify Success
You should see:
```
Success. No rows returned
```

#### Step 5: Check Tables Were Created
1. Go to **"Table Editor"** in left sidebar
2. You should see these NEW tables:
   - ✅ `budget_goals`
   - ✅ `spending_limits`
   - ✅ `bill_splits`
   - ✅ `bill_payment_history`
   - ✅ `budget_vs_actual`

3. Check **bill_reminders** table:
   - Click on it
   - You should see new columns: `is_recurring`, `category`, `recurrence_pattern`

---

### **Method 2: Using Supabase CLI** (Advanced)

```bash
# If you have Supabase CLI installed
supabase db push

# Or run the migration file directly
psql <your-connection-string> -f database/01_add_budget_features.sql
```

---

## ✅ Verification Checklist

After running the migration, verify:

- [ ] **bill_reminders** table has new columns:
  - `is_recurring` (boolean)
  - `category` (varchar)
  - `recurrence_pattern` (varchar)
  - `next_due_date` (date)
  - `auto_create` (boolean)

- [ ] New tables exist:
  - [ ] `budget_goals`
  - [ ] `spending_limits`
  - [ ] `bill_splits`
  - [ ] `bill_payment_history`
  - [ ] `budget_vs_actual`

- [ ] Row Level Security (RLS) is enabled on all new tables
- [ ] Policies exist for each table (check "Policies" section in Table Editor)

---

## 🎨 Bill Categories

The system now supports these categories:

- **Housing** - Rent, mortgage, property tax
- **Utilities** - Electricity, water, gas, internet
- **Transportation** - Car payment, gas, insurance
- **Food** - Groceries, dining out
- **Healthcare** - Insurance, medications, doctor visits
- **Entertainment** - Netflix, Spotify, hobbies
- **Insurance** - Life, health, car insurance
- **Education** - Tuition, books, courses
- **Subscriptions** - Software, memberships, magazines
- **Other** - Everything else

---

## 🔧 Rollback (If Needed)

If something goes wrong and you need to undo the changes:

```sql
-- WARNING: This will delete all data in these tables!

-- Drop new tables
DROP TABLE IF EXISTS budget_vs_actual CASCADE;
DROP TABLE IF EXISTS bill_payment_history CASCADE;
DROP TABLE IF EXISTS bill_splits CASCADE;
DROP TABLE IF EXISTS spending_limits CASCADE;
DROP TABLE IF EXISTS budget_goals CASCADE;

-- Remove columns from bill_reminders
ALTER TABLE bill_reminders 
DROP COLUMN IF EXISTS is_recurring,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS recurrence_pattern,
DROP COLUMN IF EXISTS next_due_date,
DROP COLUMN IF EXISTS auto_create;
```

---

## 📸 Screenshots Guide

### Where to find SQL Editor:
```
Supabase Dashboard
├── [Project Name]
│   ├── Table Editor
│   ├── SQL Editor  ← Click here!
│   ├── Database
│   └── ...
```

### What the SQL Editor looks like:
```
┌─────────────────────────────────────────┐
│ SQL Editor                     [New +]  │
├─────────────────────────────────────────┤
│                                         │
│  [Paste your SQL here]                  │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│                          [Run] [Cancel] │
└─────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Error: "relation already exists"
- **Solution**: The table already exists. Either drop it first or skip that part.

### Error: "column already exists"
- **Solution**: The column was already added. Skip that ALTER TABLE statement.

### Error: "permission denied"
- **Solution**: Make sure you're logged in as the project owner.

### Error: "syntax error"
- **Solution**: Make sure you copied the ENTIRE SQL file, including all semicolons.

---

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase logs (Dashboard → Logs)
2. Verify your database connection
3. Make sure you're in the correct project
4. Try running each section of the SQL separately

---

## ✨ After Migration

Once the migration is complete, the app will automatically:
- Support recurring bills
- Show bill categories
- Allow bill splitting
- Track payment history
- Support budget goals

No additional code changes needed - the UI will be updated in the next phase!

---

**Migration created on:** January 2025
**Version:** 1.0.0
**Estimated time:** 2-3 minutes
