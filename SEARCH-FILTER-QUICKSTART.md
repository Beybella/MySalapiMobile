# 🚀 Search & Filter - Quick Start

## ⚡ 5-Minute Integration

### Step 1: Imports (30 seconds)
\`\`\`typescript
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';
\`\`\`

### Step 2: Add State (30 seconds)
\`\`\`typescript
const [showFilterModal, setShowFilterModal] = useState(false);
\`\`\`

### Step 3: Initialize Hook (1 minute)
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
  data: yourData,                    // Your data array
  searchFields: ['name', 'email'],   // Fields to search
  categoryField: 'category',         // Optional
  dateField: 'created_at',           // Optional
  statusField: 'status',             // Optional
  amountField: 'amount',             // Optional
  nameField: 'name',                 // Optional
});
\`\`\`

### Step 4: Add UI (2 minutes)
\`\`\`typescript
return (
  <View>
    {/* Search Bar */}
    <SearchBar
      value={filters.searchQuery}
      onChangeText={(text) => updateFilter('searchQuery', text)}
      placeholder="Search..."
      onFilterPress={() => setShowFilterModal(true)}
      hasActiveFilters={hasActiveFilters}
    />

    {/* Result Counter */}
    {totalItems > 0 && (
      <ResultCounter
        filteredCount={filteredCount}
        totalCount={totalItems}
        itemLabel="items"
      />
    )}

    {/* List */}
    <ScrollView>
      {filteredData.length === 0 ? (
        totalItems === 0 ? (
          <EmptyState
            title="No Data"
            message="Add your first item."
            type="no-data"
          />
        ) : (
          <EmptyState
            title="No Matches"
            message="Try different filters."
            type="no-results"
          />
        )
      ) : (
        filteredData.map((item) => <ItemCard key={item.id} item={item} />)
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
      availableCategories={['Category A', 'Category B']}
      availableStatuses={[
        { value: 'active', label: 'Active', color: '#4CAF50' },
        { value: 'inactive', label: 'Inactive', color: '#999' },
      ]}
      categoryLabel="Category"
      statusLabel="Status"
      showDateFilter={true}
      showSortOptions={true}
    />
  </View>
);
\`\`\`

### Step 5: Done! ✅

---

## 📝 Configuration Checklist

Customize these for your screen:

### Data Configuration
\`\`\`typescript
data: yourDataArray,              // ✏️ Your data
searchFields: ['field1', 'field2'], // ✏️ Fields to search
categoryField: 'category',         // ✏️ Category field name
dateField: 'date',                 // ✏️ Date field name
statusField: 'status',             // ✏️ Status field name
\`\`\`

### UI Labels
\`\`\`typescript
placeholder="Search..."            // ✏️ Search placeholder
itemLabel="items"                  // ✏️ Counter label
categoryLabel="Category"           // ✏️ Category section label
statusLabel="Status"               // ✏️ Status section label
\`\`\`

### Filter Options
\`\`\`typescript
availableCategories={[             // ✏️ Your categories
  'Category A',
  'Category B',
  'Category C',
]}

availableStatuses={[               // ✏️ Your statuses
  { value: 'active', label: 'Active', color: '#4CAF50' },
  { value: 'pending', label: 'Pending', color: '#FFA500' },
  { value: 'inactive', label: 'Inactive', color: '#999' },
]}
\`\`\`

### Feature Toggles
\`\`\`typescript
showDateFilter={true}              // ✏️ Show/hide date filter
showSortOptions={true}             // ✏️ Show/hide sort options
\`\`\`

---

## 🎯 Common Patterns

### Pattern 1: Simple Search Only
\`\`\`typescript
const { filters, filteredData, updateFilter } = useSearchFilter({
  data: items,
  searchFields: ['name', 'description'],
});

return (
  <SearchBar
    value={filters.searchQuery}
    onChangeText={(text) => updateFilter('searchQuery', text)}
  />
);
\`\`\`

### Pattern 2: Search + Categories
\`\`\`typescript
const { filters, filteredData, updateFilter, toggleCategory, hasActiveFilters } = useSearchFilter({
  data: items,
  searchFields: ['name'],
  categoryField: 'type',
});
\`\`\`

### Pattern 3: Full Features
\`\`\`typescript
const { filters, filteredData, ...all } = useSearchFilter({
  data: items,
  searchFields: ['name', 'email'],
  categoryField: 'category',
  dateField: 'created_at',
  statusField: 'status',
  amountField: 'amount',
  nameField: 'name',
});
\`\`\`

---

## 🔧 Troubleshooting

### Issue: "Cannot find module"
**Fix**: Check file paths match your project structure

### Issue: TypeScript errors on nested fields
**Fix**: Cast to `any`:
\`\`\`typescript
searchFields: ['user.name' as any, 'user.email' as any]
\`\`\`

### Issue: Empty state always showing
**Fix**: Check `totalItems === 0` first:
\`\`\`typescript
{filteredData.length === 0 ? (
  totalItems === 0 ? (
    <EmptyState type="no-data" ... />
  ) : (
    <EmptyState type="no-results" ... />
  )
) : (
  // render list
)}
\`\`\`

### Issue: Filters not updating
**Fix**: Make sure you're using the hook's return values:
\`\`\`typescript
const { filteredData } = useSearchFilter(...);
// Use filteredData, NOT original data
{filteredData.map(...)}
\`\`\`

---

## 📚 More Resources

- **Complete Examples**: See `SEARCH-FILTER-EXAMPLES.md`
- **Full API Docs**: See `SEARCH-FILTER-COMPLETE-GUIDE.md`
- **Visual Reference**: See `SEARCH-FILTER-VISUAL-GUIDE.md`
- **Implementation Details**: See `SEARCH-FILTER-IMPLEMENTATION.md`

---

## ✅ Testing Checklist

After integration, test:
- [ ] Search updates results in real-time
- [ ] Clear button appears when typing
- [ ] Filter button turns blue when active
- [ ] Category chips turn blue when selected
- [ ] Date ranges filter correctly
- [ ] Status checkboxes work
- [ ] Sort options work
- [ ] Result counter updates
- [ ] Clear All resets everything
- [ ] Empty states show correctly
- [ ] Modal opens and closes
- [ ] Drag to dismiss works

---

## 🎉 You're Done!

Now you have a complete search and filter system!

**Next Steps:**
1. Test all features
2. Customize colors and labels
3. Add to other screens
4. Enjoy! 🚀

---

**Need help?** Check the comprehensive guides in:
- `SEARCH-FILTER-COMPLETE-GUIDE.md`
- `SEARCH-FILTER-EXAMPLES.md`
- `SEARCH-FILTER-VISUAL-GUIDE.md`
