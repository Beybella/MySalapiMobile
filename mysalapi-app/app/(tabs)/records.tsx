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
  status?: string;
}

export default function RecordsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<RecordCategory>('personal');
  const [records, setRecords] = useState<Record[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let data;

      if (selectedCategory === 'personal') {
        // Personal expenses
        const response = await supabase
          .from('personal_expenses')
          .select('id, amount, expense_date, description')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false });

        if (response.error) {
          console.error('Personal expenses query error:', response.error);
          setRecords([]);
        } else {
          data = response.data || [];
          setRecords(
            data.map(r => ({
              id: r.id,
              amount: r.amount,
              date: r.expense_date,
              description: r.description,
              category: 'personal' as RecordCategory,
            }))
          );
        }
      } else if (selectedCategory === 'pautang') {
        // Loans where user is borrower or lender
        const response = await supabase
          .from('loans')
          .select('id, amount_remaining, created_at, purpose, status')
          .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (response.error) {
          console.error('Loans query error:', response.error);
          setRecords([]);
        } else {
          data = response.data || [];
          setRecords(
            data.map(r => ({
              id: r.id,
              amount: r.amount_remaining,
              date: r.created_at,
              description: r.purpose,
              status: r.status,
              category: 'pautang' as RecordCategory,
            }))
          );
        }
      } else if (selectedCategory === 'ambagan') {
        // Group expenses (ambagan)
        const response = await supabase
          .from('group_expenses')
          .select('id, total_amount, expense_date, title')
          .eq('payer_id', user.id)
          .order('expense_date', { ascending: false });

        if (response.error) {
          console.error('Group expenses query error:', response.error);
          setRecords([]);
        } else {
          data = response.data || [];
          setRecords(
            data.map(r => ({
              id: r.id,
              amount: r.total_amount,
              date: r.expense_date,
              description: r.title,
              category: 'ambagan' as RecordCategory,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Records</Text>
      </View>

      {/* Category Filter - Horizontal Chips */}
      <View style={styles.filterContainer}>
        {(['personal', 'pautang', 'ambagan'] as RecordCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterButton,
              selectedCategory === cat && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getCategoryIcon(cat) as any}
              size={16}
              color={selectedCategory === cat ? '#ffffff' : colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === cat && styles.filterButtonTextActive,
              ]}
            >
              {cat === 'personal' ? 'Personal' : cat === 'pautang' ? 'Loans' : 'Groups'}
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
        {loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hourglass" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>Loading records...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No {getCategoryLabel(selectedCategory).toLowerCase()} found</Text>
          </View>
        ) : selectedCategory === 'pautang' ? (
          // For loans, separate active/partial (unsettled) and paid (settled)
          <>
            {/* Unsettled Loans */}
            {records.filter(r => r.status !== 'paid').length > 0 && (
              <>
                <Text style={styles.recordsGroupTitle}>Unsettled Loans</Text>
                {records
                  .filter(r => r.status !== 'paid')
                  .map(record => (
                    <TouchableOpacity
                      key={record.id}
                      style={styles.recordCard}
                      onPress={() => {
                        router.push({
                          pathname: '/loan-detail',
                          params: { id: record.id },
                        });
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
                  ))}
              </>
            )}

            {/* Settled Loans */}
            {records.filter(r => r.status === 'paid').length > 0 && (
              <>
                <Text style={[styles.recordsGroupTitle, { marginTop: 12 }]}>Settled Loans</Text>
                {records
                  .filter(r => r.status === 'paid')
                  .map(record => (
                    <TouchableOpacity
                      key={record.id}
                      style={styles.recordCard}
                      onPress={() => {
                        router.push({
                          pathname: '/loan-detail',
                          params: { id: record.id },
                        });
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
                        <Text style={[styles.recordAmount, { color: colors.success }]}>{formatCurrency(record.amount)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </>
            )}
          </>
        ) : (
          // For personal and ambagan
          records.map(record => (
            <TouchableOpacity
              key={record.id}
              style={styles.recordCard}
              onPress={() => {
                if (selectedCategory === 'ambagan') {
                  router.push({
                    pathname: '/group-detail',
                    params: { id: record.id },
                  });
                }
                // TODO: Add navigation for personal expenses
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
      paddingHorizontal: 24,
      paddingTop: 56,
      paddingBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 10,
      justifyContent: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    filterButtonTextActive: {
      color: '#ffffff',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 4,
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
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
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
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    recordDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    recordAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    recordsGroupTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      paddingHorizontal: 20,
      paddingTop: 5,
      paddingBottom: 5,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
