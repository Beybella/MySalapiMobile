# Search & Filter System - Complete Examples

## Example 1: Pautang (Loans) Screen ✅

**Already implemented in `pautang.tsx`**

### Features:
- Search by borrower/lender name, email, or purpose
- Filter by payment method (GCash, Maya, BDO, BPI, Cash, Other)
- Filter by status (Active, Partial, Paid, Overdue)
- Filter by due date range
- Sort by date, amount, or name
- Result counter showing filtered/total
- Empty states for no data vs no matches

---

## Example 2: Personal Expenses Screen

\`\`\`typescript
import React, { useState } from 'react';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Other',
];

export default function PersonalScreen() {
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Apply search & filter
  const {
    filters,
    filteredData,
    hasActiveFilters,
    totalItems,
    filteredCount,
    updateFilter,
    toggleCategory,
    clearFilters,
  } = useSearchFilter({
    data: expenses,
    searchFields: ['description', 'category'],
    categoryField: 'category',
    dateField: 'expense_date',
    amountField: 'amount',
    nameField: 'description',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Expenses</Text>
        <Text style={styles.headerSubtitle}>Track your daily spending</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={(text) => updateFilter('searchQuery', text)}
        placeholder="Search expenses..."
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Result Counter */}
      {totalItems > 0 && (
        <ResultCounter
          filteredCount={filteredCount}
          totalCount={totalItems}
          itemLabel="expenses"
        />
      )}

      {/* Expense List */}
      <ScrollView style={styles.list}>
        {filteredData.length === 0 ? (
          totalItems === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title="No Expenses Yet"
              message="Start tracking your expenses by tapping the + button below."
              type="no-data"
            />
          ) : (
            <EmptyState
              title="No Matches Found"
              message="Try adjusting your search or filters."
              type="no-results"
            />
          )
        ) : (
          filteredData.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onUpdateFilter={updateFilter}
        onToggleCategory={toggleCategory}
        onToggleStatus={() => {}} // No status for expenses
        onClearAll={clearFilters}
        availableCategories={EXPENSE_CATEGORIES}
        availableStatuses={[]}
        categoryLabel="Expense Category"
        showDateFilter={true}
        showSortOptions={true}
      />
    </View>
  );
}
\`\`\`

---

## Example 3: Bill Reminders Screen

\`\`\`typescript
import React, { useState } from 'react';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';

const BILL_CATEGORIES = [
  'Housing',
  'Utilities',
  'Transportation',
  'Food',
  'Healthcare',
  'Entertainment',
  'Insurance',
  'Education',
  'Subscriptions',
  'Other',
];

export default function BillsScreen() {
  const { colors } = useTheme();
  const [bills, setBills] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Add payment status to each bill
  const billsWithStatus = bills.map((bill) => ({
    ...bill,
    displayStatus: bill.is_paid ? 'paid' : 'unpaid',
  }));

  // Apply search & filter
  const {
    filters,
    filteredData,
    hasActiveFilters,
    totalItems,
    filteredCount,
    updateFilter,
    toggleCategory,
    toggleStatus,
    clearFilters,
  } = useSearchFilter({
    data: billsWithStatus,
    searchFields: ['title', 'category'],
    categoryField: 'category',
    dateField: 'due_date',
    statusField: 'displayStatus',
    amountField: 'amount',
    nameField: 'title',
  });

  const BILL_STATUSES = [
    { value: 'paid', label: 'Paid', color: colors.success },
    { value: 'unpaid', label: 'Unpaid', color: colors.warning },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bill Reminders</Text>
        <Text style={styles.headerSubtitle}>Never miss a payment</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={(text) => updateFilter('searchQuery', text)}
        placeholder="Search bills..."
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Result Counter */}
      {totalItems > 0 && (
        <ResultCounter
          filteredCount={filteredCount}
          totalCount={totalItems}
          itemLabel="bills"
        />
      )}

      {/* Bill List */}
      <ScrollView style={styles.list}>
        {filteredData.length === 0 ? (
          totalItems === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No Bills Yet"
              message="Add your first bill reminder to get started."
              type="no-data"
            />
          ) : (
            <EmptyState
              title="No Matches Found"
              message="Try adjusting your search or filters."
              type="no-results"
            />
          )
        ) : (
          filteredData.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onUpdateFilter={updateFilter}
        onToggleCategory={toggleCategory}
        onToggleStatus={toggleStatus}
        onClearAll={clearFilters}
        availableCategories={BILL_CATEGORIES}
        availableStatuses={BILL_STATUSES}
        categoryLabel="Bill Category"
        statusLabel="Payment Status"
        showDateFilter={true}
        showSortOptions={true}
      />
    </View>
  );
}
\`\`\`

---

## Example 4: Ambagan (Group Savings) Screen

\`\`\`typescript
import React, { useState } from 'react';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';

const GROUP_CATEGORIES = [
  'Family',
  'Friends',
  'Work',
  'Community',
  'Travel',
  'Event',
  'Other',
];

export default function AmbaganScreen() {
  const { colors } = useTheme();
  const [groups, setGroups] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Apply search & filter
  const {
    filters,
    filteredData,
    hasActiveFilters,
    totalItems,
    filteredCount,
    updateFilter,
    toggleCategory,
    toggleStatus,
    clearFilters,
  } = useSearchFilter({
    data: groups,
    searchFields: ['name', 'description'],
    categoryField: 'category',
    dateField: 'target_date',
    statusField: 'status',
    amountField: 'target_amount',
    nameField: 'name',
  });

  const GROUP_STATUSES = [
    { value: 'active', label: 'Active', color: colors.success },
    { value: 'completed', label: 'Completed', color: colors.primary },
    { value: 'cancelled', label: 'Cancelled', color: colors.error },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ambagan Groups</Text>
        <Text style={styles.headerSubtitle}>Collaborative savings</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={(text) => updateFilter('searchQuery', text)}
        placeholder="Search groups..."
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Result Counter */}
      {totalItems > 0 && (
        <ResultCounter
          filteredCount={filteredCount}
          totalCount={totalItems}
          itemLabel="groups"
        />
      )}

      {/* Group List */}
      <ScrollView style={styles.list}>
        {filteredData.length === 0 ? (
          totalItems === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No Groups Yet"
              message="Create your first savings group to get started."
              type="no-data"
            />
          ) : (
            <EmptyState
              title="No Matches Found"
              message="Try adjusting your search or filters."
              type="no-results"
            />
          )
        ) : (
          filteredData.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onUpdateFilter={updateFilter}
        onToggleCategory={toggleCategory}
        onToggleStatus={toggleStatus}
        onClearAll={clearFilters}
        availableCategories={GROUP_CATEGORIES}
        availableStatuses={GROUP_STATUSES}
        categoryLabel="Group Type"
        statusLabel="Group Status"
        showDateFilter={true}
        showSortOptions={true}
      />
    </View>
  );
}
\`\`\`

---

## Quick Integration Checklist

For each screen you want to add search/filter to:

1. ✅ Import the hook and components
\`\`\`typescript
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';
\`\`\`

2. ✅ Add state for filter modal
\`\`\`typescript
const [showFilterModal, setShowFilterModal] = useState(false);
\`\`\`

3. ✅ Initialize the hook
\`\`\`typescript
const {
  filters,
  filteredData,
  hasActiveFilters,
  totalItems,
  filteredCount,
  updateFilter,
  toggleCategory,
  toggleStatus,
  clearFilters,
} = useSearchFilter({
  data: yourData,
  searchFields: ['field1', 'field2'],
  categoryField: 'category',
  dateField: 'date',
  statusField: 'status',
  amountField: 'amount',
  nameField: 'name',
});
\`\`\`

4. ✅ Add SearchBar component
\`\`\`typescript
<SearchBar
  value={filters.searchQuery}
  onChangeText={(text) => updateFilter('searchQuery', text)}
  placeholder="Search..."
  onFilterPress={() => setShowFilterModal(true)}
  hasActiveFilters={hasActiveFilters}
/>
\`\`\`

5. ✅ Add ResultCounter
\`\`\`typescript
{totalItems > 0 && (
  <ResultCounter
    filteredCount={filteredCount}
    totalCount={totalItems}
    itemLabel="items"
  />
)}
\`\`\`

6. ✅ Update list rendering
\`\`\`typescript
{filteredData.length === 0 ? (
  totalItems === 0 ? (
    <EmptyState title="No Data" message="Add your first item." type="no-data" />
  ) : (
    <EmptyState title="No Matches" message="Try different filters." type="no-results" />
  )
) : (
  filteredData.map((item) => <ItemCard key={item.id} item={item} />)
)}
\`\`\`

7. ✅ Add FilterModal
\`\`\`typescript
<FilterModal
  visible={showFilterModal}
  onClose={() => setShowFilterModal(false)}
  filters={filters}
  onUpdateFilter={updateFilter}
  onToggleCategory={toggleCategory}
  onToggleStatus={toggleStatus}
  onClearAll={clearFilters}
  availableCategories={YOUR_CATEGORIES}
  availableStatuses={YOUR_STATUSES}
  categoryLabel="Category"
  statusLabel="Status"
  showDateFilter={true}
  showSortOptions={true}
/>
\`\`\`

---

## Tips & Tricks

### 1. Nested Object Fields
When searching in nested objects (e.g., `borrower.full_name`), cast to `any`:
\`\`\`typescript
searchFields: ['borrower.full_name' as any, 'borrower.email' as any]
\`\`\`

### 2. Computed Fields
Add computed fields before filtering:
\`\`\`typescript
const dataWithStatus = data.map((item) => ({
  ...item,
  displayStatus: item.is_paid ? 'paid' : 'unpaid',
}));
\`\`\`

### 3. Dynamic Search Fields
Change search fields based on context:
\`\`\`typescript
searchFields: activeTab === 'given' 
  ? ['borrower.full_name', 'borrower.email']
  : ['lender.full_name', 'lender.email']
\`\`\`

### 4. Reset Filters on Tab Change
\`\`\`typescript
useEffect(() => {
  clearFilters();
}, [activeTab]);
\`\`\`

### 5. Custom Status Colors
\`\`\`typescript
const STATUSES = [
  { value: 'active', label: 'Active', color: '#FFA500' },
  { value: 'paid', label: 'Paid', color: '#4CAF50' },
  { value: 'overdue', label: 'Overdue', color: '#F44336' },
];
\`\`\`

---

## Performance Notes

- **Memoization**: All filtering is memoized and only recalculates when dependencies change
- **Single Pass**: O(n) complexity for all filters except sort
- **Lazy Rendering**: Use `FlatList` for large datasets instead of `ScrollView`
- **Debouncing**: Consider debouncing search input for very large datasets

---

## Accessibility

All components include:
- Proper touch targets (minimum 44x44)
- Accessible labels for screen readers
- Color contrast ratios that meet WCAG AA
- Keyboard navigation support

---

Happy coding! 🚀
