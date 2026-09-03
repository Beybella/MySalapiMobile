import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { sendShortfallAlert } from '../../lib/api';
import DateInput from '../../components/DateInput';
import AppModal from '../../components/AppModal';

const FUND_TYPES = ['credit_card', 'savings_account', 'cash'];
const FUND_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  savings_account: 'Savings Account',
  cash: 'Cash on Hand',
};

// Bill Categories
const BILL_CATEGORIES = [
  'Housing', 'Utilities', 'Transportation', 'Food', 'Healthcare',
  'Entertainment', 'Insurance', 'Education', 'Subscriptions', 'Other'
];

const CATEGORY_ICONS: Record<string, string> = {
  Housing: 'home',
  Utilities: 'flash',
  Transportation: 'car',
  Food: 'restaurant',
  Healthcare: 'medical',
  Entertainment: 'game-controller',
  Insurance: 'shield-checkmark',
  Education: 'school',
  Subscriptions: 'card',
  Other: 'ellipsis-horizontal-circle',
};

const RECURRENCE_PATTERNS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
];

type BillWithCategory = {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  is_recurring: boolean;
  category: string;
  recurrence_pattern: string | null;
};

export default function BudgetScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [fundSources, setFundSources] = useState<any[]>([]);
  const [bills, setBills] = useState<BillWithCategory[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [billSplits, setBillSplits] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);
  const [healthStatus, setHealthStatus] = useState<'Healthy' | 'At Risk' | 'Critical'>('Healthy');
  const [totalObligations, setTotalObligations] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [shortfall, setShortfall] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'bills' | 'goals'>('overview');
  const [periodStart, setPeriodStart] = useState(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(endOfMonth(new Date()).toISOString().split('T')[0]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showAddFund, setShowAddFund] = useState(false);
  const [showEditFund, setShowEditFund] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillWithCategory | null>(null);
  const [editingFund, setEditingFund] = useState<any>(null);
  const [fundName, setFundName] = useState('');
  const [fundType, setFundType] = useState('savings_account');
  const [fundBalance, setFundBalance] = useState('');
  // Split bill state
  const [splitAllocations, setSplitAllocations] = useState<{ fundId: string; amount: string }[]>([]);
  
  // Budget Goals state
  const [budgetGoals, setBudgetGoals] = useState<any[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('Savings');
  
  // Spending Limits state
  const [spendingLimits, setSpendingLimits] = useState<any[]>([]);
  const [showAddLimit, setShowAddLimit] = useState(false);
  const [showEditLimit, setShowEditLimit] = useState(false);
  const [editingLimit, setEditingLimit] = useState<any>(null);
  const [limitCategory, setLimitCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  
  // Update Goal Progress state
  const [showUpdateGoal, setShowUpdateGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [goalContribution, setGoalContribution] = useState('');
  
  // Analytics state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<any[]>([]);

  // ── Reusable modals ──────────────────────────────────────────────────
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const showError = (msg: string) => { setErrorMsg(msg); setShowErrorModal(true); };

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const showInfo = (title: string, msg: string) => { setInfoTitle(title); setInfoMsg(msg); setShowInfoModal(true); };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const showConfirm = (title: string, msg: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };
  const runConfirm = () => {
    setShowConfirmModal(false);
    if (confirmAction) confirmAction();
  };

  const [showLimitMenu, setShowLimitMenu] = useState(false);
  const [limitMenuTarget, setLimitMenuTarget] = useState<any>(null);

  const deleteLimit = async (limit: any) => {
    setShowLimitMenu(false);
    if (!limit) return;
    const { error } = await supabase.from('spending_limits').delete().eq('id', limit.id);
    if (error) { showError(error.message); return; }
    loadData();
  };

  const loadData = async () => {
    if (!user) return;
    const start = periodStart;
    const end = periodEnd;
    
    // Load existing data
    const { data: funds } = await supabase.from('fund_sources').select('*').eq('user_id', user.id).order('created_at');
    const { data: billData, error: billError } = await supabase.from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false).gte('due_date', start).lte('due_date', end).order('due_date');
    console.log('[Budget] period:', start, '→', end, '| bills fetched:', billData?.length, '| error:', billError?.message);
    console.log('[Budget] bill due_dates:', (billData || []).map((b: any) => b.due_date));
    const { data: allocData } = await supabase.from('budget_allocations').select('*').eq('user_id', user.id);
    
    // Load budget goals
    const { data: goalsData } = await supabase.from('budget_goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at');
    setBudgetGoals(goalsData || []);
    
    // Load spending limits
    const { data: limitsData } = await supabase.from('spending_limits').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at');
    setSpendingLimits(limitsData || []);
    
    // Load payment history (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data: historyData } = await supabase.from('bill_payment_history').select('*').eq('user_id', user.id).gte('paid_date', sixMonthsAgo.toISOString().split('T')[0]).order('paid_date', { ascending: false });
    setPaymentHistory(historyData || []);
    
    // Load budget vs actual
    const { data: bvaData } = await supabase.from('budget_vs_actual').select('*').eq('user_id', user.id).order('month', { ascending: false }).limit(6);
    setBudgetVsActual(bvaData || []);
    
    const fundsWithBalance = (funds || []).map((f) => {
      const allocated = (allocData || []).filter((a) => a.fund_source_id === f.id).reduce((s: number, a: any) => s + Number(a.amount), 0);
      return { ...f, available_balance: Number(f.credit_limit || f.initial_balance) - allocated };
    });
    setFundSources(fundsWithBalance);
    setBills(billData || []);
    setAllocations(allocData || []);
    const totalBills = (billData || []).reduce((s: number, b: any) => s + Number(b.amount), 0);
    const totalFunds = fundsWithBalance.reduce((s: number, f: any) => s + f.available_balance, 0);
    const sf = Math.max(0, totalBills - totalFunds);
    setTotalObligations(totalBills);
    setTotalAvailable(totalFunds);
    setShortfall(sf);
    const ratio = totalFunds > 0 ? totalBills / totalFunds : 1;
    setHealthStatus(ratio <= 0.8 ? 'Healthy' : ratio <= 1 ? 'At Risk' : 'Critical');
    generateRecommendations(fundsWithBalance, billData || [], sf);
    if (sf > 0 && user) {
      const { data: userProfile } = await supabase.from('users').select('email').eq('id', user.id).single();
      if (userProfile?.email) {
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase.from('email_notifications').select('id').eq('notification_type', 'shortfall').eq('recipient_email', userProfile.email).gte('created_at', `${today}T00:00:00`).limit(1);
        if (!existing || existing.length === 0) {
          const { data: notif } = await supabase.from('email_notifications').insert({ recipient_email: userProfile.email, subject_email: 'MySalapi — Budget Shortfall Alert', notification_type: 'shortfall', status: 'pending' }).select().single();
          sendShortfallAlert({ recipient_email: userProfile.email, shortfall: sf, bills: (billData || []).map((b: any) => ({ title: b.title, amount: Number(b.amount), due_date: b.due_date })), notification_id: notif?.id });
        }
      }
    }
  };

  const generateRecommendations = (funds: any[], billList: any[], sf: number) => {
    if (sf <= 0) { setRecommendations([]); return; }
    const recs: string[] = [];
    const surplusFunds = funds.filter((f) => f.available_balance > 0);
    const sortedBills = [...billList].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    if (sortedBills.length > 1) recs.push(`Defer "${sortedBills[0].title}" (due ${format(new Date(sortedBills[0].due_date), 'MMM d')}) to free up ₱${Number(sortedBills[0].amount).toFixed(2)}.`);
    if (surplusFunds.length > 0) recs.push(`Move funds from "${surplusFunds[0].name}" — it has ₱${surplusFunds[0].available_balance.toFixed(2)} available.`);
    recs.push(`You need ₱${sf.toFixed(2)} more to cover all bills. Consider adding a fund source.`);
    setRecommendations(recs.slice(0, 5));
  };

  useEffect(() => { loadData(); }, [user, periodStart, periodEnd]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const deleteFundSource = (fund: any) => {
    showConfirm('Delete Fund Source', `Delete "${fund.name}"? All allocations linked to it will also be removed.`, async () => {
      const { error: allocError } = await supabase.from('budget_allocations').delete().eq('fund_source_id', fund.id);
      if (allocError) { showError('Failed to remove allocations.'); return; }
      const { error } = await supabase.from('fund_sources').delete().eq('id', fund.id);
      if (error) { showError(error.message); return; }
      loadData();
    });
  };

  const openEditFund = (fund: any) => {
    setEditingFund(fund); setFundName(fund.name); setFundType(fund.type);
    setFundBalance(String(fund.credit_limit || fund.initial_balance)); setShowEditFund(true);
  };

  const saveEditFund = async () => {
    if (!fundName || !fundBalance) { showError('Name and balance are required.'); return; }
    const balance = parseFloat(fundBalance);
    if (isNaN(balance) || balance <= 0) { showError('Enter a valid balance.'); return; }
    const payload: any = { name: fundName, type: fundType };
    if (fundType === 'credit_card') { payload.credit_limit = balance; payload.initial_balance = null; }
    else { payload.initial_balance = balance; payload.credit_limit = null; }
    const { error } = await supabase.from('fund_sources').update(payload).eq('id', editingFund.id);
    if (error) { showError(error.message); return; }
    setShowEditFund(false); setEditingFund(null); setFundName(''); setFundBalance(''); setFundType('savings_account');
    loadData();
  };

  const addFundSource = async () => {
    if (!fundName || !fundBalance) { showError('Name and balance are required.'); return; }
    const balance = parseFloat(fundBalance);
    if (isNaN(balance) || balance <= 0) { showError('Enter a valid balance.'); return; }
    const { data: existing } = await supabase.from('fund_sources').select('id').eq('user_id', user!.id).eq('name', fundName).single();
    if (existing) { showError('A fund source with that name already exists.'); return; }
    const payload: any = { user_id: user!.id, name: fundName, type: fundType };
    if (fundType === 'credit_card') payload.credit_limit = balance;
    else payload.initial_balance = balance;
    const { error } = await supabase.from('fund_sources').insert(payload);
    if (error) { showError(error.message); return; }
    setShowAddFund(false); setFundName(''); setFundBalance(''); setFundType('savings_account');
    loadData();
  };

  // Returns the effective available balance for a fund, accounting for:
  // - all existing allocations for OTHER bills
  // - the current bill's existing allocation being REPLACED (so we add it back)
  const getEffectiveBalance = (fund: any): number => {
    const billAmt = selectedBill ? Number(selectedBill.amount) : 0;
    // Sum of allocations for this fund, excluding the current bill's allocation
    const otherAllocated = allocations
      .filter((a) => a.fund_source_id === fund.id && a.bill_reminder_id !== selectedBill?.id)
      .reduce((s: number, a: any) => s + Number(a.amount), 0);
    const rawBalance = Number(fund.credit_limit || fund.initial_balance);
    return rawBalance - otherAllocated;
  };

  const allocateBill = async (fundSourceId: string) => {
    if (!selectedBill) return;
    const fund = fundSources.find((f) => f.id === fundSourceId);
    if (!fund) return;
    const effectiveBalance = getEffectiveBalance(fund);
    if (effectiveBalance < Number(selectedBill.amount)) {
      showConfirm(
        'Shortfall Warning',
        `${fund.name} will be short by ₱${(Number(selectedBill.amount) - effectiveBalance).toFixed(2)}. Proceed anyway?`,
        () => saveAllocation(fundSourceId)
      );
    } else {
      saveAllocation(fundSourceId);
    }
  };

  const saveAllocation = async (fundSourceId: string) => {
    if (!selectedBill) return;
    // upsert replaces any existing allocation for this bill automatically
    await supabase.from('budget_allocations').upsert(
      {
        user_id: user!.id,
        bill_reminder_id: selectedBill.id,
        fund_source_id: fundSourceId,
        amount: selectedBill.amount,
      },
      { onConflict: 'bill_reminder_id' }
    );
    setShowAllocate(false);
    setSelectedBill(null);
    // Reload everything so all balances and totals are recalculated from DB
    loadData();
  };

  const removeAllocation = async (billId: string) => {
    await supabase.from('budget_allocations').delete().eq('bill_reminder_id', billId);
    setShowAllocate(false);
    setSelectedBill(null);
    loadData();
  };

  const autoAllocate = async () => {
    const sortedBills = [...bills].sort((a, b) => {
      const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return Number(b.amount) - Number(a.amount);
    });
    const workingFunds = fundSources.map((f) => ({ ...f }));
    const plan: { bill: any; fund: any }[] = [];
    for (const bill of sortedBills) {
      const eligible = workingFunds.filter((f) => f.available_balance >= Number(bill.amount));
      eligible.sort((a, b) => b.available_balance - a.available_balance);
      if (eligible.length > 0) { plan.push({ bill, fund: eligible[0] }); eligible[0].available_balance -= Number(bill.amount); }
    }
    if (plan.length === 0) { showInfo('No Allocations Possible', 'No fund source has enough balance for any bill.'); return; }
    showConfirm('Auto-Allocate Plan', `${plan.length} bill(s) will be allocated. Apply?`, async () => {
      for (const { bill, fund } of plan) {
        await supabase.from('budget_allocations').upsert({ user_id: user!.id, bill_reminder_id: bill.id, fund_source_id: fund.id, amount: bill.amount }, { onConflict: 'bill_reminder_id' });
      }
      loadData();
    });
  };

  const formatCurrency = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const healthColor = healthStatus === 'Healthy' ? colors.healthy : healthStatus === 'At Risk' ? colors.atRisk : colors.critical;
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={[styles.header, { backgroundColor: colors.budgetPlanner }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Smart Budget</Text>
          <Text style={styles.headerSubtitle}>Financial Planning</Text>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowDateFilter(true)}
        >
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
          <Ionicons 
            name={healthStatus === 'Healthy' ? 'checkmark-circle' : healthStatus === 'At Risk' ? 'alert-circle' : 'warning'} 
            size={14} 
            color="#fff" 
          />
          <Text style={styles.healthText}>{healthStatus}</Text>
        </View>
      </View>

      {/* Modern Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {(['overview', 'funds', 'bills', 'goals'] as const).map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tab, activeTab === tab && styles.tabActive]} 
                onPress={() => setActiveTab(tab)}
              >
                <Ionicons 
                  name={
                    tab === 'overview' ? 'stats-chart' : 
                    tab === 'funds' ? 'wallet' : 
                    tab === 'bills' ? 'receipt' : 
                    'trophy'
                  } 
                  size={18} 
                  color={activeTab === tab ? colors.budgetPlanner : colors.textLight} 
                />
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewContainer}>
            {/* Enhanced Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderLeftColor: colors.error + '80' }]}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-down" size={20} color={colors.error} />
                </View>
                <Text style={styles.summaryLabel}>Total Bills</Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>{formatCurrency(totalObligations)}</Text>
              </View>
              
              <View style={[styles.summaryCard, { borderLeftColor: colors.success + '80' }]}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-up" size={20} color={colors.success} />
                </View>
                <Text style={styles.summaryLabel}>Available</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(totalAvailable)}</Text>
              </View>
            </View>

            {/* Alert Banners */}
            {shortfall > 0 && (
              <View style={styles.shortfallBanner}>
                <View style={styles.shortfallIcon}>
                  <Ionicons name="warning" size={22} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shortfallTitle}>Budget Shortfall</Text>
                  <Text style={styles.shortfallAmount}>
                    You need {formatCurrency(shortfall)} more to cover all bills
                  </Text>
                </View>
              </View>
            )}
            
            {shortfall === 0 && bills.length > 0 && fundSources.length > 0 && totalObligations > 0 && (
              <View style={styles.healthyBanner}>
                <View style={styles.healthyIcon}>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.healthyTitle}>All Bills Covered!</Text>
                  <Text style={styles.healthyText}>
                    Remaining: {formatCurrency(totalAvailable - totalObligations)}
                  </Text>
                </View>
              </View>
            )}

            {/* Recommendations */}
            {recommendations.filter((r) => !dismissedRecs.includes(r)).length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bulb" size={20} color={colors.warning} />
                  <Text style={styles.sectionTitle}>Smart Suggestions</Text>
                </View>
                {recommendations.filter((r) => !dismissedRecs.includes(r)).map((rec, i) => (
                  <View key={i} style={styles.recCard}>
                    <View style={styles.recIcon}>
                      <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.budgetPlanner} />
                    </View>
                    <Text style={styles.recText}>{rec}</Text>
                    <TouchableOpacity 
                      onPress={() => setDismissedRecs((d) => [...d, rec])}
                      style={styles.recDismiss}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Auto Allocate Button */}
            <TouchableOpacity style={styles.autoBtn} onPress={autoAllocate}>
              <View style={styles.autoBtnGradient}>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.autoBtnText}>Auto-Allocate Bills</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            
            {/* Enhanced Category Spending Chart */}
            {bills.length > 0 && (
              <View style={styles.categoryChartSection}>
                <View style={styles.categoryChartHeader}>
                  <View style={styles.categoryChartHeaderLeft}>
                    <View style={styles.categoryChartIconLarge}>
                      <Ionicons name="pie-chart" size={20} color={colors.budgetPlanner} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.categoryChartTitle} numberOfLines={1}>Spending by Category</Text>
                      <Text style={styles.categoryChartSubtitle}>{BILL_CATEGORIES.filter(cat => bills.some(b => (b.category || 'Other') === cat)).length} categories</Text>
                    </View>
                  </View>
                  <Text style={styles.categoryChartTotal} numberOfLines={1}>{formatCurrency(totalObligations)}</Text>
                </View>
                
                {BILL_CATEGORIES.map((category) => {
                  const categoryBills = bills.filter((b) => (b.category || 'Other') === category);
                  if (categoryBills.length === 0) return null;
                  
                  const categoryTotal = categoryBills.reduce((sum, b) => sum + Number(b.amount), 0);
                  const percentage = totalObligations > 0 ? (categoryTotal / totalObligations) * 100 : 0;
                  const categoryIcon = CATEGORY_ICONS[category];
                  
                  return (
                    <View key={category} style={styles.enhancedCategoryItem}>
                      <View style={styles.categoryItemHeader}>
                        <View style={styles.categoryItemLeft}>
                          <View style={[styles.categoryItemIcon, { backgroundColor: colors.budgetPlanner + '20' }]}>
                            <Ionicons name={categoryIcon as any} size={20} color={colors.budgetPlanner} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.categoryItemName}>{category}</Text>
                            <Text style={styles.categoryItemCount}>{categoryBills.length} bill{categoryBills.length !== 1 ? 's' : ''}</Text>
                          </View>
                        </View>
                        <View style={styles.categoryItemRight}>
                          <Text style={styles.categoryItemAmount}>{formatCurrency(categoryTotal)}</Text>
                          <View style={styles.categoryItemPercentBadge}>
                            <Text style={styles.categoryItemPercent}>{percentage.toFixed(1)}%</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.categoryItemBarContainer}>
                        <View style={[styles.categoryItemBar, { 
                          width: `${percentage}%`,
                          backgroundColor: percentage > 30 ? colors.error : percentage > 20 ? colors.warning : colors.budgetPlanner,
                        }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            
            {/* Budget Health Analytics */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>Budget Health Score</Text>
              <View style={styles.healthScoreContainer}>
                <View style={styles.circularProgress}>
                  <Text style={[styles.healthScoreValue, { color: healthColor }]}>
                    {Math.round(Math.max(0, Math.min(100, (totalAvailable - totalObligations) / totalAvailable * 100)))}
                  </Text>
                  <Text style={styles.healthScoreLabel}>Health</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.healthMetric}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.healthMetricLabel}>Available</Text>
                    <Text style={styles.healthMetricValue}>{formatCurrency(totalAvailable)}</Text>
                  </View>
                  <View style={styles.healthMetric}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={styles.healthMetricLabel}>Obligations</Text>
                    <Text style={styles.healthMetricValue}>{formatCurrency(totalObligations)}</Text>
                  </View>
                  <View style={styles.healthMetric}>
                    <Ionicons name="trending-up" size={16} color={colors.budgetPlanner} />
                    <Text style={styles.healthMetricLabel}>Balance</Text>
                    <Text style={[styles.healthMetricValue, { color: totalAvailable >= totalObligations ? colors.success : colors.error }]}>
                      {formatCurrency(totalAvailable - totalObligations)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Payment History Insights */}
            {paymentHistory.length > 0 && (
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsCardTitle}>Payment History</Text>
                <View style={styles.paymentStats}>
                  <View style={styles.paymentStatItem}>
                    <Ionicons name="checkmark-done" size={24} color={colors.success} />
                    <Text style={styles.paymentStatValue}>
                      {paymentHistory.filter((p) => p.status === 'on_time').length}
                    </Text>
                    <Text style={styles.paymentStatLabel}>On Time</Text>
                  </View>
                  <View style={styles.paymentStatItem}>
                    <Ionicons name="time" size={24} color={colors.warning} />
                    <Text style={styles.paymentStatValue}>
                      {paymentHistory.filter((p) => p.status === 'late').length}
                    </Text>
                    <Text style={styles.paymentStatLabel}>Late</Text>
                  </View>
                  <View style={styles.paymentStatItem}>
                    <Ionicons name="cash" size={24} color={colors.budgetPlanner} />
                    <Text style={styles.paymentStatValue}>
                      {formatCurrency(paymentHistory.reduce((sum, p) => sum + Number(p.amount_paid), 0))}
                    </Text>
                    <Text style={styles.paymentStatLabel}>Total Paid</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'funds' && (
          <View style={styles.section}>
            {fundSources.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="wallet-outline" size={40} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No Fund Sources</Text>
                <Text style={styles.emptyText}>Add a fund source to start planning your budget</Text>
              </View>
            ) : (
              fundSources.map((fund) => {
                const isLow = fund.available_balance > 0 && fund.available_balance < 0.2 * Number(fund.credit_limit || fund.initial_balance);
                const percentage = (fund.available_balance / Number(fund.credit_limit || fund.initial_balance)) * 100;
                
                return (
                  <View key={fund.id} style={[styles.fundCard, isLow && styles.fundLow]}>
                    <View style={styles.fundHeader}>
                      <View style={styles.fundIconBadge}>
                        <Ionicons 
                          name={fund.type === 'credit_card' ? 'card' : fund.type === 'cash' ? 'cash' : 'wallet'} 
                          size={20} 
                          color={colors.budgetPlanner} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fundName}>{fund.name}</Text>
                        <Text style={styles.fundType}>{FUND_TYPE_LABELS[fund.type]}</Text>
                      </View>
                      <View style={styles.fundActions}>
                        {isLow && (
                          <View style={styles.lowBadge}>
                            <Text style={styles.lowBadgeText}>Low</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => openEditFund(fund)} style={styles.iconBtn}>
                          <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteFundSource(fund)} style={styles.iconBtn}>
                          <Ionicons name="trash" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${Math.min(100, percentage)}%`,
                              backgroundColor: percentage > 50 ? colors.success : percentage > 20 ? colors.warning : colors.error,
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
                    </View>
                    
                    <View style={styles.fundAmounts}>
                      <View>
                        <Text style={styles.amountLabel}>Total Balance</Text>
                        <Text style={styles.amountValue}>
                          {formatCurrency(Number(fund.credit_limit || fund.initial_balance))}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.amountLabel}>Available</Text>
                        <Text style={[
                          styles.amountValue, 
                          { color: fund.available_balance > 0 ? colors.success : colors.error }
                        ]}>
                          {formatCurrency(fund.available_balance)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'bills' && (
          <View style={styles.section}>
            {bills.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="receipt-outline" size={40} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No Bills</Text>
                <Text style={styles.emptyText}>No unpaid bills in this period</Text>
              </View>
            ) : (
              BILL_CATEGORIES.map((category) => {
                const categoryBills = bills.filter((b) => (b.category || 'Other') === category);
                if (categoryBills.length === 0) return null;
                
                const categoryTotal = categoryBills.reduce((sum, b) => sum + Number(b.amount), 0);
                const categoryIcon = CATEGORY_ICONS[category];
                
                return (
                  <View key={category} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons name={categoryIcon as any} size={22} color={colors.budgetPlanner} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <Text style={styles.categoryCount}>{categoryBills.length} bill{categoryBills.length !== 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={styles.categoryTotal}>{formatCurrency(categoryTotal)}</Text>
                    </View>
                    
                    {categoryBills.map((bill) => {
                      const alloc = allocations.find((a) => a.bill_reminder_id === bill.id);
                      const allocFund = alloc ? fundSources.find((f) => f.id === alloc.fund_source_id) : null;
                      const isUrgent = (new Date(bill.due_date).getTime() - Date.now()) < 3 * 86400000;
                      
                      return (
                        <View key={bill.id} style={[styles.categoryBillCard, isUrgent && styles.billUrgent]}>
                          <View style={styles.billHeader}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <Text style={styles.billTitle}>{bill.title}</Text>
                                {bill.is_recurring && (
                                  <View style={styles.recurringBadge}>
                                    <Ionicons name="repeat" size={10} color={colors.budgetPlanner} />
                                    <Text style={styles.recurringText}>
                                      {bill.recurrence_pattern || 'Monthly'}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.billCategory}>
                                Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}
                              </Text>
                              {allocFund && (
                                <View style={styles.billAllocatedBadge}>
                                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                  <Text style={styles.billAllocated}>{allocFund.name}</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.billRight}>
                              <Text style={styles.billAmount}>{formatCurrency(Number(bill.amount))}</Text>
                              {isUrgent && !alloc && (
                                <View style={styles.urgentBadge}>
                                  <Text style={styles.urgentText}>Urgent</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <TouchableOpacity 
                            style={[styles.allocateBtn, alloc && styles.allocateBtnAllocated]} 
                            onPress={() => { setSelectedBill(bill); setShowAllocate(true); }}
                          >
                            <Ionicons 
                              name={alloc ? "swap-horizontal" : "add-circle-outline"} 
                              size={16} 
                              color={alloc ? colors.success : colors.budgetPlanner} 
                            />
                            <Text style={[styles.allocateBtnText, alloc && { color: colors.success }]}>
                              {alloc ? 'Change Fund Source' : 'Assign Fund Source'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'goals' && (
          <View style={styles.goalsTabContainer}>
            {/* Budget Goals Section */}
            <View style={styles.goalsSection}>
              <View style={styles.goalsSectionHeader}>
                <View style={styles.goalsSectionLeft}>
                  <View style={styles.goalsSectionIcon}>
                    <Ionicons name="trophy" size={24} color={colors.budgetPlanner} />
                  </View>
                  <View>
                    <Text style={styles.goalsSectionTitle}>Budget Goals</Text>
                    <Text style={styles.goalsSectionSubtitle}>Track your savings targets</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.addGoalBtn}
                  onPress={() => setShowAddGoal(true)}
                >
                  <Ionicons name="add-circle" size={28} color={colors.budgetPlanner} />
                </TouchableOpacity>
              </View>
            
            {budgetGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="trophy-outline" size={48} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No Goals Yet</Text>
                <Text style={styles.emptyText}>Set savings goals to track your progress</Text>
              </View>
            ) : (
              budgetGoals.map((goal) => {
                const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                const remaining = Number(goal.target_amount) - Number(goal.current_amount);
                
                return (
                  <View key={goal.id} style={styles.enhancedGoalCard}>
                    <View style={styles.goalCardTop}>
                      <View style={styles.goalIconContainer}>
                        <View style={[styles.goalIcon, { backgroundColor: colors.budgetPlanner + '15' }]}>
                          <Ionicons name="flag" size={22} color={colors.budgetPlanner} />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.goalCategory}>{goal.category}</Text>
                      </View>
                      {daysLeft !== null && (
                        <View style={[
                          styles.daysLeftBadge, 
                          daysLeft < 7 && { backgroundColor: colors.error + '15', borderColor: colors.error },
                          daysLeft >= 7 && daysLeft < 30 && { backgroundColor: colors.warning + '15', borderColor: colors.warning }
                        ]}>
                          <Ionicons 
                            name="time-outline" 
                            size={12} 
                            color={daysLeft < 7 ? colors.error : daysLeft < 30 ? colors.warning : colors.textSecondary} 
                          />
                          <Text style={[
                            styles.daysLeftText, 
                            daysLeft < 7 && { color: colors.error },
                            daysLeft >= 7 && daysLeft < 30 && { color: colors.warning }
                          ]}>
                            {daysLeft}d
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.goalProgressSection}>
                      <View style={styles.goalProgressInfo}>
                        <Text style={styles.goalProgressLabel}>Progress</Text>
                        <Text style={[
                          styles.goalProgressPercent,
                          { color: progress >= 100 ? colors.success : progress >= 70 ? colors.budgetPlanner : colors.warning }
                        ]}>
                          {Math.round(progress)}%
                        </Text>
                      </View>
                      <View style={styles.goalProgressBarContainer}>
                        <View style={[styles.goalProgressBar, { 
                          width: `${Math.min(100, progress)}%`,
                          backgroundColor: progress >= 100 ? colors.success : progress >= 70 ? colors.budgetPlanner : colors.warning,
                        }]} />
                      </View>
                    </View>
                    
                    <View style={styles.goalBottomRow}>
                      <View style={styles.goalAmount}>
                        <Text style={styles.goalAmountLabel}>Saved</Text>
                        <Text style={styles.goalAmountValue}>{formatCurrency(Number(goal.current_amount))}</Text>
                      </View>
                      <View style={styles.goalDivider} />
                      <View style={styles.goalAmount}>
                        <Text style={styles.goalAmountLabel}>Target</Text>
                        <Text style={[styles.goalAmountValue, { color: colors.budgetPlanner }]}>
                          {formatCurrency(Number(goal.target_amount))}
                        </Text>
                      </View>
                      {progress < 100 && (
                        <>
                          <View style={styles.goalDivider} />
                          <View style={styles.goalAmount}>
                            <Text style={styles.goalAmountLabel}>Needed</Text>
                            <Text style={[styles.goalAmountValue, { color: colors.error }]}>
                              {formatCurrency(remaining)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                    
                    {progress >= 100 ? (
                      <View style={styles.goalCompleteBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={styles.goalCompleteText}>Goal Achieved!</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addFundsBtn}
                        onPress={() => {
                          setSelectedGoal(goal);
                          setGoalContribution('');
                          setShowUpdateGoal(true);
                        }}
                      >
                        <Ionicons name="add-circle" size={16} color={colors.budgetPlanner} />
                        <Text style={styles.addFundsBtnText}>Add Funds</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
            </View>
            
            <View style={styles.sectionDivider} />
            
            {/* Spending Limits Section */}
            <View style={styles.limitsSection}>
              <View style={styles.limitsSectionHeader}>
                <View style={styles.limitsSectionLeft}>
                  <View style={styles.limitsSectionIcon}>
                    <Ionicons name="speedometer" size={24} color={colors.warning} />
                  </View>
                  <View>
                    <Text style={styles.limitsSectionTitle}>Spending Limits</Text>
                    <Text style={styles.limitsSectionSubtitle}>Control your budget by category</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.addLimitBtn}
                  onPress={() => setShowAddLimit(true)}
                >
                  <Ionicons name="add-circle" size={28} color={colors.warning} />
                </TouchableOpacity>
              </View>
            
            {spendingLimits.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="speedometer-outline" size={48} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No Limits Set</Text>
                <Text style={styles.emptyText}>Set spending limits by category to control your budget</Text>
              </View>
            ) : (
              spendingLimits.map((limit) => {
                // Calculate current spending for this category
                const categorySpending = bills
                  .filter((b) => (b.category || 'Other') === limit.category)
                  .reduce((sum, b) => sum + Number(b.amount), 0);
                const percentage = limit.limit_amount > 0 ? (categorySpending / limit.limit_amount) * 100 : 0;
                const isNearLimit = percentage >= limit.alert_threshold;
                const isOverLimit = percentage >= 100;
                const remaining = Number(limit.limit_amount) - categorySpending;
                
                return (
                  <View key={limit.id} style={[styles.enhancedLimitCard, isOverLimit && styles.limitCardOver]}>
                    <View style={styles.limitCardTop}>
                      <View style={[
                        styles.limitIconContainer, 
                        isOverLimit && { backgroundColor: colors.error + '15' },
                        isNearLimit && !isOverLimit && { backgroundColor: colors.warning + '15' }
                      ]}>
                        <Ionicons 
                          name={CATEGORY_ICONS[limit.category] as any || 'pricetag'} 
                          size={24} 
                          color={isOverLimit ? colors.error : isNearLimit ? colors.warning : colors.budgetPlanner} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.limitCategoryName}>{limit.category}</Text>
                        <Text style={styles.limitPeriodText}>
                          {limit.period || 'monthly'} limit
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.limitMenuBtn}
                        onPress={() => { setLimitMenuTarget(limit); setShowLimitMenu(true); }}
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.limitProgressSection}>
                      <View style={styles.limitProgressInfo}>
                        <Text style={styles.limitProgressLabel}>Spending</Text>
                        <Text style={[
                          styles.limitProgressPercent,
                          { color: isOverLimit ? colors.error : isNearLimit ? colors.warning : colors.success }
                        ]}>
                          {Math.round(percentage)}%
                        </Text>
                      </View>
                      <View style={styles.limitProgressBarContainer}>
                        <View style={[styles.limitProgressBar, { 
                          width: `${Math.min(100, percentage)}%`,
                          backgroundColor: isOverLimit ? colors.error : isNearLimit ? colors.warning : colors.success,
                        }]} />
                      </View>
                    </View>
                    
                    <View style={styles.limitBottomRow}>
                      <View style={styles.limitAmount}>
                        <Text style={styles.limitAmountLabel}>Spent</Text>
                        <Text style={[
                          styles.limitAmountValue,
                          isOverLimit && { color: colors.error }
                        ]}>
                          {formatCurrency(categorySpending)}
                        </Text>
                      </View>
                      <View style={styles.limitDivider} />
                      <View style={styles.limitAmount}>
                        <Text style={styles.limitAmountLabel}>Limit</Text>
                        <Text style={styles.limitAmountValue}>
                          {formatCurrency(Number(limit.limit_amount))}
                        </Text>
                      </View>
                      <View style={styles.limitDivider} />
                      <View style={styles.limitAmount}>
                        <Text style={styles.limitAmountLabel}>{isOverLimit ? 'Over' : 'Left'}</Text>
                        <Text style={[
                          styles.limitAmountValue,
                          { color: isOverLimit ? colors.error : colors.success }
                        ]}>
                          {formatCurrency(Math.abs(remaining))}
                        </Text>
                      </View>
                    </View>
                    
                    {isOverLimit && (
                      <View style={styles.limitOverBadge}>
                        <Ionicons name="alert-circle" size={14} color={colors.error} />
                        <Text style={styles.limitOverText}>Exceeded by {formatCurrency(categorySpending - Number(limit.limit_amount))}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
            </View>
          </View>
        )}
      </ScrollView>

      {activeTab === 'funds' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddFund(true)}>
          <View style={[styles.fabGradient, { backgroundColor: colors.budgetPlanner }]}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
      
      {activeTab === 'goals' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddGoal(true)}>
          <View style={[styles.fabGradient, { backgroundColor: colors.budgetPlanner }]}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Add Fund Modal */}
      <Modal visible={showAddFund} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Fund Source</Text>
              <TouchableOpacity onPress={() => setShowAddFund(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Name (e.g. BDO Credit Card)" placeholderTextColor={colors.textLight} value={fundName} onChangeText={setFundName} />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeRow}>
                {FUND_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, fundType === t && styles.typeChipActive]} onPress={() => setFundType(t)}>
                    <Text style={[styles.typeChipText, fundType === t && styles.typeChipTextActive]}>{FUND_TYPE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder={fundType === 'credit_card' ? 'Credit limit (₱)' : 'Balance (₱)'} placeholderTextColor={colors.textLight} value={fundBalance} onChangeText={setFundBalance} keyboardType="decimal-pad" />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.budgetPlanner }]} onPress={addFundSource}>
                <Text style={styles.saveBtnText}>Add Fund Source</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Fund Modal */}
      <Modal visible={showEditFund} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Fund Source</Text>
              <TouchableOpacity onPress={() => setShowEditFund(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.textLight} value={fundName} onChangeText={setFundName} />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeRow}>
                {FUND_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, fundType === t && styles.typeChipActive]} onPress={() => setFundType(t)}>
                    <Text style={[styles.typeChipText, fundType === t && styles.typeChipTextActive]}>{FUND_TYPE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder={fundType === 'credit_card' ? 'Credit limit (₱)' : 'Balance (₱)'} placeholderTextColor={colors.textLight} value={fundBalance} onChangeText={setFundBalance} keyboardType="decimal-pad" />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.budgetPlanner }]} onPress={saveEditFund}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Allocate Bill Modal */}
      <Modal visible={showAllocate} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Fund Source</Text>
              <TouchableOpacity onPress={() => { setShowAllocate(false); setSelectedBill(null); }} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedBill && (
              <View style={styles.allocBillCard}>
                <Text style={styles.allocBillTitle}>{selectedBill.title}</Text>
                <Text style={styles.allocBillAmount}>{formatCurrency(Number(selectedBill.amount))}</Text>
              </View>
            )}

            <Text style={styles.modalSub}>
              Balances shown are after removing this bill's current allocation.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {fundSources.length === 0 ? (
                <Text style={styles.emptyText}>Add a fund source first.</Text>
              ) : (
                fundSources.map((fund) => {
                  const effectiveBal = getEffectiveBalance(fund);
                  const billAmt = selectedBill ? Number(selectedBill.amount) : 0;
                  const afterAlloc = effectiveBal - billAmt;
                  const isCurrentAlloc = allocations.some(
                    (a) => a.bill_reminder_id === selectedBill?.id && a.fund_source_id === fund.id
                  );
                  const canCover = effectiveBal >= billAmt;
                  return (
                    <TouchableOpacity
                      key={fund.id}
                      style={[
                        styles.fundOption,
                        isCurrentAlloc && styles.fundOptionCurrent,
                        !canCover && styles.fundOptionLow,
                      ]}
                      onPress={() => allocateBill(fund.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.fundOptionRow}>
                          <Text style={[styles.fundOptionName, isCurrentAlloc && { color: colors.primary }]}>
                            {fund.name}
                          </Text>
                          {isCurrentAlloc && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.fundOptionType}>{FUND_TYPE_LABELS[fund.type]}</Text>
                        <View style={styles.fundBalanceRow}>
                          <Text style={styles.fundOptionBalance}>
                            Available: {formatCurrency(effectiveBal)}
                          </Text>
                          {selectedBill && (
                            <Text style={[
                              styles.fundAfterAlloc,
                              { color: afterAlloc >= 0 ? colors.success : colors.error },
                            ]}>
                              After: {formatCurrency(afterAlloc)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name={isCurrentAlloc ? 'checkmark-circle' : 'chevron-forward'}
                        size={20}
                        color={isCurrentAlloc ? colors.primary : colors.textLight}
                      />
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Remove allocation option — only if bill already has one */}
              {selectedBill && allocations.some((a) => a.bill_reminder_id === selectedBill.id) && (
                <TouchableOpacity
                  style={styles.removeAllocBtn}
                  onPress={() => removeAllocation(selectedBill.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.removeAllocText}>Remove Fund Assignment</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Budget Goal</Text>
              <TouchableOpacity onPress={() => setShowAddGoal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput 
                style={styles.input} 
                placeholder="Goal name (e.g. Emergency Fund)" 
                placeholderTextColor={colors.textLight} 
                value={goalName} 
                onChangeText={setGoalName} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Target amount (₱)" 
                placeholderTextColor={colors.textLight} 
                value={goalTarget} 
                onChangeText={setGoalTarget} 
                keyboardType="decimal-pad" 
              />
              <DateInput 
                label="Deadline (optional)" 
                value={goalDeadline} 
                onChange={setGoalDeadline} 
              />
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.typeRow}>
                {['Savings', 'Emergency', 'Vacation', 'Big Purchase'].map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.typeChip, goalCategory === cat && styles.typeChipActive]} 
                    onPress={() => setGoalCategory(cat)}
                  >
                    <Text style={[styles.typeChipText, goalCategory === cat && styles.typeChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.budgetPlanner }]} 
                onPress={async () => {
                  if (!goalName || !goalTarget) {
                    showError('Goal name and target amount are required.');
                    return;
                  }
                  const target = parseFloat(goalTarget);
                  if (isNaN(target) || target <= 0) {
                    showError('Enter a valid target amount.');
                    return;
                  }
                  const { error } = await supabase.from('budget_goals').insert({
                    user_id: user!.id,
                    name: goalName,
                    target_amount: target,
                    category: goalCategory,
                    deadline: goalDeadline || null,
                    status: 'active',
                  });
                  if (error) {
                    showError(error.message);
                    return;
                  }
                  setShowAddGoal(false);
                  setGoalName('');
                  setGoalTarget('');
                  setGoalDeadline('');
                  setGoalCategory('Savings');
                  loadData();
                }}
              >
                <Text style={styles.saveBtnText}>Create Goal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Spending Limit Modal */}
      <Modal visible={showAddLimit} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Spending Limit</Text>
              <TouchableOpacity onPress={() => setShowAddLimit(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.typeRow}>
                {BILL_CATEGORIES.slice(0, 4).map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.typeChip, limitCategory === cat && styles.typeChipActive]} 
                    onPress={() => setLimitCategory(cat)}
                  >
                    <Text style={[styles.typeChipText, limitCategory === cat && styles.typeChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.typeRow}>
                {BILL_CATEGORIES.slice(4, 8).map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.typeChip, limitCategory === cat && styles.typeChipActive]} 
                    onPress={() => setLimitCategory(cat)}
                  >
                    <Text style={[styles.typeChipText, limitCategory === cat && styles.typeChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.typeRow}>
                {BILL_CATEGORIES.slice(8).map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.typeChip, limitCategory === cat && styles.typeChipActive]} 
                    onPress={() => setLimitCategory(cat)}
                  >
                    <Text style={[styles.typeChipText, limitCategory === cat && styles.typeChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="Limit amount (₱)" 
                placeholderTextColor={colors.textLight} 
                value={limitAmount} 
                onChangeText={setLimitAmount} 
                keyboardType="decimal-pad" 
              />
              <Text style={styles.modalSub}>
                You'll be alerted when spending reaches 80% of this limit.
              </Text>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.warning }]} 
                onPress={async () => {
                  if (!limitCategory || !limitAmount) {
                    showError('Category and limit amount are required.');
                    return;
                  }
                  const amount = parseFloat(limitAmount);
                  if (isNaN(amount) || amount <= 0) {
                    showError('Enter a valid limit amount.');
                    return;
                  }
                  // Check if limit already exists for this category
                  const { data: existing } = await supabase
                    .from('spending_limits')
                    .select('id')
                    .eq('user_id', user!.id)
                    .eq('category', limitCategory)
                    .eq('is_active', true)
                    .single();
                  
                  if (existing) {
                    showError(`A spending limit for ${limitCategory} already exists.`);
                    return;
                  }
                  
                  const { error } = await supabase.from('spending_limits').insert({
                    user_id: user!.id,
                    category: limitCategory,
                    limit_amount: amount,
                    period: 'monthly',
                    alert_threshold: 80,
                    is_active: true,
                  });
                  if (error) {
                    showError(error.message);
                    return;
                  }
                  setShowAddLimit(false);
                  setLimitCategory('');
                  setLimitAmount('');
                  loadData();
                }}
              >
                <Text style={styles.saveBtnText}>Create Limit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Spending Limit Modal */}
      <Modal visible={showEditLimit} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Spending Limit</Text>
              <TouchableOpacity onPress={() => setShowEditLimit(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{limitCategory}</Text>
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="Limit amount (₱)" 
                placeholderTextColor={colors.textLight} 
                value={limitAmount} 
                onChangeText={setLimitAmount} 
                keyboardType="decimal-pad" 
              />
              <Text style={styles.modalSub}>
                You'll be alerted when spending reaches 80% of this limit.
              </Text>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.warning }]}
                onPress={async () => {
                  if (!limitAmount) {
                    showError('Enter a limit amount.');
                    return;
                  }
                  const amount = parseFloat(limitAmount);
                  if (isNaN(amount) || amount <= 0) {
                    showError('Enter a valid limit amount.');
                    return;
                  }
                  const { error } = await supabase
                    .from('spending_limits')
                    .update({ limit_amount: amount })
                    .eq('id', editingLimit.id);
                  if (error) {
                    showError(error.message);
                    return;
                  }
                  setShowEditLimit(false);
                  setEditingLimit(null);
                  setLimitCategory('');
                  setLimitAmount('');
                  loadData();
                }}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Update Goal Progress Modal */}
      <Modal visible={showUpdateGoal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Funds to Goal</Text>
              <TouchableOpacity onPress={() => setShowUpdateGoal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedGoal && (
              <View style={styles.goalSummaryCard}>
                <View style={styles.goalSummaryHeader}>
                  <Ionicons name="flag" size={20} color={colors.budgetPlanner} />
                  <Text style={styles.goalSummaryName}>{selectedGoal.name}</Text>
                </View>
                <View style={styles.goalSummaryRow}>
                  <Text style={styles.goalSummaryLabel}>Current</Text>
                  <Text style={styles.goalSummaryValue}>{formatCurrency(Number(selectedGoal.current_amount))}</Text>
                </View>
                <View style={styles.goalSummaryRow}>
                  <Text style={styles.goalSummaryLabel}>Target</Text>
                  <Text style={[styles.goalSummaryValue, { color: colors.budgetPlanner }]}>
                    {formatCurrency(Number(selectedGoal.target_amount))}
                  </Text>
                </View>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput 
                style={styles.input} 
                placeholder="Amount to add (₱)" 
                placeholderTextColor={colors.textLight} 
                value={goalContribution} 
                onChangeText={setGoalContribution} 
                keyboardType="decimal-pad" 
              />
              <Text style={styles.modalSub}>
                This will increase your current savings toward this goal.
              </Text>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.budgetPlanner }]} 
                onPress={async () => {
                  if (!goalContribution) {
                    showError('Enter an amount to add.');
                    return;
                  }
                  const contribution = parseFloat(goalContribution);
                  if (isNaN(contribution) || contribution <= 0) {
                    showError('Enter a valid amount.');
                    return;
                  }
                  const newAmount = Number(selectedGoal.current_amount) + contribution;
                  const { error } = await supabase
                    .from('budget_goals')
                    .update({ current_amount: newAmount })
                    .eq('id', selectedGoal.id);
                  if (error) {
                    showError(error.message);
                    return;
                  }
                  setShowUpdateGoal(false);
                  setSelectedGoal(null);
                  setGoalContribution('');
                  loadData();
                }}
              >
                <Text style={styles.saveBtnText}>Add Funds</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={showDateFilter} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filter by Date Range</Text>
              <TouchableOpacity onPress={() => setShowDateFilter(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateFilterContent}>
              <DateInput 
                label="Start Date" 
                value={periodStart} 
                onChange={(d) => setPeriodStart(d)} 
              />
              <DateInput 
                label="End Date" 
                value={periodEnd} 
                onChange={(d) => {
                  if (d < periodStart) { 
                    showError('End date must be on or after start date.'); 
                    return; 
                  }
                  setPeriodEnd(d);
                }} 
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: colors.border }]}
                onPress={() => setShowDateFilter(false)}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.budgetPlanner }]}
                onPress={() => {
                  setShowDateFilter(false);
                  loadData();
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <AppModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        icon="alert-circle"
        iconColor={colors.error}
        title="Error"
        message={errorMsg}
        buttons={[{ label: 'OK', onPress: () => setShowErrorModal(false) }]}
      />

      {/* Info Modal */}
      <AppModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        icon="information-circle"
        title={infoTitle}
        message={infoMsg}
        buttons={[{ label: 'OK', onPress: () => setShowInfoModal(false) }]}
      />

      {/* Confirm Modal (Cancel / Confirm) */}
      <AppModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        icon="help-circle"
        iconColor={colors.warning}
        title={confirmTitle}
        message={confirmMsg}
        buttons={[
          { label: 'Cancel', variant: 'secondary', onPress: () => setShowConfirmModal(false) },
          { label: 'Confirm', onPress: runConfirm },
        ]}
      />

      {/* Spending Limit Action Menu (Edit / Delete) */}
      <AppModal
        visible={showLimitMenu}
        onClose={() => setShowLimitMenu(false)}
        icon="ellipsis-horizontal-circle"
        title={limitMenuTarget ? `${limitMenuTarget.category} Limit` : 'Limit'}
        message="Choose an action for this spending limit."
        buttons={[
          { label: 'Cancel', variant: 'secondary', onPress: () => setShowLimitMenu(false) },
          {
            label: 'Edit',
            onPress: () => {
              setShowLimitMenu(false);
              setEditingLimit(limitMenuTarget);
              setLimitCategory(limitMenuTarget.category);
              setLimitAmount(String(limitMenuTarget.limit_amount));
              setShowEditLimit(true);
            },
          },
          {
            label: 'Delete',
            onPress: () => deleteLimit(limitMenuTarget),
          },
        ]}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    
    // Enhanced Header
    header: { 
      padding: 24, 
      paddingTop: 56, 
      paddingBottom: 24,
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: 0.3 },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontWeight: '500' },
    filterButton: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginRight: 10,
    },
    healthBadge: { 
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10, 
      paddingVertical: 6, 
      borderRadius: 10,
    },
    healthText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    // Date Filter Modal
    dateFilterContent: {
      gap: 16,
      marginBottom: 20,
    },
    
    // Modern Tabs
    tabsContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    tabs: { 
      flexDirection: 'row', 
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      minWidth: '100%',
    },
    tab: { 
      flex: 1,
      minWidth: 90,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10, 
      paddingHorizontal: 12, 
      borderRadius: 10,
    },
    tabActive: { 
      backgroundColor: colors.budgetPlanner + '15',
    },
    tabText: { fontSize: 13, color: colors.textLight, fontWeight: '600' },
    tabTextActive: { color: colors.budgetPlanner, fontWeight: '700' },
    
    content: { flex: 1, paddingBottom: 120 },
    overviewContainer: { paddingBottom: 20 },
    
    // Enhanced Summary Cards
    summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
    summaryCard: { 
      flex: 1, 
      backgroundColor: colors.surface, 
      borderRadius: 16, 
      padding: 18,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    summaryLabel: { 
      fontSize: 11, 
      color: colors.textSecondary, 
      marginBottom: 6,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    summaryValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
    
    // Alert Banners
    shortfallBanner: { 
      marginHorizontal: 16, 
      marginBottom: 12, 
      backgroundColor: colors.error + '10', 
      borderRadius: 16, 
      padding: 18, 
      flexDirection: 'row', 
      alignItems: 'flex-start',
      gap: 14,
      borderWidth: 0,
      overflow: 'hidden',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    shortfallIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    shortfallTitle: { fontSize: 14, fontWeight: '700', color: colors.error, marginBottom: 3 },
    shortfallAmount: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', lineHeight: 18 },
    
    healthyBanner: { 
      marginHorizontal: 16, 
      marginBottom: 12, 
      backgroundColor: colors.success, 
      borderRadius: 16, 
      padding: 18, 
      flexDirection: 'row', 
      alignItems: 'flex-start',
      gap: 14,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    healthyIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.25)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    healthyTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 3 },
    healthyText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500', lineHeight: 18 },
    
    // Section
    section: { padding: 16 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },
    
    // Recommendation Cards
    recCard: { 
      backgroundColor: colors.surface, 
      borderRadius: 14, 
      padding: 16, 
      marginBottom: 10, 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      gap: 12,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    recIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.budgetPlanner + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    recText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 21, fontWeight: '500' },
    recDismiss: {
      padding: 2,
    },
    
    // Auto Allocate Button
    autoBtn: { 
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: colors.budgetPlanner,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    autoBtnGradient: {
      backgroundColor: colors.budgetPlanner,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    autoBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
    
    // Empty States
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 32,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    emptyText: { 
      fontSize: 14, 
      color: colors.textLight, 
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '500',
    },
    
    // Fund Cards
    fundCard: { 
      backgroundColor: colors.surface, 
      borderRadius: 16, 
      padding: 18, 
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    fundLow: { 
      borderLeftWidth: 4, 
      borderLeftColor: colors.warning,
      backgroundColor: colors.warning + '05',
    },
    fundHeader: { 
      flexDirection: 'row', 
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    fundIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.budgetPlanner + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fundName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },
    fundType: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: '500' },
    fundActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
    iconBtn: { padding: 8, borderRadius: 8, backgroundColor: colors.background },
    lowBadge: { 
      backgroundColor: colors.warning + '20', 
      paddingHorizontal: 10, 
      paddingVertical: 5, 
      borderRadius: 10,
    },
    lowBadgeText: { fontSize: 11, color: colors.warning, fontWeight: '700', letterSpacing: 0.5 },
    
    // Progress Bar
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.background,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      minWidth: 40,
      textAlign: 'right',
    },
    
    fundAmounts: { 
      flexDirection: 'row', 
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight || colors.border,
    },
    amountLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    amountValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
    
    // Bill Cards
    billCard: { 
      backgroundColor: colors.surface, 
      borderRadius: 16, 
      padding: 16, 
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    // categoryBillCard: same visual treatment as billCard, used for per-category bill rows
    categoryBillCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
    },
    billUrgent: { 
      backgroundColor: colors.error + '18',
    },
    billHeader: { 
      flexDirection: 'row', 
      gap: 12,
      marginBottom: 12,
    },
    billIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    billTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, letterSpacing: 0.2 },
    billCategory: { fontSize: 12, color: colors.textSecondary, marginTop: 1, fontWeight: '500' },
    billDue: { fontSize: 12, color: colors.textSecondary, marginTop: 1, fontWeight: '500' },
    recurringBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.budgetPlanner + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    recurringText: {
      fontSize: 10,
      color: colors.budgetPlanner,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    billAllocatedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    billAllocated: { fontSize: 12, color: colors.success, fontWeight: '600' },
    billRight: {
      alignItems: 'flex-end',
      marginLeft: 'auto',
    },
    billAmount: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 4, letterSpacing: 0.3 },
    urgentBadge: {
      backgroundColor: colors.error + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    urgentText: { fontSize: 11, color: colors.error, fontWeight: '700', letterSpacing: 0.5 },
    
    allocateBtn: { 
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.budgetPlanner + '15', 
      borderRadius: 10, 
      padding: 11,
      borderWidth: 1,
      borderColor: colors.budgetPlanner + '30',
    },
    allocateBtnAllocated: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success + '30',
    },
    allocateBtnText: { fontSize: 14, color: colors.budgetPlanner, fontWeight: '700' },
    
    // FAB
    fab: { 
      position: 'absolute', 
      bottom: 24, 
      right: 24, 
      borderRadius: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    fabGradient: {
      width: 56, 
      height: 56, 
      borderRadius: 28, 
      justifyContent: 'center', 
      alignItems: 'center',
    },
    
    // Modals (keep existing modal styles)
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    closeBtn: { padding: 4, borderRadius: 20, backgroundColor: colors.border },
    modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    modalButtonSecondary: { backgroundColor: colors.background, borderWidth: 1 },
    modalButtonPrimary: { backgroundColor: colors.budgetPlanner },
    modalButtonTextSecondary: { fontSize: 15, fontWeight: '600' },
    modalButtonTextPrimary: { fontSize: 15, fontWeight: '700', color: '#fff' },
    modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, fontSize: 14, marginBottom: 10, color: colors.textPrimary, backgroundColor: colors.background },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    typeChipActive: { backgroundColor: colors.budgetPlanner, borderColor: colors.budgetPlanner },
    typeChipText: { fontSize: 12, color: colors.textSecondary },
    typeChipTextActive: { color: '#fff', fontWeight: '600' },
    saveBtn: { padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', marginTop: 6, marginBottom: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    fundOption: {
      flexDirection: 'row', alignItems: 'center', padding: 14,
      borderRadius: 10, backgroundColor: colors.background,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    fundOptionCurrent: { borderColor: colors.primary, borderWidth: 1.5 },
    fundOptionLow: { opacity: 0.6 },
    fundOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    fundOptionName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    fundOptionType: { fontSize: 11, color: colors.textLight, marginBottom: 4 },
    fundBalanceRow: { flexDirection: 'row', gap: 12 },
    fundOptionBalance: { fontSize: 12, color: colors.textSecondary },
    fundAfterAlloc: { fontSize: 12, fontWeight: '600' },
    currentBadge: {
      backgroundColor: colors.primary + '20', paddingHorizontal: 7,
      paddingVertical: 2, borderRadius: 8,
    },
    currentBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
    allocBillCard: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.background, borderRadius: 10, padding: 12,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    allocBillTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    allocBillAmount: { fontSize: 15, fontWeight: '800', color: colors.budgetPlanner },
    removeAllocBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: 13, borderRadius: 10, marginTop: 4, marginBottom: 8,
      borderWidth: 1, borderColor: colors.error + '50',
      backgroundColor: colors.error + '10',
    },
    removeAllocText: { fontSize: 14, color: colors.error, fontWeight: '600' },
    
    // Category View Styles
    categorySection: {
      marginBottom: 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight || colors.border,
    },
    categoryIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.budgetPlanner + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    categoryCount: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
    },
    categoryTotal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.budgetPlanner,
      letterSpacing: 0.3,
    },
    categoryBillItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 10,
      marginBottom: 8,
    },
    categoryBillTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    categoryBillDue: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 3,
      fontWeight: '500',
    },
    categoryBillAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    
    // Enhanced Category Chart Styles
    categoryChartSection: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 20,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
    },
    categoryChartHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: colors.borderLight || colors.border,
      gap: 12,
    },
    categoryChartHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    categoryChartIconLarge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.budgetPlanner + '20',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    categoryChartTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    categoryChartSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
    },
    categoryChartTotal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.budgetPlanner,
      letterSpacing: 0.3,
      flexShrink: 0,
      marginLeft: 8,
    },
    enhancedCategoryItem: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
    },
    categoryItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    categoryItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    categoryItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryItemName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    categoryItemCount: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
    },
    categoryItemRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    categoryItemAmount: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    categoryItemPercentBadge: {
      backgroundColor: colors.budgetPlanner + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    categoryItemPercent: {
      fontSize: 11,
      color: colors.budgetPlanner,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    categoryItemBarContainer: {
      height: 8,
      backgroundColor: colors.borderLight || colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    categoryItemBar: {
      height: '100%',
      borderRadius: 4,
    },
    
    // Enhanced Goals Tab Styles
    goalCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    goalIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.budgetPlanner + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    goalName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    goalCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
    },
    daysLeftBadge: {
      backgroundColor: colors.budgetPlanner + '15',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    daysLeftText: {
      fontSize: 11,
      color: colors.budgetPlanner,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    goalProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    goalAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight || colors.border,
    },
    goalLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 4,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    goalValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    spacer: {
      height: 24,
    },
    
    // Enhanced Analytics Tab Styles
    analyticsCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    analyticsCardTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 16,
      letterSpacing: 0.3,
    },
    healthScoreContainer: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    circularProgress: {
      width: 85,
      height: 85,
      borderRadius: 42.5,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 6,
      borderColor: colors.budgetPlanner + '30',
      flexShrink: 0,
    },
    healthScoreValue: {
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    healthScoreLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    healthMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    healthMetricLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
      fontWeight: '500',
    },
    healthMetricValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    spendingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight || colors.border,
    },
    spendingIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.budgetPlanner + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    spendingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    spendingCategory: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    spendingAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    spendingBar: {
      height: 6,
      backgroundColor: colors.background,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },
    spendingBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    spendingPercentage: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    paymentStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    paymentStatItem: {
      alignItems: 'center',
      gap: 8,
    },
    paymentStatValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    paymentStatLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    
    // Goals Tab Container
    goalsTabContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    // Enhanced Goals Section Styles
    goalsSection: {
      marginBottom: 24,
      backgroundColor: colors.background,
    },
    goalsSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    goalsSectionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    goalsSectionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.budgetPlanner + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    goalsSectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    goalsSectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    addGoalBtn: {
      padding: 4,
    },
    enhancedGoalCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    goalCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      gap: 12,
    },
    goalIconContainer: {
      flexShrink: 0,
    },
    goalIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    goalProgressSection: {
      marginBottom: 14,
    },
    goalProgressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    goalProgressLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    goalProgressPercent: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    goalProgressBarContainer: {
      height: 10,
      backgroundColor: colors.background,
      borderRadius: 5,
      overflow: 'hidden',
    },
    goalProgressBar: {
      height: '100%',
      borderRadius: 5,
    },
    goalBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight || colors.border,
      gap: 12,
    },
    goalAmount: {
      flex: 1,
      alignItems: 'center',
    },
    goalAmountLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    goalAmountValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    goalDivider: {
      width: 1,
      height: '100%',
      backgroundColor: colors.borderLight || colors.border,
    },
    goalCompleteBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.success + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 12,
      justifyContent: 'center',
    },
    goalCompleteText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.success,
      letterSpacing: 0.3,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.borderLight || colors.border,
      marginVertical: 20,
      marginHorizontal: 16,
    },

    // Enhanced Spending Limits Section Styles (mirrors the Goals section above)
    limitsSection: {
      marginBottom: 24,
      backgroundColor: colors.background,
    },
    limitsSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    limitsSectionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    limitsSectionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.warning + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    limitsSectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    limitsSectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    addLimitBtn: {
      padding: 4,
    },
    enhancedLimitCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    limitCardOver: {
      backgroundColor: colors.error + '18',
    },
    limitCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      gap: 12,
    },
    limitIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.budgetPlanner + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    limitCategoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    limitPeriodText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    limitMenuBtn: {
      padding: 8,
      marginRight: -8,
    },
    limitProgressSection: {
      marginBottom: 14,
    },
    limitProgressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    limitProgressLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    limitProgressPercent: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    limitProgressBarContainer: {
      height: 10,
      backgroundColor: colors.background,
      borderRadius: 5,
      overflow: 'hidden',
    },
    limitProgressBar: {
      height: '100%',
      borderRadius: 5,
    },
    limitBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight || colors.border,
      gap: 12,
    },
    limitAmount: {
      flex: 1,
      alignItems: 'center',
    },
    limitAmountLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    limitAmountValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    limitDivider: {
      width: 1,
      height: '100%',
      backgroundColor: colors.borderLight || colors.border,
    },
    limitOverBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.error + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 12,
      justifyContent: 'center',
    },
    limitOverText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.error,
      letterSpacing: 0.3,
    },

    addFundsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.budgetPlanner + '15',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 12,
    },
    addFundsBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.budgetPlanner,
      letterSpacing: 0.3,
    },
    disabledInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabledInputText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    goalSummaryCard: {
      backgroundColor: colors.budgetPlanner + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.budgetPlanner + '30',
    },
    goalSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.budgetPlanner + '20',
    },
    goalSummaryName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    goalSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    goalSummaryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    goalSummaryValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
