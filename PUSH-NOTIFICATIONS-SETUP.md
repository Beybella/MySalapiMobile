# 🔔 MySalapi Push Notifications Setup Guide

## Overview

MySalapi now includes push notifications to remind users about upcoming bills and loan due dates!

## Features

✅ **Bill Due Date Alerts**
- Notifications 3 days before, 1 day before, and on due date
- Urgent notifications for overdue bills

✅ **Loan Payment Reminders**
- Reminders for both lenders and borrowers
- Automatic notifications based on loan status

✅ **Smart Scheduling**
- Automatically schedules notifications when bills/loans are created
- Re-schedules when dates are updated
- Cancels notifications when items are marked as paid

✅ **Customizable Settings**
- Enable/disable push notifications in Profile
- Separate controls for bills and loans
- Works alongside email notifications

## Setup Instructions

### 1. Database Update

Run the SQL migration to add push token storage:

```sql
-- In Supabase SQL Editor
-- Run the contents of: mysalapi-backend/database/add-push-token-column.sql
```

### 2. Mobile App Configuration

The app is already configured! Just rebuild:

```bash
cd mysalapi-app
npx expo prebuild --clean
```

### 3. Testing on Physical Device

⚠️ **Important:** Push notifications only work on **physical devices**, not emulators!

**For Android:**
```bash
npx expo run:android
```

**For iOS:**
```bash
npx expo run:ios
```

## How It Works

### 1. Permission Request

When users first open the app, they'll be asked to allow notifications.

### 2. Automatic Scheduling

When a bill or loan is created with a due date within the next 7 days:
- Notifications are automatically scheduled
- 3 reminders: 3 days before, 1 day before, and on due date

### 3. Real-time Updates

When bills/loans are updated:
- Old notifications are canceled
- New notifications are scheduled based on new dates

### 4. Notification Taps

When users tap a notification:
- **Bill notifications** → Navigate to Budget tab
- **Loan notifications** → Navigate to Loan Detail screen

## Notification Settings

Users can manage notifications in **Profile > Push Notifications**:

- **Enable Push Notifications** - Master toggle
- **Bill Due Date Alerts** - Control bill reminders
- **Loan Payment Reminders** - Control loan reminders

## Notification Channels (Android)

Three notification channels are created:

1. **Bills** - For bill reminders (Green icon)
2. **Loans** - For loan reminders (Gold icon)
3. **Overdue** - For urgent overdue alerts (Red icon)

## Badge Count

The app automatically manages notification badge counts:
- Increments when notifications are received
- Clears when user opens the app

## Testing Notifications

### Test Immediately

```typescript
import { sendImmediateNotification } from '@/lib/notifications';

// Send a test notification right away
await sendImmediateNotification(
  'Test Notification',
  'This is a test from MySalapi!'
);
```

### View Scheduled Notifications

```typescript
import { getAllScheduledNotifications } from '@/lib/notifications';

const scheduled = await getAllScheduledNotifications();
console.log('Scheduled notifications:', scheduled);
```

## Troubleshooting

### Notifications Not Showing Up?

1. **Check device settings**
   - Go to Settings > Notifications
   - Find MySalapi
   - Ensure notifications are enabled

2. **Check app permissions**
   - Open Profile tab
   - Verify "Enable Push Notifications" is ON

3. **Verify scheduled notifications**
   ```typescript
   const scheduled = await getAllScheduledNotifications();
   console.log(`${scheduled.length} notifications scheduled`);
   ```

4. **Check notification channels (Android)**
   - Settings > Apps > MySalapi > Notifications
   - Ensure "Bills", "Loans", and "Overdue" channels are enabled

### Testing Without Waiting

Schedule a notification for 1 minute from now:

```typescript
const testDate = new Date();
testDate.setMinutes(testDate.getMinutes() + 1);

await scheduleBillNotification(
  'test-bill-id',
  'Test Bill',
  1000,
  testDate,
  [0] // Only send one notification
);
```

## Production Considerations

### Expo Push Token (Remote Notifications)

For production, you can send remote push notifications using Expo's push service:

1. **Add EAS project ID** to `app.json`:
   ```json
   {
     "extra": {
       "eas": {
         "projectId": "your-project-id"
       }
     }
   }
   ```

2. **Push tokens are automatically saved** to user profiles

3. **Use Expo Push API** to send notifications from your backend

### Rate Limits

- **Local notifications:** No limit
- **Expo Push Service:** 600 notifications per second

## API Reference

### Main Functions

```typescript
// Request permissions
await registerForPushNotifications();

// Schedule bill notification
await scheduleBillNotification(billId, title, amount, dueDate);

// Schedule loan notification
await scheduleLoanNotification(loanId, title, amount, dueDate, isLender);

// Cancel a notification
await cancelNotification(notificationId);

// Cancel all notifications
await cancelAllNotifications();

// Get badge count
const count = await getBadgeCount();

// Set badge count
await setBadgeCount(5);

// Clear badge
await clearBadgeCount();
```

## Files Created

### Core Files
- `lib/notifications.ts` - Main notification service
- `hooks/useNotifications.ts` - Notification hook for components
- `hooks/useScheduleNotifications.ts` - Auto-scheduling hook

### Configuration
- `app.json` - Updated with notification plugin
- `app/_layout.tsx` - Integrated notification initialization
- `app/(tabs)/_layout.tsx` - Integrated auto-scheduling
- `app/(tabs)/profile.tsx` - Added notification settings UI

### Database
- `database/add-push-token-column.sql` - SQL migration

## Next Steps

### Future Enhancements

1. **Daily Digest** - Single notification with all due items
2. **Quiet Hours** - Don't send notifications during sleep hours
3. **Custom Notification Times** - Let users choose reminder times
4. **Recurring Notifications** - For recurring bills
5. **Group Payment Reminders** - Notify group members
6. **Payment Confirmation** - Notify when payment is received

## Support

For issues or questions:
1. Check this guide
2. Review console logs
3. Test on a physical device (not emulator!)
4. Verify all setup steps are complete

---

**Status:** ✅ Fully Implemented & Ready for Testing

**Last Updated:** August 14, 2026
