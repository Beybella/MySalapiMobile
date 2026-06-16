import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfDay, subDays, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Others'];
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B', 
  Transport: '#4ECDC4', 
  Utilities: '#45B7D1',
  Health: '#96CEB4', 
  Entertainment: '#FFEAA7', 
  Shopping: '#DDA0DD',
  Education: '#98D8C8', 
  Others: '#B0B0B0',
};

export default function ReportsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [loanSummary, setLoanSummary] = useState({ given: 0, owed: 0, collected: 0 });
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getMonthRange = () => {
    const base = subMonths(new Date(), monthOffset);
    return { start: startOfMonth(base).toISOString().split('T')[0], end: endOfMonth(base).toISOString().split('T')[0], label: format(base, 'MMMM yyyy') };
  };

  const loadData = async () => {
    if (!user) return;
    const { start, end } = getMonthRange();
    const { data: expData } = await supabase.from('personal_expenses').select('*').eq('user_id', user.id).gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false });
    const { data: loansGiven } = await supabase.from('loans').select('amount, amount_remaining').eq('lender_id', user.id);
    const { data: loansOwed } = await supabase.from('loans').select('amount, amount_remaining').eq('borrower_id', user.id);
    const exps = expData || [];
    setExpenses(exps);
    const total = exps.reduce((s, e) => s + Number(e.amount), 0);
    setTotalSpent(total);
    const cats: Record<string, number> = {};
    CATEGORIES.forEach((c) => { cats[c] = 0; });
    exps.forEach((e) => { const cat = e.category || 'Others'; cats[cat] = (cats[cat] || 0) + Number(e.amount); });
    setCategoryTotals(cats);
    const givenTotal = (loansGiven || []).reduce((s, l) => s + Number(l.amount), 0);
    const owedTotal = (loansOwed || []).reduce((s, l) => s + Number(l.amount), 0);
    const collectedTotal = (loansGiven || []).reduce((s, l) => s + (Number(l.amount) - Number(l.amount_remaining)), 0);
    setLoanSummary({ given: givenTotal, owed: owedTotal, collected: collectedTotal });
  };

  useEffect(() => { loadData(); }, [user, monthOffset]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };
  const formatCurrency = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const { label } = getMonthRange();
  const sortedCats = Object.entries(categoryTotals).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  
  const getTrendData = () => {
    const { start } = getMonthRange();
    const startDate = new Date(start);
    const endDate = new Date();
    
    if (trendPeriod === 'daily') {
      // Last 7 days
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(endDate, 6 - i);
        const dayStr = format(date, 'yyyy-MM-dd');
        const dayExpenses = expenses.filter(e => e.expense_date === dayStr);
        const total = dayExpenses.reduce((s, e) => s + Number(e.amount), 0);
        return { label: format(date, 'EEE'), value: total, date: dayStr };
      });
      return days;
    } else if (trendPeriod === 'weekly') {
      // Last 4 weeks
      const weeks = Array.from({ length: 4 }, (_, i) => {
        const weekEnd = subDays(endDate, i * 7);
        const weekStart = subDays(weekEnd, 6);
        const weekExpenses = expenses.filter(e => {
          const expDate = new Date(e.expense_date);
          return expDate >= weekStart && expDate <= weekEnd;
        });
        const total = weekExpenses.reduce((s, e) => s + Number(e.amount), 0);
        return { label: `W${4-i}`, value: total, date: format(weekStart, 'MMM d') };
      });
      return weeks.reverse();
    } else {
      // Last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(endDate, 5 - i);
        const monthStr = format(monthDate, 'yyyy-MM');
        const monthExpenses = expenses.filter(e => e.expense_date.startsWith(monthStr));
        const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
        return { label: format(monthDate, 'MMM'), value: total, date: monthStr };
      });
      return months;
    }
  };

  const renderTrendChart = () => {
    const data = getTrendData();
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    // Chart dimensions
    const chartWidth = 320;
    const chartHeight = 120;
    const padding = 20;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding;
    
    // Calculate points for the line
    const points = data.map((item, idx) => {
      const x = padding + (idx / (data.length - 1)) * graphWidth;
      const y = padding + graphHeight - (item.value / maxValue) * graphHeight;
      return { x, y, value: item.value };
    });
    
    // Create smooth curve path using quadratic bezier curves
    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const midX = (current.x + next.x) / 2;
        
        // Quadratic curve for smooth transition
        pathD += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
        pathD += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`;
      }
    }
    
    // Create gradient fill path
    let fillPath = pathD;
    if (points.length > 0) {
      fillPath += ` L ${points[points.length - 1].x} ${chartHeight}`;
      fillPath += ` L ${points[0].x} ${chartHeight} Z`;
    }
    
    return (
      <View style={styles.chartArea}>
        <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
          <Defs>
            <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          
          {/* Gradient fill under line */}
          <Path d={fillPath} fill="url(#lineGradient)" />
          
          {/* Main line */}
          <Path 
            d={pathD} 
            stroke={colors.primary} 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, idx) => (
            <Circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={colors.surface}
              stroke={colors.primary}
              strokeWidth="2.5"
            />
          ))}
        </Svg>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.map((item, idx) => (
            <Text key={idx} style={styles.barXLabel}>{item.label}</Text>
          ))}
        </View>
      </View>
    );
  };
  
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Reports</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => setMonthOffset((m) => m + 1)} style={styles.monthBtn}><Ionicons name="chevron-back" size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.monthLabel}>{label}</Text>
        <TouchableOpacity onPress={() => setMonthOffset((m) => Math.max(0, m - 1))} style={[styles.monthBtn, monthOffset === 0 && { opacity: 0.3 }]} disabled={monthOffset === 0}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="wallet-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.statSub}>{expenses.length} transactions</Text>
            </View>
          </View>
          
          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trending-up-outline" size={22} color={colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>To Collect</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(loanSummary.given)}</Text>
              <Text style={styles.statSub}>Loans given</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="trending-down-outline" size={22} color={colors.error} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>I Owe</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>{formatCurrency(loanSummary.owed)}</Text>
              <Text style={styles.statSub}>My debts</Text>
            </View>
          </View>
          
          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.warning} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Collected</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>{formatCurrency(loanSummary.collected)}</Text>
              <Text style={styles.statSub}>Payments received</Text>
            </View>
          </View>
        </View>

        {/* Spending Trends Section */}
        <View style={styles.trendsSection}>
          <View style={styles.trendsHeader}>
            <Text style={styles.sectionTitle}>Spending Trends</Text>
            <View style={styles.trendTabs}>
              <TouchableOpacity 
                style={[styles.trendTab, trendPeriod === 'daily' && styles.trendTabActive]}
                onPress={() => setTrendPeriod('daily')}
              >
                <Text style={[styles.trendTabText, trendPeriod === 'daily' && styles.trendTabTextActive]}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.trendTab, trendPeriod === 'weekly' && styles.trendTabActive]}
                onPress={() => setTrendPeriod('weekly')}
              >
                <Text style={[styles.trendTabText, trendPeriod === 'weekly' && styles.trendTabTextActive]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.trendTab, trendPeriod === 'monthly' && styles.trendTabActive]}
                onPress={() => setTrendPeriod('monthly')}
              >
                <Text style={[styles.trendTabText, trendPeriod === 'monthly' && styles.trendTabTextActive]}>Monthly</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderTrendChart()}
        </View>

        {/* Bar Chart Section */}
        {sortedCats.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {sortedCats.map(([cat, amount]) => {
              const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <View key={cat} style={styles.barRow}>
                  <View style={styles.barHeader}>
                    <View style={styles.barLeft}>
                      <View style={[styles.barDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
                      <Text style={styles.barLabel}>{cat}</Text>
                    </View>
                    <View style={styles.barRight}>
                      <Text style={styles.barValue}>{formatCurrency(amount)}</Text>
                      <Text style={styles.barPct}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: CATEGORY_COLORS[cat] }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {expenses.length === 0 ? <Text style={styles.emptyText}>No transactions this month.</Text> : (
            expenses.slice(0, 10).map((exp) => (
              <View key={exp.id} style={styles.txRow}>
                <View style={[styles.txDot, { backgroundColor: CATEGORY_COLORS[exp.category] || colors.textLight }]} />
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{exp.title}</Text>
                  <Text style={styles.txMeta}>{exp.category} · {format(new Date(exp.expense_date), 'MMM d')}</Text>
                </View>
                <Text style={styles.txAmount}>{formatCurrency(Number(exp.amount))}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { 
      backgroundColor: colors.primary, 
      paddingTop: 56, 
      paddingBottom: 24, 
      paddingHorizontal: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    },
    backBtn: { padding: 8 },
    headerTitle: { 
      color: '#fff', 
      fontSize: 24, 
      fontWeight: '700', 
      letterSpacing: 0.3 
    },
    monthSelector: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      backgroundColor: colors.surface, 
      paddingHorizontal: 16, 
      paddingVertical: 16,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    monthBtn: { padding: 8 },
    monthLabel: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: colors.textPrimary 
    },
    
    // Stats Cards - Compact Size
    statsRow: { 
      flexDirection: 'row', 
      paddingHorizontal: 16, 
      gap: 10,
      marginBottom: 10,
    },
    statCard: { 
      flex: 1, 
      backgroundColor: colors.surface, 
      borderRadius: 12, 
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderLeftWidth: 3,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    statContent: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    statLabel: { 
      fontSize: 10, 
      color: colors.textSecondary, 
      marginBottom: 3,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: { 
      fontSize: 16, 
      fontWeight: '800',
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    statSub: { 
      fontSize: 9, 
      color: colors.textLight,
      fontWeight: '600',
    },
    
    // Spending Trends Section
    trendsSection: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    trendsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    trendTabs: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 3,
    },
    trendTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    trendTabActive: {
      backgroundColor: colors.primary,
    },
    trendTabText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    trendTabTextActive: {
      color: '#fff',
    },
    chartArea: {
      alignItems: 'center',
      marginTop: 8,
      paddingVertical: 10,
    },
    svgChart: {
      overflow: 'visible',
    },
    xAxisLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 320,
      paddingHorizontal: 20,
      marginTop: 8,
    },
    barXLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      flex: 1,
    },
    
    // Bar Chart Section - Compact
    chartSection: { 
      marginHorizontal: 16, 
      marginBottom: 16,
      backgroundColor: colors.surface, 
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    barRow: {
      marginBottom: 12,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    barLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    barDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    barLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    barValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    barRight: {
      alignItems: 'flex-end',
    },
    barPct: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
    },
    barTrack: {
      height: 6,
      backgroundColor: colors.borderLight || colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: 6,
      borderRadius: 3,
    },
    
    section: { marginHorizontal: 16, marginBottom: 16 },
    sectionTitle: { 
      fontSize: 15, 
      fontWeight: '700', 
      color: colors.textPrimary, 
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    emptyText: { 
      color: colors.textLight, 
      fontSize: 14, 
      textAlign: 'center', 
      padding: 20,
      fontWeight: '500',
    },
    txRow: { 
      backgroundColor: colors.surface, 
      borderRadius: 12, 
      padding: 14, 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    txDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, flexShrink: 0 },
    txInfo: { flex: 1 },
    txTitle: { 
      fontSize: 14, 
      fontWeight: '600', 
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    txMeta: { 
      fontSize: 12, 
      color: colors.textSecondary, 
      marginTop: 2,
      fontWeight: '500',
    },
    txAmount: { 
      fontSize: 15, 
      fontWeight: '700', 
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
  });
