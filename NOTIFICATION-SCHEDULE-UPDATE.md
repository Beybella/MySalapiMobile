# 📅 Notification Schedule Update

**Date:** August 15, 2026  
**Change:** Updated notification reminder schedule from (3 days, 1 day, due date) to (7 days, 3 days, due date)

---

## What Changed

### Previous Schedule ❌
- **3 days before** due date
- **1 day before** due date  
- **On due date**

### New Schedule ✅
- **7 days before** due date
- **3 days before** due date
- **On due date**

---

## Why This Change?

This gives users **more advance notice** about upcoming bills and loans, allowing better financial planning and preparation.

---

## What Was Updated

### 1. Core Notification Service
**File:** `mysalapi-app/lib/notifications.ts`

- ✅ Updated `scheduleBillNotification()` default parameter: `[7, 3, 0]`
- ✅ Updated `scheduleLoanNotification()` default parameter: `[7, 3, 0]`

### 2. Scheduling Hook
**File:** `mysalapi-app/hooks/useScheduleNotifications.ts`

- ✅ Updated lookahead window from 7 days to **14 days** to catch 7-day reminders
- This ensures bills/loans due in 7-14 days get their first notification scheduled

### 3. Documentation
**File:** `NOTIFICATION-TYPES.md`

- ✅ Updated feature descriptions
- ✅ Updated scenario examples
- ✅ Updated Profile UI mockup
- ✅ Added example notifications for all 3 reminder times

---

## How It Works

### Example: Bill Due on August 25, 2026

| Date | Notification Time | Message |
|------|------------------|---------|
| **Aug 18** (7 days before) | 9:00 AM | 💰 Bill Reminder: "Electric Bill" of ₱2,500.00 is due in 7 days |
| **Aug 22** (3 days before) | 9:00 AM | 💰 Bill Reminder: "Electric Bill" of ₱2,500.00 is due in 3 days |
| **Aug 25** (due date) | 9:00 AM | ⚠️ Bill Due Today: "Electric Bill" of ₱2,500.00 is due TODAY! |

---

## Technical Details

### Scheduling Logic
```typescript
// Both bills and loans now use [7, 3, 0] by default
daysBeforeArray: number[] = [7, 3, 0]

// For each day in the array:
for (const daysBefore of daysBeforeArray) {
  const notificationDate = new Date(dueDate);
  notificationDate.setDate(notificationDate.getDate() - daysBefore);
  notificationDate.setHours(9, 0, 0, 0); // 9 AM
  
  // Only schedule if in the future
  if (notificationDate > new Date()) {
    // Schedule notification...
  }
}
```

### Lookahead Window
The system checks for bills/loans due in the **next 14 days** (extended from 7 days) to ensure the 7-day reminder gets scheduled in time.

```typescript
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 14); // Next 14 days
```

---

## Testing Instructions

### 1. Create Test Bill/Loan
Create a bill or loan with a due date 8 days from now.

### 2. Expected Behavior
The system should immediately schedule:
- ✅ 7-day reminder (for tomorrow)
- ✅ 3-day reminder (for 5 days from now)  
- ✅ Due date reminder (for 8 days from now)

### 3. Verify Scheduled Notifications
```typescript
import { getAllScheduledNotifications } from '@/lib/notifications';

const notifications = await getAllScheduledNotifications();
console.log(notifications); // Should show 3 scheduled notifications
```

---

## User Impact

### Positive Changes ✅
- **Better Planning:** 7 days advance notice allows users to plan finances
- **Less Stress:** More time to prepare for payments
- **Flexibility:** Still get reminder at 3 days and on due date

### What Stays the Same ✅
- All notifications still run at **9 AM**
- Still only notifies for **unpaid bills** and **active loans**
- Auto-reschedules when dates change
- Auto-cancels when marked as paid
- Works for both **bills** and **loans** (lender & borrower)

---

## No Code Changes Required For:

- ✅ Profile settings UI (still toggles all notifications)
- ✅ Navigation (tap notification → still navigates correctly)
- ✅ Badge counts (still updates properly)
- ✅ Notification channels (Android categories unchanged)
- ✅ Email notifications (separate system, unaffected)
- ✅ Singil instant notifications (still works the same)

---

## Summary

This is a simple but impactful change that gives users **double the advance notice** for their upcoming financial obligations. The system automatically handles all the scheduling logic, so no user action is required.

**Old:** 3 days warning  
**New:** 7 days warning + 3 days warning

---

**Status:** ✅ Complete - Ready for testing  
**Breaking Changes:** None  
**Migration Required:** None
