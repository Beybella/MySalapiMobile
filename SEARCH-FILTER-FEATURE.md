# Search & Filter Feature Documentation

## Overview
The Personal Ledger now includes a comprehensive search and filter system that allows users to quickly find and organize their expenses and bills.

## Features Implemented

### 1. Text Search
**Location**: Search bar below tabs

**What it does**:
- Searches through expense/bill titles
- Searches through categories
- Searches through descriptions (expenses only)
- Case-insensitive, partial matches supported

**Example**:
```
Search: "meralco"
Results: Shows all bills with "Meralco" in title or category
```

---

### 2. Status Filter (Bills Only)
**Location**: Filter modal → Status section

**Options**:
- ☑️ **Unpaid** - Bills that are due but not yet paid (not overdue)
- ☑️ **Overdue** - Bills past due date and not paid
- ☑️ **Paid** - Bills marked as paid

**Default**: All statuses enabled (shows everything)

**How it works**:
- Users can toggle each status on/off
- Multiple selections allowed
- If all unchecked, no bills will show

---

### 3. Date Range Filter
**Location**: Filter modal → Date Range section

**Options**:
- **All Time** (default) - No date filtering
- **Today** - Records from today only
- **This Week** - Last 7 days
- **This Month** - From 1st of current month to today
- **Custom** - User picks start and end dates

**Applies to**:
- **Expenses**: Filters by `expense_date`
- **Bills**: Filters by `due_date`

---

### 4. Sort Options
**Location**: Filter modal → Sort By section

**Options**:
- **Default** 
  - Expenses: Newest first (default database order)
  - Bills: Unpaid first (by due date), then paid bills
- **Newest First** - Most recent date first
- **Oldest First** - Oldest date first
- **Highest Amount** - Largest amount first
- **Lowest Amount** - Smallest amount first

**Default Behavior** (no filters applied):
- Expenses are sorted newest first
- Bills show unpaid with nearest due date first, then paid bills

---

## User Interface

### Search Bar
```
┌─────────────────────────────────────────┐
│ 🔍 Search records...            [⚙️]    │
└─────────────────────────────────────────┘
```
- Left icon: Search icon
- Input: Type to search
- Clear button: Appears when text is entered (X icon)
- Right button: Filter modal opener (turns blue when filters active)

### Filter Modal
```
┌─────────────────────────────────────────┐
│ Filter & Sort                      [X]  │
├─────────────────────────────────────────┤
│ DATE RANGE                              │
│ [All Time] [Today] [This Week]          │
│ [This Month] [Custom]                   │
│                                         │
│ STATUS (Bills only)                     │
│ ☑ Unpaid  ☑ Overdue  ☑ Paid           │
│                                         │
│ SORT BY                                 │
│ ⦿ Unpaid First (Due Date)              │
│ ○ Newest First                         │
│ ○ Oldest First                         │
│ ○ Highest Amount                       │
│ ○ Lowest Amount                        │
│                                         │
│ [Clear All]  [Apply Filters]           │
└─────────────────────────────────────────┘
```

### Active Filters Indicator
When filters are active, a result counter appears:
```
┌─────────────────────────────────────────┐
│ Showing 5 of 20 expenses   [Clear All] │
└─────────────────────────────────────────┘
```

---

## Filter Logic

### Combined Filters
All active filters work together (AND logic):
- Text search AND status AND date range AND sort

**Example**:
```
Search: "meralco"
Status: Unpaid only
Date Range: This Month
Sort: Highest Amount

Result: Shows unpaid Meralco bills from this month, 
        sorted by highest amount first
```

### Empty Results
If no records match the filters:
```
"No expenses match your filters."
"No bills match your filters."
```

---

## Technical Implementation

### State Management
```typescript
// Search
const [searchText, setSearchText] = useState('');

// Filter modal
const [showFilterModal, setShowFilterModal] = useState(false);

// Status (Bills only)
const [statusFilter, setStatusFilter] = useState<{
  paid: boolean;
  unpaid: boolean;
  overdue: boolean;
}>({ paid: true, unpaid: true, overdue: true });

// Date range
const [dateRangeType, setDateRangeType] = useState<
  'all' | 'today' | 'week' | 'month' | 'custom'
>('all');
const [customDateFrom, setCustomDateFrom] = useState('');
const [customDateTo, setCustomDateTo] = useState('');

// Sort
const [sortBy, setSortBy] = useState<
  'default' | 'newest' | 'oldest' | 'highest' | 'lowest'
>('default');
```

### Filter Functions
```typescript
// Expenses filter & sort
const filterAndSortExpenses = () => {
  // 1. Text search (title, category, description)
  // 2. Date range filter
  // 3. Apply sort
  return filteredExpenses;
};

// Bills filter & sort
const filterAndSortBills = () => {
  // 1. Text search (title, category)
  // 2. Status filter (paid/unpaid/overdue)
  // 3. Date range filter
  // 4. Apply sort
  return filteredBills;
};
```

### Active Filters Detection
```typescript
const hasActiveFilters = 
  searchText.trim() !== '' || 
  dateRangeType !== 'all' || 
  !statusFilter.paid || 
  !statusFilter.unpaid || 
  !statusFilter.overdue ||
  sortBy !== 'default';
```

---

## User Experience

### Clear All Functionality
Two ways to clear filters:
1. **Clear All button** in filter modal (clears and closes modal)
2. **Clear All link** in result counter (clears immediately)

Both reset:
- Search text to empty
- Date range to "All Time"
- Status to all enabled
- Sort to "Default"

### Visual Feedback
- **Blue filter button** - Active filters applied
- **Result counter** - Shows filtered count vs total
- **Empty state message** - When no matches found

---

## Use Cases

### UC1: Find specific bill
```
User types: "Meralco"
System: Shows all Meralco bills (past and current)
```

### UC2: Check overdue bills
```
User: Opens filter modal
User: Unchecks "Paid" and "Unpaid", leaves "Overdue" checked
User: Applies filter
System: Shows only overdue bills with red indicators
```

### UC3: Review this month's expenses
```
User: Opens filter modal
User: Selects "This Month" date range
User: Applies filter
System: Shows all expenses from month start to today
```

### UC4: Find large expenses
```
User: Opens filter modal
User: Selects "Highest Amount" sort
User: Applies filter
System: Shows expenses sorted from highest to lowest
```

### UC5: Check unpaid bills due soon
```
User: Opens filter modal
User: Unchecks "Paid" and "Overdue"
User: Keeps sort as "Default" (nearest due date)
User: Applies filter
System: Shows upcoming unpaid bills, nearest due date first
```

---

## Responsive Behavior

- Search input expands to fill available space
- Filter chips wrap to multiple lines if needed
- Modal scrolls if content doesn't fit screen
- Keyboard automatically dismissed when search completes

---

## Future Enhancements (Not Implemented)

1. **Category Filter** - Multi-select categories
2. **Amount Range** - Min/Max amount sliders
3. **Saved Presets** - Save favorite filter combinations
4. **Quick Filters** - One-tap common filters ("Due This Week", "Large Expenses")
5. **Export Filtered Results** - Export to CSV/PDF

---

## Files Modified

### Frontend
- `mysalapi-app/app/(tabs)/personal.tsx`
  - Added search bar UI
  - Added filter modal UI
  - Added filter logic (text, status, date, sort)
  - Added result counter
  - Added clear filters functionality

---

## Testing Checklist

### Text Search
- [ ] Search by exact title match
- [ ] Search by partial match (case-insensitive)
- [ ] Search by category
- [ ] Search by description (expenses)
- [ ] Clear button removes search text
- [ ] Empty search shows all records

### Status Filter (Bills)
- [ ] Filter shows only Paid bills
- [ ] Filter shows only Unpaid bills
- [ ] Filter shows only Overdue bills
- [ ] Multiple status selections work
- [ ] Unchecking all statuses shows empty state

### Date Range
- [ ] "Today" shows today's records only
- [ ] "This Week" shows last 7 days
- [ ] "This Month" shows from month start
- [ ] "Custom" allows date picker selection
- [ ] Custom date validates from/to range

### Sort Options
- [ ] Default sort works (unpaid first for bills, newest for expenses)
- [ ] Newest First sorts correctly
- [ ] Oldest First sorts correctly
- [ ] Highest Amount sorts correctly
- [ ] Lowest Amount sorts correctly

### Combined Filters
- [ ] Search + Status filter works
- [ ] Search + Date range works
- [ ] All filters combined work together
- [ ] Result counter shows correct numbers
- [ ] Clear All resets everything

### UI/UX
- [ ] Filter button turns blue when active
- [ ] Result counter appears when filters active
- [ ] Empty state message shows when no matches
- [ ] Modal opens/closes smoothly
- [ ] Keyboard dismisses appropriately

---

## Known Limitations

1. **Performance**: Large datasets (1000+ records) may cause slight lag. Consider pagination if needed.
2. **Search Scope**: Search only covers title, category, and description. Does not search dates or amounts.
3. **Date Persistence**: Filter settings reset when app restarts (no local storage).

---

**Implementation Date**: January 2026  
**Status**: ✅ Completed  
**Version**: 1.0
