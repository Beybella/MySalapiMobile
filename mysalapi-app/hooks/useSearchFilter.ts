import { useState, useMemo, useCallback } from 'react';

export type SortOption = 'default' | 'newest' | 'oldest' | 'highest' | 'lowest' | 'a-z' | 'z-a';
export type DateRangeOption = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface FilterState {
  searchQuery: string;
  categories: string[];
  dateRange: DateRangeOption;
  customDateStart: string;
  customDateEnd: string;
  statuses: string[];
  sortBy: SortOption;
}

export interface UseSearchFilterOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  categoryField?: keyof T;
  dateField?: keyof T;
  statusField?: keyof T;
  amountField?: keyof T;
  nameField?: keyof T;
}

export function useSearchFilter<T>({
  data,
  searchFields,
  categoryField,
  dateField,
  statusField,
  amountField,
  nameField,
}: UseSearchFilterOptions<T>) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categories: [],
    dateRange: 'all',
    customDateStart: '',
    customDateEnd: '',
    statuses: [],
    sortBy: 'default',
  });

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.length > 0 ||
      filters.categories.length > 0 ||
      filters.dateRange !== 'all' ||
      filters.statuses.length > 0 ||
      filters.sortBy !== 'default'
    );
  }, [filters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      categories: [],
      dateRange: 'all',
      customDateStart: '',
      customDateEnd: '',
      statuses: [],
      sortBy: 'default',
    });
  }, []);

  // Update individual filter
  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Toggle category filter
  const toggleCategory = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  // Toggle status filter
  const toggleStatus = useCallback((status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  // Get date range boundaries
  const getDateRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filters.dateRange) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 86400000 - 1),
        };
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      }
      case 'custom':
        return {
          start: filters.customDateStart ? new Date(filters.customDateStart) : null,
          end: filters.customDateEnd ? new Date(filters.customDateEnd) : null,
        };
      default:
        return { start: null, end: null };
    }
  }, [filters.dateRange, filters.customDateStart, filters.customDateEnd]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Text search - O(n)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Category filter - O(n)
    if (filters.categories.length > 0 && categoryField) {
      result = result.filter((item) => {
        const category = item[categoryField];
        if (category == null) return false;
        return filters.categories.includes(String(category));
      });
    }

    // Date range filter - O(n)
    if (filters.dateRange !== 'all' && dateField) {
      const { start, end } = getDateRange();
      result = result.filter((item) => {
        const dateValue = item[dateField];
        if (dateValue == null) return false;
        const itemDate = new Date(String(dateValue));
        if (isNaN(itemDate.getTime())) return false;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    // Status filter - O(n)
    if (filters.statuses.length > 0 && statusField) {
      result = result.filter((item) => {
        const status = item[statusField];
        if (status == null) return false;
        return filters.statuses.includes(String(status));
      });
    }

    // Sort - O(n log n)
    if (filters.sortBy !== 'default') {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            if (!dateField) return 0;
            return new Date(String(b[dateField])).getTime() - new Date(String(a[dateField])).getTime();
          case 'oldest':
            if (!dateField) return 0;
            return new Date(String(a[dateField])).getTime() - new Date(String(b[dateField])).getTime();
          case 'highest':
            if (!amountField) return 0;
            return Number(b[amountField] || 0) - Number(a[amountField] || 0);
          case 'lowest':
            if (!amountField) return 0;
            return Number(a[amountField] || 0) - Number(b[amountField] || 0);
          case 'a-z':
            if (!nameField) return 0;
            return String(a[nameField] || '').localeCompare(String(b[nameField] || ''));
          case 'z-a':
            if (!nameField) return 0;
            return String(b[nameField] || '').localeCompare(String(a[nameField] || ''));
          default:
            return 0;
        }
      });
    }

    return result;
  }, [data, filters, searchFields, categoryField, dateField, statusField, amountField, nameField, getDateRange]);

  return {
    filters,
    filteredData,
    hasActiveFilters,
    totalItems: data.length,
    filteredCount: filteredData.length,
    updateFilter,
    toggleCategory,
    toggleStatus,
    clearFilters,
  };
}
