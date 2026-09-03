# Email Directory / Contacts Feature ✅

## Overview
Added a personal contacts directory that allows users to save emails of non-MySalapi users, making it easier to create loans and group expenses without requiring everyone to register first.

## What Was Implemented

### 1. **Database: Contacts Table**
**File:** `mysalapi-backend/database/add_contacts_table.sql`

**Schema:**
```sql
CREATE TABLE public.contacts (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),  -- Owner of this contact
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ,
  UNIQUE(user_id, email)  -- No duplicate emails per user
);
```

**Features:**
- Each user has their own private contact list
- Row Level Security (RLS) enabled - users can only see their own contacts
- Duplicate email prevention per user
- Indexed for fast lookups

### 2. **ContactsModal Component**
**File:** `mysalapi-app/components/ContactsModal.tsx`

**Features:**
- **View Contacts:** Scrollable list with avatar, name, email, phone, notes
- **Add Contact:** Form with email validation
- **Delete Contact:** Swipe or tap to remove
- **Select Contact:** Tap to choose (when used as a picker)
- **Empty State:** Helpful message when no contacts exist
- **Validation:** Email format checking, duplicate prevention
- **Professional UI:** Matches app theme, smooth animations

### 3. **UserOrContactPicker Component**
**File:** `mysalapi-app/components/UserOrContactPicker.tsx`

**Features:**
- Text input for manual email entry
- Contact book icon button to open contacts modal
- Quick selection from saved contacts
- Hint text to guide users
- Reusable across loan and ambagan screens

### 4. **Profile Integration**
**File:** `mysalapi-app/app/(tabs)/profile.tsx`

**Added:**
- New "My Contacts" section in profile
- "Manage Contacts" button with contact icon
- Opens ContactsModal for full CRUD operations

### 5. **Loan Creation Integration**
**File:** `mysalapi-app/app/(tabs)/pautang.tsx`

**Updated:**
- Replaced plain TextInput with UserOrContactPicker
- Users can now:
  - Type email manually (existing flow)
  - Tap contact icon to select from saved contacts (new!)
  - Placeholder updated: "must be a MySalapi user or contact"

## How It Works

### User Flow:

#### **Adding Contacts:**
1. Go to Profile tab
2. Tap "Manage Contacts"
3. Tap "Add Contact" button
4. Fill in:
   - Email (required, validated)
   - Full Name (required)
   - Phone (optional)
   - Notes (optional, e.g., "Friend from college")
5. Tap "Save Contact"

#### **Using Contacts in Loans:**
1. Go to Pautang tab → Create Loan
2. In "Borrower's Email" field:
   - **Option A:** Type email manually
   - **Option B:** Tap the 📇 people icon
3. Select contact from list
4. Email auto-fills!
5. Complete loan creation as normal

#### **Using Contacts in Ambagan:**
*(To be fully integrated - see Future Enhancements)*
- Currently: Manual email entry
- Planned: Tap icon to add contact emails

### Database Validation:
- App first checks if email exists in `users` table (registered MySalapi user)
- If found: Creates loan/ambagan with that user's ID
- If not found: Shows error (current behavior - see Future Enhancements)

## Database Setup Instructions

Run this SQL file in Supabase SQL Editor:

```
mysalapi-backend/database/add_contacts_table.sql
```

This will:
✅ Create the contacts table
✅ Add indexes for performance
✅ Enable Row Level Security
✅ Set up access policies

## Files Created/Modified

### Created:
- ✅ `mysalapi-backend/database/add_contacts_table.sql`
- ✅ `mysalapi-app/components/ContactsModal.tsx`
- ✅ `mysalapi-app/components/UserOrContactPicker.tsx`
- ✅ `EMAIL-DIRECTORY-IMPLEMENTATION.md` (this file)

### Modified:
- ✅ `mysalapi-app/app/(tabs)/profile.tsx` (added Contacts section)
- ✅ `mysalapi-app/app/(tabs)/pautang.tsx` (integrated UserOrContactPicker)

## Future Enhancements

### Phase 1: Basic Contact Support ✅ (DONE)
- [x] Create contacts table
- [x] Build ContactsModal for CRUD operations
- [x] Add contacts section to Profile
- [x] Integrate picker in loan creation

### Phase 2: Ambagan Integration (NEXT)
- [ ] Update equal split member inputs to use UserOrContactPicker
- [ ] Update custom split member inputs to use UserOrContactPicker
- [ ] Allow adding multiple contacts at once

### Phase 3: Smart Contact Creation (FUTURE)
- [ ] Auto-save new emails as contacts after first loan/ambagan
- [ ] "Add to Contacts" prompt when creating with new email
- [ ] Bulk import contacts from device contacts

### Phase 4: Pending Users (ADVANCED)
- [ ] Allow creating loans/ambagan with non-registered users
- [ ] Store as "pending" with contact email only
- [ ] Send invitation email to join MySalapi
- [ ] Auto-link when they register with same email
- [ ] Show pending vs. active users differently in UI

### Phase 5: Enhanced Features
- [ ] Contact groups (e.g., "Family", "Coworkers")
- [ ] Contact notes and history
- [ ] Export contacts
- [ ] Search and filter contacts
- [ ] Most-used contacts quick access

## Technical Notes

### Contacts vs. Users:
- **Users table:** Registered MySalapi accounts with auth
- **Contacts table:** Personal directory of emails (may or may not have accounts)
- Contacts are user-specific (each user has their own list)
- Contacts DON'T need to be MySalapi users (just save the email)

### Current Limitation:
Loans and group expenses still **require borrowers/participants to be registered users**. Contacts just make it easier to input their emails, but validation still fails if they're not in the `users` table.

**To Fix This:** Implement Phase 4 (Pending Users) to allow inviting non-registered users.

### Security:
- RLS policies ensure users can only see their own contacts
- No contact sharing between users
- Email validation prevents malformed addresses
- Duplicate prevention per user

## Testing Checklist

### Contacts Management:
- [ ] Run database migration in Supabase
- [ ] Open Profile → Manage Contacts
- [ ] Add a new contact with all fields
- [ ] Add a contact with only required fields
- [ ] Try adding duplicate email (should show error)
- [ ] Try adding invalid email format (should show error)
- [ ] Delete a contact
- [ ] Close and reopen modal (contacts should persist)

### Loan Creation:
- [ ] Go to Pautang → Add Loan
- [ ] Type email manually (old flow still works)
- [ ] Tap contact icon to open contacts modal
- [ ] Select a contact from list
- [ ] Verify email auto-fills
- [ ] Complete loan creation

### Profile Integration:
- [ ] Check "My Contacts" section appears in Profile
- [ ] Tap "Manage Contacts" opens modal
- [ ] Icon and styling match app theme
- [ ] Works in both light and dark mode

---

**Status:** ✅ Phase 1 Complete (Basic Contact Support)  
**Next Feature:** Optional App Lock Settings
