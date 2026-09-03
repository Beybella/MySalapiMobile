# Search & Filter System Implementation

Complete search and filter system for React Native MySalapi app.

## 📁 Files Created

### 1. Core Hook
- **`hooks/useSearchFilter.ts`** - Main filtering logic with O(n) complexity
  - Text search across multiple fields
  - Category multi-select
  - Date range filtering (All Time, Today, Week, Month, Custom)
  - Status filtering with checkboxes
  - Sorting (Default, Newest, Oldest, Highest, Lowest, A-Z, Z-A)
  - Memoized for performance

### 2. UI Components
- **`components/SearchBar.tsx`** - Search input with clear button and filter toggle
- **`components/FilterModal.tsx`** - Draggable modal with all filter options
- **`components/ResultCounter.tsx`** - Shows "X of Y items"
- **`components/EmptyState.tsx`** - Different states for no data vs no matches

## 🎯 Features Implemented

✅ Real-time text search with clear button
✅ Multi-select category chips (turn blue when active)
✅ Date range filters with custom date picker
✅ Status checkboxes with color-coded icons
✅ Sort options with radio buttons
✅ Filter button turns blue when active
✅ Result counter shows filtered vs total
✅ Clear All button
✅ Draggable filter modal
✅ Empty states (no data vs no results)
✅ TypeScript with proper types
✅ O(n) filtering algorithms
✅ Memoized functions for performance
✅ Edge case handling (null values, empty arrays)

## 📖 Usage Example - Pautang Screen

Here's how to integrate into your existing Pautang screen:

\`\`\`typescript
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';

export default function PautangScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'given' | 'owed'>('given');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Original data
  const [loansGiven, setLoansGiven] = useState<any[]>([]);
  const [loansOwed, setLoansOwed] = useState<any[]>([]);
  
  // Get active data based on tab
  const activeData = activeTab === 'given' ? loansGiven : loansOwed;
  
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
    data: activeData,
    searchFields: ['borrower.full_name', 'borrower.email', 'lender.full_name', 'lender.email', 'purpose'],
    categoryField: 'payment_method',
    dateField: 'due_date',
    statusField: 'status',
    amountField: 'amount_remaining',
    nameField: activeTab === 'given' ? 'borrower.full_name' : 'lender.full_name',
  });

  // Available categories from PAYMENT_METHODS
  const PAYMENT_METHODS = ['GCash', 'Maya', 'BDO', 'BPI', 'Cash', 'Other'];
  
  // Available statuses
  const LOAN_STATUSES = [
    { value: 'active', label: 'Active', color: colors.warning },
    { value: 'partial', label: 'Partial', color: colors.info },
    { value: 'paid', label: 'Paid', color: colors.success },
    { value: 'overdue', label: 'Overdue', color: colors.error },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>...</View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>...</View>

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={(text) => updateFilter('searchQuery', text)}
        placeholder={`Search ${activeTab === 'given' ? 'borrowers' : 'lenders'}...`}
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Result Counter */}
      {totalItems > 0 && (
        <ResultCounter
          filteredCount={filteredCount}
          totalCount={totalItems}
          itemLabel="loans"
        />
      )}

      {/* Loan List */}
      <ScrollView style={styles.list}>
        {filteredData.length === 0 ? (
          totalItems === 0 ? (
            <EmptyState
              icon={activeTab === 'given' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
              title={activeTab === 'given' ? 'No Loans Given' : 'No Loans Owed'}
              message={
                activeTab === 'given'
                  ? 'Start tracking loans by tapping the + button below.'
                  : "You don't owe anyone. Great job!"
              }
              type="no-data"
            />
          ) : (
            <EmptyState
              title="No Matches Found"
              message="Try adjusting your search or filters to find what you're looking for."
              type="no-results"
            />
          )
        ) : (
          filteredData.map((loan) => renderLoan(loan, activeTab === 'given'))
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
        availableCategories={PAYMENT_METHODS}
        availableStatuses={LOAN_STATUSES}
        categoryLabel="Payment Method"
        statusLabel="Loan Status"
        showDateFilter={true}
        showSortOptions={true}
      />

      {/* FAB */}
      {activeTab === 'given' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddLoan(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
\`\`\`

## 🎨 Visual Features

### Search Bar
- Clean, modern design with rounded corners
- Search icon on left
- Clear button (X) appears when typing
- Filter button on right
- Filter button turns **blue** when filters are active

### Filter Modal
- Draggable from top edge
- Organized sections: Categories, Date Range, Status, Sort
- **Category chips** turn **blue** when selected
- Date range includes All Time, Today, Week, Month, Custom
- Status checkboxes with color-coded dots
- Sort options with radio buttons
- Clear All button (red outline) + Apply button (blue solid)

### Result Counter
- Small badge with document icon
- Shows "Showing X of Y items"
- Highlights filtered count in blue

### Empty States
- Large circular icon
- Different messages for:
  - No data exists (e.g., "No loans given yet")
  - No search matches (e.g., "Try adjusting your filters")

## 🔧 Integration Steps

1. **Import the hook and components** in your screen
2. **Pass your data array** to `useSearchFilter`
3. **Specify which fields** to search, filter, and sort
4. **Add SearchBar** below your tabs
5. **Add ResultCounter** to show counts
6. **Replace your list rendering** with `filteredData.map()`
7. **Add EmptyState** for zero results
8. **Add FilterModal** at bottom of component

## 📊 Performance

- **O(n) filtering** - single pass through data
- **O(n log n) sorting** - standard array sort
- **Memoized results** - only recalculates when dependencies change
- **Efficient hooks** - uses `useCallback` and `useMemo`

## 🎯 Customization

You can customize each screen differently:

\`\`\`typescript
// Personal Expenses
const { filteredData } = useSearchFilter({
  data: expenses,
  searchFields: ['description', 'category'],
  categoryField: 'category',
  dateField: 'expense_date',
  amountField: 'amount',
  nameField: 'description',
});

// Bills
const { filteredData } = useSearchFilter({
  data: bills,
  searchFields: ['title', 'category'],
  categoryField: 'category',
  dateField: 'due_date',
  statusField: 'is_paid',
  amountField: 'amount',
  nameField: 'title',
});

// Ambagan Groups
const { filteredData } = useSearchFilter({
  data: groups,
  searchFields: ['name', 'description'],
  categoryField: 'category',
  dateField: 'created_at',
  statusField: 'status',
  nameField: 'name',
});
\`\`\`

## 🎨 Theme Support

All components use `useTheme()` hook for light/dark mode support.

## ✅ Best Practices

1. **Always check totalItems === 0** before showing "no results"
2. **Use different EmptyState messages** for no data vs no matches
3. **Memoize expensive computations** in your render functions
4. **Keep filter state in parent** component, not in modal
5. **Reset filters** when changing tabs/screens if needed

## 🚀 Ready to Use

All components are production-ready with:
- TypeScript types
- Error handling
- Edge case coverage
- Performance optimization
- Accessibility support
- Theme integration
- Clean, modern UI

Happy filtering! 🎉
