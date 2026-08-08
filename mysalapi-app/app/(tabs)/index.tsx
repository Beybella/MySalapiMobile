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
  const [calendarExpanded, setCalendarExpanded] = useState(false);

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

  // Get current week dates for horizontal calendar
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Go to Sunday
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const weekDates = getCurrentWeekDates();
  const todayStr = new Date().toISOString().split('T')[0];
  const styles = makeStyles(colors);

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
      {/* ── Modern Header with Greeting ── */}
      <View style={styles.modernHeader}>
        <View style={styles.modernHeaderTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.currentDate}>{format(new Date(), 'EEEE, d MMMM, yyyy')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutIconBtn}>
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Old Quick Stats Card ── */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Monthly Overview</Text>
          <Text style={styles.statsAmount}>{formatCurrency(stats.totalExpenses)}</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsItemValue} numberOfLines={1}>{formatCurrency(stats.totalLoansGiven)}</Text>
            <Text style={styles.statsItemLabel}>To Collect</Text>
          </View>
          <View style={styles.statsSep} />
          <View style={styles.statsItem}>
            <Text style={[styles.statsItemValue, { color: colors.error }]} numberOfLines={1}>
              {formatCurrency(stats.totalLoansOwed)}
            </Text>
            <Text style={styles.statsItemLabel}>I Owe</Text>
          </View>
          <View style={styles.statsSep} />
          <View style={styles.statsItem}>
            <Text style={styles.statsItemValue}>{stats.upcomingBills.length}</Text>
            <Text style={styles.statsItemLabel}>Bills Due</Text>
          </View>
        </View>
      </View>

      {/* ── Calendar (Expands Seamlessly) ── */}
      <View style={styles.weekCalendarContainer}>
        {!calendarExpanded ? (
          <>
            <View style={styles.weekCalendar}>
              {weekDates.map((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const isToday = dateStr === todayStr;
                const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
                const dayNum = date.getDate();
                const hasDues = stats.markedDates[dateStr];
                
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={styles.weekDayContainer}
                    onPress={() => handleDatePress({ dateString: dateStr })}
                  >
                    <Text style={styles.weekDayLabel}>{dayLabel}</Text>
                    <View style={[
                      styles.weekDayCircle,
                      isToday && styles.weekDayCircleToday,
                    ]}>
                      <Text style={[
                        styles.weekDayNum,
                        isToday && styles.weekDayNumToday,
                      ]}>{dayNum}</Text>
                    </View>
                    {hasDues && (
                      <View style={styles.weekDayDots}>
                        {hasDues.dots.map((dot: any, i: number) => (
                          <View key={i} style={[styles.weekDayDot, { backgroundColor: dot.color }]} />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.compactLegend}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={styles.compactLegendItem}>
                  <View style={[styles.compactLegendDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.compactLegendText}>Bills</Text>
                </View>
                <View style={styles.compactLegendItem}>
                  <View style={[styles.compactLegendDot, { backgroundColor: '#FF5252' }]} />
                  <Text style={styles.compactLegendText}>Loans</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setCalendarExpanded(true)}
              >
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
                <Text style={styles.expandButtonText}>Expand</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Calendar
              markedDates={stats.markedDates}
              markingType={'multi-dot'}
              onDayPress={handleDatePress}
              renderHeader={(date: any) => {
                const d = new Date(date);
                const label = d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
                return <Text style={styles.expandedCalendarHeader}>{label}</Text>;
              }}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#ffffff',
                todayBackgroundColor: colors.primary,
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.textLight,
                monthTextColor: colors.textPrimary,
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 12,
                arrowColor: colors.primary,
                dotColor: colors.primary,
              }}
              style={styles.expandedCalendar}
            />
            
            <View style={styles.compactLegend}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={styles.compactLegendItem}>
                  <View style={[styles.compactLegendDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.compactLegendText}>Bills</Text>
                </View>
                <View style={styles.compactLegendItem}>
                  <View style={[styles.compactLegendDot, { backgroundColor: '#FF5252' }]} />
                  <Text style={styles.compactLegendText}>Loans</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setCalendarExpanded(false)}
              >
                <Ionicons name="chevron-up" size={16} color={colors.primary} />
                <Text style={styles.expandButtonText}>Collapse</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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

    // Modern Header
    modernHeader: {
      backgroundColor: colors.primary,
      paddingTop: 56,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      marginBottom: 16,
    },
    headerLogo: {
      marginLeft: 12,
    },
    logoImage: {
      width: 40,
      height: 40,
    },
    modernHeaderTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      justifyContent: 'center',
    },
    logoutIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    greeting: {
      fontSize: 13,
      fontWeight: '500',
      color: '#ffffff',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    userName: {
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    currentDate: {
      fontSize: 12,
      color: '#ffffff',
      fontWeight: '500',
    },
    avatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    avatar: {
      width: '100%',
      height: '100%',
    },

    // Week Calendar with Circles
    weekCalendarContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 24,
      padding: 20,
      elevation: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      marginBottom: 16,
    },
    weekCalendar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    weekDayContainer: {
      alignItems: 'center',
      gap: 8,
    },
    weekDayLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    weekDayCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    weekDayCircleToday: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    weekDayNum: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    weekDayNumToday: {
      color: '#ffffff',
    },
    weekDayDots: {
      flexDirection: 'row',
      gap: 4,
    },
    weekDayDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    // Compact Legend
    compactLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    compactLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    compactLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    compactLegendText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
    },
    expandButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '700',
    },

    expandedCalendar: {
      marginBottom: 12,
    },
    expandedCalendarHeader: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },

    // Old Stats Card (Enhanced)
    statsCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 24,
      padding: 24,
      elevation: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      marginBottom: 16,
    },
    statsHeader: {
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    statsAmount: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    statsDivider: {
      height: 1.5,
      backgroundColor: colors.border,
      marginBottom: 20,
      opacity: 0.5,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsItem: {
      flex: 1,
      alignItems: 'center',
    },
    statsItemValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    statsItemLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    statsSep: {
      width: 1.5,
      height: 36,
      backgroundColor: colors.border,
      opacity: 0.5,
    },

    // Alert
    alertBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 16, marginBottom: 12,
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
      backgroundColor: '#f0f0f0',  // Light gray background
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
      color: '#999999',  // Gray text
    },
    dueItemAmount: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '700',
    },
    dueItemAmountPaid: {
      textDecorationLine: 'line-through',
      color: '#999999',  // Gray text
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