# 🚀 Quick Start: Push Notifications

## 5-Minute Setup

### Step 1: Database (1 min)

1. Go to: https://supabase.com/dashboard/project/afqsmrwbwnnldpjouhxb/sql/new
2. Copy & paste from: `mysalapi-backend/database/add-push-token-column.sql`
3. Click **Run**
4. Done! ✅

### Step 2: Rebuild App (2 min)

```bash
cd mysalapi-app
npx expo prebuild --clean
```

### Step 3: Run on Physical Device (2 min)

**Android:**
```bash
npx expo run:android
```

**iOS:**
```bash
npx expo run:ios
```

⚠️ **IMPORTANT:** Must use **physical device**, not emulator!

---

## Quick Test (30 seconds)

1. Open app on physical device
2. Grant notification permission
3. Go to **Profile** tab
4. Scroll to **Push Notifications**
5. Ensure "Enable Push Notifications" is **ON**
6. Go to **Budget** tab
7. Add a bill due tomorrow
8. Check notification tray - you should see notification scheduling confirmation!

---

## What You Get

✅ Bill reminders (3 days, 1 day, due date)  
✅ Loan reminders (for lenders & borrowers)  
✅ Overdue alerts  
✅ Tap notification → navigate to screen  
✅ Badge counts  
✅ Works offline  
✅ Auto-schedules on create/update  
✅ Cancels on payment  

---

## Troubleshooting

**Not seeing notifications?**

1. Check it's a **physical device** (not emulator)
2. Check **Settings > Notifications > MySalapi** is enabled
3. Check **Profile > Push Notifications** is ON
4. Create bill with due date **tomorrow** (not next week)
5. Check console for "✅ Notifications scheduled successfully"

**Still not working?**

```typescript
// Add this to Profile screen to test:
import { sendImmediateNotification } from '@/lib/notifications';

<TouchableOpacity onPress={() => sendImmediateNotification('Test', 'It works!')}>
  <Text>Test Notification</Text>
</TouchableOpacity>
```

---

## For Your Thesis Demo

1. Open **Profile** → Show notification settings
2. Create test bill due tomorrow
3. Run quick test (see above)
4. Show notification appearing
5. Tap notification → Show navigation

**Time needed:** 3 minutes

---

## Files to Review

- `lib/notifications.ts` - Main service (300+ lines)
- `hooks/useNotifications.ts` - Integration hook
- `hooks/useScheduleNotifications.ts` - Auto-scheduler
- `app/(tabs)/profile.tsx` - Settings UI

---

## That's It!

You now have a complete push notification system! 🎉

**Questions?** Check:
- `PUSH-NOTIFICATIONS-SETUP.md` (detailed guide)
- `TESTING-NOTIFICATIONS.md` (test procedures)
- `PUSH-NOTIFICATIONS-FEATURE-SUMMARY.md` (complete docs)
