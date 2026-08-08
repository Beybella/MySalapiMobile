import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Image, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

interface DashboardStats {
  totalExpenses: number;
  totalLoansGiven: number;
  totalLoansOwed: number;
  upcomingBills: any[];
  overdueLoanCount: number;
  markedDates: any;
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    totalLoansGiven: 0,
    totalLoansOwed: 0,
    upcomingBills: [],
    overdueLoanCount: 0,
    markedDates: {},
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [duesOnDate, setDuesOnDate] = useState<{ bills: any[], loans: any[] }>({ bills: [], loans: [] });
  const [modalTab, setModalTab] = useState<'unsettled' | 'paid'>('unsettled');

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    const [{ data: expenses }, { data: bills }, { data: loansGiven },
           { data: loansOwed }, { data: overdueLoans }, { data: profile },
           { data: allBills }, { data: allLoans }] =
      await Promise.all([
        supabase.from('personal_expenses').select('amount').eq('user_id', user.id).gte('expense_date', startOfMonth),
        supabase.from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false)
          .lte('due_date', in7Days).order('due_date', { ascending: true }).limit(5),
        supabase.from('loans').select('amount_remaining').eq('lender_id', user.id).neq('status', 'paid'),
        supabase.from('loans').select('amount_remaining').eq('borrower_id', user.id).neq('status', 'paid'),
        supabase.from('loans').select('id').eq('lender_id', user.id).lt('due_date', today).neq('status', 'paid'),
        supabase.from('users').select('full_name').eq('id', user.id).single(),
        supabase.from('bill_reminders').select('due_date, title, amount, is_paid').eq('user_id', user.id)
          .gte('due_date', today).lte('due_date', in30Days),
        supabase.from('loans').select('due_date, amount_remaining, status, borrower:borrower_id(full_name), lender:lender_id(full_name)')
          .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`)
          .gte('due_date', today).lte('due_date', in30Days),
      ]);

    setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');

    // Build marked dates for calendar - one dot per type
    const marked: any = {};
    const dateData: any = {}; // Store actual data for each date
    
    // Track which dates have which types
    (allBills || []).forEach((bill: any) => {
      const date = bill.due_date;
      if (!dateData[date]) {
        dateData[date] = { bills: [], loans: [] };
      }
      dateData[date].bills.push(bill);
    });

    (allLoans || []).forEach((loan: any) => {
      const date = loan.due_date;
      if (!dateData[date]) {
        dateData[date] = { bills: [], loans: [] };
      }
      dateData[date].loans.push(loan);
    });

    // Create marked dates with one dot per type
    Object.keys(dateData).forEach((date) => {
      marked[date] = { dots: [] };
      
      if (dateData[date].bills.length > 0) {
        marked[date].dots.push({ key: 'bill', color: '#2196F3' });
      }
      if (dateData[date].loans.length > 0) {
        marked[date].dots.push({ key: 'loan', color: '#FF5252' });
      }
    });

    // Store dateData for click handling
    (window as any).calendarDateData = dateData;

    setStats({
      totalExpenses: expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0,
      totalLoansGiven: loansGiven?.reduce((s, l) => s + Number(l.amount_remaining), 0) || 0,
      totalLoansOwed: loansOwed?.reduce((s, l) => s + Number(l.amount_remaining), 0) || 0,
      upcomingBills: bills || [],
      overdueLoanCount: overdueLoans?.length || 0,
      markedDates: marked,
    });
  };

  useEffect(() => { loadDashboard(); }, [user]);
  const onRefresh = async () => { setRefreshing(true); await loadDashboard(); setRefreshing(false); };

  const handleDatePress = (day: any) => {
    const dateData = (window as any).calendarDateData || {};
    const data = dateData[day.dateString] || { bills: [], loans: [] };
    
    if (data.bills.length === 0 && data.loans.length === 0) {
      return; // No dues on this date
    }
    
    setSelectedDate(day.dateString);
    setDuesOnDate(data);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ],
      { cancelable: true }
    );
  };

  const formatCurrency = (n: number) =>
    `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const styles = makeStyles(colors);

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroLeft}>
            <Image
              source={require('../../assets/MySalapiLogo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.heroGreeting}>Good day,</Text>
              <Text style={styles.heroName}>{userName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Monthly spend highlight */}
        <View style={styles.spendCard}>
          <Text style={styles.spendLabel}>Total Spent This Month</Text>
          <Text style={styles.spendAmount}>{formatCurrency(stats.totalExpenses)}</Text>
          <View style={styles.spendDivider} />
          <View style={styles.spendRow}>
            <View style={styles.spendItem}>
              <Text style={styles.spendItemValue} numberOfLines={1}>{formatCurrency(stats.totalLoansGiven)}</Text>
              <Text style={styles.spendItemLabel}>To Collect</Text>
            </View>
            <View style={styles.spendSep} />
            <View style={styles.spendItem}>
              <Text style={[styles.spendItemValue, { color: colors.error }]} numberOfLines={1}>
                {formatCurrency(stats.totalLoansOwed)}
              </Text>
              <Text style={styles.spendItemLabel}>I Owe</Text>
            </View>
            <View style={styles.spendSep} />
            <View style={styles.spendItem}>
              <Text style={styles.spendItemValue}>{stats.upcomingBills.length}</Text>
              <Text style={styles.spendItemLabel}>Bills Due</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Overdue Alert ── */}
      {stats.overdueLoanCount > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/(tabs)/pautang')}>
          <View style={styles.alertIcon}>
            <Ionicons name="warning" size={16} color={colors.error} />
          </View>
          <Text style={styles.alertText}>
            {stats.overdueLoanCount} overdue loan{stats.overdueLoanCount > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.error} />
        </TouchableOpacity>
      )}

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
          {[
            { label: 'Expense', icon: 'wallet-outline', route: '/(tabs)/personal', color: colors.personalLedger },
            { label: 'Loan', icon: 'people-outline', route: '/(tabs)/pautang', color: colors.pautangLedger },
            { label: 'Ambagan', icon: 'grid-outline', route: '/(tabs)/ambagan', color: colors.ambaganLedger },
            { label: 'Budget', icon: 'bar-chart-outline', route: '/(tabs)/budget', color: colors.budgetPlanner },
            { label: 'Reports', icon: 'pie-chart-outline', route: '/reports', color: colors.primary },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionChip}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionChipIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionChipLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Calendar View ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Dues Calendar</Text>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.calendarCard}>
          <Calendar
            markedDates={stats.markedDates}
            markingType={'multi-dot'}
            onDayPress={handleDatePress}
            renderHeader={(date: any) => {
              const d = new Date(date);
              const label = d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
              return (
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
                  {label}
                </Text>
              );
            }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.primary,
              todayBackgroundColor: colors.primary + '15',
              dayTextColor: colors.textPrimary,
              textDisabledColor: colors.textLight,
              monthTextColor: colors.textPrimary,
              textDayFontSize: 15,
              textMonthFontSize: 17,
              textDayHeaderFontSize: 13,
              arrowColor: colors.primary,
              dotColor: colors.primary,
            }}
            style={styles.calendar}
          />
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Bills</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
              <Text style={styles.legendText}>Loans</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Upcoming Bills ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bills</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/personal')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {stats.upcomingBills.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
            <Text style={styles.emptyText}>No bills due in the next 7 days</Text>
          </View>
        ) : (
          stats.upcomingBills.map((bill, index) => {
            const daysLeft = Math.ceil(
              (new Date(bill.due_date).getTime() - Date.now()) / 86400000
            );
            const isUrgent = daysLeft <= 1;
            return (
              <View key={bill.id} style={[styles.billItem, index === 0 && { marginTop: 0 }]}>
                <View style={[styles.billDot, {
                  backgroundColor: isUrgent ? colors.error : colors.warning,
                }]} />
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.title}</Text>
                  <Text style={styles.billDate}>
                    {format(new Date(bill.due_date), 'MMM d, yyyy')}
                    {isUrgent ? ' · Today' : daysLeft === 0 ? ' · Today' : ` · ${daysLeft}d left`}
                  </Text>
                </View>
                <Text style={[styles.billAmount, isUrgent && { color: colors.error }]}>
                  {formatCurrency(Number(bill.amount))}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Dues Modal ── */}
      <Modal
        visible={selectedDate !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDate ? format(new Date(selectedDate), 'MMM d, yyyy') : ''}
                </Text>
                <Text style={styles.modalSubtitle}>Dues on this date</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setSelectedDate(null);
                setModalTab('unsettled');
              }} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[styles.modalTab, modalTab === 'unsettled' && styles.modalTabActive]}
                onPress={() => setModalTab('unsettled')}
              >
                <Text style={[styles.modalTabText, modalTab === 'unsettled' && styles.modalTabTextActive]}>
                  Unsettled
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTab, modalTab === 'paid' && styles.modalTabActive]}
                onPress={() => setModalTab('paid')}
              >
                <Text style={[styles.modalTabText, modalTab === 'paid' && styles.modalTabTextActive]}>
                  Paid
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalScrollContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
              {duesOnDate.bills.filter((bill: any) => modalTab === 'paid' ? bill.is_paid : !bill.is_paid).length > 0 && (
                <View style={styles.duesSection}>
                  <View style={styles.duesSectionHeader}>
                    <View style={[styles.dueDot, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.duesSectionTitle}>
                      Bills ({duesOnDate.bills.filter((bill: any) => modalTab === 'paid' ? bill.is_paid : !bill.is_paid).length})
                    </Text>
                  </View>
                  {duesOnDate.bills
                    .filter((bill: any) => modalTab === 'paid' ? bill.is_paid : !bill.is_paid)
                    .map((bill: any, idx: number) => {
                      const isPaid = bill.is_paid;
                      return (
                        <View key={idx} style={[styles.dueItem, isPaid && styles.dueItemPaid]}>
                          <Text style={[styles.dueItemTitle, isPaid && styles.dueItemTitlePaid]}>
                            {bill.title}
                          </Text>
                          <Text style={[styles.dueItemAmount, isPaid && styles.dueItemAmountPaid]}>
                            {formatCurrency(Number(bill.amount))}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}

              {duesOnDate.loans.filter((loan: any) => modalTab === 'paid' ? loan.status === 'paid' : loan.status !== 'paid').length > 0 && (
                <View style={styles.duesSection}>
                  <View style={styles.duesSectionHeader}>
                    <View style={[styles.dueDot, { backgroundColor: '#FF5252' }]} />
                    <Text style={styles.duesSectionTitle}>
                      Loans ({duesOnDate.loans.filter((loan: any) => modalTab === 'paid' ? loan.status === 'paid' : loan.status !== 'paid').length})
                    </Text>
                  </View>
                  {duesOnDate.loans
                    .filter((loan: any) => modalTab === 'paid' ? loan.status === 'paid' : loan.status !== 'paid')
                    .map((loan: any, idx: number) => {
                      const isPaid = loan.status === 'paid';
                      return (
                        <View key={idx} style={[styles.dueItem, isPaid && styles.dueItemPaid]}>
                          <Text style={[styles.dueItemTitle, isPaid && styles.dueItemTitlePaid]}>
                            {loan.borrower?.full_name || loan.lender?.full_name || 'Loan'}
                          </Text>
                          <Text style={[styles.dueItemAmount, isPaid && styles.dueItemAmountPaid]}>
                            {formatCurrency(Number(loan.amount_remaining))}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}

              {duesOnDate.bills.filter((bill: any) => modalTab === 'paid' ? bill.is_paid : !bill.is_paid).length === 0 && 
               duesOnDate.loans.filter((loan: any) => modalTab === 'paid' ? loan.status === 'paid' : loan.status !== 'paid').length === 0 && (
                <View style={styles.emptyDues}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
                  <Text style={styles.emptyDuesText}>
                    No {modalTab === 'paid' ? 'paid' : 'unsettled'} dues on this date
                  </Text>
                </View>
              )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Hero
    hero: { backgroundColor: colors.primary, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroLogo: { width: 40, height: 40, borderRadius: 10 },
    heroGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
    heroName: { fontSize: 18, fontWeight: '700', color: '#fff' },
    logoutBtn: { padding: 6 },

    // Spend card inside hero
    spendCard: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    spendLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
    spendAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 14 },
    spendDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 14 },
    spendRow: { flexDirection: 'row', alignItems: 'center' },
    spendItem: { flex: 1, alignItems: 'center' },
    spendItemValue: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
    spendItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    spendSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Alert
    alertBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: colors.error + '12',
      borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.error + '30',
    },
    alertIcon: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.error + '20',
      justifyContent: 'center', alignItems: 'center',
    },
    alertText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '600' },

    // Sections
    section: { marginHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },

    // Quick actions horizontal scroll
    actionsScroll: { marginTop: 12 },
    actionChip: { alignItems: 'center', marginRight: 16, width: 64 },
    actionChipIcon: {
      width: 52, height: 52, borderRadius: 16,
      justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    },
    actionChipLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

    // Bills
    emptyCard: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 24,
      alignItems: 'center', gap: 8, elevation: 1,
    },
    emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
    billItem: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginBottom: 8, elevation: 1,
    },
    billDot: { width: 8, height: 8, borderRadius: 4 },
    billInfo: { flex: 1 },
    billName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    billDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    billAmount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

    // Calendar
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      elevation: 3,
      marginTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendar: {
      borderRadius: 12,
    },
    calendarLegend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 12,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderRadius: 20,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '600',
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      width: '100%',
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 20,
      paddingBottom: 16,
      borderBottomWidth: 0,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    modalClose: {
      padding: 4,
    },
    modalTabs: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    modalTabActive: {
      backgroundColor: colors.primary,
    },
    modalTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalTabTextActive: {
      color: '#ffffff',
    },
    modalScrollContainer: {
      padding: 20,
      height: 300,
    },
    modalScroll: {
    },

    // Dues sections
    duesSection: {
      marginBottom: 20,
    },
    duesSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    dueDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    duesSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    dueItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
    },
    dueItemPaid: {
      backgroundColor: colors.success + '15',  // Light green background
    },
    dueItemTitle: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
      flex: 1,
      marginRight: 12,
    },
    dueItemTitlePaid: {
      textDecorationLine: 'line-through',
      color: colors.success,  // Green text
    },
    dueItemAmount: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '700',
    },
    dueItemAmountPaid: {
      textDecorationLine: 'line-through',
      color: colors.success,  // Green text
    },
    emptyDues: {
      alignItems: 'center',
      padding: 40,
      gap: 12,
    },
    emptyDuesText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });