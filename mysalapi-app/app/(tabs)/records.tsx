import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

type RecordCategory = 'personal' | 'pautang' | 'ambagan';

interface Record {
  id: string;
  amount: number;
  date: string;
  description?: string;
  category: RecordCategory;
}

export default function RecordsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<RecordCategory>('personal');
  const [records, setRecords] = useState<Record[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = async () => {
    if (!user) return;

    try {
      let query;

      if (selectedCategory === 'personal') {
        // Personal expenses
        const { data } = await supabase
          .from('personal_expenses')
          .select('id, amount, expense_date as date, description')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false });

        setRecords(
          (data || []).map(r => ({
            ...r,
            category: 'personal' as RecordCategory,
          }))
        );
      } else if (selectedCategory === 'pautang') {
        // Loans where user is borrower or lender
        const { data } = await supabase
          .from('loans')
          .select('id, amount_remaining as amount, created_at as date, description, lender_id, borrower_id')
          .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        setRecords(
          (data || []).map(r => ({
            ...r,
            category: 'pautang' as RecordCategory,
          }))
        );
      } else if (selectedCategory === 'ambagan') {
        // Group expenses (ambagan)
        const { data } = await supabase
          .from('group_expenses')
          .select('id, amount, created_at as date, description')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setRecords(
          (data || []).map(r => ({
            ...r,
            category: 'ambagan' as RecordCategory,
          }))
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load records');
    }
  };

  useEffect(() => {
    loadRecords();
  }, [selectedCategory, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const formatCurrency = (n: number) =>
    `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getCategoryLabel = (cat: RecordCategory) => {
    switch (cat) {
      case 'personal': return 'Personal Expenses';
      case 'pautang': return 'Loans';
      case 'ambagan': return 'Group Expenses';
    }
  };

  const getCategoryIcon = (cat: RecordCategory) => {
    switch (cat) {
      case 'personal': return 'wallet';
      case 'pautang': return 'people';
      case 'ambagan': return 'grid';
    }
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.header}>
        <Text style={styles.title}>Records</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['personal', 'pautang', 'ambagan'] as RecordCategory[]).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterButton,
              selectedCategory === cat && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Ionicons
              name={getCategoryIcon(cat) as any}
              size={18}
              color={selectedCategory === cat ? '#ffffff' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === cat && styles.filterButtonTextActive,
              ]}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Records List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No {getCategoryLabel(selectedCategory).toLowerCase()} found</Text>
          </View>
        ) : (
          records.map(record => (
            <TouchableOpacity
              key={record.id}
              style={styles.recordCard}
              onPress={() => {
                // TODO: Navigate to detail/edit screen
              }}
            >
              <View style={styles.recordContent}>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordTitle} numberOfLines={1}>
                    {record.description || 'Untitled'}
                  </Text>
                  <Text style={styles.recordDate}>
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </Text>
                </View>
                <Text style={styles.recordAmount}>{formatCurrency(record.amount)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterButtonTextActive: {
      color: '#ffffff',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    recordCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      elevation: 1,
    },
    recordContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    recordInfo: {
      flex: 1,
    },
    recordTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    recordDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    recordAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
  });
