# 🎨 Search & Filter System - Visual Guide

## Component Layouts

### 1. Search Bar
\`\`\`
┌─────────────────────────────────────────────────┐
│  🔍  Search loans...              [✕]     [⚙️]  │
└─────────────────────────────────────────────────┘
     ↑                                ↑       ↑
  Search Icon                    Clear   Filter
                                 Button  Button
                                         (Blue when active)
\`\`\`

**States:**
- **Empty**: Shows placeholder, no clear button
- **Typing**: Shows text + clear button
- **Filters Active**: Filter button turns blue

---

### 2. Result Counter
\`\`\`
┌─────────────────────────────────────────────────┐
│  📄  Showing 12 of 45 loans                     │
└─────────────────────────────────────────────────┘
     ↑          ↑       ↑
   Icon     Filtered  Total
          (Highlighted in blue)
\`\`\`

---

### 3. Filter Modal Header
\`\`\`
┌─────────────────────────────────────────────────┐
│  ─── (drag handle)                              │
│                                                 │
│  [⚙️]  Filters & Sort                      [✕]  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
\`\`\`

---

### 4. Category Filter Section
\`\`\`
PAYMENT METHOD
┌─────────┬─────────┬─────────┬─────────┐
│ GCash   │  Maya   │  BDO    │  BPI    │  ← Unselected (gray)
└─────────┴─────────┴─────────┴─────────┘

┌─────────┬─────────┐
│ Cash    │  Other  │
└─────────┴─────────┘
     ↓
┏━━━━━━━━━┓  ← Selected (blue background, white text)
┃  Cash   ┃
┗━━━━━━━━━┛
\`\`\`

---

### 5. Date Range Filter
\`\`\`
DATE RANGE
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│∞ All    │📅 Today │📅 Week  │📅 Month │⚙️ Custom│
└─────────┴─────────┴─────────┴─────────┴─────────┘
                                             ↓
                               If Custom selected:
                               ┌─────────────────┐
                               │ Start: YYYY-MM-DD│
                               │ End:   YYYY-MM-DD│
                               └─────────────────┘
\`\`\`

---

### 6. Status Filter with Checkboxes
\`\`\`
LOAN STATUS
┌──────────────────────────────────────────────┐
│  ☑️  🟠  Active                               │
│  ☐  🔵  Partial                              │
│  ☑️  🟢  Paid                                │
│  ☐  🔴  Overdue                              │
└──────────────────────────────────────────────┘
   ↑   ↑
Checkbox Color Dot
(checked/unchecked)
\`\`\`

---

### 7. Sort Options with Radio Buttons
\`\`\`
SORT BY
┌──────────────────────────────────────────────┐
│  ( )  📋  Default                            │
│  (●)  ⬇️  Newest First                       │  ← Selected
│  ( )  ⬆️  Oldest First                       │
│  ( )  📈  Highest Amount                     │
│  ( )  📉  Lowest Amount                      │
│  ( )  🔤  A to Z                             │
│  ( )  🔤  Z to A                             │
└──────────────────────────────────────────────┘
   ↑
Radio Button
\`\`\`

---

### 8. Modal Footer Actions
\`\`\`
┌──────────────────────────────────────────────┐
│  ┌──────────────────┬──────────────────────┐ │
│  │  🔄  Clear All   │  ✓  Apply Filters    │ │
│  └──────────────────┴──────────────────────┘ │
└──────────────────────────────────────────────┘
      ↑                       ↑
   Red outline            Blue solid
   (Disabled when         (Always enabled)
    no filters active)
\`\`\`

---

### 9. Empty State - No Data
\`\`\`
          ┌─────────────┐
          │             │
          │      📄      │  ← Large icon in circle
          │             │
          └─────────────┘
          
          No Loans Given
          
   Start tracking loans by
   tapping the + button below.
\`\`\`

---

### 10. Empty State - No Results
\`\`\`
          ┌─────────────┐
          │             │
          │      🔍      │  ← Search icon
          │             │
          └─────────────┘
          
        No Matches Found
          
   Try adjusting your search
    or filters to find what
      you're looking for.
\`\`\`

---

## Full Screen Layout

\`\`\`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  PAUTANG LEDGER                    ▓▓▓▓▓▓  ┃  ← Header (blue)
┃  Track loans given and owed        ▓▓▓▓▓▓  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌──────────────────────────────────────────────┐
│  [  Given (12)  ] [  Owed (5)  ]            │  ← Tabs
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  🔍  Search borrowers...        [✕]     [⚙️]  │  ← Search Bar
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  📄  Showing 8 of 12 loans                   │  ← Result Counter
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  John Doe              🟠 Active             │
│  Emergency - ₱5,000.00                       │
│  Original  Remaining      Due                │
│  ₱5,000    ₱3,000        Aug 25              │
│  [💰 Record Payment]  [✉️ Singil]            │
├──────────────────────────────────────────────┤
│  Jane Smith            🟢 Paid               │
│  Business - ₱10,000.00                       │
│  Original  Remaining      Due                │
│  ₱10,000   ₱0            Aug 15              │
├──────────────────────────────────────────────┤
│  ...more items...                            │
└──────────────────────────────────────────────┘
                                           ┌────┐
                                           │ ➕  │  ← FAB
                                           └────┘
\`\`\`

---

## Color Coding System

### Status Colors
- 🟢 **Paid/Success**: #4CAF50 (Green)
- 🟠 **Active/Warning**: #FFA500 (Orange)
- 🔵 **Partial/Info**: #2196F3 (Blue)
- 🔴 **Overdue/Error**: #F44336 (Red)

### UI Element Colors
- **Primary Action**: Blue (#2196F3)
- **Secondary Action**: Gray outline
- **Destructive Action**: Red (#F44336)
- **Success**: Green (#4CAF50)
- **Warning**: Orange (#FFA500)

### Filter States
- **Inactive Filter**: Gray background, dark text
- **Active Filter**: Blue background, white text
- **Filter Button**: Gray normally, blue when filters active

---

## Interaction Flows

### Flow 1: Basic Search
\`\`\`
User Types → Search updates → Results filter in real-time
   "John"        instantly       Shows only "John Doe"
\`\`\`

### Flow 2: Apply Category Filter
\`\`\`
Tap Filter → Open Modal → Select Category → Apply → See Results
   Button     (slides up)    (turns blue)    (closes)  (filtered)
\`\`\`

### Flow 3: Apply Multiple Filters
\`\`\`
Open Modal → Select GCash → Select Active → Select Newest → Apply
             (category)     (status)       (sort)
                          ↓
           All filters combine with AND logic
                          ↓
                  Shows Active GCash loans
                   sorted by newest first
\`\`\`

### Flow 4: Clear All Filters
\`\`\`
Tap Clear All → Confirm → Filters Reset → See All Data
   (in modal)              (closes modal)  (original order)
\`\`\`

### Flow 5: Search + Filter Combination
\`\`\`
Search "Emergency" → Tap Filter → Select Overdue → Apply
   (narrows down)       (opens)    (further filters)
                          ↓
              Shows overdue loans with
            "Emergency" in description
\`\`\`

---

## Responsive Behavior

### Phone Portrait (Standard)
- Search bar full width
- Filter button 48x48
- Modal covers 85% of screen
- Chips wrap to multiple rows

### Phone Landscape
- Search bar compressed
- Result counter inline
- Modal covers 70% of screen

### Tablet
- All elements scale proportionally
- More chips visible without scrolling
- Modal max-width 600px centered

---

## Animation Timing

| Animation | Duration | Easing |
|-----------|----------|---------|
| Modal Open | 300ms | Spring |
| Modal Close | 220ms | Ease Out |
| Chip Selection | 200ms | Ease In Out |
| Search Clear | 150ms | Ease Out |
| Filter Button | 200ms | Ease In Out |

---

## Accessibility Features

### Touch Targets
- Minimum 44x44 points for all tappable elements
- Adequate spacing between interactive elements
- Large drag handle area on modal

### Color Contrast
- Text: 4.5:1 minimum contrast ratio
- Icons: 3:1 minimum contrast ratio
- Status indicators: distinct shapes + colors

### Screen Reader Support
- All buttons have labels
- Status changes announced
- Filter counts announced
- Empty states clearly described

### Keyboard Navigation
- Tab order logical
- Enter key activates buttons
- Escape closes modal
- Arrow keys navigate options

---

## Dark Mode Adaptations

### Light Mode
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #212121
- Border: #E0E0E0

### Dark Mode
- Background: #121212
- Surface: #1E1E1E
- Text: #FFFFFF
- Border: #2C2C2C

### Consistent Across Both
- Primary: #2196F3 (Blue)
- Success: #4CAF50 (Green)
- Warning: #FFA500 (Orange)
- Error: #F44336 (Red)

---

## Quick Visual Checklist

When implementing, ensure:
- [ ] Search icon on left
- [ ] Clear button appears when typing
- [ ] Filter button on right
- [ ] Filter button turns blue when active
- [ ] Category chips turn blue when selected
- [ ] Status checkboxes have color dots
- [ ] Sort options use radio buttons
- [ ] Modal has drag handle
- [ ] Result counter shows X of Y
- [ ] Empty states have different messages
- [ ] Footer has Clear + Apply buttons
- [ ] All touch targets minimum 44x44
- [ ] Colors match theme
- [ ] Animations are smooth
- [ ] Works in light and dark mode

---

## Component Spacing Guide

\`\`\`
Header:           padding: 24px
Search Bar:       margin: 16px, height: 48px
Result Counter:   padding: 10px 16px
List Items:       gap: 10px, padding: 14px
Modal:            padding: 24px
Chips:            gap: 8px, padding: 8px 14px
Buttons:          height: 48px, padding: 16px
\`\`\`

---

## Z-Index Layers

\`\`\`
Layer 5: Modal Overlay (1000)
Layer 4: Filter Modal (999)
Layer 3: FAB Button (100)
Layer 2: Header (10)
Layer 1: Content (1)
Layer 0: Background (0)
\`\`\`

---

Made with ❤️ for MySalapi - Visual Reference v1.0
