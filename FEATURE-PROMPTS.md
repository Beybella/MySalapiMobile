# Feature Implementation Prompts for Other Systems

This document contains detailed prompts for implementing the Push Notification System and Search/Filter System in other applications.

---

## 📱 PROMPT 1: Push Notification System Implementation

### Prompt for AI Assistant:

```
I need to implement a comprehensive push notification system for my [React Native/Flutter/Mobile] app using [Expo Notifications/Firebase/OneSignal].

REQUIREMENTS:

1. AUTOMATIC SCHEDULED NOTIFICATIONS:
   - Schedule notifications for upcoming due dates/deadlines
   - Multiple reminders: 7 days before, 3 days before, and on due date
   - All notifications should trigger at 9:00 AM local time
   - Only schedule notifications for items that haven't been completed/paid
   - Automatically cancel notifications when items are marked as complete

2. INSTANT NOTIFICATIONS:
   - Support sending immediate notifications (not scheduled)
   - Useful for urgent alerts or when another user triggers an action
   - Example: When User A sends a payment reminder to User B, B gets instant push

3. NOTIFICATION CHANNELS (Android):
   - Create separate channels for different notification types
   - Channel 1: Regular reminders (high importance, green color)
   - Channel 2: Urgent alerts (max importance, red color)
   - Each channel should have custom vibration patterns and sounds

4. BADGE MANAGEMENT:
   - Show badge count on app icon for pending notifications
   - Update badge count when notifications are received
   - Clear badge count when user opens the app
   - Provide function to manually set/clear badge count

5. TAP NAVIGATION:
   - When user taps notification, navigate to the relevant screen
   - Pass data (ID, type, etc.) to the target screen
   - Handle navigation when app is:
     - Foreground (app open)
     - Background (app minimized)
     - Killed (app closed completely)

6. PERMISSION HANDLING:
   - Request notification permissions on first app launch
   - Handle permission denied gracefully
   - Provide way to re-request permissions from settings

7. 14-DAY LOOKAHEAD:
   - When app loads, scan all upcoming items for next 14 days
   - Auto-schedule notifications for all items within this window
   - This ensures items created close to due date still get early reminders

8. NOTIFICATION MANAGEMENT FUNCTIONS:
   - Get all scheduled notifications
   - Cancel individual notification by ID
   - Cancel all notifications at once
   - Reschedule notification (cancel old, create new)

TECHNICAL REQUIREMENTS:

- Use TypeScript for type safety
- Create notification data interface with fields: type, id, title, amount, dueDate
- Configure notification handler for foreground display
- Support both iOS and Android platforms
- Store push tokens in user database for remote notifications
- Create React hooks for:
  - useNotifications (permission & navigation)
  - useScheduleNotifications (auto-scheduling logic)

OUTPUT NEEDED:

1. Core notification service file with all scheduling/cancellation functions
2. React hooks for permission handling and auto-scheduling
3. Android notification channel configuration
4. Navigation handler for notification taps
5. Example usage code for common scenarios

My data structure:
[Describe your data structure here - e.g., "I have bills with fields: id, title, amount, due_date, is_paid"]

My navigation structure:
[Describe your routes - e.g., "I use React Navigation with tabs, main screen is /home"]

Please implement this notification system with complete code and TypeScript types.
```

---

## 🔍 PROMPT 2: Search & Filter System Implementation

### Prompt for AI Assistant:

```
I need to implement a comprehensive search and filter system for my [React Native/Web] app with [list number] different data screens/tabs.

REQUIREMENTS:

1. TEXT SEARCH:
   - Real-time search as user types
   - Search across multiple fields (title, description, category, etc.)
   - Case-insensitive matching
   - Clear button (X) to reset search
   - Debounced input for performance (optional)

2. CATEGORY FILTER:
   - Multi-select category chips
   - Visual indication of selected categories (blue highlight)
   - Show count of selected categories in filter label
   - Categories are different for each tab/section:
     Tab 1: [list categories]
     Tab 2: [list categories]
     Tab 3: [list categories]

3. DATE RANGE FILTER:
   - Predefined ranges: All Time, Today, This Week, This Month
   - Custom date range with from/to date pickers
   - Chip-based UI for quick selection
   - Filter by [specify date field: created_date, due_date, etc.]

4. STATUS FILTER:
   - Multi-select checkboxes for different statuses
   - Color-coded icons for each status:
     Status 1: [color] - e.g., Paid: green
     Status 2: [color] - e.g., Pending: yellow
     Status 3: [color] - e.g., Overdue: red
   - All statuses checked by default (show all)

5. ADDITIONAL FILTERS (optional):
   - [Specify any custom filters for your use case]
   - Example: Type filter (for showing both incoming and outgoing items)
   - Example: Amount range filter (min/max)
   - Example: Priority filter (low/medium/high)

6. SORT OPTIONS:
   - Multiple sort criteria:
     - Default (your preferred default sort)
     - Newest First
     - Oldest First
     - Highest Amount/Value
     - Lowest Amount/Value
     - Alphabetical (A-Z)
     - Reverse Alphabetical (Z-A)
   - Radio button selection (single choice)

7. VISUAL FEEDBACK:
   - Filter button changes color when filters are active
   - Show result counter: "Showing X of Y items"
   - Display "Clear All" button when filters are active
   - Empty state messages:
     - When no data exists at all
     - When no data matches current filters

8. FILTER MODAL:
   - Draggable modal (mobile) or sidebar (web)
   - Scrollable content for many filter options
   - Two action buttons:
     - "Clear All" (secondary style) - resets all filters
     - "Apply Filters" (primary style) - applies and closes modal
   - Modal sections clearly labeled

9. CONSISTENT DESIGN:
   - Same UI pattern across all tabs/screens
   - Search bar at top of each screen
   - Filter button next to search bar
   - Result counter below search when filtering

TECHNICAL REQUIREMENTS:

- Use React state management (useState or useReducer)
- Efficient filtering algorithm (O(n) complexity)
- Type-safe filter functions with TypeScript
- Proper state cleanup on unmount
- Handle edge cases (null values, empty arrays)
- Memoize filter functions if needed for performance

SCREENS TO IMPLEMENT:

Screen 1: [Name]
- Data type: [describe your data]
- Search fields: [list fields to search]
- Filters needed: [list specific filters]
- Sort options: [list sort criteria]

Screen 2: [Name]
- Data type: [describe your data]
- Search fields: [list fields]
- Filters needed: [list filters]
- Sort options: [list sort options]

[Add more screens as needed]

OUTPUT NEEDED:

1. State management setup (all filter state variables)
2. Filter logic functions (filterAndSort functions)
3. Search bar component/UI
4. Filter button with active state indicator
5. Filter modal with all filter options
6. Result counter component
7. Clear filters function
8. hasActiveFilters logic
9. Styles for all new UI elements
10. Example usage code

My current tech stack:
- Framework: [React Native/React/Next.js/etc.]
- UI Library: [Native Components/Material UI/Chakra/etc.]
- State Management: [useState/Redux/Zustand/etc.]
- Styling: [StyleSheet/Styled Components/Tailwind/etc.]

My data structure:
[Provide your data type/interface - e.g., 
```typescript
interface MyItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  status: 'active' | 'completed';
}
```
]

Please implement this search and filter system with complete code, TypeScript types, and styles.
```

---

## 🎯 COMBINED PROMPT (Both Features)

### If you want both features in one prompt:

```
I need to implement TWO major features for my [React Native/Flutter] app:

FEATURE 1: PUSH NOTIFICATION SYSTEM
[Copy full prompt 1 content here]

FEATURE 2: SEARCH & FILTER SYSTEM  
[Copy full prompt 2 content here]

INTEGRATION NOTES:
- Notification settings should be accessible from app settings/profile
- Search results might include items with upcoming notifications
- Consider showing notification indicator badges on filtered items
- Both features should work independently and not conflict

Please implement both features with:
1. Complete working code
2. TypeScript types
3. Proper error handling
4. Example usage documentation
5. Testing considerations

Prioritize clean, maintainable code that follows best practices.
```

---

## 📝 CUSTOMIZATION GUIDE

### To adapt these prompts for your specific system:

#### 1. Replace Placeholder Data:
- `[React Native/Flutter/Mobile]` → Your framework
- `[Expo Notifications/Firebase/OneSignal]` → Your notification service
- `Tab 1: [list categories]` → Your actual categories
- `[describe your data]` → Your data structure

#### 2. Add Your Requirements:
- Specify your date fields (created_at, due_date, etc.)
- List your status types
- Define your color scheme
- Describe your navigation structure

#### 3. Include Your Data Models:
```typescript
// Example - replace with your models
interface MyDataType {
  id: string;
  title: string;
  // ... your fields
}
```

#### 4. Specify Your Tech Stack:
- UI framework (React Native, Flutter, etc.)
- Navigation library (React Navigation, etc.)
- State management (Redux, Context, etc.)
- Backend (if applicable)

#### 5. Define Success Criteria:
Add at the end of each prompt:
```
SUCCESS CRITERIA:
- Users can search and find items in under 2 seconds
- Filters work correctly with 1000+ items
- Notifications trigger reliably at scheduled times
- No performance issues or memory leaks
- Code is testable and maintainable
```

---

## 🔧 USAGE EXAMPLES

### Example 1: E-Commerce App

```
CONTEXT: I'm building an e-commerce app with order management.

FEATURE 1 CUSTOMIZATION:
- Notifications for: Order shipped, Delivery due, Payment due
- Notification times: 1 day before delivery, on delivery day, 3 days after for review

FEATURE 2 CUSTOMIZATION:
- Search: Order number, product name, customer name
- Filters: Order status, Date range, Price range, Shipping method
- Categories: Electronics, Clothing, Home, Books

My data:
```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: Product[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate: string;
  shippingMethod: string;
}
```
```

### Example 2: Task Management App

```
CONTEXT: I'm building a task/todo management app.

FEATURE 1 CUSTOMIZATION:
- Notifications for: Task due dates, Reminders, Recurring tasks
- Notification times: 1 week before, 1 day before, 1 hour before

FEATURE 2 CUSTOMIZATION:
- Search: Task title, description, assignee
- Filters: Priority, Status, Project, Tags, Due date
- Categories: Work, Personal, Shopping, Health, Finance

My data:
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  project: string;
  tags: string[];
  assignee: string;
}
```
```

### Example 3: Event Management App

```
CONTEXT: I'm building an event management and RSVP app.

FEATURE 1 CUSTOMIZATION:
- Notifications for: Event reminders, RSVP confirmations, Event updates
- Notification times: 1 week before, 1 day before, 1 hour before event

FEATURE 2 CUSTOMIZATION:
- Search: Event name, venue, organizer
- Filters: Event type, Date, Location, RSVP status, Price (free/paid)
- Categories: Conference, Concert, Workshop, Social, Sports

My data:
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  organizer: string;
  category: string;
  price: number;
  capacity: number;
  rsvpStatus: 'attending' | 'maybe' | 'not_attending' | 'pending';
}
```
```

---

## 💡 PRO TIPS FOR USING THESE PROMPTS

### 1. Be Specific About Your Use Case
Instead of: "I need notifications"
Say: "I need notifications for rental payment reminders with 7-day, 3-day, and same-day alerts"

### 2. Provide Real Data Examples
Instead of: "I have items"
Say: 
```typescript
interface Rental {
  id: '123',
  property: 'Apartment 4B',
  tenant: 'John Doe',
  amount: 1500,
  dueDate: '2024-12-01',
  isPaid: false
}
```

### 3. Specify Edge Cases
"Handle scenarios where:
- User has no items yet (empty state)
- All items are filtered out (no matches)
- User denies notification permissions
- Date is past due (overdue scenario)"

### 4. Include Design Preferences
"UI Style: Modern, minimal, with rounded corners
Colors: Primary #4A90E2, Success #4CAF50, Error #F44336
Font: System default, weights 400-700"

### 5. Request Documentation
"Please include:
- JSDoc comments for all functions
- README with setup instructions
- Usage examples for common scenarios
- Testing recommendations"

---

## 📦 DELIVERABLES CHECKLIST

When using these prompts, expect these deliverables:

### Push Notification System:
- [ ] `notifications.ts` - Core notification service
- [ ] `useNotifications.ts` - Permission & navigation hook
- [ ] `useScheduleNotifications.ts` - Auto-scheduling hook
- [ ] Android channel configuration
- [ ] iOS permission handling
- [ ] Navigation integration code
- [ ] Database schema for push tokens
- [ ] Example usage code
- [ ] Testing utilities

### Search & Filter System:
- [ ] State management setup
- [ ] Filter logic functions
- [ ] Search bar component
- [ ] Filter button component
- [ ] Filter modal component
- [ ] Result counter component
- [ ] Clear filters function
- [ ] Style definitions
- [ ] TypeScript interfaces
- [ ] Example usage code

---

## 🚀 QUICK START TEMPLATES

### Minimal Prompt (Push Notifications):
```
Implement push notifications for my React Native app using Expo Notifications.

Features needed:
- Schedule notifications 7 days, 3 days, and 0 days before due dates
- Android notification channels
- Tap to navigate
- Badge counts

Data structure:
```typescript
interface Item {
  id: string;
  title: string;
  dueDate: string;
  isComplete: boolean;
}
```

Provide complete TypeScript code with hooks.
```

### Minimal Prompt (Search & Filter):
```
Implement search and filter for my React app with items list.

Features needed:
- Text search (title, description)
- Status filter (active, completed)
- Date range (this week, this month)
- Sort (newest, oldest, A-Z)

Data structure:
```typescript
interface Item {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  createdAt: string;
}
```

Provide React component with hooks and styles.
```

---

## ✨ READY TO USE

These prompts are ready to copy and paste into any AI assistant (ChatGPT, Claude, Copilot, etc.). Just:

1. Copy the relevant prompt
2. Replace placeholders with your specifics
3. Add your data structures
4. Paste into AI chat
5. Review and iterate on the generated code

Good luck building your features! 🎉

---

**Created**: August 19, 2026  
**Version**: 1.0  
**Based on**: MySalapi Mobile implementation
