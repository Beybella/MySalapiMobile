# 🔔 MySalapi Notification System - Types & Features

## Two Integrated Notification Systems

MySalapi uses **two complementary notification systems** that work together:

---

## 1. 📱 Push Notifications (In-App)

### Purpose
Alert users directly on their device about upcoming bills and loans, even when the app is closed.

### Technology
- **Platform:** Expo Notifications (Native iOS/Android)
- **Type:** Local scheduled notifications + Remote push (for Singil)
- **Delivery:** Device-based, works offline for scheduled notifications
- **Requirement:** Development build (not Expo Go)

### Features
✅ **Bill Due Date Alerts** (Automatic)
- Automatic reminders 7 days before, 3 days before, and on due date
- Runs at 9 AM daily
- Only for unpaid bills

✅ **Loan Payment Reminders** (Automatic)
- Reminders for both lenders and borrowers
- Same 7-day, 3-day, due date schedule
- Only for active loans

✅ **Singil Notification** (Instant) ⭐ NEW!
- When lender sends Singil email, borrower receives instant push notification
- Message: "💰 Payment Reminder from [Lender Name] - Check your email for payment details"
- Tap to open app and view loan details
- Works even if app is closed

✅ **Smart Scheduling**
- Auto-schedules when bills/loans are created
- Auto-reschedules when dates are updated
- Auto-cancels when marked as paid
- 14-day lookahead window (to catch 7-day reminders)

✅ **Native Features**
- Badge counts on app icon
- Tap notification → Navigate to relevant screen
- Android notification channels
- Custom sounds & vibration

### User Controls (in Profile)
- **Master Toggle:** Enable/Disable all push notifications
- **Bill Alerts:** Toggle bill reminders on/off
- **Loan Reminders:** Toggle loan reminders on/off

### Example Push Notifications

**Automatic Bill Reminder (7 days):**
```
┌────────────────────────────────────┐
│ [MySalapi Logo]                    │
│ Bill Reminder                      │
│                                    │
│ Your bill "Electric Bill" of       │
│ ₱2,500.00 is due in 7 days        │
│                                    │
│ [Tap to view]                      │
└────────────────────────────────────┘
```

**Automatic Bill Reminder (3 days):**
```
┌────────────────────────────────────┐
│ [MySalapi Logo]                    │
│ Bill Reminder                      │
│                                    │
│ Your bill "Electric Bill" of       │
│ ₱2,500.00 is due in 3 days        │
│                                    │
│ [Tap to view]                      │
└────────────────────────────────────┘
```

**Automatic Bill Reminder (Due Date):**
```
┌────────────────────────────────────┐
│ [MySalapi Logo]                    │
│ Bill Due Today                     │
│                                    │
│ Your bill "Electric Bill" of       │
│ ₱2,500.00 is due TODAY!           │
│                                    │
│ [Tap to view]                      │
└────────────────────────────────────┘
```

**Singil Received (Instant):**
```
┌────────────────────────────────────┐
│ [MySalapi Logo]                    │
│ Payment Reminder from              │
│ Juan Dela Cruz                     │
│                                    │
│ You have a payment reminder of     │
│ ₱5,000.00. Check your email for    │
│ payment details.                   │
│                                    │
│ [Tap to view]                      │
└────────────────────────────────────┘
```

---

## 2. 📧 Email Notifications

### Purpose
Send payment reminders and alerts via email, particularly for collecting debt (Singil feature).

### Technology
- **Platform:** Brevo API (formerly Sendinblue)
- **Backend:** Laravel API endpoints
- **Type:** Transactional emails
- **Delivery:** Email inbox
- **Requirement:** Working Laravel backend

### Features
✅ **Bill Reminders (via Email)**
- Automated daily check at 8 AM
- Sends email reminders for upcoming bills
- Professional HTML email template

✅ **Loan Collection - Singil (Manual)**
- Lender manually sends payment reminder to borrower
- Triggered from loan detail screen
- Includes payment details and due date

✅ **Group Expense Reminders**
- Send reminders to group members
- Notify about pending payments

✅ **Budget Shortfall Alerts**
- Warns when funds are insufficient
- Lists all upcoming bills

### User Controls (in Profile)
- **Bill Reminders:** Toggle automated email reminders
- **Loan Collection:** Toggle Singil feature
- **Group Reminders:** Toggle group notifications

### Example Email (Singil)
```
Subject: Payment Reminder from Juan Dela Cruz via MySalapi

Hi, you have an outstanding payment to Juan Dela Cruz.

₱5,000.00

Purpose: Emergency loan
Due Date: 2026-08-20
Payment Method: GCash
Payment Details: 0917-123-4567

Please settle this at your earliest convenience.
```

---

## Comparison Table

| Feature | Push Notifications 📱 | Email Notifications 📧 |
|---------|---------------------|----------------------|
| **Delivery** | Device (instant) | Email inbox (delayed) |
| **Works Offline** | ✅ Yes | ❌ No (requires internet) |
| **Automatic Scheduling** | ✅ Yes | ✅ Yes (for bills) |
| **Manual Sending** | ❌ No | ✅ Yes (Singil) |
| **Instant on Singil** | ✅ Yes (NEW!) | ✅ Yes |
| **Requires Build** | ✅ Yes (dev build) | ❌ No (works in Expo Go) |
| **Backend Required** | ❌ No (client-side) | ✅ Yes (Laravel) |
| **Cost** | Free | Free (300/day limit) |
| **Tap to Navigate** | ✅ Yes | ❌ No |
| **Badge Counts** | ✅ Yes | ❌ No |
| **Notification Channels** | ✅ Yes (Android) | ❌ No |
| **Customizable Sound** | ✅ Yes | ❌ No |
| **Works for Non-Users** | ❌ No | ✅ Yes |

---

## Use Cases

### Use Push Notifications When:
- ✅ User has the app installed
- ✅ Need immediate alerts
- ✅ Want offline functionality
- ✅ Need to navigate to specific screens
- ✅ Reminding yourself about bills/loans

### Use Email Notifications When:
- ✅ Need to reach someone without the app
- ✅ Collecting debt (Singil) from borrowers
- ✅ Sending payment reminders to others
- ✅ Want permanent record in email
- ✅ Recipient prefers email communication

---

## How They Work Together ⭐

### Scenario 1: Personal Bill Reminder
1. **Day -7:** Push notification + Email reminder (optional)
2. **Day -3:** Push notification + Email reminder (optional)
3. **Due Date:** Push notification + Email reminder (optional)

### Scenario 2: Loan Collection (Singil) - INTEGRATED!
1. **Lender:** Taps "Send Singil" button in app
2. **System:** 
   - Sends detailed email to borrower (via Brevo) ✉️
   - Sends instant push notification to borrower (via Expo) 📱
3. **Borrower:** 
   - Receives push: "💰 Payment Reminder from Juan - Check email for details"
   - Taps notification → Opens app → Views loan details
   - Receives email with complete payment information
4. **Lender:** Gets confirmation both email and push were sent

### Scenario 3: Group Expense
1. **Payer:** Creates group expense
2. **System:** Sends email to all members
3. **Members:** Receive payment reminder via email
4. **Payer:** Tracks who's been notified

---

## Profile UI Organization

```
┌─────────────────────────────────────┐
│ Push Notifications (In-App) 📱      │
├─────────────────────────────────────┤
│ ☑ Enable Push Notifications         │
│   ├ ☑ Bill Due Date Alerts          │
│   └ ☑ Loan Payment Reminders        │
│                                     │
│ 💡 Push notifications appear on     │
│    your device even when app is     │
│    closed. Alerts: 7 days, 3 days,  │
│    and due date.                    │
│                                     │
│ ⚠️  Requires development build       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Email Notifications 📧               │
├─────────────────────────────────────┤
│ ☑ Bill Reminders (via Email)        │
│   Receive bill reminders in inbox   │
│                                     │
│ ☑ Loan Collection - Singil          │
│   Send payment reminders to others  │
│                                     │
│ ☑ Group Expense Reminders           │
│   Notify group members              │
│                                     │
│ 📧 Email notifications via Brevo    │
│    API, delivered to registered     │
│    email address.                   │
└─────────────────────────────────────┘
```

---

## Implementation Files

### Push Notifications
- `lib/notifications.ts` - Core service
- `hooks/useNotifications.ts` - Permission & navigation
- `hooks/useScheduleNotifications.ts` - Auto-scheduling
- `app/(tabs)/_layout.tsx` - Integration

### Email Notifications
- `mysalapi-backend/app/Services/BrevoService.php` - Email service
- `mysalapi-backend/app/Http/Controllers/EmailController.php` - API endpoints
- `mysalapi-app/lib/api.ts` - API client
- `mysalapi-app/app/loan-detail.tsx` - Singil button

---

## Summary

**Push Notifications** = Fast, local, automatic, for personal use  
**Email Notifications** = Reliable, reach anyone, manual sending, for collections

Both systems work independently and can be enabled/disabled separately in Profile settings.

---

**Last Updated:** August 14, 2026
