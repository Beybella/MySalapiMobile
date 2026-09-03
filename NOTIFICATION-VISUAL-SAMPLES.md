# 📱 MySalapi Push Notifications - Visual Samples

All push notifications display with the **MySalapi app logo/icon** on the left side, followed by the notification title and message.

---

## 🎨 NOTIFICATION FORMAT

```
┌─────────────────────────────────────────┐
│  [🟢]  Title                            │
│        Message body text                │
│        continues here...                │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘

[🟢] = MySalapi Logo (Green circular icon with coin/money design)
```

---

## 📋 BILL NOTIFICATIONS

### 7 Days Before Due Date
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Reminder                    │
│        Your bill "Electric Bill" of     │
│        ₱2,500.00 is due in 7 days      │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

### 3 Days Before Due Date
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Reminder                    │
│        Your bill "Water Bill" of        │
│        ₱850.00 is due in 3 days        │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

### Due Date (Today)
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Due Today                   │
│        Your bill "Internet Bill" of     │
│        ₱1,699.00 is due TODAY!         │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

---

## 💰 LOAN NOTIFICATIONS - As Borrower

### 7 Days Before Due Date
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Reminder                    │
│        Loan "Emergency loan"            │
│        (₱5,000.00) is due in 7 days -  │
│        pay payment                      │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

### 3 Days Before Due Date
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Reminder                    │
│        Loan "Medical expenses"          │
│        (₱3,500.00) is due in 3 days -  │
│        pay payment                      │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

### Due Date (Today)
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Due Today                   │
│        Loan "Tuition fee" (₱10,000.00)  │
│        is due TODAY - pay payment       │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

---

## 💵 LOAN NOTIFICATIONS - As Lender

### 7 Days Before Due Date
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Reminder                    │
│        Loan "Cash advance"              │
│        (₱2,000.00) is due in 7 days -  │
│        receive payment                  │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

### 3 Days Before Due Date
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Reminder                    │
│        Loan "Personal loan"             │
│        (₱15,000.00) is due in 3 days - │
│        receive payment                  │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

### Due Date (Today)
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Due Today                   │
│        Loan "Business loan"             │
│        (₱25,000.00) is due TODAY -     │
│        receive payment                  │
│                                         │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

---

## 🔔 SINGIL (INSTANT NOTIFICATION)

When lender sends payment reminder via Singil button:

```
┌─────────────────────────────────────────┐
│  [🟢]  Payment Reminder from            │
│        Juan Dela Cruz                   │
│                                         │
│        You have a payment reminder of   │
│        ₱5,000.00. Check your email for │
│        payment details.                 │
│                                         │
│        • MySalapi                       │
│        • just now                       │
└─────────────────────────────────────────┘
```

---

## 🚨 OVERDUE ALERTS

### Overdue Bill
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Overdue                     │
│        "Credit Card" (₱8,500.00) is    │
│        2 day(s) overdue!                │
│                                         │
│        • MySalapi                       │
│        • 1 hour ago                     │
└─────────────────────────────────────────┘
```

### Overdue Loan
```
┌─────────────────────────────────────────┐
│  [🟢]  Loan Overdue                     │
│        "Car repair loan" (₱12,000.00)   │
│        is 5 day(s) overdue!             │
│                                         │
│        • MySalapi                       │
│        • 1 hour ago                     │
└─────────────────────────────────────────┘
```

---

## 📱 ANDROID NOTIFICATION DRAWER

### Collapsed View (Multiple Notifications)
```
┌─────────────────────────────────────────┐
│  [🟢]  MySalapi Reminder                │
│        3 new notifications              │
│                                         │
│        • MySalapi                       │
│        • 5 min ago                      │
└─────────────────────────────────────────┘
```

### Expanded View (Multiple Notifications)
```
┌─────────────────────────────────────────┐
│  [🟢]  MySalapi Reminder                │
│                                         │
│    ▼  Bill Reminder                     │
│       Your bill "Electric Bill" of      │
│       ₱2,500.00 is due in 3 days       │
│                                         │
│    ▼  Loan Reminder                     │
│       Loan "Emergency loan"             │
│       (₱5,000.00) is due in 7 days -   │
│       pay payment                       │
│                                         │
│    ▼  Bill Due Today                    │
│       Your bill "Water Bill" of         │
│       ₱850.00 is due TODAY!            │
│                                         │
│        • MySalapi                       │
│        • 5 min ago                      │
└─────────────────────────────────────────┘
```

---

## 🔔 NOTIFICATION WITH BADGE COUNT

When there are unread notifications:

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────┐                     │
│         │  [🟢]   │  ← App icon         │
│         │   ③    │  ← Red badge (3)    │
│         └─────────┘                     │
│         MySalapi                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 VISUAL ELEMENTS

### App Icon Properties
- **Shape:** Circular
- **Background Color:** Green (#1B4332)
- **Icon Design:** Coin/Money symbol
- **Notification Color:** #32A08E (Teal Green)

### Android Notification Channels

#### Bills Channel
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Reminder                    │ ← Green tint
│        Your bill is due in 3 days       │
│        LED: Green                       │
│        Vibrate: [0,250,250,250]         │
└─────────────────────────────────────────┘
```

#### Loans Channel
```
┌─────────────────────────────────────────┐
│  [🟡]  Loan Reminder                    │ ← Gold tint
│        Loan is due in 7 days            │
│        LED: Gold                        │
│        Vibrate: [0,250,250,250]         │
└─────────────────────────────────────────┘
```

#### Overdue Channel
```
┌─────────────────────────────────────────┐
│  [🔴]  Bill Overdue                     │ ← Red tint
│        Item is 2 days overdue!          │
│        LED: Red                         │
│        Vibrate: [0,500,250,500]         │
└─────────────────────────────────────────┘
```

---

## 📲 LOCK SCREEN NOTIFICATION

### Standard Lock Screen Display
```
┌─────────────────────────────────────────┐
│                                         │
│  🔒  Locked                             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  [🟢]  Bill Reminder              │ │
│  │        Your bill "Electric Bill"  │ │
│  │        of ₱2,500.00 is due in    │ │
│  │        3 days                     │ │
│  │                                   │ │
│  │        MySalapi • now             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Slide to open] [Tap to view]          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔊 NOTIFICATION WITH SOUND

When notification arrives:

```
🔊 Coin sound plays (coinsound.wav)
📳 Device vibrates
🔔 Notification appears

┌─────────────────────────────────────────┐
│  [🟢]  Payment Reminder from            │
│        Juan Dela Cruz                   │
│                                         │
│        You have a payment reminder...   │
│                                         │
│        • MySalapi                       │
│        • just now                       │
└─────────────────────────────────────────┘
```

---

## 👆 TAP ACTIONS

### Tap Notification → Navigate to App

**Bill Notification:**
```
[Tap] → Opens MySalapi → Budget Tab
```

**Loan Notification:**
```
[Tap] → Opens MySalapi → Loan Detail Screen
```

**Singil Notification:**
```
[Tap] → Opens MySalapi → Loan Detail Screen
```

---

## 📊 NOTIFICATION PRIORITY LEVELS

### High Priority (Bills & Loans)
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Reminder                    │
│        Displays at top of notification   │
│        drawer with sound & vibration    │
└─────────────────────────────────────────┘
```

### Max Priority (Overdue & Due Today)
```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Due Today                   │
│        Heads-up notification (pops up   │
│        even during phone use)           │
└─────────────────────────────────────────┘
```

---

## 🌙 SILENT HOURS

Notifications still appear but:
- 🔕 No sound
- 📳 Reduced vibration
- 💤 Do Not Disturb compatible

```
┌─────────────────────────────────────────┐
│  [🟢]  Bill Reminder                    │
│        Your bill "Electric Bill" of     │
│        ₱2,500.00 is due in 3 days      │
│                                         │
│        🔕 Silent mode                   │
│        • MySalapi                       │
│        • now                            │
└─────────────────────────────────────────┘
```

---

## 💡 KEY DESIGN PRINCIPLES

1. **Clean Titles** - No emoji in notification titles
2. **App Branding** - MySalapi logo visible on all notifications
3. **Clear Messaging** - Amount and due date always visible
4. **Consistent Format** - All notifications follow same structure
5. **Action Oriented** - Clear next steps (pay/receive payment)
6. **Professional** - Suitable for financial app

---

## 📝 NOTIFICATION TEXT TEMPLATES

### Bills
```
Title: Bill Reminder / Bill Due Today
Body: Your bill "{title}" of ₱{amount} is due in {days} days
```

### Loans (Borrower)
```
Title: Loan Reminder / Loan Due Today
Body: Loan "{purpose}" (₱{amount}) is due in {days} days - pay payment
```

### Loans (Lender)
```
Title: Loan Reminder / Loan Due Today
Body: Loan "{purpose}" (₱{amount}) is due in {days} days - receive payment
```

### Singil
```
Title: Payment Reminder from {lender_name}
Body: You have a payment reminder of ₱{amount}. Check your email for payment details.
```

### Overdue
```
Title: Bill Overdue / Loan Overdue
Body: "{title}" (₱{amount}) is {days} day(s) overdue!
```

---

## 🎯 USER EXPERIENCE FLOW

```
1. Notification Received
   ↓
2. [🟢 MySalapi Logo] displays with title
   ↓
3. User reads message
   ↓
4. User taps notification
   ↓
5. App opens to relevant screen
   ↓
6. User views full details
   ↓
7. User takes action (pay bill, view loan, etc.)
```

---

## ✨ SUMMARY

**Visual Identity:**
- ✅ MySalapi app logo on every notification
- ✅ Brand color (#32A08E) for notification tint
- ✅ Clean, professional text (no emoji in titles)
- ✅ Consistent formatting across all types

**User Benefits:**
- ✅ Instant brand recognition
- ✅ Professional appearance
- ✅ Clear, readable messages
- ✅ Easy to understand at a glance

**Technical Implementation:**
- ✅ Icon configured in app.json
- ✅ Notification plugin properly set up
- ✅ Android adaptive icon support
- ✅ Color and sound customization

---

**Version:** 2.0 (Logo-Based Design)  
**Date:** August 15, 2026  
**Status:** ✅ Implemented
