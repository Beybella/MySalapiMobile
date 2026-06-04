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

const FUND_TYPES = ['credit_card', 'savings_account', 'cash'];
const FUND_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  savings_account: 'Savings Account',
  cash: 'Cash on Hand',
};
const PERIOD_PRESETS = ['This Month', 'Next 7 Days', 'Next 30 Days', 'Custom'];
const PERIOD_STORAGE_KEY = 'mysalapi_budget_period';

export default function BudgetScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [fundSources, setFundSources] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);
  const [healthStatus, setHealthStatus] = useState<'Healthy' | 'At Risk' | 'Critical'>('Healthy');
  const [totalObligations, setTotalObligations] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [shortfall, setShortfall] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'bills'>('overview');
  const [periodPreset, setPeriodPreset] = useState('This Month');
  const [periodStart, setPeriodStart] = useState(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(endOfMonth(new Date()).toISOString().split('T')[0]);
  const [showAddFund, setShowAddFund] = useState(false);
  const [showEditFund, setShowEditFund] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [editingFund, setEditingFund] = useState<any>(null);
  const [fundName, setFundName] = useState('');
  const [fundType, setFundType] = useState('savings_account');
  const [fundBalance, setFundBalance] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(PERIOD_STORAGE_KEY).then((saved) => {
      if (saved) {
        const { preset, start, end } = JSON.parse(saved);
        setPeriodPreset(preset || 'This Month');
        if (start) setPeriodStart(start);
        if (end) setPeriodEnd(end);
      }
    });
  }, []);

  const getPeriodDates = (preset: string) => {
    const today = new Date();
    if (preset === 'This Month') return { start: startOfMonth(today).toISOString().split('T')[0], end: endOfMonth(today).toISOString().split('T')[0] };
    if (preset === 'Next 7 Days') return { start: today.toISOString().split('T')[0], end: addDays(today, 7).toISOString().split('T')[0] };
    if (preset === 'Next 30 Days') return { start: today.toISOString().split('T')[0], end: addDays(today, 30).toISOString().split('T')[0] };
    return { start: periodStart, end: periodEnd };
  };

  const loadData = async () => {
    if (!user) return;
    const { start, end } = getPeriodDates(periodPreset);
    const { data: funds } = await supabase.from('fund_sources').select('*').eq('user_id', user.id).order('created_at');
    const { data: billData } = await supabase.from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false).gte('due_date', start).lte('due_date', end).order('due_date');
    const { data: allocData } = await supabase.from('budget_allocations').select('*').eq('user_id', user.id).gte('created_at', start);
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

  useEffect(() => { loadData(); }, [user, periodPreset]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const changePeriod = (preset: string) => {
    setPeriodPreset(preset);
    AsyncStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify({ preset, start: periodStart, end: periodEnd }));
  };

  const deleteFundSource = async (fund: any) => {
    Alert.alert('Delete Fund Source', `Delete "${fund.name}"? All allocations linked to it will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error: allocError } = await supabase.from('budget_allocations').delete().eq('fund_source_id', fund.id);
        if (allocError) { Alert.alert('Error', 'Failed to remove allocations.'); return; }
        const { error } = await supabase.from('fund_sources').delete().eq('id', fund.id);
        if (error) { Alert.alert('Error', error.message); return; }
        loadData();
      }},
    ]);
  };

  const openEditFund = (fund: any) => {
    setEditingFund(fund); setFundName(fund.name); setFundType(fund.type);
    setFundBalance(String(fund.credit_limit || fund.initial_balance)); setShowEditFund(true);
  };

  const saveEditFund = async () => {
    if (!fundName || !fundBalance) { Alert.alert('Error', 'Name and balance are required.'); return; }
    const balance = parseFloat(fundBalance);
    if (isNaN(balance) || balance <= 0) { Alert.alert('Error', 'Enter a valid balance.'); return; }
    const payload: any = { name: fundName, type: fundType };
    if (fundType === 'credit_card') { payload.credit_limit = balance; payload.initial_balance = null; }
    else { payload.initial_balance = balance; payload.credit_limit = null; }
    const { error } = await supabase.from('fund_sources').update(payload).eq('id', editingFund.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowEditFund(false); setEditingFund(null); setFundName(''); setFundBalance(''); setFundType('savings_account');
    loadData();
  };

  const addFundSource = async () => {
    if (!fundName || !fundBalance) { Alert.alert('Error', 'Name and balance are required.'); return; }
    const balance = parseFloat(fundBalance);
    if (isNaN(balance) || balance <= 0) { Alert.alert('Error', 'Enter a valid balance.'); return; }
    const { data: existing } = await supabase.from('fund_sources').select('id').eq('user_id', user!.id).eq('name', fundName).single();
    if (existing) { Alert.alert('Error', 'A fund source with that name already exists.'); return; }
    const payload: any = { user_id: user!.id, name: fundName, type: fundType };
    if (fundType === 'credit_card') payload.credit_limit = balance;
    else payload.initial_balance = balance;
    const { error } = await supabase.from('fund_sources').insert(payload);
    if (error) { Alert.alert('Error', error.message); return; }
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
      Alert.alert(
        'Shortfall Warning',
        `${fund.name} will be short by ₱${(Number(selectedBill.amount) - effectiveBalance).toFixed(2)}. Proceed anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => saveAllocation(fundSourceId) },
        ]
      );
    } else {
      saveAllocation(fundSourceId);
    }
  };

  const saveAllocation = async (fundSourceId: string) => {
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
    if (plan.length === 0) { Alert.alert('No allocations possible', 'No fund source has enough balance for any bill.'); return; }
    Alert.alert('Auto-Allocate Plan', `${plan.length} bill(s) will be allocated. Apply?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: async () => {
        for (const { bill, fund } of plan) {
          await supabase.from('budget_allocations').upsert({ user_id: user!.id, bill_reminder_id: bill.id, fund_source_id: fund.id, amount: bill.amount }, { onConflict: 'bill_reminder_id' });
        }
        loadData();
      }},
    ]);
  };

  const formatCurrency = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const healthColor = healthStatus === 'Healthy' ? colors.healthy : healthStatus === 'At Risk' ? colors.atRisk : colors.critical;
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.budgetPlanner }]}>
        <Text style={styles.headerTitle}>Smart Budget Planner</Text>
        <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
          <Text style={styles.healthText}>{healthStatus}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
        {PERIOD_PRESETS.map((p) => (
          <TouchableOpacity key={p} style={[styles.periodChip, periodPreset === p && styles.periodChipActive]} onPress={() => changePeriod(p)}>
            <Text style={[styles.periodChipText, periodPreset === p && styles.periodChipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {periodPreset === 'Custom' && (
        <View style={styles.customPeriodRow}>
          <View style={{ flex: 1 }}><DateInput label="From" value={periodStart} onChange={(d) => { setPeriodStart(d); AsyncStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify({ preset: 'Custom', start: d, end: periodEnd })); loadData(); }} /></View>
          <View style={{ flex: 1 }}><DateInput label="To" value={periodEnd} onChange={(d) => { if (d < periodStart) { Alert.alert('Error', 'End date must be on or after start date.'); return; } setPeriodEnd(d); AsyncStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify({ preset: 'Custom', start: periodStart, end: d })); loadData(); }} /></View>
        </View>
      )}

      <View style={styles.tabs}>
        {(['overview', 'funds', 'bills'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} style={styles.content}>
        {activeTab === 'overview' && (
          <View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Total Bills</Text><Text style={styles.summaryValue}>{formatCurrency(totalObligations)}</Text></View>
              <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Available</Text><Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(totalAvailable)}</Text></View>
            </View>
            {shortfall > 0 && (
              <View style={styles.shortfallBanner}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.shortfallTitle}>Shortfall Detected</Text>
                  <Text style={styles.shortfallAmount}>You need {formatCurrency(shortfall)} more to cover all bills.</Text>
                </View>
              </View>
            )}
            {shortfall === 0 && bills.length > 0 && (
              <View style={styles.healthyBanner}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.healthyText}>All bills are covered! Remaining: {formatCurrency(totalAvailable - totalObligations)}</Text>
              </View>
            )}
            {recommendations.filter((r) => !dismissedRecs.includes(r)).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggestions</Text>
                {recommendations.filter((r) => !dismissedRecs.includes(r)).map((rec, i) => (
                  <View key={i} style={styles.recCard}>
                    <Text style={styles.recText}>{rec}</Text>
                    <TouchableOpacity onPress={() => setDismissedRecs((d) => [...d, rec])}><Ionicons name="close" size={18} color={colors.textLight} /></TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.autoBtn} onPress={autoAllocate}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.autoBtnText}>Auto-Allocate Bills</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'funds' && (
          <View style={styles.section}>
            {fundSources.length === 0 ? <Text style={styles.emptyText}>No fund sources yet. Add one to start planning.</Text> : (
              fundSources.map((fund) => {
                const isLow = fund.available_balance > 0 && fund.available_balance < 0.2 * Number(fund.credit_limit || fund.initial_balance);
                return (
                  <View key={fund.id} style={[styles.fundCard, isLow && styles.fundLow]}>
                    <View style={styles.fundHeader}>
                      <View style={{ flex: 1 }}><Text style={styles.fundName}>{fund.name}</Text><Text style={styles.fundType}>{FUND_TYPE_LABELS[fund.type]}</Text></View>
                      <View style={styles.fundActions}>
                        {isLow && <View style={styles.lowBadge}><Text style={styles.lowBadgeText}>Low</Text></View>}
                        <TouchableOpacity onPress={() => openEditFund(fund)} style={styles.iconBtn}><Ionicons name="pencil-outline" size={16} color={colors.textSecondary} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteFundSource(fund)} style={styles.iconBtn}><Ionicons name="trash-outline" size={16} color={colors.error} /></TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.fundAmounts}>
                      <View><Text style={styles.amountLabel}>Limit / Balance</Text><Text style={styles.amountValue}>{formatCurrency(Number(fund.credit_limit || fund.initial_balance))}</Text></View>
                      <View><Text style={styles.amountLabel}>Available</Text><Text style={[styles.amountValue, { color: fund.available_balance > 0 ? colors.success : colors.error }]}>{formatCurrency(fund.available_balance)}</Text></View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'bills' && (
          <View style={styles.section}>
            {bills.length === 0 ? <Text style={styles.emptyText}>No unpaid bills in this period.</Text> : (
              bills.map((bill) => {
                const alloc = allocations.find((a) => a.bill_reminder_id === bill.id);
                const allocFund = alloc ? fundSources.find((f) => f.id === alloc.fund_source_id) : null;
                const isUrgent = (new Date(bill.due_date).getTime() - Date.now()) < 3 * 86400000;
                return (
                  <View key={bill.id} style={[styles.billCard, isUrgent && styles.billUrgent]}>
                    <View style={styles.billHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.billTitle}>{bill.title}</Text>
                        <Text style={styles.billDue}>Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}</Text>
                        {allocFund && <Text style={styles.billAllocated}>→ {allocFund.name}</Text>}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.billAmount}>{formatCurrency(Number(bill.amount))}</Text>
                        {isUrgent && !alloc && <Text style={styles.urgentText}>Urgent</Text>}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.allocateBtn} onPress={() => { setSelectedBill(bill); setShowAllocate(true); }}>
                      <Text style={styles.allocateBtnText}>{alloc ? 'Change Fund Source' : 'Assign Fund Source'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {activeTab === 'funds' && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.budgetPlanner }]} onPress={() => setShowAddFund(true)}>
          <Ionicons name="add" size={28} color="#fff" />
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
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 24, paddingTop: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
    healthBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    healthText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    periodRow: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    periodChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    periodChipActive: { backgroundColor: colors.budgetPlanner, borderColor: colors.budgetPlanner },
    periodChipText: { fontSize: 13, color: colors.textSecondary },
    periodChipTextActive: { color: '#fff', fontWeight: '600' },
    tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, padding: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.budgetPlanner },
    tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    tabTextActive: { color: colors.budgetPlanner },
    content: { flex: 1 },
    summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
    summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 18, elevation: 1 },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
    summaryValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    shortfallBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.error + '18', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: colors.error },
    shortfallTitle: { fontSize: 14, fontWeight: '700', color: colors.error },
    shortfallAmount: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    healthyBanner: { margin: 12, backgroundColor: colors.success + '18', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    healthyText: { fontSize: 13, color: colors.success, fontWeight: '600', flex: 1 },
    section: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
    recCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10, elevation: 1 },
    recText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 21 },
    autoBtn: { margin: 16, backgroundColor: colors.budgetPlanner, borderRadius: 14, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    autoBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: colors.textLight, padding: 40, fontSize: 14 },
    fundCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 18, marginBottom: 12, elevation: 1 },
    fundLow: { borderLeftWidth: 3, borderLeftColor: colors.warning },
    fundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    fundName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    fundType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    lowBadge: { backgroundColor: colors.warning + '25', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    lowBadgeText: { fontSize: 11, color: colors.warning, fontWeight: '700' },
    fundAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
    amountLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
    amountValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    billCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1 },
    billUrgent: { borderLeftWidth: 3, borderLeftColor: colors.warning },
    billHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    billTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    billDue: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
    billAllocated: { fontSize: 12, color: colors.success, marginTop: 2, fontWeight: '600' },
    billAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    urgentText: { fontSize: 11, color: colors.warning, fontWeight: '700', marginTop: 2 },
    allocateBtn: { backgroundColor: colors.budgetPlanner + '20', borderRadius: 8, padding: 8, alignItems: 'center' },
    allocateBtnText: { fontSize: 13, color: colors.budgetPlanner, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    closeBtn: { padding: 4, borderRadius: 20, backgroundColor: colors.border },
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
    customPeriodRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    fundActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconBtn: { padding: 6 },
  });
