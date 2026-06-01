import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Others'];
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B', Transport: '#4ECDC4', Utilities: '#45B7D1',
  Health: '#96CEB4', Entertainment: '#FFEAA7', Shopping: '#DDA0DD',
  Education: '#98D8C8', Others: '#B0B0B0',
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
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.totalSub}>{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {sortedCats.length === 0 ? <Text style={styles.emptyText}>No expenses this month.</Text> : (
            sortedCats.map(([cat, amount]) => {
              const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[cat] || colors.textLight }]} />
                    <Text style={styles.catName}>{cat}</Text>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={styles.catAmount}>{formatCurrency(amount)}</Text>
                    <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, { width: `${pct}%` as any, backgroundColor: CATEGORY_COLORS[cat] || colors.textLight }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Summary (All Time)</Text>
          <View style={styles.loanSummaryGrid}>
            {[
              { label: 'Total Lent', value: loanSummary.given, color: colors.pautangLedger },
              { label: 'Collected', value: loanSummary.collected, color: colors.success },
              { label: 'Total Owed', value: loanSummary.owed, color: colors.error },
            ].map((item) => (
              <View key={item.label} style={[styles.loanCard, { borderTopColor: item.color }]}>
                <Text style={styles.loanCardLabel}>{item.label}</Text>
                <Text style={[styles.loanCardValue, { color: item.color }]}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {expenses.length === 0 ? <Text style={styles.emptyText}>No transactions this month.</Text> : (
            expenses.map((exp) => (
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
    header: { backgroundColor: colors.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 8 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    monthBtn: { padding: 8 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    totalCard: { margin: 16, backgroundColor: colors.primary, borderRadius: 16, padding: 24, alignItems: 'center' },
    totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
    totalAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 4 },
    totalSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
    section: { marginHorizontal: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
    emptyText: { color: colors.textLight, fontSize: 14, textAlign: 'center', padding: 16 },
    catRow: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
    catLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    catName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 },
    catRight: { position: 'absolute', right: 14, top: 14, alignItems: 'flex-end' },
    catAmount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    catPct: { fontSize: 11, color: colors.textSecondary },
    catBarBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    catBarFill: { height: 6, borderRadius: 3 },
    loanSummaryGrid: { flexDirection: 'row', gap: 10 },
    loanCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 14, borderTopWidth: 3, elevation: 1 },
    loanCardLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
    loanCardValue: { fontSize: 14, fontWeight: '800' },
    txRow: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 6, elevation: 1 },
    txDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    txInfo: { flex: 1 },
    txTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    txMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  });
