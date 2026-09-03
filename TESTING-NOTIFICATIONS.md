# 🧪 Testing Push Notifications

## Quick Start

### Option 1: Test from Profile Screen

1. Open the MySalapi app on your **physical device**
2. Navigate to **Profile** tab
3. Look for **Push Notifications** section
4. Toggle **Enable Push Notifications** ON
5. Create a bill with due date tomorrow
6. Wait for notification!

### Option 2: Use Test Functions

Add this to any screen in your app (e.g., Profile):

```typescript
import { testNotificationSystem } from '../scripts/test-notifications';

// In your component:
<TouchableOpacity onPress={testNotificationSystem}>
  <Text>🧪 Test Notifications</Text>
</TouchableOpacity>
```

## Manual Testing

### Test 1: Immediate Notification

```typescript
import { sendImmediateNotification } from '@/lib/notifications';

// Send right now
await sendImmediateNotification(
  '💰 MySalapi',
  'This is a test notification!'
);
```

### Test 2: Schedule for 1 Minute

```typescript
import { scheduleBillNotification } from '@/lib/notifications';

const testDate = new Date();
testDate.setMinutes(testDate.getMinutes() + 1);

await scheduleBillNotification(
  'test-id',
  'Test Bill',
  1000,
  testDate,
  [0] // Only one notification
);
```

### Test 3: Check What's Scheduled

```typescript
import { getAllScheduledNotifications } from '@/lib/notifications';

const scheduled = await getAllScheduledNotifications();
console.log(`${scheduled.length} notifications scheduled`);
scheduled.forEach(n => {
  console.log(n.content.title, n.trigger);
});
```

## Real-World Testing

### Test Bill Notifications

1. Go to **Budget** tab
2. Click **+ Add Bill**
3. Enter bill details:
   - Title: "Test Electric Bill"
   - Amount: 2500
   - Due Date: Tomorrow
   - Status: Unpaid
4. Save the bill
5. **Check immediately:**
   ```typescript
   const scheduled = await getAllScheduledNotifications();
   console.log('Notifications:', scheduled);
   ```
6. You should see 3 notifications scheduled (if within 7 days)

### Test Loan Notifications

1. Go to **Pautang** tab
2. Create a new loan:
   - Purpose: "Test Loan"
   - Amount: 5000
   - Due Date: 3 days from now
   - Select borrower
3. Save the loan
4. Check for scheduled notifications

### Test Notification Tap

1. Wait for a notification to arrive
2. Tap the notification
3. App should navigate to:
   - **Bill notification** → Budget tab
   - **Loan notification** → Loan Detail screen

## Verify Everything Works

### Checklist

- [ ] Permissions requested on first run
- [ ] Profile shows "Enable Push Notifications" toggle
- [ ] Creating bill schedules 3 notifications (if due within 7 days)
- [ ] Creating loan schedules 3 notifications (if due within 7 days)
- [ ] Updating bill/loan reschedules notifications
- [ ] Marking as paid cancels future notifications
- [ ] Tapping notification navigates to correct screen
- [ ] Badge count increases when notification received
- [ ] Notifications show at correct times
- [ ] Android: 3 notification channels visible in settings
- [ ] iOS: Notifications appear in notification center

## Debugging

### View Console Logs

```typescript
// In useScheduleNotifications.ts
console.log('✅ Notifications scheduled successfully');

// Look for this in your console when:
// - App starts
// - Bill/loan is created
// - Bill/loan is updated
```

### Check Scheduled Count

Add this to your Home screen:

```typescript
import { getAllScheduledNotifications } from '@/lib/notifications';

useEffect(() => {
  getAllScheduledNotifications().then(scheduled => {
    console.log(`📅 ${scheduled.length} notifications scheduled`);
  });
}, []);
```

### Common Issues

**No notifications appearing?**
1. Check device is **physical** (not emulator)
2. Check **Settings > Notifications > MySalapi** is enabled
3. Check **Profile > Push Notifications** is ON
4. Check date is within next 7 days
5. Check bill/loan status is unpaid/active

**Notifications not rescheduling?**
1. Check console for "✅ Notifications scheduled successfully"
2. Check Supabase subscriptions are active
3. Restart app to re-initialize subscriptions

**Notification count seems wrong?**
- Each bill/loan creates 3 notifications (3 days, 1 day, due date)
- Only items within next 7 days are scheduled
- Paid/completed items don't get notifications

## Test Scenarios

### Scenario 1: Upcoming Bill (3 days away)

Expected notifications:
- ✅ 3 days before (today at 9 AM)
- ✅ 1 day before (2 days from now at 9 AM)
- ✅ On due date (3 days from now at 9 AM)

### Scenario 2: Tomorrow's Bill

Expected notifications:
- ✅ Today at 9 AM (1 day before)
- ✅ Tomorrow at 9 AM (due date)

### Scenario 3: Today's Bill

Expected notifications:
- ✅ Today at 9 AM (due date)

### Scenario 4: Bill Due in 10 Days

Expected notifications:
- ❌ None (outside 7-day window)
- Will be scheduled when it enters 7-day window

## Production Testing Checklist

Before thesis defense:

- [ ] Test on Android device
- [ ] Test on iOS device (if available)
- [ ] Test creating multiple bills at once
- [ ] Test editing bill due dates
- [ ] Test marking bills as paid
- [ ] Test with poor network (notifications should still fire)
- [ ] Test with app closed (notifications should still fire)
- [ ] Test with app in background
- [ ] Test notification tap navigation
- [ ] Test badge counts
- [ ] Take screenshots for thesis documentation

## Demo for Thesis Defense

**Recommended Demo Flow:**

1. **Show Profile Settings**
   - Navigate to Profile
   - Show "Push Notifications" section
   - Explain toggles

2. **Create Test Bill**
   - Create bill due tomorrow
   - Show it in Budget tab

3. **Show Scheduled Notifications**
   - Use test script to display scheduled notifications
   - Explain timing (1 day before, due date)

4. **Trigger Immediate Test**
   - Run `quickTest()` function
   - Show notification appearing

5. **Show Notification Tap**
   - Tap notification
   - Show navigation to Budget tab

6. **Show Integration**
   - Explain auto-scheduling
   - Show Supabase subscriptions
   - Explain real-time updates

## Screenshots to Capture

For thesis documentation:

1. 📱 Profile > Push Notifications settings
2. 🔔 Notification permission prompt
3. 📬 Notification in notification tray
4. 🎯 Notification tap → Navigation
5. ⚙️ Android: Notification channels in settings
6. 📊 Multiple notifications scheduled
7. ✅ Notification when app is closed
8. 🔢 Badge count on app icon

---

**Happy Testing! 🚀**

Remember: Push notifications only work on **physical devices**!
