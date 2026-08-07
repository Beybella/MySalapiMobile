# MySalapi — Setup & Run Guide

## Project Structure
```
THESIS 3RD YEAR/
├── mysalapi-app/        ← React Native (Expo) mobile app
├── mysalapi-backend/    ← Laravel PHP API + email service
└── README.md
```

---

## Step 1 — Run the Supabase SQL Schema

1. Go to https://supabase.com/dashboard → your project → **SQL Editor**
2. Open `mysalapi-backend/database/supabase_schema.sql`
3. Paste the entire contents into the SQL Editor
4. Click **Run** — this creates all tables, RLS policies, and the auto-user trigger

---

## Step 2 — Start the Laravel Backend

```bash
cd mysalapi-backend
php artisan serve --host=0.0.0.0 --port=8000
```

> **Important:** You must use `--host=0.0.0.0` so your phone can reach the server over WiFi.
> Using just `php artisan serve` binds to `127.0.0.1` (localhost only) — your phone cannot connect to that.

Backend runs at: http://localhost:8000 (from PC) or http://YOUR_PC_IP:8000 (from phone)
Test it: http://localhost:8000/api/health

---

## Step 3 — Start the React Native App

```bash
cd mysalapi-app
npx expo start
```

Then:
- Press **A** to open in Android emulator, OR
- Scan the QR code with **Expo Go** app on your Android phone

---

## Step 4 — Build the Android APK (for submission)

```bash
cd mysalapi-app
npx expo install eas-cli
npx eas build --platform android --profile preview
```

---

## Environment Variables

### mysalapi-app/.env
```
EXPO_PUBLIC_SUPABASE_URL=https://afqsmrwbwnnldpjouhxb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### mysalapi-backend/.env (already configured)
```
SUPABASE_URL=https://afqsmrwbwnnldpjouhxb.supabase.co
SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_KEY=<your service key>
BREVO_API_KEY=<your brevo api key>
MAIL_FROM_ADDRESS=noreply@mysalapi.app
MAIL_FROM_NAME=MySalapi
```

---

## Features Built

| Feature | Status |
|---------|--------|
| User Registration & Login (Supabase Auth) | ✅ |
| 6-digit PIN lock with biometric fallback | ✅ |
| PIN lockout after 3 failed attempts | ✅ |
| Forgot PIN via password verification | ✅ |
| Change PIN from Profile | ✅ |
| Change Password from Profile | ✅ |
| Personal Expense Ledger with categories | ✅ |
| Bill Reminders with category & edit/delete | ✅ |
| Bill Reminders with email alerts | ✅ |
| Pautang (Bilateral Loan) Ledger | ✅ |
| Singil — automated debt collection email | ✅ |
| Ambagan (Group Expense) Ledger | ✅ |
| Group Singil email | ✅ |
| Smart Budget Planner (Fund Sources) | ✅ |
| Budget Goals with progress tracking | ✅ |
| Spending Limits by category | ✅ |
| Auto bill prioritization by due date | ✅ |
| Shortfall detection & warnings | ✅ |
| Budget health status (Healthy/At Risk/Critical) | ✅ |
| Budget recommendations | ✅ |
| Laravel API + Brevo email service | ✅ |
| Daily cron for bill reminders | ✅ |
| Daily cron for overdue loan notifications | ✅ |
| PostgreSQL RLS security | ✅ |
| Email notification tracking | ✅ |
| Dark mode support | ✅ |
| Drag-to-dismiss bottom sheet modals | ✅ |
