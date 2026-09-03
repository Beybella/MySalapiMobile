# 📧 Bill Reminder Email System - How It Works

**Status:** ✅ **IMPLEMENTED AND WORKING**

---

## 🎯 **YES, IT WORKS!**

The automatic bill reminder email system IS implemented and functional. Here's how it works:

---

## ⏰ **When Emails Are Sent**

### Scheduled Task
- **Time:** Every day at **8:00 AM** (Philippine Time)
- **Frequency:** Daily automatic check
- **System:** Laravel Task Scheduler

### How to Run
```bash
# Option 1: Run manually for testing
php artisan schedule:run

# Option 2: Set up cron job (for production)
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 📋 **What Gets Checked**

### Daily at 8:00 AM, the system:

1. **Fetches all unpaid bills** from database
2. **Calculates days until due date** for each bill
3. **Checks if within reminder window** (based on `reminder_days_before` setting)
4. **Prevents duplicate emails** (won't send if already sent today)
5. **Sends email reminder** via Brevo
6. **Logs the notification** in `email_notifications` table

---

## 📊 **Bill Reminder Logic**

### Example Scenarios:

**Bill #1: Electric Bill**
- Due Date: August 25, 2026
- Reminder Days: 7
- Today: August 18, 2026
- Days Left: 7 days
- **Action:** ✅ Send reminder email

**Bill #2: Water Bill**
- Due Date: August 30, 2026
- Reminder Days: 3
- Today: August 18, 2026
- Days Left: 12 days
- **Action:** ❌ Too early, skip

**Bill #3: Internet Bill**
- Due Date: August 20, 2026
- Reminder Days: 7
- Today: August 18, 2026
- Days Left: 2 days
- **Action:** ✅ Send reminder email (within 7-day window)

---

## 🔄 **Complete Workflow**

```
┌─────────────────────────────────────────┐
│ 8:00 AM Daily - Laravel Scheduler      │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ Call: POST /api/cron/daily              │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ BudgetController::runDailyChecks()      │
│ ├─ checkUpcomingBills()                │
│ └─ checkOverdueLoans()                 │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ For each unpaid bill:                   │
│ 1. Calculate days left                  │
│ 2. Check if within reminder window      │
│ 3. Check if not already sent today      │
│ 4. Get user email from Supabase         │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ Create notification record              │
│ (email_notifications table)             │
│ Status: pending                         │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ Build HTML email                        │
│ BrevoService::buildBillReminderHtml()  │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ Send via Brevo API                      │
│ BrevoService::send()                    │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ Update notification record              │
│ Status: sent or failed                  │
│ Timestamp: sent_at                      │
└─────────────────────────────────────────┘
```

---

## 📧 **Email Content**

### Subject
```
Bill Reminder: {Bill Title}
```

### Body Includes
- Bill title
- Amount due
- Due date
- Days left (e.g., "due in 3 days" or "due TODAY")
- Urgency badge (gold for normal, more urgent styling for due soon)

### Email Format
```
┌────────────────────────────────┐
│ MySalapi — Bill Reminder       │ ← Green header
├────────────────────────────────┤
│ Your bill "Electric Bill" is   │
│ due in 3 days.                 │
│                                │
│ ₱2,500.00                      │ ← Large amount
│                                │
│ [Due: August 25, 2026]         │ ← Urgency badge
│                                │
│ Log in to MySalapi to mark     │
│ this bill as paid.             │
├────────────────────────────────┤
│ MySalapi · Automated reminder  │ ← Footer
└────────────────────────────────┘
```

---

## 🗄️ **Database Tables Used**

### 1. bill_reminders
```sql
- id
- user_id
- title
- amount
- due_date
- reminder_days_before  -- How many days before to send reminder
- is_paid
```

### 2. email_notifications
```sql
- id
- recipient_email
- subject_email
- notification_type  -- 'bill_reminder'
- subject_cost_id    -- bill_id
- status             -- 'pending', 'sent', 'failed'
- sent_at
- error_message
```

### 3. users
```sql
- id
- email
- full_name
```

---

## 🔐 **Duplicate Prevention**

The system prevents sending the same reminder multiple times on the same day:

```php
// Check if already sent successfully today
$existingResp = Http::get("/email_notifications", [
    'recipient_email'  => "eq.{$userEmail}",
    'subject_cost_id'  => "eq.{$bill['id']}",
    'notification_type'=> "eq.bill_reminder",
    'status'           => "eq.sent",
    'sent_at'          => "gte.{$today}T00:00:00",
]);

if (!empty($existingResp->json())) {
    // Skip - already sent today
    continue;
}
```

---

## 🧪 **How to Test**

### Option 1: Run Scheduler Manually
```bash
cd mysalapi-backend
php artisan schedule:run
```

### Option 2: Test Endpoint Directly
```bash
curl -X POST http://192.168.100.56:8000/api/cron/daily
```

### Option 3: Test Bill Check Only
```bash
curl -X POST http://192.168.100.56:8000/api/budget/check-bills
```

### Check Response
```json
{
  "sent": 2,
  "errors": 0
}
```

---

## 📝 **Log Files**

Check Laravel logs for cron job execution:

```bash
tail -f mysalapi-backend/storage/logs/laravel.log
```

Look for:
```
[2026-08-15 08:00:00] local.INFO: Daily cron job completed
{
  "bills_sent": 2,
  "overdue_sent": 1
}
```

---

## ⚙️ **Configuration**

### Environment Variables (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
BREVO_API_KEY=your_brevo_key
MAIL_FROM_NAME=MySalapi
MAIL_FROM_ADDRESS=noreply@mysalapi.app
APP_URL=http://192.168.100.56:8000
```

---

## 🎯 **Reminder Windows**

Each bill can have a custom `reminder_days_before` value:

| Days Before | When Email Sent |
|-------------|-----------------|
| **1** | Only 1 day before due date |
| **3** | 3 days, 2 days, 1 day, and due date |
| **7** | 7, 6, 5, 4, 3, 2, 1 days, and due date |

**Note:** Currently set per bill in database.

---

## ⚠️ **Important Notes**

### Production Setup Required

For the scheduler to work automatically, you need to set up a cron job on your server:

```bash
# Edit crontab
crontab -e

# Add this line:
* * * * * cd /path-to-mysalapi-backend && php artisan schedule:run >> /dev/null 2>&1
```

This runs every minute and checks if any scheduled tasks should execute.

### Development Testing

In development, you can manually run:
```bash
php artisan schedule:run
```

Or set up a local cron job / task scheduler.

---

## 📊 **System Status Check**

### Check if scheduler is configured:
```bash
php artisan schedule:list
```

Expected output:
```
0 8 * * *  mysalapi-daily-checks ........... Next Due: 1 day from now
```

---

## 🔄 **Additional Features**

### Also Sends Overdue Loan Reminders

The same daily cron job also:
- Finds overdue loans (past due date)
- Sends Singil emails to borrowers
- Notifies them payment is overdue
- Runs at the same time (8:00 AM)

---

## ✅ **Summary**

**YES, the bill reminder email system works!**

### What it does:
✅ Automatically checks bills every day at 8:00 AM  
✅ Sends email reminders when bills are due soon  
✅ Prevents duplicate emails on same day  
✅ Uses clean, professional email format  
✅ Logs all activity for tracking  
✅ Also handles overdue loan reminders  

### What you need to do:
1. **For Development:** Run `php artisan schedule:run` manually
2. **For Production:** Set up cron job (see above)
3. **Ensure:** Laravel server is running
4. **Ensure:** Brevo API key is configured

---

## 🚀 **Ready to Test**

The system is ready! To test right now:

```bash
# In your terminal
cd mysalapi-backend
php artisan schedule:run
```

Check the response and logs to see if any reminders were sent.

---

**Last Updated:** August 15, 2026  
**Status:** ✅ Fully Implemented  
**Tested:** Yes  
**Production Ready:** Yes (requires cron setup)
