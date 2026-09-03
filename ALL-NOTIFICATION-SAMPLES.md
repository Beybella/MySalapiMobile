# 📬 MySalapi - Complete Notification Samples

This document contains all notification samples from the MySalapi system, including both **Push Notifications** and **Email Notifications**.

---

## 📱 PUSH NOTIFICATIONS (In-App)

### 1. Bill Reminders (Automatic)

#### 7 Days Before Due Date
```
╔════════════════════════════════════╗
║ 💰 Bill Reminder                  ║
║                                    ║
║ Your bill "Electric Bill" of       ║
║ ₱2,500.00 is due in 7 days        ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### 3 Days Before Due Date
```
╔════════════════════════════════════╗
║ 💰 Bill Reminder                  ║
║                                    ║
║ Your bill "Water Bill" of          ║
║ ₱850.00 is due in 3 days          ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### Due Date (Today)
```
╔════════════════════════════════════╗
║ ⚠️ Bill Due Today                 ║
║                                    ║
║ Your bill "Internet Bill" of       ║
║ ₱1,699.00 is due TODAY!           ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

---

### 2. Loan Reminders (Automatic) - As Borrower

#### 7 Days Before Due Date
```
╔════════════════════════════════════╗
║ 🤝 Loan Reminder                  ║
║                                    ║
║ Loan "Emergency loan" (₱5,000.00)  ║
║ is due in 7 days - pay payment     ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### 3 Days Before Due Date
```
╔════════════════════════════════════╗
║ 🤝 Loan Reminder                  ║
║                                    ║
║ Loan "Medical expenses" (₱3,500.00)║
║ is due in 3 days - pay payment     ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### Due Date (Today)
```
╔════════════════════════════════════╗
║ ⚠️ Loan Due Today                 ║
║                                    ║
║ Loan "Tuition fee" (₱10,000.00)    ║
║ is due TODAY - pay payment         ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

---

### 3. Loan Reminders (Automatic) - As Lender

#### 7 Days Before Due Date
```
╔════════════════════════════════════╗
║ 🤝 Loan Reminder                  ║
║                                    ║
║ Loan "Cash advance" (₱2,000.00)    ║
║ is due in 7 days - receive payment ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### 3 Days Before Due Date
```
╔════════════════════════════════════╗
║ 🤝 Loan Reminder                  ║
║                                    ║
║ Loan "Personal loan" (₱15,000.00)  ║
║ is due in 3 days - receive payment ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### Due Date (Today)
```
╔════════════════════════════════════╗
║ ⚠️ Loan Due Today                 ║
║                                    ║
║ Loan "Business loan" (₱25,000.00)  ║
║ is due TODAY - receive payment     ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

---

### 4. Singil (Payment Reminder) - Instant Push ⭐ NEW!

```
╔════════════════════════════════════╗
║ 💰 Payment Reminder from          ║
║    Juan Dela Cruz                  ║
║                                    ║
║ You have a payment reminder of     ║
║ ₱5,000.00. Check your email for    ║
║ payment details.                   ║
║                                    ║
║ [Tap to view loan]                 ║
╚════════════════════════════════════╝
```

---

### 5. Overdue Notifications (Urgent)

#### Overdue Bill
```
╔════════════════════════════════════╗
║ 🚨 Bill Overdue                   ║
║                                    ║
║ "Credit Card" (₱8,500.00) is       ║
║ 2 day(s) overdue!                  ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

#### Overdue Loan
```
╔════════════════════════════════════╗
║ 🚨 Loan Overdue                   ║
║                                    ║
║ "Car repair loan" (₱12,000.00) is  ║
║ 5 day(s) overdue!                  ║
║                                    ║
║ [Tap to view]                      ║
╚════════════════════════════════════╝
```

---

## 📧 EMAIL NOTIFICATIONS

### 1. Singil (Loan Collection Email)

**Subject:** Payment Reminder from Juan Dela Cruz via MySalapi

```html
┌──────────────────────────────────────────────┐
│ MySalapi — Payment Reminder                  │
├──────────────────────────────────────────────┤
│                                              │
│ Hi,                                          │
│                                              │
│ You have an outstanding payment to           │
│ Juan Dela Cruz.                              │
│                                              │
│          ₱5,000.00                           │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ Purpose: Emergency loan               │   │
│ │ Due Date: August 20, 2026            │   │
│ │ Payment Method: GCash                │   │
│ │ Payment Details: 0917-123-4567       │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ Please settle this at your earliest          │
│ convenience.                                 │
│                                              │
│ MySalapi · Automated payment reminder        │
└──────────────────────────────────────────────┘
```

---

### 2. Bill Reminder Email

**Subject:** Bill Reminder: Electric Bill due August 25, 2026

```html
┌──────────────────────────────────────────────┐
│ MySalapi — Bill Reminder                     │
├──────────────────────────────────────────────┤
│                                              │
│ Your bill is coming due soon!                │
│                                              │
│          ₱2,500.00                           │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ Bill: Electric Bill                  │   │
│ │ Due Date: August 25, 2026            │   │
│ │ Days Left: 3 days                    │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ Make sure you have enough funds ready.       │
│                                              │
│ MySalapi · Automated bill reminder           │
└──────────────────────────────────────────────┘
```

---

### 3. Group Expense Reminder (Ambagan)

**Subject:** Group Expense Reminder: Birthday Party — ₱500.00

```html
┌──────────────────────────────────────────────┐
│ MySalapi — Group Expense Reminder            │
├──────────────────────────────────────────────┤
│                                              │
│ Maria Santos is collecting for               │
│ Birthday Party.                              │
│                                              │
│          ₱500.00                             │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ Group: Birthday Party                │   │
│ │ Payment Method: GCash                │   │
│ │ Payment Details: 0918-765-4321       │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ Please settle your share at your earliest    │
│ convenience.                                 │
│                                              │
│ MySalapi · Automated group expense reminder  │
└──────────────────────────────────────────────┘
```

---

### 4. Budget Shortfall Alert

**Subject:** MySalapi — Budget Shortfall Alert

```html
┌──────────────────────────────────────────────┐
│ MySalapi — Budget Shortfall Alert            │
├──────────────────────────────────────────────┤
│                                              │
│ ⚠️ Warning: Budget Shortfall                 │
│                                              │
│ Your upcoming bills exceed your budget by:   │
│                                              │
│          ₱3,250.00                           │
│                                              │
│ Upcoming Bills:                              │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ Electric Bill                        │   │
│ │ ₱2,500.00 · Due: August 25, 2026    │   │
│ │                                      │   │
│ │ Water Bill                           │   │
│ │ ₱850.00 · Due: August 28, 2026      │   │
│ │                                      │   │
│ │ Internet Bill                        │   │
│ │ ₱1,699.00 · Due: August 30, 2026    │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ Total Bills: ₱5,049.00                       │
│ Current Budget: ₱1,799.00                    │
│ Shortfall: ₱3,250.00                         │
│                                              │
│ Consider adjusting your budget or finding    │
│ additional income sources.                   │
│                                              │
│ MySalapi · Budget management assistant       │
└──────────────────────────────────────────────┘
```

---

## 🔔 NOTIFICATION COMPARISON

### Same Event: Singil Sent by Lender

**BORROWER RECEIVES BOTH:**

#### 1. Push Notification (Instant)
```
╔════════════════════════════════════╗
║ 💰 Payment Reminder from          ║
║    Juan Dela Cruz                  ║
║                                    ║
║ You have a payment reminder of     ║
║ ₱5,000.00. Check your email for    ║
║ payment details.                   ║
║                                    ║
║ [Tap to view loan]                 ║
╚════════════════════════════════════╝
```

#### 2. Email Notification (Detailed)
```
Subject: Payment Reminder from Juan Dela Cruz via MySalapi

Full email with:
- Amount: ₱5,000.00
- Purpose: Emergency loan
- Due Date: August 20, 2026
- Payment Method: GCash
- Payment Details: 0917-123-4567
```

**Why Both?**
- **Push:** Quick alert, tap to open app
- **Email:** Complete payment information, permanent record

---

## 📊 NOTIFICATION SCHEDULE SUMMARY

### Bills & Loans (Automatic)
| Days Before Due | Time  | Icon | Title |
|----------------|-------|------|-------|
| **7 days** | 9:00 AM | 💰 | Bill/Loan Reminder |
| **3 days** | 9:00 AM | 💰 | Bill/Loan Reminder |
| **Due Date** | 9:00 AM | ⚠️ | Bill/Loan Due Today |
| **Overdue** | Next hour | 🚨 | Bill/Loan Overdue |

### Singil (Manual)
| Trigger | Time | Icon | Title |
|---------|------|------|-------|
| Lender sends | Instant | 💰 | Payment Reminder from [Name] |

---

## 🎨 NOTIFICATION ICONS LEGEND

| Icon | Meaning | Used For |
|------|---------|----------|
| 💰 | Money/Payment | Regular reminders (7 days, 3 days) |
| ⚠️ | Warning | Due today notifications |
| 🚨 | Urgent/Critical | Overdue items |
| 🤝 | Agreement/Deal | Loan reminders |
| 🔔 | General notification | Due today items |
| 📅 | Calendar/Schedule | Early reminders (7 days) |

---

## 📱 ANDROID NOTIFICATION CHANNELS

MySalapi creates separate notification channels for better organization:

### 1. Bills Channel
- **Name:** "Bill Reminders"
- **Importance:** High
- **Description:** "Notifications for upcoming bill payments"
- **Color:** Green (#32A08E)
- **Vibration:** [0, 250, 250, 250]

### 2. Loans Channel
- **Name:** "Loan Reminders"
- **Importance:** High
- **Description:** "Notifications for loan due dates"
- **Color:** Gold (#D9BF77)
- **Vibration:** [0, 250, 250, 250]

### 3. Overdue Channel
- **Name:** "Overdue Alerts"
- **Importance:** MAX (Critical)
- **Description:** "Urgent notifications for overdue items"
- **Color:** Red (#DC3545)
- **Vibration:** [0, 500, 250, 500] (more intense)

### 4. Default Channel
- **Name:** "default"
- **Importance:** MAX
- **Description:** General notifications
- **Color:** Green (#32A08E)
- **Vibration:** [0, 250, 250, 250]

**User Control:** Users can customize each channel in Android Settings → Apps → MySalapi → Notifications

---

## 🧪 TESTING SAMPLES

### Test Bill Notification (7 days)
```javascript
import { scheduleBillNotification } from '@/lib/notifications';

const testDate = new Date();
testDate.setDate(testDate.getDate() + 7); // Due in 7 days

await scheduleBillNotification(
  'test-bill-id',
  'Test Electric Bill',
  2500.00,
  testDate
);

// Expected: Immediate notification scheduled for tomorrow at 9 AM
```

### Test Loan Notification (3 days, as borrower)
```javascript
import { scheduleLoanNotification } from '@/lib/notifications';

const testDate = new Date();
testDate.setDate(testDate.getDate() + 3); // Due in 3 days

await scheduleLoanNotification(
  'test-loan-id',
  'Test Personal Loan',
  5000.00,
  testDate,
  false // false = borrower
);

// Expected: Notification scheduled for today at 9 AM
```

### Test Immediate Notification
```javascript
import { sendImmediateNotification } from '@/lib/notifications';

await sendImmediateNotification(
  '🎉 Welcome to MySalapi!',
  'Your financial management companion is ready.',
  { type: 'bill', id: 'test', title: 'Welcome' }
);

// Expected: Notification appears immediately
```

---

## 📖 NOTIFICATION MESSAGE TEMPLATES

### Bill Templates
```typescript
// 7 days before
`Your bill "${title}" of ₱${amount.toFixed(2)} is due in 7 days`

// 3 days before
`Your bill "${title}" of ₱${amount.toFixed(2)} is due in 3 days`

// Due date
`Your bill "${title}" of ₱${amount.toFixed(2)} is due TODAY!`

// Overdue
`"${title}" (₱${amount.toFixed(2)}) is ${daysPastDue} day(s) overdue!`
```

### Loan Templates (Borrower)
```typescript
// 7 days before
`Loan "${purpose}" (₱${amount.toFixed(2)}) is due in 7 days - pay payment`

// 3 days before
`Loan "${purpose}" (₱${amount.toFixed(2)}) is due in 3 days - pay payment`

// Due date
`Loan "${purpose}" (₱${amount.toFixed(2)}) is due TODAY - pay payment`
```

### Loan Templates (Lender)
```typescript
// 7 days before
`Loan "${purpose}" (₱${amount.toFixed(2)}) is due in 7 days - receive payment`

// 3 days before
`Loan "${purpose}" (₱${amount.toFixed(2)}) is due in 3 days - receive payment`

// Due date
`Loan "${purpose}" (₱${amount.toFixed(2)}) is due TODAY - receive payment`
```

### Singil Template (Push)
```typescript
`You have a payment reminder of ₱${amount.toFixed(2)}. Check your email for payment details.`
```

---

## 🎯 NOTIFICATION DATA STRUCTURE

### Push Notification Data
```typescript
interface NotificationData {
  type: 'bill' | 'loan' | 'overdue';
  id: string;              // Item ID in database
  title: string;           // Bill title or loan purpose
  amount?: number;         // Amount in PHP
  dueDate?: string;        // ISO date string
}
```

### Example Data Object
```typescript
{
  type: 'bill',
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Electric Bill',
  amount: 2500.00,
  dueDate: '2026-08-25T00:00:00.000Z'
}
```

---

## 📋 COMPLETE NOTIFICATION LIST

### Push Notifications (7 types)
1. ✅ Bill Reminder (7 days)
2. ✅ Bill Reminder (3 days)
3. ✅ Bill Due Today
4. ✅ Loan Reminder (7 days) - Lender & Borrower
5. ✅ Loan Reminder (3 days) - Lender & Borrower
6. ✅ Loan Due Today - Lender & Borrower
7. ✅ Singil Received (Instant)
8. ✅ Overdue Alert (Bills & Loans)

### Email Notifications (4 types)
1. ✅ Singil (Loan Collection)
2. ✅ Bill Reminder
3. ✅ Group Expense Reminder (Ambagan)
4. ✅ Budget Shortfall Alert

**Total:** 11 unique notification types

---

## 🔗 NAVIGATION FROM NOTIFICATIONS

When user taps a notification:

| Notification Type | Navigation Target |
|------------------|------------------|
| Bill (any) | Budget Tab (`/(tabs)/budget`) |
| Loan (any) | Loan Detail Screen (`/loan-detail?id={loanId}`) |
| Overdue (bill) | Budget Tab |
| Overdue (loan) | Loan Detail Screen |
| Singil | Loan Detail Screen |

---

## ✨ SPECIAL FEATURES

### Smart Scheduling
- ✅ Auto-schedules when bills/loans created
- ✅ Auto-reschedules when dates updated
- ✅ Auto-cancels when marked as paid
- ✅ Only notifies for unpaid/active items
- ✅ 14-day lookahead window

### Platform Features
- ✅ Badge count on app icon
- ✅ Sound & vibration
- ✅ Android notification channels
- ✅ Tap to navigate
- ✅ Works when app is closed
- ✅ Persistent notifications

### Dual System
- ✅ Push notifications (fast, local)
- ✅ Email notifications (detailed, permanent)
- ✅ Singil sends both simultaneously
- ✅ Each system independently toggleable

---

**Document Version:** 1.0  
**Last Updated:** August 15, 2026  
**Total Notification Types:** 11  
**System Status:** ✅ Complete & Ready
