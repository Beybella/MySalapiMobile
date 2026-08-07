# 📱 MySalapi - Complete Setup Guide for Team Members

Welcome! This guide will help you set up the **MySalapi** project locally for development and testing.

---

## 🎯 Project Overview

MySalapi is a **loan & debt management application** with two main components:

- **Frontend**: React Native (Expo) mobile app - iOS/Android
- **Backend**: Laravel PHP API with Supabase database & email integration

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

# ===== EMAIL (Mailtrap SMTP) =====
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=your_email_here
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

### 2.3 Get Your Mailtrap SMTP Credentials

1. Go to [https://mailtrap.io/](https://mailtrap.io/) and log in
2. Select **Email Sending** → **Integrations**
3. Choose **SMTP**
4. Copy the credentials:
   - **Host**: sandbox.smtp.mailtrap.io
   - **Port**: 2525
   - **Username**: (from Mailtrap credentials)
   - **Password**: (from Mailtrap credentials)
   - **API Token**: (from your API settings)

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
php artisan serve
```

Expected output:
```
INFO  Server running on [http://127.0.0.1:8000].

Press Ctrl+C to stop the server
```

**Test it**:
```bash
curl http://localhost:8000/api/health
```

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

## ✉️ Testing Email (Singil Feature)

When debt collection email is triggered:

1. **Check Mailtrap Inbox**:
   - Go to [https://mailtrap.io/](https://mailtrap.io/) → Email Testing → Inbox
   - You'll see the sent email there

2. **Check Backend Logs**:
   ```bash
   tail -f mysalapi-backend/storage/logs/laravel.log
   ```

---

## 🐛 Common Issues & Fixes

### Issue: SMTP Connection Refused
**Solution**:
```bash
# Check if MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD are correct
# Verify Mailtrap credentials are copied correctly
# Make sure MAIL_ENCRYPTION=tls is set
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
1. Get your machine IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
2. Update backend URL in app code
3. Restart Expo app

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
- **Mailtrap Docs**: https://mailtrap.io/api/docs

---

## ❓ Need Help?

If you encounter issues:

1. Check the **Common Issues** section above
2. Review logs in `storage/logs/laravel.log`
3. Check browser console for frontend errors (F12)
4. Ask in the team chat with error details

---

**Last Updated**: May 2026  
**Version**: 1.0
