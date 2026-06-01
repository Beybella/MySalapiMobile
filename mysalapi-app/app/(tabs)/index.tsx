import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

interface DashboardStats {
  totalExpenses: number;
  totalLoansGiven: number;
  totalLoansOwed: number;
  totalGroupOwed: number;
  upcomingBills: any[];
  overdueLoanCount: number;
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    totalLoansGiven: 0,
    totalLoansOwed: 0,
    totalGroupOwed: 0,
    upcomingBills: [],
    overdueLoanCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data: expenses } = await supabase
      .from('personal_expenses').select('amount').eq('user_id', user.id).gte('expense_date', startOfMonth);

    const { data: bills } = await supabase
      .from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false)
      .lte('due_date', in7Days).order('due_date', { ascending: true }).limit(5);

    const { data: loansGiven } = await supabase
      .from('loans').select('amount, amount_remaining').eq('lender_id', user.id).neq('status', 'paid');

    const { data: loansOwed } = await supabase
      .from('loans').select('amount, amount_remaining').eq('borrower_id', user.id).neq('status', 'paid');

    const { data: overdueLoans } = await supabase
      .from('loans').select('id').eq('lender_id', user.id).lt('due_date', today).neq('status', 'paid');

    const { data: profile } = await supabase
      .from('users').select('full_name').eq('id', user.id).single();

    setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');
    setStats({
      totalExpenses: expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0,
      totalLoansGiven: loansGiven?.reduce((s, l) => s + Number(l.amount_remaining), 0) || 0,
      totalLoansOwed: loansOwed?.reduce((s, l) => s + Number(l.amount_remaining), 0) || 0,
      totalGroupOwed: 0,
      upcomingBills: bills || [],
      overdueLoanCount: overdueLoans?.length || 0,
    });
  };

  useEffect(() => { loadDashboard(); }, [user]);

  const onRefresh = async () => { setRefreshing(true); await loadDashboard(); setRefreshing(false); };

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Alerts */}
      {stats.overdueLoanCount > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/(tabs)/pautang')}>
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.alertText}>
            {stats.overdueLoanCount} overdue loan{stats.overdueLoanCount > 1 ? 's' : ''} — tap to view
          </Text>
        </TouchableOpacity>
      )}

      {/* Summary Cards */}
      <View style={styles.cardsRow}>
        <TouchableOpacity style={[styles.card, { borderTopColor: colors.personalLedger }]} onPress={() => router.push('/(tabs)/personal')}>
          <Text style={styles.cardLabel}>This Month</Text>
          <Text style={[styles.cardAmount, { color: colors.personalLedger }]}>{formatCurrency(stats.totalExpenses)}</Text>
          <Text style={styles.cardSub}>Personal Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { borderTopColor: colors.pautangLedger }]} onPress={() => router.push('/(tabs)/pautang')}>
          <Text style={styles.cardLabel}>To Collect</Text>
          <Text style={[styles.cardAmount, { color: colors.pautangLedger }]}>{formatCurrency(stats.totalLoansGiven)}</Text>
          <Text style={styles.cardSub}>Loans Given</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardsRow}>
        <TouchableOpacity style={[styles.card, { borderTopColor: colors.error }]} onPress={() => router.push('/(tabs)/pautang')}>
          <Text style={styles.cardLabel}>I Owe</Text>
          <Text style={[styles.cardAmount, { color: colors.error }]}>{formatCurrency(stats.totalLoansOwed)}</Text>
          <Text style={styles.cardSub}>Loans Owed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { borderTopColor: colors.budgetPlanner }]} onPress={() => router.push('/(tabs)/budget')}>
          <Text style={styles.cardLabel}>Budget</Text>
          <Ionicons name="bar-chart" size={28} color={colors.budgetPlanner} />
          <Text style={styles.cardSub}>Smart Planner</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Bills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bills (7 days)</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/personal')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {stats.upcomingBills.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming bills</Text>
        ) : (
          stats.upcomingBills.map((bill) => (
            <View key={bill.id} style={styles.billItem}>
              <View style={styles.billLeft}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.billName}>{bill.title}</Text>
                  <Text style={styles.billDate}>Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}</Text>
                </View>
              </View>
              <Text style={styles.billAmount}>{formatCurrency(Number(bill.amount))}</Text>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { label: 'Add Expense', icon: 'add-circle', route: '/(tabs)/personal', color: colors.personalLedger },
            { label: 'New Loan', icon: 'people', route: '/(tabs)/pautang', color: colors.pautangLedger },
            { label: 'Group Expense', icon: 'grid', route: '/(tabs)/ambagan', color: colors.ambaganLedger },
            { label: 'Budget Plan', icon: 'bar-chart', route: '/(tabs)/budget', color: colors.budgetPlanner },
            { label: 'Reports', icon: 'pie-chart', route: '/reports', color: colors.primary },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '25' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary, padding: 24, paddingTop: 56,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
    userName: { color: '#fff', fontSize: 22, fontWeight: '700' },
    logoutBtn: { padding: 8 },
    alertBanner: {
      backgroundColor: colors.error, flexDirection: 'row', alignItems: 'center',
      padding: 12, paddingHorizontal: 16, gap: 8,
    },
    alertText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    cardsRow: { flexDirection: 'row', padding: 12, gap: 12 },
    card: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16,
      borderTopWidth: 4, elevation: 2,
    },
    cardLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 },
    cardAmount: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
    cardSub: { fontSize: 11, color: colors.textLight },
    section: { margin: 12, marginTop: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    emptyText: { color: colors.textLight, fontSize: 14, textAlign: 'center', padding: 16 },
    billItem: {
      backgroundColor: colors.surface, borderRadius: 10, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 8, elevation: 1,
    },
    billLeft: { flexDirection: 'row', alignItems: 'center' },
    billName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    billDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    billAmount: { fontSize: 15, fontWeight: '700', color: colors.primary },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    quickAction: { width: '45%', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
    quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickActionLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  });
