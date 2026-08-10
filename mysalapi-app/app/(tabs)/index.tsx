import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { setPendingRecordsNav } from '../../lib/navigationStore';

// Home sub-components
import HomeHeader from '../../components/home/HomeHeader';
import StatsCard from '../../components/home/StatsCard';
import HomeCalendar from '../../components/home/HomeCalendar';
import UpcomingBills from '../../components/home/UpcomingBills';
import DuesModal from '../../components/home/DuesModal';

interface DashboardStats {
  totalExpenses: number;
  totalLoansGiven: number;
  totalLoansOwed: number;
  upcomingBills: any[];
  overdueBills: any[];
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
    overdueBills: [],
    overdueLoanCount: 0,
    markedDates: {},
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [duesOnDate, setDuesOnDate] = useState<{ bills: any[]; loans: any[] }>({ bills: [], loans: [] });

  // Stored outside state so it doesn't cause re-renders
  const calendarDateDataRef = React.useRef<any>({});

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    const [
      { data: expenses },
      { data: bills },
      { data: overdueBills },
      { data: loansGiven },
      { data: loansOwed },
      { data: overdueLoans },
      { data: profile },
      { data: allBills },
      { data: allLoans },
    ] = await Promise.all([
      supabase.from('personal_expenses').select('amount').eq('user_id', user.id).gte('expense_date', startOfMonth),
      // upcoming: unpaid bills due from today to 7 days ahead
      supabase.from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false)
        .gte('due_date', today).lte('due_date', in7Days).order('due_date', { ascending: true }),
      // overdue: unpaid bills with due date before today
      supabase.from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false)
        .lt('due_date', today).order('due_date', { ascending: false }),
      supabase.from('loans').select('amount_remaining').eq('lender_id', user.id).neq('status', 'paid'),
      supabase.from('loans').select('amount_remaining').eq('borrower_id', user.id).neq('status', 'paid'),
      // Only show overdue alert for borrowed loans (borrower perspective), not lent loans
      supabase.from('loans').select('id').eq('borrower_id', user.id).lt('due_date', today).neq('status', 'paid'),
      supabase.from('users').select('full_name').eq('id', user.id).single(),
      supabase.from('bill_reminders').select('due_date, title, amount, is_paid').eq('user_id', user.id),
      supabase.from('loans')
        .select('due_date, amount_remaining, status, borrower:borrower_id(full_name), lender:lender_id(full_name)')
        .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`),
    ]);

    setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');

    // Build calendar data
    const dateData: any = {};
    (allBills || []).forEach((bill: any) => {
      const d = bill.due_date;
      if (!dateData[d]) dateData[d] = { bills: [], loans: [] };
      dateData[d].bills.push(bill);
    });
    (allLoans || []).forEach((loan: any) => {
      const d = loan.due_date;
      if (!dateData[d]) dateData[d] = { bills: [], loans: [] };
      dateData[d].loans.push(loan);
    });

    calendarDateDataRef.current = dateData;

    const marked: any = {};
    Object.keys(dateData).forEach((date) => {
      const dotColor = dateData[date].loans.length > 0 ? '#FF5252' : '#2196F3';
      marked[date] = { marked: true, dotColor };
    });

    setStats({
      totalExpenses: expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0,
      totalLoansGiven: loansGiven?.reduce((s, l) => s + Number(l.amount_remaining), 0) || 0,
      totalLoansOwed: loansOwed?.reduce((s, l) => s + Number(l.amount_remaining), 0) || 0,
      upcomingBills: bills || [],
      overdueBills: overdueBills || [],
      overdueLoanCount: overdueLoans?.length || 0,
      markedDates: marked,
    });
  };

  useEffect(() => { loadDashboard(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleDatePress = (day: { dateString: string }) => {
    const data = calendarDateDataRef.current[day.dateString] || { bills: [], loans: [] };
    if (data.bills.length === 0 && data.loans.length === 0) return;
    setSelectedDate(day.dateString);
    setDuesOnDate(data);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const styles = makeStyles(colors);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <HomeHeader userName={userName} />

        {/* Monthly Stats */}
        <StatsCard
          totalExpenses={stats.totalExpenses}
          totalLoansGiven={stats.totalLoansGiven}
          totalLoansOwed={stats.totalLoansOwed}
          upcomingBillsCount={stats.upcomingBills.length + stats.overdueBills.length}
        />

        {/* Calendar */}
        <HomeCalendar markedDates={stats.markedDates} onDatePress={handleDatePress} />

        {/* Overdue Alert */}
        {stats.overdueLoanCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => {
              setPendingRecordsNav({ tab: 'pautang', sub: 'given' });
              router.replace('/(tabs)/records');
            }}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={16} color={colors.error} />
            </View>
            <Text style={styles.alertText}>
              {stats.overdueLoanCount} overdue loan{stats.overdueLoanCount > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Upcoming Bills */}
        <UpcomingBills bills={stats.upcomingBills} overdueBills={stats.overdueBills} />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Calendar date tap modal */}
      <DuesModal
        selectedDate={selectedDate}
        duesOnDate={duesOnDate}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.error + '12',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '600' },
});
