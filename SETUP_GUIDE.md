# 📱 MySalapi - Complete Setup Guide for Team Members

Welcome! This guide will help you set up the **MySalapi** project locally for development and testing.

---

## 🎯 Project Overview

MySalapi is a **comprehensive loan & debt management application** with two main components:

- **Frontend**: React Native (Expo) mobile app - iOS/Android with modern tab-based navigation
- **Backend**: Laravel PHP API with Supabase database & Brevo email integration

### Key Features
- 📊 Dashboard with statistics and interactive calendar
- 💳 Unified records management (Personal expenses, Loans, Group expenses)
- 🔐 PIN-based security with email confirmation
- 📧 Email notifications via Brevo
- 🎯 Budget planning and tracking
- 📅 Due date calendar with color-coded indicators

---

## 🌳 Git Branch Structure

Understanding the branch strategy will help with development:

### **main** - Production-ready base
- Core authentication and keyboard optimization
- Foundation for all features
- Status: Stable

### **svenj** - Calendar features branch
- Interactive calendar with due dates
- Payment tracking interface
- Status: Merged into ara

### **ara** - Feature integration branch
- Combines main + svenj features
- Email confirmation flow with Brevo magiclink
- Password reset functionality
- Enhanced PIN security
- Status: Active feature branch

### **optimized** - Latest development (current)
- Navigation redesign (4 main tabs: Home, Records, Budget, Profile)
- Consolidated records interface with category filtering
- Floating action button for quick-add
- Floating pill-shaped navigation bar
- Success alerts and toast notifications
- Status: Current recommended branch

To work with the latest features:
```bash
git checkout optimized
```

---

## 📋 Prerequisites

Before starting, ensure you have installed:

- **Node.js** 18+ (check: `node --version`)
- **npm** 9+ (check: `npm --version`)
- **PHP** 8.2+ (check: `php --version`)
- **Composer** (check: `composer --version`)
- **Android Studio** (for Android emulator) OR **Expo Go** app on your phone
- **Git** (check: `git --version`)

---

## ⚙️ Step 1 — Clone & Install Dependencies

### 1.1 Clone the repository (if you haven't already)
```bash
git clone <repository-url>
cd "THESIS 3RD YEAR"
```

### 1.2 Switch to optimized branch (recommended)
```bash
git checkout optimized
```

### 1.3 Backend setup
```bash
cd mysalapi-backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env
```

### 1.4 Frontend setup
```bash
cd ../mysalapi-app

# Install Node dependencies
npm install
```

---

## 🔐 Step 2 — Configure Environment Variables

### 2.1 Backend (.env)

Edit **mysalapi-backend/.env** and add/update these values:

```env
# ===== APP SETTINGS =====
APP_NAME=MySalapi
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

# ===== SUPABASE (Database) =====
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# ===== EMAIL (Brevo SMTP) =====
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=your_brevo_smtp_login_here
MAIL_PASSWORD=your_brevo_smtp_key_here
MAIL_FROM_ADDRESS=noreply@mysalapi.com
MAIL_FROM_NAME=MySalapi

# ===== BREVO API =====
BREVO_API_KEY=your_brevo_api_key_here

# ===== DATABASE =====
DB_CONNECTION=sqlite

# ===== SESSION & CACHE =====
SESSION_DRIVER=file
CACHE_STORE=file

# ===== QUEUE & BROADCAST =====
QUEUE_CONNECTION=sync
BROADCAST_CONNECTION=log

# ===== MAINTENANCE =====
APP_MAINTENANCE_DRIVER=file

# ===== LOCALIZATION =====
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

# ===== LOGGING =====
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=debug

# ===== SECURITY =====
BCRYPT_ROUNDS=12
```

### 2.2 Frontend (.env)

Edit **mysalapi-app/.env** and add:

```env
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:8000/api
```

### 2.3 Get Your Supabase Keys

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_KEY`

### 2.4 Get Your Brevo (Email) Credentials

1. Go to [https://app.brevo.com](https://app.brevo.com) and log in (or create a free account)
2. Go to **SMTP & API** in the left sidebar
3. **For SMTP:** copy your login and generate an SMTP key — use these for `MAIL_USERNAME` and `MAIL_PASSWORD`
4. **For API:** click **API Keys** tab → generate a key → use it for `BREVO_API_KEY`

> The app uses Brevo's HTTP API for transactional emails (registration confirmation, bill reminders, alerts). Free tier allows 300 emails/day with no domain required.

---

## 🗄️ Step 3 — Initialize the Database

### 3.1 Run Supabase Schema

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Click **New Query**
3. Open and copy contents of: `mysalapi-backend/database/supabase_schema.sql`
4. Paste into the SQL Editor
5. Click **Run**

This creates:
- User table with Row Level Security (RLS)
- Bill reminders table
- Loan records table
- Payment records table
- Group expenses table
- Auto-triggers for user creation

### 3.2 Generate Laravel App Key

```bash
cd mysalapi-backend
php artisan key:generate
```

---

## 🚀 Step 4 — Start the Backend

```bash
cd mysalapi-backend
php artisan serve --host=0.0.0.0 --port=8000
```

Expected output:
```
INFO  Server running on [http://0.0.0.0:8000].

Press Ctrl+C to stop the server
```

**Test it**:
```bash
curl http://localhost:8000/api/health
```

> **Note**: The `--host=0.0.0.0` flag allows the frontend (on your phone/emulator) to connect from your machine's IP address.

---

## 📲 Step 5 — Start the Frontend

In a **new terminal**:

```bash
cd mysalapi-app
npx expo start
```

**Then choose ONE option:**

### Option A: Android Emulator
1. Press **A** in the terminal
2. Android emulator will start (if not, open Android Studio first)

### Option B: iOS Simulator (Mac only)
1. Press **I** in the terminal
2. iOS simulator will launch

### Option C: Phone
1. Install **Expo Go** app from App Store or Google Play
2. Press **Q** in the terminal to show QR code
3. Scan the QR code with **Expo Go**

---

## 📱 Application Navigation

The optimized branch features a modern 4-tab navigation structure:

### **Home Tab**
- Dashboard with total expenses, loans given, loans owed
- Interactive calendar with bill and loan due dates
- Upcoming bills (next 7 days) and overdue alerts
- MySalapi logo in header
- Quick navigation to records

### **Records Tab**
- Unified interface for all record types
- Category filtering: Personal Expenses, Loans, Groups
- Personal expenses listed by date
- Loans separated into Unsettled and Settled
- Group expenses with payer information
- Tap any record for details

### **Budget Tab**
- Budget planning and tracking
- Spending limits management
- Budget goals visualization

### **Profile Tab**
- User profile management
- Security settings (PIN, password change)
- Account preferences
- Sign out

### **Floating + Button**
- Quick spending entry from any screen
- Fast expense/payment recording
- Success feedback with alerts

---

## 🧪 Step 6 — Test the Application

### Backend Tests
```bash
cd mysalapi-backend
php artisan test
```

### Frontend Development
- App should automatically reload when you save files
- Check terminal for errors
- Test data flows through all tabs

### Key Testing Areas
1. **Authentication**: Login, register, email confirmation, password reset
2. **Calendar**: Due dates display correctly, date selection works
3. **Records**: Filter by category, view details, successful alerts
4. **Navigation**: Tab switching, floating button functionality
5. **Responsive Design**: Test on various screen sizes

---

## ✉️ Email Confirmation Flow (Registration)

When a user registers:

1. **User enters email** in the app
2. **App calls Laravel** with email, password, name, and phone
3. **Laravel creates user in Supabase** using the Admin API
4. **Laravel generates a token** containing email & user ID
5. **Confirmation email is sent via Brevo magiclink** with verification link
6. **User clicks the confirmation link** → redirects to `email-confirmed.html`
7. **Confirmation endpoint** (`/api/auth/confirm-email?token=...`) confirms the user in Supabase
8. **User can now login** with their credentials

### To test email confirmation:

1. Ensure backend is running with Brevo credentials configured
2. Register a new account in the app (use real email or test address)
3. Check your email inbox
4. Click the confirmation link
5. See the "Email Confirmed" success page
6. Log in with your credentials

---

## 🔄 Password Reset Flow

When a user needs to reset their password:

1. **User enters email** on forgot password screen
2. **Laravel generates reset token** with email and timestamp
3. **Brevo sends reset link** with encoded token
4. **User clicks link** → interactive reset page loads
5. **User enters new password** and confirms
6. **Token is validated** and password updated in Supabase
7. **User can login** with new password

---

## 📋 Calendar & Due Dates

The interactive calendar displays:

- **Color-coded dots** for due dates:
  - Blue: Bills only
  - Red: Loans (takes priority)
  - Gray: Paid/settled items

- **Due date modal** shows:
  - Bills due on selected date
  - Loans due on selected date
  - Quick action buttons to record payments

---

## 🐛 Common Issues & Fixes

### Issue: SMTP Connection Refused / Email not sending
**Solution**:
```bash
# Check BREVO_API_KEY is set correctly in .env
# Verify your IP is authorized in Brevo → Settings → Security → Authorized IPs
# Run php artisan config:clear after changing .env
php artisan config:clear
```

### Issue: "Connection refused" on http://localhost:8000
**Solution**:
```bash
# Ensure backend is running
cd mysalapi-backend
php artisan serve

# If port 8000 is in use:
php artisan serve --port=8001
```

### Issue: Expo app won't connect to backend
**Solution**:
1. Get your machine IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `EXPO_PUBLIC_API_URL` in **mysalapi-app/.env**:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:8000/api
   ```
3. Update `APP_URL` in **mysalapi-backend/.env**:
   ```env
   APP_URL=http://YOUR_MACHINE_IP:8000
   ```
4. Restart both backend and frontend

### Issue: Supabase authentication fails
**Solution**:
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check if tables were created: Go to Supabase Dashboard → Table Editor
- Verify RLS policies are enabled

### Issue: Calendar not showing due dates
**Solution**:
- Ensure bill_reminders and loans tables have data
- Check that dates are formatted correctly (YYYY-MM-DD)
- Verify calendar component is receiving data from Supabase

### Issue: Records tab shows "No records found"
**Solution**:
- Check that user has created expenses/loans/groups
- Verify correct category filter is selected
- Check Supabase tables for data ownership (user_id matches)

---

## 📁 Project Structure

```
THESIS 3RD YEAR/
├── mysalapi-backend/          ← Laravel API
│   ├── app/
│   │   ├── Http/Controllers/  ← API endpoints
│   │   ├── Models/            ← Database models
│   │   └── Services/          ← Business logic
│   ├── config/                ← Configuration
│   ├── database/
│   │   ├── migrations/
│   │   └── supabase_schema.sql
│   ├── routes/api.php         ← API routes
│   ├── .env                   ← Environment variables
│   └── composer.json
│
├── mysalapi-app/              ← React Native (Expo)
│   ├── app/
│   │   ├── (auth)/            ← Authentication screens
│   │   └── (tabs)/            ← Main app screens
│   │       ├── home.tsx       ← Dashboard
│   │       ├── records.tsx    ← Records management
│   │       ├── budget.tsx     ← Budget planning
│   │       └── profile.tsx    ← User profile
│   ├── components/
│   │   └── home/              ← Home-specific components
│   ├── context/               ← State management
│   ├── lib/                   ← API & utilities
│   ├── constants/             ← App constants
│   ├── package.json
│   └── app.json
│
├── CHANGES_REPORT.md          ← Detailed development report
├── SETUP_GUIDE.md             ← This file
└── README.md
```

---

## 🤝 Contributing

When making changes:

1. Choose the appropriate branch to base your work:
   ```bash
   git checkout optimized  # For latest features
   git checkout ara        # For feature development
   git checkout main       # For production fixes
   ```

2. Create a new feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes

4. Test locally (see Step 6)

5. Commit with clear messages:
   ```bash
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request with description of changes

---

## 📚 Useful Commands

### Backend

```bash
# Run migrations
php artisan migrate

# Seed database with dummy data
php artisan db:seed

# Check routes
php artisan route:list

# Clear cache
php artisan cache:clear
php artisan config:clear

# View logs
tail -f storage/logs/laravel.log

# Run tests
php artisan test
```

### Frontend

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Reset Expo cache
npx expo start --clear

# Build APK for Android
eas build --platform android

# Check for TypeScript errors
npx tsc --noEmit
```

### Git

```bash
# View branch graph
git log --oneline --graph --all

# Switch to optimized branch
git checkout optimized

# Create new branch from optimized
git checkout -b feature/name optimized

# Merge branch
git merge feature/name
```

---

## 🔗 Helpful Links

- **Supabase Docs**: https://supabase.com/docs
- **Laravel Docs**: https://laravel.com/docs
- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Expo Docs**: https://docs.expo.dev
- **Brevo Docs**: https://developers.brevo.com
- **CHANGES_REPORT.md**: See development history and branch information

---

## 📝 Development Checklist

Before committing, ensure:

- [ ] Code follows project style conventions
- [ ] All TypeScript errors resolved
- [ ] Tested on both Android and iOS (if possible)
- [ ] No console errors or warnings
- [ ] Commit message is clear and descriptive
- [ ] Changes documented in relevant files
- [ ] Related tests pass (if applicable)

---

## ❓ Need Help?

If you encounter issues:

1. Check the **Common Issues** section above
2. Review **CHANGES_REPORT.md** for feature details
3. Check logs in `storage/logs/laravel.log`
4. Check browser console for frontend errors (F12)
5. Review git history: `git log --oneline --all`
6. Ask in the team chat with error details and branch info

---

**Last Updated**: August 11, 2026  
**Version**: 2.0  
**Current Active Branch**: optimized  
**Status**: Production Ready with Latest Features

---

## 📋 Prerequisites

Before starting, ensure you have installed:

- **Node.js** 18+ (check: `node --version`)
- **npm** 9+ (check: `npm --version`)
- **PHP** 8.2+ (check: `php --version`)
- **Composer** (check: `composer --version`)
- **Android Studio** (for Android emulator) OR **Expo Go** app on your phone
- **Git** (check: `git --version`)

---

## ⚙️ Step 1 — Clone & Install Dependencies

### 1.1 Clone the repository (if you haven't already)
```bash
git clone <repository-url>
cd "THESIS 3RD YEAR"
```

### 1.2 Backend setup
```bash
cd mysalapi-backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env
```

### 1.3 Frontend setup
```bash
cd ../mysalapi-app

# Install Node dependencies
npm install
```

---

## 🔐 Step 2 — Configure Environment Variables

### 2.1 Backend (.env)

Edit **mysalapi-backend/.env** and add/update these values:

```env
# ===== APP SETTINGS =====
APP_NAME=MySalapi
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

# ===== SUPABASE (Database) =====
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# ===== EMAIL (Brevo SMTP) =====
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=your_brevo_smtp_login_here
MAIL_PASSWORD=your_brevo_smtp_key_here
MAIL_FROM_ADDRESS=noreply@mysalapi.com
MAIL_FROM_NAME=MySalapi

# ===== BREVO API =====
BREVO_API_KEY=your_brevo_api_key_here

# ===== DATABASE =====
DB_CONNECTION=sqlite

# ===== SESSION & CACHE =====
SESSION_DRIVER=file
CACHE_STORE=file

# ===== QUEUE & BROADCAST =====
QUEUE_CONNECTION=sync
BROADCAST_CONNECTION=log

# ===== MAINTENANCE =====
APP_MAINTENANCE_DRIVER=file

# ===== LOCALIZATION =====
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

# ===== LOGGING =====
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=debug

# ===== SECURITY =====
BCRYPT_ROUNDS=12
```

### 2.2 Get Your Supabase Keys

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_KEY`

### 2.3 Get Your Brevo (Email) Credentials

1. Go to [https://app.brevo.com](https://app.brevo.com) and log in (or create a free account)
2. Go to **SMTP & API** in the left sidebar
3. **For SMTP:** copy your login and generate an SMTP key — use these for `MAIL_USERNAME` and `MAIL_PASSWORD`
4. **For API:** click **API Keys** tab → generate a key → use it for `BREVO_API_KEY`

> The app uses Brevo's HTTP API for transactional emails (Singil, bill reminders, shortfall alerts). Free tier allows 300 emails/day with no domain required.

---

## 🗄️ Step 3 — Initialize the Database

### 3.1 Run Supabase Schema

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Click **New Query**
3. Open and copy contents of: `mysalapi-backend/database/supabase_schema.sql`
4. Paste into the SQL Editor
5. Click **Run**

This creates:
- User table with Row Level Security (RLS)
- Loan record table
- Payment record table
- Auto-trigger for user creation

### 3.2 Generate Laravel App Key

```bash
cd mysalapi-backend
php artisan key:generate
```

---

## 🚀 Step 4 — Start the Backend

```bash
cd mysalapi-backend
php artisan serve --host=0.0.0.0 --port=8000
```

Expected output:
```
INFO  Server running on [http://0.0.0.0:8000].

Press Ctrl+C to stop the server
```

**Test it**:
```bash
curl http://localhost:8000/api/health
```

> **Note**: The `--host=0.0.0.0` flag allows the frontend (on your phone/emulator) to connect from your machine's IP address.

---

## 📲 Step 5 — Start the Frontend

In a **new terminal**:

```bash
cd mysalapi-app
npx expo start
```

**Then choose ONE option:**

### Option A: Android Emulator
1. Press **A** in the terminal
2. Android emulator will start (if not, open Android Studio first)

### Option B: Phone
1. Install **Expo Go** app from Google Play Store
2. Press **Q** in the terminal to show QR code
3. Scan the QR code with **Expo Go**

---

## 🧪 Step 6 — Test the Application

### Backend Tests
```bash
cd mysalapi-backend
php artisan test
```

### Frontend Development
- App should automatically reload when you save files
- Check terminal for errors

---

## ✉️ Email Confirmation Flow (Registration)

When a user registers:

1. **User enters email** in the app
2. **App calls Laravel** with email, password, name, and phone
3. **Laravel creates user in Supabase** using the Admin API (bypassing built-in SMTP which doesn't work reliably)
4. **Laravel generates a token** containing email & user ID
5. **Confirmation email is sent via Brevo** with a link containing the token
6. **User clicks the confirmation link** → redirects to `email-confirmed.html`
7. **Confirmation endpoint** (`/api/auth/confirm-email?token=...`) confirms the user in Supabase
8. **User can now login** with their credentials

### To test email confirmation:

1. Make sure backend is running with Brevo credentials configured
2. Register a new account in the app
3. Check your email inbox (or Brevo dashboard: https://app.brevo.com → Transactional → Logs)
4. Click the confirmation link in the email
5. You should see the "Email Confirmed" page
6. Log in with your credentials

---

## ✉️ Testing Email (Singil Feature)

When debt collection email is triggered:

1. **Check the recipient's inbox directly** — Brevo sends real emails (free tier: 300/day)
2. **Check Backend Logs**:
   ```bash
   Get-Content mysalapi-backend\storage\logs\laravel.log -Tail 30
   ```
3. **Check Brevo dashboard** for send status: https://app.brevo.com → Transactional → Logs

---

## 🐛 Common Issues & Fixes

### Issue: SMTP Connection Refused / Email not sending
**Solution**:
```bash
# Check BREVO_API_KEY is set correctly in .env
# Verify your IP is authorized in Brevo → Settings → Security → Authorized IPs
# Run php artisan config:clear after changing .env
```

### Issue: "Connection refused" on http://localhost:8000
**Solution**:
```bash
# Ensure backend is running
cd mysalapi-backend
php artisan serve

# If port 8000 is in use:
php artisan serve --port=8001
```

### Issue: Expo app won't connect to backend
**Solution**:
1. Get your machine IP: `ipconfig` (Windows)
2. Update `EXPO_PUBLIC_API_URL` in **mysalapi-app/.env**:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:8000/api
   ```
3. Update `APP_URL` in **mysalapi-backend/.env**:
   ```env
   APP_URL=http://YOUR_MACHINE_IP:8000
   ```
4. Restart both backend and frontend

### Issue: Supabase authentication fails
**Solution**:
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check if tables were created: Go to Supabase Dashboard → Table Editor
- Verify RLS policies are enabled

---

## 📁 Project Structure

```
THESIS 3RD YEAR/
├── mysalapi-backend/          ← Laravel API
│   ├── app/
│   │   ├── Http/Controllers/  ← API endpoints
│   │   ├── Models/            ← Database models
│   │   └── Services/          ← Business logic
│   ├── config/                ← Configuration
│   ├── database/
│   │   ├── migrations/
│   │   └── supabase_schema.sql
│   ├── routes/api.php         ← API routes
│   ├── .env                   ← Environment variables
│   └── composer.json
│
├── mysalapi-app/              ← React Native (Expo)
│   ├── app/                   ← Screens & navigation
│   ├── components/            ← Reusable components
│   ├── context/               ← State management
│   ├── lib/                   ← API & utilities
│   ├── package.json
│   └── app.json
│
└── README.md
```

---

## 🤝 Contributing

When making changes:

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test locally (see Step 6)

4. Commit with clear messages:
   ```bash
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request

---

## 📚 Useful Commands

### Backend

```bash
# Run migrations
php artisan migrate

# Seed database with dummy data
php artisan db:seed

# Check routes
php artisan route:list

# Clear cache
php artisan cache:clear
php artisan config:clear

# View logs
tail -f storage/logs/laravel.log

# Run tests
php artisan test
```

### Frontend

```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Reset Expo cache
npx expo start --clear

# Build APK for Android
eas build --platform android
```

---

## 🔗 Helpful Links

- **Supabase Docs**: https://supabase.com/docs
- **Laravel Docs**: https://laravel.com/docs
- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Expo Docs**: https://docs.expo.dev
- **Brevo Docs**: https://developers.brevo.com

---

## ❓ Need Help?

If you encounter issues:

1. Check the **Common Issues** section above
2. Review logs in `storage/logs/laravel.log`
3. Check browser console for frontend errors (F12)
4. Ask in the team chat with error details

---

**Last Updated**: August 2026  
**Version**: 1.1
