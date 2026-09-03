import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DraggableModal from './DraggableModal';
import DateInput from './DateInput';
import { FilterState, SortOption, DateRangeOption } from '../hooks/useSearchFilter';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleCategory: (category: string) => void;
  onToggleStatus: (status: string) => void;
  onClearAll: () => void;
  availableCategories?: string[];
  availableStatuses?: { value: string; label: string; color: string }[];
  categoryLabel?: string;
  statusLabel?: string;
  showDateFilter?: boolean;
  showSortOptions?: boolean;
}

const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string; icon: string }[] = [
  { value: 'all', label: 'All Time', icon: 'infinite' },
  { value: 'today', label: 'Today', icon: 'today' },
  { value: 'week', label: 'This Week', icon: 'calendar' },
  { value: 'month', label: 'This Month', icon: 'calendar-outline' },
  { value: 'custom', label: 'Custom', icon: 'options' },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'default', label: 'Default', icon: 'list' },
  { value: 'newest', label: 'Newest First', icon: 'arrow-down' },
  { value: 'oldest', label: 'Oldest First', icon: 'arrow-up' },
  { value: 'highest', label: 'Highest Amount', icon: 'trending-up' },
  { value: 'lowest', label: 'Lowest Amount', icon: 'trending-down' },
  { value: 'a-z', label: 'A to Z', icon: 'text' },
  { value: 'z-a', label: 'Z to A', icon: 'text-outline' },
];

export default function FilterModal({
  visible,
  onClose,
  filters,
  onUpdateFilter,
  onToggleCategory,
  onToggleStatus,
  onClearAll,
  availableCategories = [],
  availableStatuses = [],
  categoryLabel = 'Categories',
  statusLabel = 'Status',
  showDateFilter = true,
  showSortOptions = true,
}: FilterModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.statuses.length > 0 ||
    filters.sortBy !== 'default';

  return (
    <DraggableModal visible={visible} onClose={onClose} maxHeight="85%">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="options" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Filters & Sort</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Categories */}
        {availableCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{categoryLabel}</Text>
            <View style={styles.chipContainer}>
              {availableCategories.map((category) => {
                const isActive = filters.categories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onToggleCategory(category)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Date Range */}
        {showDateFilter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.chipContainer}>
              {DATE_RANGE_OPTIONS.map((option) => {
                const isActive = filters.dateRange === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onUpdateFilter('dateRange', option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={14}
                      color={isActive ? '#fff' : colors.textLight}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isActive && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filters.dateRange === 'custom' && (
              <View style={styles.customDateContainer}>
                <View style={{ flex: 1 }}>
                  <DateInput
                    label="Start Date"
                    value={filters.customDateStart}
                    onChange={(date) => onUpdateFilter('customDateStart', date)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DateInput
                    label="End Date"
                    value={filters.customDateEnd}
                    onChange={(date) => onUpdateFilter('customDateEnd', date)}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Status */}
        {availableStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{statusLabel}</Text>
            {availableStatuses.map((status) => {
              const isActive = filters.statuses.includes(status.value);
              return (
                <TouchableOpacity
                  key={status.value}
                  style={styles.checkboxRow}
                  onPress={() => onToggleStatus(status.value)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isActive && {
                        backgroundColor: status.color,
                        borderColor: status.color,
                      },
                    ]}
                  >
                    {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={styles.checkboxLabel}>{status.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Sort */}
        {showSortOptions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {SORT_OPTIONS.map((option) => {
              const isActive = filters.sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioRow,
                    isActive && { backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => onUpdateFilter('sortBy', option.value)}
                >
                  <View
                    style={[
                      styles.radio,
                      isActive && { borderColor: colors.primary },
                    ]}
                  >
                    {isActive && (
                      <View
                        style={[styles.radioInner, { backgroundColor: colors.primary }]}
                      />
                    )}
                  </View>
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={isActive ? colors.primary : colors.textLight}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.radioLabel,
                      isActive && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, styles.clearBtn]}
          onPress={onClearAll}
          disabled={!hasActiveFilters}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={hasActiveFilters ? colors.error : colors.textLight}
          />
          <Text
            style={[
              styles.clearBtnText,
              !hasActiveFilters && { color: colors.textLight },
            ]}
          >
            Clear All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, styles.applyBtn]}
          onPress={onClose}
        >
          <Text style={styles.applyBtnText}>Apply Filters</Text>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </DraggableModal>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingTop: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingBottom: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    customDateContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.background,
      marginBottom: 8,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
    },
    checkboxLabel: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '600',
      flex: 1,
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.background,
      marginBottom: 6,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    radioLabel: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '600',
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    clearBtn: {
      backgroundColor: colors.error + '15',
      borderWidth: 1.5,
      borderColor: colors.error + '30',
    },
    clearBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.error,
    },
    applyBtn: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    applyBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
