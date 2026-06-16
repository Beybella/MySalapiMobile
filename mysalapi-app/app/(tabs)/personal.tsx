import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';
import DateInput from '../../components/DateInput';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Others'];
const BILL_CATEGORIES = [
  'Housing', 'Utilities', 'Transportation', 'Food', 'Healthcare',
  'Entertainment', 'Insurance', 'Education', 'Subscriptions', 'Other'
];
const FUND_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  savings_account: 'Savings Account',
  cash: 'Cash on Hand',
};

export default function PersonalScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [fundSources, setFundSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'bills'>('expenses');
  const [refreshing, setRefreshing] = useState(false);

  // ── Add / Edit Expense modal ──────────────────────────────────────────
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null); // null = add mode
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');

  // ── Add / Edit Bill modal ─────────────────────────────────────────────
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null); // null = add mode
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billReminderDays, setBillReminderDays] = useState('3');
  const [billCategory, setBillCategory] = useState('Other');

  // ── Mark Paid confirmation modal ──────────────────────────────────────
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────
  const loadData = async () => {
    if (!user) return;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    const [{ data: exp }, { data: b }, { data: funds }] = await Promise.all([
      supabase.from('personal_expenses').select('*')
        .eq('user_id', user.id).gte('expense_date', startOfMonth)
        .order('expense_date', { ascending: false }),
      supabase.from('bill_reminders').select('*')
        .eq('user_id', user.id).order('due_date', { ascending: true }),
      supabase.from('fund_sources').select('*')
        .eq('user_id', user.id).order('created_at'),
    ]);

    setExpenses(exp || []);
    setBills(b || []);
    setFundSources(funds || []);
  };

  useEffect(() => { loadData(); }, [user]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // ── Open add expense ──────────────────────────────────────────────────
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpTitle(''); setExpAmount(''); setExpCategory('Food');
    setExpDate(new Date().toISOString().split('T')[0]); setExpDesc('');
    setShowExpenseModal(true);
  };

  // ── Open edit expense ─────────────────────────────────────────────────
  const openEditExpense = (exp: any) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpAmount(String(exp.amount));
    setExpCategory(exp.category || 'Food');
    setExpDate(exp.expense_date);
    setExpDesc(exp.description || '');
    setShowExpenseModal(true);
  };

  // ── Save (add or update) expense ──────────────────────────────────────
  const saveExpense = async () => {
    if (!expTitle || !expAmount) { Alert.alert('Error', 'Title and amount are required.'); return; }
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    if (editingExpense) {
      const { error } = await supabase.from('personal_expenses').update({
        title: expTitle, amount, category: expCategory,
        expense_date: expDate, description: expDesc,
      }).eq('id', editingExpense.id);
      if (error) { Alert.alert('Error', error.message); return; }
    } else {
      const { error } = await supabase.from('personal_expenses').insert({
        user_id: user!.id, title: expTitle, amount,
        category: expCategory, expense_date: expDate, description: expDesc,
      });
      if (error) { Alert.alert('Error', error.message); return; }
    }

    setShowExpenseModal(false);
    loadData();
  };

  // ── Delete expense ────────────────────────────────────────────────────
  const deleteExpense = (exp: any) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${exp.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await supabase.from('personal_expenses').delete().eq('id', exp.id);
            setShowExpenseModal(false);
            loadData();
          },
        },
      ]
    );
  };

  // ── Open add bill ─────────────────────────────────────────────────────
  const openAddBill = () => {
    setEditingBill(null);
    setBillTitle(''); setBillAmount(''); setBillDueDate(''); setBillReminderDays('3');
    setBillCategory('Other');
    setShowBillModal(true);
  };

  // ── Open edit bill ────────────────────────────────────────────────────
  const openEditBill = (bill: any) => {
    setEditingBill(bill);
    setBillTitle(bill.title);
    setBillAmount(String(bill.amount));
    setBillDueDate(bill.due_date);
    setBillReminderDays(String(bill.reminder_days_before ?? 3));
    setBillCategory(bill.category || 'Other');
    setShowBillModal(true);
  };

  // ── Save (add or update) bill ─────────────────────────────────────────
  const saveBill = async () => {
    if (!billTitle || !billAmount || !billDueDate) {
      Alert.alert('Error', 'All fields are required.'); return;
    }
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    if (editingBill) {
      const { error } = await supabase.from('bill_reminders').update({
        title: billTitle, amount,
        due_date: billDueDate, reminder_days_before: parseInt(billReminderDays) || 3,
        category: billCategory,
      }).eq('id', editingBill.id);
      if (error) { Alert.alert('Error', error.message); return; }
    } else {
      const { error } = await supabase.from('bill_reminders').insert({
        user_id: user!.id, title: billTitle, amount,
        due_date: billDueDate, reminder_days_before: parseInt(billReminderDays) || 3,
        category: billCategory,
      });
      if (error) { Alert.alert('Error', error.message); return; }
    }

    setShowBillModal(false);
    loadData();
  };

  // ── Delete bill ───────────────────────────────────────────────────────
  const deleteBill = (bill: any) => {
    Alert.alert(
      'Delete Bill',
      `Delete "${bill.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await supabase.from('bill_reminders').delete().eq('id', bill.id);
            setShowBillModal(false);
            loadData();
          },
        },
      ]
    );
  };

  // ── Open pay confirmation ─────────────────────────────────────────────
  const openPayModal = (bill: any) => {
    setPayingBill(bill);
    setSelectedFundId(null);
    setShowPayModal(true);
  };

  // ── Confirm payment — mark paid + deduct from fund source ─────────────
  const confirmPayment = async () => {
    if (!payingBill) return;

    // Mark bill as paid
    const { error } = await supabase
      .from('bill_reminders')
      .update({ is_paid: true })
      .eq('id', payingBill.id);
    if (error) { Alert.alert('Error', error.message); return; }

    // If a fund source was selected, deduct by reducing its balance
    if (selectedFundId) {
      const fund = fundSources.find((f) => f.id === selectedFundId);
      if (fund) {
        const billAmt = Number(payingBill.amount);
        if (fund.type === 'credit_card') {
          // Reduce credit limit by the bill amount
          const newLimit = Math.max(0, Number(fund.credit_limit) - billAmt);
          await supabase.from('fund_sources').update({ credit_limit: newLimit }).eq('id', fund.id);
        } else {
          // Reduce initial_balance
          const newBalance = Math.max(0, Number(fund.initial_balance) - billAmt);
          await supabase.from('fund_sources').update({ initial_balance: newBalance }).eq('id', fund.id);
        }
      }
    }

    setShowPayModal(false);
    setPayingBill(null);
    setSelectedFundId(null);
    loadData();
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const formatCurrency = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Personal Ledger</Text>
          <Text style={styles.headerSubtitle}>Track expenses and bills</Text>
        </View>
      </View>

      {/* Modern Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {(['expenses', 'bills'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={tab === 'expenses' ? 'wallet-outline' : 'receipt-outline'} 
                size={18} 
                color={activeTab === tab ? colors.personalLedger : colors.textLight} 
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'expenses' ? 'Expenses' : 'Bills'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* ── Expenses tab ── */}
        {activeTab === 'expenses' ? (
          <View style={styles.list}>
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>No expenses this month yet.</Text>
            ) : (
              expenses.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={styles.item}
                  onPress={() => openEditExpense(exp)}
                  activeOpacity={0.75}
                >
                  {/* Category badge on top */}
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20', alignSelf: 'flex-start' }]}>
                    <Text style={[styles.categoryText, { color: colors.primary }]}>{exp.category}</Text>
                  </View>
                  
                  {/* Main content */}
                  <View style={styles.itemContentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemSub}>{format(new Date(exp.expense_date), 'MMM d, yyyy')}</Text>
                      {exp.description ? <Text style={styles.itemDesc}>{exp.description}</Text> : null}
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemAmount}>{formatCurrency(Number(exp.amount))}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textLight} style={{ marginTop: 4 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* ── Bills tab ── */
          <View style={styles.list}>
            {bills.length === 0 ? (
              <Text style={styles.emptyText}>No bill reminders set.</Text>
            ) : (
              // Sort bills: unpaid first (by due date), then paid bills at the bottom
              [...bills].sort((a, b) => {
                if (a.is_paid && !b.is_paid) return 1;
                if (!a.is_paid && b.is_paid) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              }).map((bill) => {
                const isOverdue = !bill.is_paid && new Date(bill.due_date) < new Date();
                const isDueSoon = !bill.is_paid && !isOverdue &&
                  (new Date(bill.due_date).getTime() - Date.now()) < 3 * 86400000;
                return (
                  <TouchableOpacity
                    key={bill.id}
                    style={[styles.item, isOverdue && styles.itemOverdue]}
                    onPress={() => openEditBill(bill)}
                    activeOpacity={0.75}
                  >
                    {/* Category badge on top */}
                    {bill.category && (
                      <View style={[styles.categoryBadge, { 
                        backgroundColor: bill.is_paid ? colors.success + '20' : isOverdue ? colors.error + '20' : colors.warning + '20',
                        alignSelf: 'flex-start',
                      }]}>
                        <Text style={[styles.categoryText, { 
                          color: bill.is_paid ? colors.success : isOverdue ? colors.error : colors.warning 
                        }]}>
                          {bill.category}
                        </Text>
                      </View>
                    )}
                    
                    {/* Main content */}
                    <View style={styles.itemContentRow}>
                      <Ionicons
                        name={bill.is_paid ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time-outline'}
                        size={20}
                        color={
                          bill.is_paid ? colors.success
                            : isOverdue ? colors.error
                            : isDueSoon ? colors.warning
                            : colors.textSecondary
                        }
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.itemTitle}>{bill.title}</Text>
                        <Text style={[styles.itemSub, isOverdue && { color: colors.error }]}>
                          {bill.is_paid
                            ? 'Paid'
                            : `Due: ${format(new Date(bill.due_date), 'MMM d, yyyy')}`}
                        </Text>
                        {bill.is_paid && bill.paid_with && (
                          <Text style={styles.paidWith}>via {FUND_TYPE_LABELS[bill.paid_with] ?? bill.paid_with}</Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={styles.itemAmount}>{formatCurrency(Number(bill.amount))}</Text>
                        {!bill.is_paid && (
                          <TouchableOpacity
                            style={styles.markPaidBtn}
                            onPress={(e) => { e.stopPropagation(); openPayModal(bill); }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                            <Text style={styles.markPaidText}>Mark Paid</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => activeTab === 'expenses' ? openAddExpense() : openAddBill()}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Add / Edit Expense Modal ── */}
      <Modal visible={showExpenseModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input} placeholder="Title"
                placeholderTextColor={colors.textLight}
                value={expTitle} onChangeText={setExpTitle}
              />
              <TextInput
                style={styles.input} placeholder="Amount (₱)"
                placeholderTextColor={colors.textLight}
                value={expAmount} onChangeText={setExpAmount} keyboardType="decimal-pad"
              />
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, expCategory === cat && styles.catChipActive]}
                    onPress={() => setExpCategory(cat)}
                  >
                    <Text style={[styles.catChipText, expCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <DateInput label="Date" value={expDate} onChange={setExpDate} />
              <TextInput
                style={styles.input} placeholder="Description (optional)"
                placeholderTextColor={colors.textLight}
                value={expDesc} onChangeText={setExpDesc}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveExpense}>
                <Text style={styles.saveBtnText}>
                  {editingExpense ? 'Save Changes' : 'Save Expense'}
                </Text>
              </TouchableOpacity>

              {/* Delete button — only in edit mode */}
              {editingExpense && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteExpense(editingExpense)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.deleteBtnText}>Delete Expense</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add / Edit Bill Modal ── */}
      <Modal visible={showBillModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBill ? 'Edit Bill Reminder' : 'Add Bill Reminder'}
              </Text>
              <TouchableOpacity onPress={() => setShowBillModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input} placeholder="Bill name"
                placeholderTextColor={colors.textLight}
                value={billTitle} onChangeText={setBillTitle}
              />
              <TextInput
                style={styles.input} placeholder="Amount (₱)"
                placeholderTextColor={colors.textLight}
                value={billAmount} onChangeText={setBillAmount} keyboardType="decimal-pad"
              />
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {BILL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, billCategory === cat && styles.catChipActive]}
                    onPress={() => setBillCategory(cat)}
                  >
                    <Text style={[styles.catChipText, billCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <DateInput label="Due Date" value={billDueDate} onChange={setBillDueDate} />
              <Text style={styles.inputLabel}>Reminder</Text>
              <TextInput
                style={styles.input} placeholder="Remind me X days before (e.g., 3)"
                placeholderTextColor={colors.textLight}
                value={billReminderDays} onChangeText={setBillReminderDays} keyboardType="number-pad"
              />
              <Text style={styles.helpText}>You'll be notified this many days before the bill is due</Text>
              <TouchableOpacity style={styles.saveBtn} onPress={saveBill}>
                <Text style={styles.saveBtnText}>
                  {editingBill ? 'Save Changes' : 'Save Bill'}
                </Text>
              </TouchableOpacity>
              {editingBill && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteBill(editingBill)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.deleteBtnText}>Delete Bill</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Mark Paid Confirmation Modal ── */}
      <Modal visible={showPayModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {payingBill && (
              <>
                {/* Bill summary */}
                <View style={styles.payBillCard}>
                  <Text style={styles.payBillTitle}>{payingBill.title}</Text>
                  <Text style={styles.payBillAmount}>{formatCurrency(Number(payingBill.amount))}</Text>
                </View>

                <Text style={styles.inputLabel}>Paid using (optional)</Text>
                <Text style={styles.payNote}>
                  Select a fund source to automatically deduct this amount from your budget.
                </Text>

                {/* Fund source options */}
                {fundSources.length === 0 ? (
                  <Text style={styles.payNote}>No fund sources set up yet. Payment will be recorded without deduction.</Text>
                ) : (
                  <>
                    {/* "None / Skip" option */}
                    <TouchableOpacity
                      style={[styles.fundOption, selectedFundId === null && styles.fundOptionActive]}
                      onPress={() => setSelectedFundId(null)}
                    >
                      <View style={styles.fundOptionLeft}>
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color={selectedFundId === null ? '#fff' : colors.textSecondary}
                        />
                        <Text style={[styles.fundOptionName, selectedFundId === null && styles.fundOptionNameActive]}>
                          Don't deduct from budget
                        </Text>
                      </View>
                      {selectedFundId === null && (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>

                    {fundSources.map((fund) => {
                      const balance = Number(fund.credit_limit || fund.initial_balance);
                      const isSelected = selectedFundId === fund.id;
                      return (
                        <TouchableOpacity
                          key={fund.id}
                          style={[styles.fundOption, isSelected && styles.fundOptionActive]}
                          onPress={() => setSelectedFundId(fund.id)}
                        >
                          <View style={styles.fundOptionLeft}>
                            <Ionicons
                              name={
                                fund.type === 'credit_card' ? 'card-outline'
                                  : fund.type === 'cash' ? 'cash-outline'
                                  : 'wallet-outline'
                              }
                              size={20}
                              color={isSelected ? '#fff' : colors.textSecondary}
                            />
                            <View style={{ marginLeft: 10 }}>
                              <Text style={[styles.fundOptionName, isSelected && styles.fundOptionNameActive]}>
                                {fund.name}
                              </Text>
                              <Text style={[styles.fundOptionSub, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>
                                {FUND_TYPE_LABELS[fund.type]} · {formatCurrency(balance)}
                              </Text>
                            </View>
                          </View>
                          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                <TouchableOpacity style={[styles.saveBtn, { marginTop: 16 }]} onPress={confirmPayment}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={[styles.saveBtnText, { marginLeft: 6 }]}>Confirm Paid</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { 
      backgroundColor: colors.personalLedger, 
      padding: 24, 
      paddingTop: 56, 
      paddingBottom: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: 0.3 },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontWeight: '500' },
    
    // Modern Tabs
    tabsContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    tabs: { 
      flexDirection: 'row',
      gap: 4,
    },
    tab: { 
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 8,
    },
    tabActive: { 
      backgroundColor: colors.personalLedger + '15',
    },
    tabText: { 
      fontSize: 14, 
      color: colors.textLight, 
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    tabTextActive: { 
      color: colors.personalLedger,
      fontWeight: '700',
    },
    list: { padding: 16, paddingTop: 0 },
    emptyText: { textAlign: 'center', color: colors.textLight, padding: 40, fontSize: 14, fontWeight: '500' },
    item: {
      backgroundColor: colors.surface, 
      borderRadius: 14, 
      padding: 14,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
    },
    itemOverdue: { 
      borderLeftWidth: 3, 
      borderLeftColor: colors.error,
      backgroundColor: colors.error + '03',
    },
    itemContentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 10,
      gap: 4,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    itemRight: { alignItems: 'flex-end' },
    categoryBadge: { 
      paddingHorizontal: 8, 
      paddingVertical: 4, 
      borderRadius: 8,
    },
    categoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    itemTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 2 },
    itemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
    itemDesc: { fontSize: 11, color: colors.textLight, marginTop: 3, fontStyle: 'italic', lineHeight: 16 },
    itemAmount: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
    paidWith: { fontSize: 11, color: colors.success, marginTop: 3, fontWeight: '600' },
    markPaidBtn: { 
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.success,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    markPaidText: { 
      fontSize: 11, 
      color: '#fff', 
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    fab: {
      position: 'absolute', 
      bottom: 24, 
      right: 24,
      backgroundColor: colors.personalLedger, 
      width: 60, 
      height: 60,
      borderRadius: 30, 
      justifyContent: 'center', 
      alignItems: 'center',
      shadowColor: colors.personalLedger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    // Modals
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    closeBtn: { padding: 4, borderRadius: 20, backgroundColor: colors.border },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      padding: 11, fontSize: 14, marginBottom: 10, color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    helpText: { fontSize: 12, color: colors.textLight, marginTop: -6, marginBottom: 10, lineHeight: 16 },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    catChipActive: { backgroundColor: colors.personalLedger, borderColor: colors.personalLedger },
    catChipText: { fontSize: 13, color: colors.textSecondary },
    catChipTextActive: { color: '#fff', fontWeight: '600' },
    saveBtn: {
      padding: 14, borderRadius: 10, backgroundColor: colors.personalLedger,
      alignItems: 'center', marginTop: 6, marginBottom: 8,
      flexDirection: 'row', justifyContent: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: 13, borderRadius: 10, marginBottom: 8,
      borderWidth: 1, borderColor: colors.error + '50',
      backgroundColor: colors.error + '10',
    },
    deleteBtnText: { color: colors.error, fontWeight: '600', fontSize: 14 },
    // Pay modal
    payBillCard: {
      backgroundColor: colors.background, borderRadius: 12, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 14, borderWidth: 1, borderColor: colors.border,
    },
    payBillTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    payBillAmount: { fontSize: 16, fontWeight: '800', color: colors.personalLedger },
    payNote: { fontSize: 12, color: colors.textLight, marginBottom: 10, lineHeight: 18 },
    fundOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 13, borderRadius: 10, marginBottom: 8,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
    },
    fundOptionActive: { backgroundColor: colors.personalLedger, borderColor: colors.personalLedger },
    fundOptionLeft: { flexDirection: 'row', alignItems: 'center' },
    fundOptionName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: 10 },
    fundOptionNameActive: { color: '#fff' },
    fundOptionSub: { fontSize: 12, color: colors.textSecondary, marginLeft: 10, marginTop: 1 },
  });
