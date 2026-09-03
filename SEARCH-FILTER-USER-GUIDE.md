# Search & Filter - User Guide

## Quick Start

### How to Search
1. Go to **Personal Ledger** tab
2. Type in the search bar at the top
3. Results filter instantly as you type
4. Tap the **X** to clear search

### How to Filter
1. Tap the **Filter button** (⚙️ icon) next to search
2. Choose your filters:
   - **Date Range**: All Time, Today, This Week, This Month, or Custom
   - **Status** (Bills only): Paid, Unpaid, Overdue
   - **Sort By**: How you want records ordered
3. Tap **Apply Filters**

### How to Clear Filters
- Tap **Clear All** in the filter modal, OR
- Tap **Clear All** link in the result counter

---

## Common Tasks

### 📋 Find a Specific Bill
**Example**: Find your Meralco bill
```
1. Type "Meralco" in search bar
2. See all Meralco bills instantly
```

### ⚠️ Check Overdue Bills
```
1. Tap Filter button
2. Under Status, uncheck "Paid" and "Unpaid"
3. Keep only "Overdue" checked
4. Tap Apply Filters
5. See all overdue bills (red indicators)
```

### 📅 Review This Month's Expenses
```
1. Switch to Expenses tab
2. Tap Filter button
3. Select "This Month" under Date Range
4. Tap Apply Filters
5. See all expenses from this month
```

### 💰 Find Large Expenses
```
1. Tap Filter button
2. Under Sort By, select "Highest Amount"
3. Tap Apply Filters
4. Expenses/bills now sorted largest first
```

### 🔔 See Upcoming Bills Only
```
1. Switch to Bills tab
2. Tap Filter button
3. Under Status, uncheck "Paid" and "Overdue"
4. Keep only "Unpaid" checked
5. Tap Apply Filters
6. See only unpaid bills with nearest due date first
```

### 🗓️ Custom Date Range
```
1. Tap Filter button
2. Under Date Range, select "Custom"
3. Pick "From" date
4. Pick "To" date
5. Tap Apply Filters
6. See records within that date range
```

---

## Visual Indicators

### 🔵 Blue Filter Button
When the filter button is **blue**, it means you have active filters applied.

### 📊 Result Counter
```
"Showing 5 of 20 expenses"
```
This means 5 records match your filters out of 20 total.

### ❌ Clear Button
The **X** icon appears in the search bar when you've typed something. Tap it to clear.

---

## Sort Options Explained

### For Expenses Tab:
- **Default** = Newest first (most recent expense at top)
- **Newest First** = Same as default
- **Oldest First** = Oldest expense at top
- **Highest Amount** = Largest amount at top
- **Lowest Amount** = Smallest amount at top

### For Bills Tab:
- **Default** = Unpaid bills first (nearest due date), then paid bills
- **Newest First** = Most recent due date at top
- **Oldest First** = Oldest due date at top
- **Highest Amount** = Largest bill amount at top
- **Lowest Amount** = Smallest bill amount at top

---

## Status Filter (Bills Only)

### Unpaid ✅
Bills that are due but **not yet paid** and **not overdue**.

**Example**: Bill due in 5 days, not marked as paid.

### Overdue 🚨
Bills that are **past due date** and **not marked as paid**.

**Example**: Bill was due yesterday, still not paid (red indicator).

### Paid ✅
Bills that have been **marked as paid** (green checkmark icon).

---

## Tips & Tricks

### Combine Multiple Filters
You can use search + status + date + sort all together!

**Example**:
```
Search: "utilities"
Status: Unpaid only
Date: This Month
Sort: Highest Amount

Result: Unpaid utility bills from this month, 
        highest amount first
```

### Quick Search Categories
Just type the category name to see all records in that category:
- "Food" → All food expenses
- "Transport" → All transport expenses
- "Utilities" → All utility bills

### Search is Smart
- Works with **partial matches**: "mera" finds "Meralco"
- **Case-insensitive**: "MERALCO" = "meralco" = "Meralco"
- Searches **title**, **category**, and **description**

---

## Troubleshooting

### "No expenses match your filters"
**Problem**: Your filters are too strict, no records match.

**Solution**: 
- Clear some filters (tap Clear All)
- Try broader date range (All Time)
- Check if all statuses are unchecked

### Search shows nothing
**Problem**: No records contain your search term.

**Solution**:
- Check spelling
- Try partial search (e.g., "Mer" instead of "Meralco")
- Clear search and browse manually

### Filter button not turning blue
**Problem**: You haven't applied filters yet.

**Solution**:
- Make sure to tap **Apply Filters** in the modal
- Default settings don't activate the blue indicator

---

## Screenshots Reference

### Main Screen (No Filters)
```
┌─────────────────────────────────────┐
│  Personal Ledger                    │
│  Track expenses and bills           │
├─────────────────────────────────────┤
│ [Expenses] [Bills]                  │
├─────────────────────────────────────┤
│ 🔍 Search records...          [⚙️]  │
├─────────────────────────────────────┤
│  Food                               │
│  Lunch at SM                        │
│  Jan 15, 2026             ₱250.00   │
└─────────────────────────────────────┘
```

### With Active Filters
```
┌─────────────────────────────────────┐
│  Personal Ledger                    │
│  Track expenses and bills           │
├─────────────────────────────────────┤
│ [Expenses] [Bills]                  │
├─────────────────────────────────────┤
│ 🔍 mera [X]               [🔵]      │
├─────────────────────────────────────┤
│ Showing 2 of 15 bills    Clear All  │
├─────────────────────────────────────┤
│  Utilities                          │
│  Meralco Bill                       │
│  Due: Jan 20, 2026      ₱1,500.00   │
└─────────────────────────────────────┘
```

### Filter Modal
```
┌─────────────────────────────────────┐
│ Filter & Sort                  [X]  │
├─────────────────────────────────────┤
│ DATE RANGE                          │
│ [All Time] [Today] [This Week]      │
│ [This Month] [Custom]               │
│                                     │
│ STATUS                              │
│ ☑ Unpaid  ☑ Overdue  ☑ Paid        │
│                                     │
│ SORT BY                             │
│ ⦿ Unpaid First (Due Date)           │
│ ○ Newest First                      │
│ ○ Oldest First                      │
│ ○ Highest Amount                    │
│ ○ Lowest Amount                     │
│                                     │
│ [Clear All]  [Apply Filters]        │
└─────────────────────────────────────┘
```

---

## Need Help?

If you're having trouble with search or filters:
1. Try clearing all filters first
2. Make sure you're on the right tab (Expenses vs Bills)
3. Check your internet connection if data isn't loading
4. Close and reopen the app if something seems stuck

---

**Feature Version**: 1.0  
**Last Updated**: January 2026
