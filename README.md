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
composer run dev
```

**What this does:**
- Starts PHP development server on `http://localhost:8000`
- Runs queue worker for processing jobs
- Starts Pail for real-time log monitoring
- Runs Vite for asset compilation

**Important:** The backend binds to `0.0.0.0` automatically so your phone can reach the server over WiFi.

**Test it:**
- From PC: http://localhost:8000/api/health
- From phone: http://YOUR_PC_IP:8000/api/health

---

## Step 3 — Start the React Native App

```bash
cd mysalapi-app
npm start
```

Then:
- Press **A** to open in Android emulator, OR
- Scan the QR code with **Expo Go 57** app on your Android phone

**Requirements:**
- Expo SDK 57
- Expo Go 57 on your device
- Node.js installed

---

## Step 4 — Build the Android APK (for submission)

```bash
cd mysalapi-app
npx expo install eas-cli
npx eas build --platform android --profile preview
```

---

## Environment Variables

### `mysalapi-app/.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://afqsmrwbwnnldpjouhxb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### `mysalapi-backend/.env` (already configured)

```env
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
| **Avatar Picker (12 avatars)** | ✅ |
| **Local Notifications Support (Expo SDK 57)** | ✅ |
| **Centered Success Popups with Smooth Animations** | ✅ |
| **Date Picker Auto-scroll to Current Date** | ✅ |

---

## Recent Updates (Art Branch)

### 🎨 New Features
- **Avatar Picker System**: Users can select from 12 unique avatars for their profile
- **Local Notifications**: Expo SDK 57 with `expo-notifications` and `expo-device` packages installed
- **Improved Date Picker UX**: Auto-scrolls to current month/date on open (no more scrolling from January!)

### ✨ UI/UX Improvements
- **Success Popup Enhancement**: 
  - Centered in the middle of screen
  - Full-screen modal with backdrop
  - Background form automatically hidden when success appears
  - Smooth 3-step animation (~620ms total) with no delays
- **Expo SDK Upgrade**: Upgraded from SDK 54 to SDK 57 for latest features and compatibility

### 🗄️ Database Updates
- Added `avatar_id` column (1-12) to users table
- Added `profile_completed` flag for onboarding tracking
- Removed username field (users already have first/last name)

### 🔧 Bug Fixes
- Fixed success popup positioning (was below form, now centered)
- Fixed success popup visibility (form now hidden immediately)
- Fixed animation performance (removed delays for smooth flow)
- Fixed date picker starting position (now starts at current date)
- Fixed Expo SDK version mismatch (SDK 54 → SDK 57)

---

## Tech Stack

- **Frontend**: React Native (Expo SDK 57), TypeScript
- **Backend**: Laravel 11, PHP 8.3
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Email**: Brevo (SendinBlue)
- **State Management**: React Context + Zustand
- **UI Components**: React Native Paper, Custom Components
- **Animations**: React Native Reanimated, Animated API

---

## Development Notes

- Backend runs multiple services via `composer run dev` (server, queue, logs, vite)
- Use `--host=0.0.0.0` for backend if running on physical device over WiFi
- Expo Go 57 required on device for testing
- All SQL migrations have been applied to Supabase
- `.env` files are in `.gitignore` for security

---

## Repository

**Branch**: art  
**GitHub**: https://github.com/krizxei/MySalapiMobile

For detailed changes, see [CHANGELOG.md](./CHANGELOG.md)
