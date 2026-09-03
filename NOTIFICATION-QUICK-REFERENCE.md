# 📱 MySalapi Notifications - Quick Reference

---

## 🔔 PUSH NOTIFICATIONS

### Bill Reminders
```
Day -7  │ 💰 Bill Reminder
        │ "Electric Bill" ₱2,500 due in 7 days
        │
Day -3  │ 💰 Bill Reminder  
        │ "Electric Bill" ₱2,500 due in 3 days
        │
Day 0   │ ⚠️ Bill Due Today
        │ "Electric Bill" ₱2,500 due TODAY!
```

### Loan Reminders (Borrower)
```
Day -7  │ 🤝 Loan Reminder
        │ "Emergency loan" ₱5,000 due in 7 days - pay payment
        │
Day -3  │ 🤝 Loan Reminder
        │ "Emergency loan" ₱5,000 due in 3 days - pay payment
        │
Day 0   │ ⚠️ Loan Due Today
        │ "Emergency loan" ₱5,000 due TODAY - pay payment
```

### Loan Reminders (Lender)
```
Day -7  │ 🤝 Loan Reminder
        │ "Cash advance" ₱2,000 due in 7 days - receive payment
        │
Day -3  │ 🤝 Loan Reminder
        │ "Cash advance" ₱2,000 due in 3 days - receive payment
        │
Day 0   │ ⚠️ Loan Due Today
        │ "Cash advance" ₱2,000 due TODAY - receive payment
```

### Singil (Instant)
```
NOW     │ 💰 Payment Reminder from Juan Dela Cruz
        │ You have a payment reminder of ₱5,000
        │ Check your email for payment details
```

### Overdue Alerts
```
Past    │ 🚨 Bill Overdue
Due     │ "Credit Card" ₱8,500 is 2 day(s) overdue!
        │
        │ 🚨 Loan Overdue
        │ "Car repair" ₱12,000 is 5 day(s) overdue!
```

---

## 📧 EMAIL NOTIFICATIONS

### 1. Singil (Loan Collection)
```
TO: borrower@email.com
SUBJECT: Payment Reminder from Juan Dela Cruz via MySalapi

╔════════════════════════════════╗
║ You have an outstanding        ║
║ payment to Juan Dela Cruz.     ║
║                                ║
║ ₱5,000.00                      ║
║                                ║
║ Purpose: Emergency loan        ║
║ Due Date: August 20, 2026      ║
║ Method: GCash                  ║
║ Details: 0917-123-4567         ║
╚════════════════════════════════╝
```

### 2. Bill Reminder
```
TO: user@email.com
SUBJECT: Bill Reminder: Electric Bill due August 25, 2026

╔════════════════════════════════╗
║ Your bill is coming due soon!  ║
║                                ║
║ ₱2,500.00                      ║
║                                ║
║ Bill: Electric Bill            ║
║ Due Date: August 25, 2026      ║
║ Days Left: 3 days              ║
╚════════════════════════════════╝
```

### 3. Group Expense (Ambagan)
```
TO: member@email.com
SUBJECT: Group Expense Reminder: Birthday Party — ₱500.00

╔════════════════════════════════╗
║ Maria Santos is collecting for ║
║ Birthday Party.                ║
║                                ║
║ ₱500.00                        ║
║                                ║
║ Group: Birthday Party          ║
║ Method: GCash                  ║
║ Details: 0918-765-4321         ║
╚════════════════════════════════╝
```

### 4. Budget Shortfall
```
TO: user@email.com
SUBJECT: MySalapi — Budget Shortfall Alert

╔════════════════════════════════╗
║ ⚠️ Warning: Budget Shortfall   ║
║                                ║
║ Shortfall: ₱3,250.00           ║
║                                ║
║ Electric: ₱2,500 (Aug 25)      ║
║ Water: ₱850 (Aug 28)           ║
║ Internet: ₱1,699 (Aug 30)      ║
║                                ║
║ Total: ₱5,049                  ║
║ Budget: ₱1,799                 ║
╚════════════════════════════════╝
```

---

## 📊 SCHEDULE TIMELINE

```
DAY -7  ───────┬─────────────────────────────┐
               │ 9:00 AM                      │
               │ 💰 7-day reminder            │
               │ (Bills & Loans)              │
               └──────────────────────────────┘

DAY -3  ───────┬─────────────────────────────┐
               │ 9:00 AM                      │
               │ 💰 3-day reminder            │
               │ (Bills & Loans)              │
               └──────────────────────────────┘

DAY 0   ───────┬─────────────────────────────┐
(DUE DATE)     │ 9:00 AM                      │
               │ ⚠️ Due today alert           │
               │ (Bills & Loans)              │
               └──────────────────────────────┘

OVERDUE ───────┬─────────────────────────────┐
               │ Next hour                    │
               │ 🚨 Overdue alert             │
               │ (Recurring)                  │
               └──────────────────────────────┘

ANYTIME ───────┬─────────────────────────────┐
               │ Instant                      │
               │ 💰 Singil notification       │
               │ (When lender sends)          │
               └──────────────────────────────┘
```

---

## 🎯 NOTIFICATION MATRIX

| Type | Push | Email | Trigger | Frequency |
|------|------|-------|---------|-----------|
| **Bill (7 days)** | ✅ | ✅* | Auto | Once |
| **Bill (3 days)** | ✅ | ✅* | Auto | Once |
| **Bill (Due)** | ✅ | ✅* | Auto | Once |
| **Loan (7 days)** | ✅ | ❌ | Auto | Once |
| **Loan (3 days)** | ✅ | ❌ | Auto | Once |
| **Loan (Due)** | ✅ | ❌ | Auto | Once |
| **Singil** | ✅ | ✅ | Manual | Once |
| **Group Expense** | ❌ | ✅ | Manual | Once |
| **Budget Alert** | ❌ | ✅ | Auto | Once |
| **Overdue** | ✅ | ❌ | Auto | Recurring |

\* Email optional, user can disable in settings

---

## 🔧 USER CONTROLS (Profile Screen)

### Push Notifications Section
```
☑️ Enable Push Notifications ─────┐
  ├─ ☑️ Bill Due Date Alerts       │ Master toggle
  └─ ☑️ Loan Payment Reminders     │ for all push
                                   │ notifications
⚠️ Requires development build      │
```

### Email Notifications Section
```
☑️ Bill Reminders (via Email) ────┐
   Receive bill reminders in inbox │
                                   │ Individual
☑️ Loan Collection - Singil ───────┤ toggles
   Send payment reminders to others│
                                   │
☑️ Group Expense Reminders ────────┤
   Notify group members            │
```

---

## 💡 QUICK FACTS

### Push Notifications
- ⏰ **Time:** 9:00 AM daily
- 📱 **Platform:** Native (iOS/Android)
- 🔋 **Works Offline:** Yes (for scheduled)
- 🔔 **Badge Count:** Yes
- 👆 **Tap Action:** Navigate to item
- 🎵 **Sound:** Yes
- 📳 **Vibration:** Yes
- 🚀 **Instant:** Yes (for Singil)

### Email Notifications
- ⏰ **Time:** Varies by type
- 📧 **Platform:** Email (Brevo)
- 🌐 **Requires Internet:** Yes
- 📝 **Permanent Record:** Yes
- 🎨 **HTML Styled:** Yes
- 👥 **Reach Non-Users:** Yes
- 📊 **Detailed Info:** Yes

---

## 🎨 ICON GUIDE

| Icon | Meaning | Usage |
|------|---------|-------|
| 💰 | Money | Regular reminders |
| ⚠️ | Warning | Due today |
| 🚨 | Urgent | Overdue |
| 🤝 | Loan | Loan reminders |
| 🔔 | Bell | General alert |
| 📅 | Calendar | Early reminders |

---

## 🔀 NAVIGATION MAP

```
Tap Notification
      │
      ├─ Bill ─────────► Budget Tab
      │                  (/(tabs)/budget)
      │
      ├─ Loan ─────────► Loan Detail
      │                  (/loan-detail?id=xxx)
      │
      ├─ Singil ───────► Loan Detail
      │                  (/loan-detail?id=xxx)
      │
      └─ Overdue ──────► Budget Tab or Loan Detail
                         (depends on item type)
```

---

## 📈 NOTIFICATION COUNT

### Total Types: **11**

**Push:** 8 types
- Bill reminders (3)
- Loan reminders (3)
- Singil (1)
- Overdue (1)

**Email:** 4 types
- Singil (1)
- Bill reminder (1)
- Group expense (1)
- Budget alert (1)

**Overlap:** 1 type (Singil uses both)

---

## 🧪 TEST COMMANDS

### Check Scheduled Notifications
```typescript
import { getAllScheduledNotifications } from '@/lib/notifications';
const all = await getAllScheduledNotifications();
console.log('Scheduled:', all.length);
```

### Cancel All Notifications
```typescript
import { cancelAllNotifications } from '@/lib/notifications';
await cancelAllNotifications();
```

### Send Test Notification
```typescript
import { sendImmediateNotification } from '@/lib/notifications';
await sendImmediateNotification(
  '🧪 Test',
  'This is a test notification',
  { type: 'bill', id: 'test', title: 'Test' }
);
```

### Check Badge Count
```typescript
import { getBadgeCount } from '@/lib/notifications';
const count = await getBadgeCount();
console.log('Badge:', count);
```

---

## 📱 ANDROID CHANNELS

| Channel | Color | Importance | Vibration |
|---------|-------|------------|-----------|
| Bills | 🟢 Green | High | [0,250,250,250] |
| Loans | 🟡 Gold | High | [0,250,250,250] |
| Overdue | 🔴 Red | MAX | [0,500,250,500] |
| Default | 🟢 Green | MAX | [0,250,250,250] |

---

## 🎯 BEST PRACTICES

### For Users
✅ Enable push notifications for instant alerts  
✅ Keep email notifications for permanent records  
✅ Use Singil for collecting debt from borrowers  
✅ Check badge count regularly  
✅ Tap notifications to quickly navigate  

### For Developers
✅ Use development build for testing push  
✅ Run SQL migration before using push tokens  
✅ Test with bills/loans 7+ days in future  
✅ Verify 14-day lookahead window  
✅ Check notification permissions on first launch  

---

**Version:** 1.0  
**Date:** August 15, 2026  
**Status:** ✅ Production Ready
