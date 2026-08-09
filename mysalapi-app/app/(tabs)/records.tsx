import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format, isPast } from 'date-fns';
import { sendSingil } from '../../lib/api';
import DateInput from '../../components/DateInput';
import AppModal from '../../components/AppModal';
import DraggableModal from '../../components/DraggableModal';

const EXP_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Others'];
const BILL_CATEGORIES = ['Housing', 'Utilities', 'Transportation', 'Food', 'Healthcare', 'Entertainment', 'Insurance', 'Education', 'Subscriptions', 'Other'];
const PAYMENT_METHODS = ['GCash', 'Maya', 'BDO', 'BPI', 'Cash', 'Other'];
const FUND_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card', savings_account: 'Savings Account', cash: 'Cash on Hand',
};
interface CustomMember { email: string; amount: string; }
type MainTab = 'personal' | 'pautang' | 'ambagan';

export default function RecordsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>('personal');

  // ─── PERSONAL state ───────────────────────────────────────────────────────
  const [personalSub, setPersonalSub] = useState<'expenses' | 'bills'>('expenses');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [fundSources, setFundSources] = useState<any[]>([]);
  const [personalRefreshing, setPersonalRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billReminderDays, setBillReminderDays] = useState('3');
  const [billCategory, setBillCategory] = useState('Other');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'expense' | 'bill'; item: any } | null>(null);
  const [showPersonalErr, setShowPersonalErr] = useState(false);
  const [personalErrMsg, setPersonalErrMsg] = useState('');
  const errPersonal = (msg: string) => { setPersonalErrMsg(msg); setShowPersonalErr(true); };

  const loadPersonalData = async () => {
    if (!user) return;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [{ data: exp }, { data: b }, { data: funds }] = await Promise.all([
      supabase.from('personal_expenses').select('*').eq('user_id', user.id).gte('expense_date', startOfMonth).order('expense_date', { ascending: false }),
      supabase.from('bill_reminders').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
      supabase.from('fund_sources').select('*').eq('user_id', user.id).order('created_at'),
    ]);
    setExpenses(exp || []); setBills(b || []); setFundSources(funds || []);
  };
  useEffect(() => { if (mainTab === 'personal') loadPersonalData(); }, [user, mainTab]);

  const openAddExpense = () => { setEditingExpense(null); setExpTitle(''); setExpAmount(''); setExpCategory('Food'); setExpDate(new Date().toISOString().split('T')[0]); setExpDesc(''); setShowExpenseModal(true); };
  const openEditExpense = (exp: any) => { setEditingExpense(exp); setExpTitle(exp.title); setExpAmount(String(exp.amount)); setExpCategory(exp.category || 'Food'); setExpDate(exp.expense_date); setExpDesc(exp.description || ''); setShowExpenseModal(true); };
  const saveExpense = async () => {
    if (!expTitle || !expAmount) { errPersonal('Title and amount are required.'); return; }
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) { errPersonal('Enter a valid amount.'); return; }
    if (editingExpense) {
      const { error } = await supabase.from('personal_expenses').update({ title: expTitle, amount, category: expCategory, expense_date: expDate, description: expDesc }).eq('id', editingExpense.id);
      if (error) { errPersonal(error.message); return; }
    } else {
      const { error } = await supabase.from('personal_expenses').insert({ user_id: user!.id, title: expTitle, amount, category: expCategory, expense_date: expDate, description: expDesc });
      if (error) { errPersonal(error.message); return; }
    }
    setShowExpenseModal(false); loadPersonalData();
  };
  const deleteExpense = (exp: any) => { setDeleteTarget({ type: 'expense', item: exp }); setShowDeleteModal(true); };
  const openAddBill = () => { setEditingBill(null); setBillTitle(''); setBillAmount(''); setBillDueDate(''); setBillReminderDays('3'); setBillCategory('Other'); setShowBillModal(true); };
  const openEditBill = (bill: any) => { setEditingBill(bill); setBillTitle(bill.title); setBillAmount(String(bill.amount)); setBillDueDate(bill.due_date); setBillReminderDays(String(bill.reminder_days_before ?? 3)); setBillCategory(bill.category || 'Other'); setShowBillModal(true); };
  const saveBill = async () => {
    if (!billTitle || !billAmount || !billDueDate) { errPersonal('All fields are required.'); return; }
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) { errPersonal('Enter a valid amount.'); return; }
    if (editingBill) {
      const { error } = await supabase.from('bill_reminders').update({ title: billTitle, amount, due_date: billDueDate, reminder_days_before: parseInt(billReminderDays) || 3, category: billCategory }).eq('id', editingBill.id);
      if (error) { errPersonal(error.message); return; }
    } else {
      const { error } = await supabase.from('bill_reminders').insert({ user_id: user!.id, title: billTitle, amount, due_date: billDueDate, reminder_days_before: parseInt(billReminderDays) || 3, category: billCategory });
      if (error) { errPersonal(error.message); return; }
    }
    setShowBillModal(false); loadPersonalData();
  };
  const deleteBill = (bill: any) => { setDeleteTarget({ type: 'bill', item: bill }); setShowDeleteModal(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'expense') { await supabase.from('personal_expenses').delete().eq('id', deleteTarget.item.id); setShowExpenseModal(false); }
    else { await supabase.from('bill_reminders').delete().eq('id', deleteTarget.item.id); setShowBillModal(false); }
    setShowDeleteModal(false); setDeleteTarget(null); loadPersonalData();
  };
  const openPayModal = (bill: any) => { setPayingBill(bill); setSelectedFundId(null); setShowPayModal(true); };
  const confirmPayment = async () => {
    if (!payingBill) return;
    const { error } = await supabase.from('bill_reminders').update({ is_paid: true }).eq('id', payingBill.id);
    if (error) { errPersonal(error.message); return; }
    if (selectedFundId) {
      const fund = fundSources.find(f => f.id === selectedFundId);
      if (fund) {
        const amt = Number(payingBill.amount);
        if (fund.type === 'credit_card') await supabase.from('fund_sources').update({ credit_limit: Math.max(0, Number(fund.credit_limit) - amt) }).eq('id', fund.id);
        else await supabase.from('fund_sources').update({ initial_balance: Math.max(0, Number(fund.initial_balance) - amt) }).eq('id', fund.id);
      }
    }
    setShowPayModal(false); setPayingBill(null); setSelectedFundId(null); loadPersonalData();
  };

  // ─── PAUTANG state ────────────────────────────────────────────────────────
  const [pautangSub, setPautangSub] = useState<'given' | 'owed'>('given');
  const [loansGiven, setLoansGiven] = useState<any[]>([]);
  const [loansOwed, setLoansOwed] = useState<any[]>([]);
  const [pautangRefreshing, setPautangRefreshing] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [loanPayMethod, setLoanPayMethod] = useState('GCash');
  const [loanPayDetails, setLoanPayDetails] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('GCash');
  const [showPautangErr, setShowPautangErr] = useState(false);
  const [pautangErrMsg, setPautangErrMsg] = useState('');
  const errPautang = (msg: string) => { setPautangErrMsg(msg); setShowPautangErr(true); };
  const [showSingilConfirm, setShowSingilConfirm] = useState(false);
  const [singilTarget, setSingilTarget] = useState<any>(null);
  const [showSingilResult, setShowSingilResult] = useState(false);
  const [singilResultOk, setSingilResultOk] = useState(true);
  const [singilResultMsg, setSingilResultMsg] = useState('');
  const [sendingSingil, setSendingSingil] = useState<string | null>(null);

  const loadPautangData = async () => {
    if (!user) return;
    const { data: given } = await supabase.from('loans').select('*, borrower:borrower_id(full_name, email)').eq('lender_id', user.id).order('created_at', { ascending: false });
    const { data: owed } = await supabase.from('loans').select('*, lender:lender_id(full_name, email)').eq('borrower_id', user.id).order('created_at', { ascending: false });
    setLoansGiven(given || []); setLoansOwed(owed || []);
  };
  useEffect(() => { if (mainTab === 'pautang') loadPautangData(); }, [user, mainTab]);

  const addLoan = async () => {
    if (!borrowerEmail || !loanAmount || !dueDate) { errPautang('Borrower email, amount, and due date are required.'); return; }
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) { errPautang('Enter a valid amount.'); return; }
    const { data: borrower } = await supabase.from('users').select('id').eq('email', borrowerEmail.toLowerCase().trim()).single();
    if (!borrower) { errPautang('No MySalapi user found with that email. They must register first.'); return; }
    const { error } = await supabase.from('loans').insert({ lender_id: user!.id, borrower_id: borrower.id, amount, amount_remaining: amount, purpose: loanPurpose, loan_date: loanDate, due_date: dueDate, payment_method: loanPayMethod, payment_details: loanPayDetails, status: 'active' });
    if (error) { errPautang(error.message); return; }
    setShowAddLoan(false); setBorrowerEmail(''); setLoanAmount(''); setLoanPurpose(''); setDueDate(''); setLoanPayDetails('');
    loadPautangData();
  };
  const recordPayment = async () => {
    if (!payAmount || !selectedLoan) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { errPautang('Enter a valid amount.'); return; }
    if (amount > selectedLoan.amount_remaining) { errPautang(`Amount exceeds remaining balance of ₱${selectedLoan.amount_remaining}`); return; }
    const newRemaining = Number(selectedLoan.amount_remaining) - amount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
    await supabase.from('loan_payments').insert({ loan_id: selectedLoan.id, amount, payment_date: payDate, payment_method: payMethod, recorded_by: user!.id });
    await supabase.from('loans').update({ amount_remaining: newRemaining, status: newStatus }).eq('id', selectedLoan.id);
    setShowRecordPayment(false); setPayAmount(''); setSelectedLoan(null); loadPautangData();
  };
  const sendSingilEmail = (loan: any) => { setSingilTarget(loan); setShowSingilConfirm(true); };
  const confirmSendSingil = async () => {
    const loan = singilTarget; setShowSingilConfirm(false);
    if (!loan || sendingSingil === loan.id) return;
    setSendingSingil(loan.id);
    const { data: lenderProfile } = await supabase.from('users').select('full_name, email').eq('id', user!.id).single();
    const { data: notif } = await supabase.from('email_notifications').insert({ recipient_email: loan.borrower?.email, subject_email: `Payment Reminder: ₱${loan.amount_remaining} due`, notification_type: 'singil', subject_cost_id: loan.id, status: 'pending' }).select().single();
    const result = await sendSingil({ recipient_email: loan.borrower?.email, lender_name: lenderProfile?.full_name || lenderProfile?.email || 'Your lender', amount: Number(loan.amount_remaining), purpose: loan.purpose, due_date: loan.due_date, payment_method: loan.payment_method, payment_details: loan.payment_details, notification_id: notif?.id });
    setSendingSingil(null); setSingilResultOk(result.success);
    setSingilResultMsg(result.success ? 'Singil email has been sent to the borrower.' : (result.error ?? 'Could not send email.'));
    setShowSingilResult(true);
  };

  // ─── AMBAGAN state ────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<any[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, { paid: number; total: number }>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [ambaganRefreshing, setAmbaganRefreshing] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDate, setGroupDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupCategory, setGroupCategory] = useState('Food');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [groupPayMethod, setGroupPayMethod] = useState('GCash');
  const [groupPayDetails, setGroupPayDetails] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [equalMembers, setEqualMembers] = useState<string[]>(['']);
  const [customMembers, setCustomMembers] = useState<CustomMember[]>([{ email: '', amount: '' }]);

  const resetGroupForm = () => { setGroupTitle(''); setTotalAmount(''); setGroupDate(new Date().toISOString().split('T')[0]); setGroupCategory('Food'); setSplitMode('equal'); setGroupPayMethod('GCash'); setGroupPayDetails(''); setEqualMembers(['']); setCustomMembers([{ email: '', amount: '' }]); };
  const loadGroupsData = async () => {
    if (!user) return;
    const { data } = await supabase.from('group_expenses').select('*').or(`payer_id.eq.${user.id}`).order('created_at', { ascending: false });
    setGroups(data || []);
    if (data && data.length > 0) {
      const ids = data.map((g: any) => g.id);
      const { data: participants } = await supabase.from('group_participants').select('group_expense_id, is_paid').in('group_expense_id', ids);
      const counts: Record<string, { paid: number; total: number }> = {};
      (participants || []).forEach((p: any) => { if (!counts[p.group_expense_id]) counts[p.group_expense_id] = { paid: 0, total: 0 }; counts[p.group_expense_id].total++; if (p.is_paid) counts[p.group_expense_id].paid++; });
      setGroupCounts(counts);
    }
  };
  useEffect(() => { if (mainTab === 'ambagan') loadGroupsData(); }, [user, mainTab]);

  const createEqualGroup = async () => {
    if (!groupTitle || !totalAmount) { Alert.alert('Error', 'Title and amount are required.'); return; }
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    const emails = equalMembers.map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) { Alert.alert('Error', 'Add at least one member email.'); return; }
    const { data: memberUsers } = await supabase.from('users').select('id, email, full_name').in('email', emails);
    if (!memberUsers || memberUsers.length === 0) { Alert.alert('Error', 'No valid MySalapi users found with those emails.'); return; }
    const sharePerPerson = amount / (memberUsers.length + 1);
    const { data: group, error } = await supabase.from('group_expenses').insert({ payer_id: user!.id, title: groupTitle, total_amount: amount, expense_date: groupDate, category: groupCategory, split_method: 'equal', status: 'active', payment_method: groupPayMethod, payment_details: groupPayDetails }).select().single();
    if (error || !group) { Alert.alert('Error', error?.message || 'Failed to create group.'); return; }
    await supabase.from('group_participants').insert(memberUsers.map((u: any) => ({ group_expense_id: group.id, participant_id: u.id, share_amount: sharePerPerson, is_paid: false })));
    setShowCreate(false); resetGroupForm(); loadGroupsData();
  };
  const createCustomGroup = async () => {
    if (!groupTitle) { Alert.alert('Error', 'Title is required.'); return; }
    const validMembers = customMembers.filter(m => m.email.trim() && m.amount.trim() && parseFloat(m.amount) > 0);
    if (validMembers.length === 0) { Alert.alert('Error', 'Add at least one member with a valid email and amount.'); return; }
    const emails = validMembers.map(m => m.email.trim().toLowerCase());
    const { data: memberUsers } = await supabase.from('users').select('id, email, full_name').in('email', emails);
    if (!memberUsers || memberUsers.length === 0) { Alert.alert('Error', 'No valid MySalapi users found with those emails.'); return; }
    const totalAmt = validMembers.reduce((s, m) => s + parseFloat(m.amount), 0);
    const { data: group, error } = await supabase.from('group_expenses').insert({ payer_id: user!.id, title: groupTitle, total_amount: totalAmt, expense_date: groupDate, category: groupCategory, split_method: 'custom', status: 'active', payment_method: groupPayMethod, payment_details: groupPayDetails }).select().single();
    if (error || !group) { Alert.alert('Error', error?.message || 'Failed to create group.'); return; }
    const rows = validMembers.map(m => { const found = memberUsers.find((u: any) => u.email === m.email.trim().toLowerCase()); return found ? { group_expense_id: group.id, participant_id: found.id, share_amount: parseFloat(m.amount), is_paid: false } : null; }).filter(Boolean);
    if (rows.length === 0) { Alert.alert('Error', 'None of the emails matched registered MySalapi users.'); await supabase.from('group_expenses').delete().eq('id', group.id); return; }
    await supabase.from('group_participants').insert(rows);
    setShowCreate(false); resetGroupForm(); loadGroupsData();
  };
  const customTotal = customMembers.reduce((s, m) => { const n = parseFloat(m.amount); return s + (isNaN(n) ? 0 : n); }, 0);

  const formatCurrency = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const styles = makeStyles(colors);

  // ─── loan card renderer (same as pautang.tsx) ─────────────────────────────
  const renderLoan = (loan: any, isGiven: boolean) => {
    const isOverdue = loan.status !== 'paid' && loan.due_date && isPast(new Date(loan.due_date));
    const otherParty = isGiven ? loan.borrower : loan.lender;
    return (
      <TouchableOpacity key={loan.id} style={[styles.loanCard, isOverdue && styles.loanOverdue]}
        onPress={() => router.push({ pathname: '/loan-detail', params: { id: loan.id } })}>
        <View style={styles.loanHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.loanName}>{otherParty?.full_name || otherParty?.email || 'Unknown'}</Text>
            <Text style={styles.loanPurpose}>{loan.purpose || 'No purpose stated'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: loan.status === 'paid' ? colors.success + '25' : isOverdue ? colors.error + '25' : colors.warning + '25' }]}>
            <Text style={[styles.statusText, { color: loan.status === 'paid' ? colors.success : isOverdue ? colors.error : colors.warning }]}>
              {loan.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Active'}
            </Text>
          </View>
        </View>
        <View style={styles.loanAmounts}>
          <View><Text style={styles.amountLabel}>Original</Text><Text style={styles.amountValue}>{formatCurrency(loan.amount)}</Text></View>
          <View><Text style={styles.amountLabel}>Remaining</Text><Text style={[styles.amountValue, { color: loan.status === 'paid' ? colors.success : colors.error }]}>{formatCurrency(loan.amount_remaining)}</Text></View>
          <View><Text style={styles.amountLabel}>Due</Text><Text style={[styles.amountValue, isOverdue && { color: colors.error }]}>{loan.due_date ? format(new Date(loan.due_date), 'MMM d') : 'N/A'}</Text></View>
        </View>
        {loan.status !== 'paid' && isGiven && (
          <View style={styles.loanActions}>
            <TouchableOpacity style={styles.actionBtnSolid} onPress={() => { setSelectedLoan(loan); setShowRecordPayment(true); }}>
              <Ionicons name="cash-outline" size={15} color="#fff" />
              <Text style={styles.actionBtnSolidText}>Record Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, sendingSingil === loan.id && { opacity: 0.5 }]}
              onPress={() => sendingSingil === loan.id ? null : sendSingilEmail(loan)} disabled={sendingSingil === loan.id}>
              <Ionicons name="mail-outline" size={15} color={colors.primary} />
              <Text style={styles.actionBtnText}>{sendingSingil === loan.id ? 'Sending...' : 'Singil'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Green header accent — straight cut like profile ── */}
      <View style={styles.greenHeader}>
        <Text style={styles.headerTitle}>Records</Text>
        <Text style={styles.headerSub}>Your financial history</Text>
      </View>

      {/* ── Main filter chips — below header ── */}
      <View style={styles.filterRow}>
        {(['personal', 'pautang', 'ambagan'] as MainTab[]).map(tab => (
          <TouchableOpacity key={tab}
            style={[styles.filterChip, mainTab === tab && styles.filterChipActive]}
            onPress={() => setMainTab(tab)} activeOpacity={0.75}>
            <Ionicons
              name={tab === 'personal' ? 'wallet-outline' : tab === 'pautang' ? 'people-outline' : 'grid-outline'}
              size={14} color={mainTab === tab ? '#fff' : colors.primary} style={{ marginRight: 5 }} />
            <Text style={[styles.filterChipText, mainTab === tab && { color: '#fff' }]} numberOfLines={1}>
              {tab === 'personal' ? 'Personal' : tab === 'pautang' ? 'Pautang' : 'Ambagan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ PERSONAL ══════════════════════════════════════════════════════════ */}
      {mainTab === 'personal' && (
        <View style={{ flex: 1 }}>
          <View style={styles.tabsContainer}>
            <View style={styles.tabs}>
              {(['expenses', 'bills'] as const).map(t => (
                <TouchableOpacity key={t} style={[styles.tab, personalSub === t && { backgroundColor: colors.primary + '18' }]} onPress={() => setPersonalSub(t)}>
                  <Ionicons name={t === 'expenses' ? 'wallet-outline' : 'receipt-outline'} size={13} color={personalSub === t ? colors.primary : colors.textLight} />
                  <Text style={[styles.tabText, personalSub === t && { color: colors.primary, fontWeight: '700' }]}>{t === 'expenses' ? 'Expenses' : 'Bills'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={personalRefreshing} onRefresh={async () => { setPersonalRefreshing(true); await loadPersonalData(); setPersonalRefreshing(false); }} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}>
            {personalSub === 'expenses' ? (
              expenses.length === 0
                ? <View style={styles.emptyState}><Ionicons name="wallet-outline" size={44} color={colors.textLight} /><Text style={styles.emptyText}>No expenses this month yet.</Text></View>
                : expenses.map(exp => (
                  <TouchableOpacity key={exp.id} style={styles.itemCard} onPress={() => openEditExpense(exp)} activeOpacity={0.75}>
                    <View style={[styles.badge, { backgroundColor: colors.personalLedger + '20', alignSelf: 'flex-start' }]}>
                      <Text style={[styles.badgeText, { color: colors.personalLedger }]}>{exp.category}</Text>
                    </View>
                    <View style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{exp.title}</Text>
                        <Text style={styles.itemSub}>{format(new Date(exp.expense_date), 'MMM d, yyyy')}</Text>
                        {exp.description ? <Text style={styles.itemDesc}>{exp.description}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.itemAmount, { color: colors.personalLedger }]}>{formatCurrency(Number(exp.amount))}</Text>
                        <Ionicons name="chevron-forward" size={13} color={colors.textLight} style={{ marginTop: 4 }} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
            ) : (
              bills.length === 0
                ? <View style={styles.emptyState}><Ionicons name="receipt-outline" size={44} color={colors.textLight} /><Text style={styles.emptyText}>No bill reminders set.</Text></View>
                : [...bills].sort((a, b) => { if (a.is_paid && !b.is_paid) return 1; if (!a.is_paid && b.is_paid) return -1; return new Date(a.due_date).getTime() - new Date(b.due_date).getTime(); }).map(bill => {
                  const isOverdue = !bill.is_paid && new Date(bill.due_date) < new Date();
                  const isDueSoon = !bill.is_paid && !isOverdue && (new Date(bill.due_date).getTime() - Date.now()) < 3 * 86400000;
                  return (
                    <TouchableOpacity key={bill.id} style={[styles.itemCard, isOverdue && { backgroundColor: colors.error + '18' }]}
                      onPress={() => openEditBill(bill)} activeOpacity={0.75}>
                      {bill.category && (
                        <View style={[styles.badge, { backgroundColor: bill.is_paid ? colors.success + '20' : isOverdue ? colors.error + '20' : colors.warning + '20', alignSelf: 'flex-start' }]}>
                          <Text style={[styles.badgeText, { color: bill.is_paid ? colors.success : isOverdue ? colors.error : colors.warning }]}>{bill.category}</Text>
                        </View>
                      )}
                      <View style={styles.itemRow}>
                        <Ionicons name={bill.is_paid ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time-outline'} size={20}
                          color={bill.is_paid ? colors.success : isOverdue ? colors.error : isDueSoon ? colors.warning : colors.textSecondary} style={{ marginTop: 2 }} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.itemTitle}>{bill.title}</Text>
                          <Text style={[styles.itemSub, isOverdue && { color: colors.error }]}>
                            {bill.is_paid ? 'Paid' : `Due: ${format(new Date(bill.due_date), 'MMM d, yyyy')}`}
                          </Text>
                          {bill.is_paid && bill.paid_with && <Text style={{ fontSize: 11, color: colors.success, marginTop: 2, fontWeight: '600' }}>via {FUND_TYPE_LABELS[bill.paid_with] ?? bill.paid_with}</Text>}
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={[styles.itemAmount, { color: bill.is_paid ? colors.success : colors.personalLedger }]}>{formatCurrency(Number(bill.amount))}</Text>
                          {!bill.is_paid && (
                            <TouchableOpacity style={styles.markPaidBtn} onPress={e => { e.stopPropagation(); openPayModal(bill); }}>
                              <Ionicons name="checkmark-circle-outline" size={13} color="#fff" />
                              <Text style={styles.markPaidBtnText}>Mark Paid</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => personalSub === 'expenses' ? openAddExpense() : openAddBill()}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ══ PAUTANG ══════════════════════════════════════════════════════════ */}
      {mainTab === 'pautang' && (
        <View style={{ flex: 1 }}>
          <View style={styles.tabsContainer}>
            <View style={styles.tabs}>
              {(['given', 'owed'] as const).map(t => (
                <TouchableOpacity key={t} style={[styles.tab, pautangSub === t && { backgroundColor: colors.primary + '18' }]} onPress={() => setPautangSub(t)}>
                  <Ionicons name={t === 'given' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} size={13} color={pautangSub === t ? colors.primary : colors.textLight} />
                  <Text style={[styles.tabText, pautangSub === t && { color: colors.primary, fontWeight: '700' }]}>
                    {t === 'given' ? `Given (${loansGiven.length})` : `Owed (${loansOwed.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={pautangRefreshing} onRefresh={async () => { setPautangRefreshing(true); await loadPautangData(); setPautangRefreshing(false); }} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}>
            {pautangSub === 'given'
              ? (loansGiven.length === 0 ? <View style={styles.emptyState}><Ionicons name="people-outline" size={44} color={colors.textLight} /><Text style={styles.emptyText}>No loans given yet.</Text></View> : loansGiven.map(l => renderLoan(l, true)))
              : (loansOwed.length === 0 ? <View style={styles.emptyState}><Ionicons name="people-outline" size={44} color={colors.textLight} /><Text style={styles.emptyText}>You don't owe anyone.</Text></View> : loansOwed.map(l => renderLoan(l, false)))}
            <View style={{ height: 100 }} />
          </ScrollView>

          {pautangSub === 'given' && (
            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => setShowAddLoan(true)}>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ══ AMBAGAN ══════════════════════════════════════════════════════════ */}
      {mainTab === 'ambagan' && (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={ambaganRefreshing} onRefresh={async () => { setAmbaganRefreshing(true); await loadGroupsData(); setAmbaganRefreshing(false); }} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}>
            {groups.length === 0
              ? <View style={[styles.emptyState, { paddingTop: 48 }]}><Ionicons name="people-outline" size={52} color={colors.textLight} /><Text style={styles.emptyText}>No group expenses yet.</Text><Text style={{ fontSize: 13, color: colors.textLight, marginTop: 4 }}>Tap + to create a shared expense</Text></View>
              : groups.map(group => (
                <TouchableOpacity key={group.id} style={styles.groupCard}
                  onPress={() => router.push({ pathname: '/group-detail' as any, params: { id: group.id } })}>
                  <View style={styles.groupHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupTitle}>{group.title}</Text>
                      <Text style={styles.groupSub}>{format(new Date(group.expense_date), 'MMM d, yyyy')} · {group.category}</Text>
                    </View>
                    <Text style={[styles.groupAmount, { color: colors.ambaganLedger }]}>{formatCurrency(group.total_amount)}</Text>
                  </View>
                  <View style={styles.groupFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={group.split_method === 'equal' ? 'git-branch-outline' : 'options-outline'} size={12} color={colors.ambaganLedger} />
                      <Text style={{ fontSize: 12, color: colors.ambaganLedger, fontWeight: '600' }}>{group.split_method === 'equal' ? 'Equal split' : 'Custom split'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: group.status === 'settled' ? colors.success + '25' : colors.warning + '25' }]}>
                      <Text style={[styles.statusText, { color: group.status === 'settled' ? colors.success : colors.warning }]}>{group.status === 'settled' ? 'Settled' : 'Active'}</Text>
                    </View>
                  </View>
                  {groupCounts[group.id] && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <View style={{ flex: 1, height: 4, backgroundColor: colors.borderLight || colors.border, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: '100%', backgroundColor: colors.ambaganLedger, borderRadius: 2, width: groupCounts[group.id].total > 0 ? `${(groupCounts[group.id].paid / groupCounts[group.id].total) * 100}%` as any : '0%' }} />
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{groupCounts[group.id].paid}/{groupCounts[group.id].total} paid</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="chevron-forward" size={13} color={colors.textLight} />
                    <Text style={{ fontSize: 11, color: colors.textLight, fontWeight: '500' }}>Tap to view participants</Text>
                  </View>
                </TouchableOpacity>
              ))}
            <View style={{ height: 100 }} />
          </ScrollView>
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Personal Modals ──────────────────────────────────────────────────── */}
      <DraggableModal visible={showExpenseModal} onClose={() => setShowExpenseModal(false)}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
          <TouchableOpacity onPress={() => setShowExpenseModal(false)} style={styles.modalClose}><Ionicons name="close" size={16} color={colors.textSecondary} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Lunch at SM" placeholderTextColor={colors.textLight} value={expTitle} onChangeText={setExpTitle} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Amount (₱)</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={expAmount} onChangeText={setExpAmount} keyboardType="decimal-pad" /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>
              {EXP_CATEGORIES.map(c => <TouchableOpacity key={c} style={[styles.chip, expCategory === c && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setExpCategory(c)}><Text style={[styles.chipText, expCategory === c && { color: '#fff', fontWeight: '700' }]}>{c}</Text></TouchableOpacity>)}
            </View></ScrollView></View>
          <View style={styles.fieldGroup}><DateInput label="Date" value={expDate} onChange={setExpDate} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput style={styles.input} placeholder="Add a note..." placeholderTextColor={colors.textLight} value={expDesc} onChangeText={setExpDesc} multiline numberOfLines={2} /></View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={saveExpense}><Text style={styles.saveBtnText}>{editingExpense ? 'Save Changes' : 'Save Expense'}</Text></TouchableOpacity>
          {editingExpense && <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteExpense(editingExpense)}><Ionicons name="trash-outline" size={15} color={colors.error} /><Text style={styles.deleteBtnText}>Delete Expense</Text></TouchableOpacity>}
        </ScrollView>
      </DraggableModal>

      <DraggableModal visible={showBillModal} onClose={() => setShowBillModal(false)}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingBill ? 'Edit Bill' : 'Add Bill Reminder'}</Text>
          <TouchableOpacity onPress={() => setShowBillModal(false)} style={styles.modalClose}><Ionicons name="close" size={16} color={colors.textSecondary} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Bill Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Meralco Bill" placeholderTextColor={colors.textLight} value={billTitle} onChangeText={setBillTitle} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Amount (₱)</Text>
            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={billAmount} onChangeText={setBillAmount} keyboardType="decimal-pad" /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>
              {BILL_CATEGORIES.map(c => <TouchableOpacity key={c} style={[styles.chip, billCategory === c && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setBillCategory(c)}><Text style={[styles.chipText, billCategory === c && { color: '#fff', fontWeight: '700' }]}>{c}</Text></TouchableOpacity>)}
            </View></ScrollView></View>
          <View style={styles.fieldGroup}><DateInput label="Due Date" value={billDueDate} onChange={setBillDueDate} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Remind Me (days before)</Text>
            <TextInput style={styles.input} placeholder="e.g. 3" placeholderTextColor={colors.textLight} value={billReminderDays} onChangeText={setBillReminderDays} keyboardType="number-pad" />
            <Text style={styles.helpText}>You'll get an email this many days before the due date.</Text></View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={saveBill}><Text style={styles.saveBtnText}>{editingBill ? 'Save Changes' : 'Save Bill'}</Text></TouchableOpacity>
          {editingBill && <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteBill(editingBill)}><Ionicons name="trash-outline" size={15} color={colors.error} /><Text style={styles.deleteBtnText}>Delete Bill</Text></TouchableOpacity>}
        </ScrollView>
      </DraggableModal>

      <Modal visible={showPayModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheetModal}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)} style={styles.modalClose}><Ionicons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity></View>
            {payingBill && (<>
              <View style={{ backgroundColor: colors.primary + '12', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: colors.primary + '30' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{payingBill.title}</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>{formatCurrency(Number(payingBill.amount))}</Text>
              </View>
              <Text style={styles.fieldLabel}>Paid using (optional)</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 19 }}>Select a fund source to automatically deduct from your budget.</Text>
              {fundSources.length === 0 ? <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14 }}>No fund sources set up yet.</Text> : (<>
                <TouchableOpacity style={[styles.fundOption, selectedFundId === null && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedFundId(null)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Ionicons name="close-circle-outline" size={20} color={selectedFundId === null ? '#fff' : colors.textSecondary} />
                    <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: 12 }, selectedFundId === null && { color: '#fff' }]}>Don't deduct from budget</Text></View>
                  {selectedFundId === null && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
                {fundSources.map(fund => { const isSel = selectedFundId === fund.id; const balance = Number(fund.credit_limit || fund.initial_balance); return (
                  <TouchableOpacity key={fund.id} style={[styles.fundOption, isSel && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedFundId(fund.id)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name={fund.type === 'credit_card' ? 'card-outline' : fund.type === 'cash' ? 'cash-outline' : 'wallet-outline'} size={20} color={isSel ? '#fff' : colors.textSecondary} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }, isSel && { color: '#fff' }]}>{fund.name}</Text>
                        <Text style={[{ fontSize: 12, color: colors.textSecondary }, isSel && { color: 'rgba(255,255,255,0.75)' }]}>{FUND_TYPE_LABELS[fund.type]} · {formatCurrency(balance)}</Text>
                      </View>
                    </View>
                    {isSel && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>); })}
              </>)}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, marginTop: 16, flexDirection: 'row', gap: 6 }]} onPress={confirmPayment}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.saveBtnText}>Confirm Paid</Text></TouchableOpacity>
            </>)}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AppModal visible={showPersonalErr} onClose={() => setShowPersonalErr(false)} icon="alert-circle" iconColor={colors.error} title="Error" message={personalErrMsg} buttons={[{ label: 'Got It', onPress: () => setShowPersonalErr(false) }]} />
      <AppModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} icon="trash-outline" iconColor={colors.error}
        title={deleteTarget?.type === 'expense' ? 'Delete Expense' : 'Delete Bill'} message={`Delete "${deleteTarget?.item?.title}"? This cannot be undone.`}
        buttons={[{ label: 'Cancel', variant: 'secondary', onPress: () => setShowDeleteModal(false) }, { label: 'Delete', onPress: confirmDelete }]} />

      {/* ── Pautang Modals ───────────────────────────────────────────────────── */}
      <DraggableModal visible={showAddLoan} onClose={() => setShowAddLoan(false)}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Create Loan</Text>
          <TouchableOpacity onPress={() => setShowAddLoan(false)} style={styles.modalClose}><Ionicons name="close" size={16} color={colors.textSecondary} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Borrower's Email</Text><TextInput style={styles.input} placeholder="must be a MySalapi user" placeholderTextColor={colors.textLight} value={borrowerEmail} onChangeText={setBorrowerEmail} keyboardType="email-address" autoCapitalize="none" /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Amount (₱)</Text><TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Purpose</Text><TextInput style={styles.input} placeholder="e.g. Emergency, Business" placeholderTextColor={colors.textLight} value={loanPurpose} onChangeText={setLoanPurpose} /></View>
          <View style={styles.fieldGroup}><DateInput label="Loan Date" value={loanDate} onChange={setLoanDate} /></View>
          <View style={styles.fieldGroup}><DateInput label="Due Date" value={dueDate} onChange={setDueDate} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>
              {PAYMENT_METHODS.map(m => <TouchableOpacity key={m} style={[styles.chip, loanPayMethod === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setLoanPayMethod(m)}><Text style={[styles.chipText, loanPayMethod === m && { color: '#fff', fontWeight: '700' }]}>{m}</Text></TouchableOpacity>)}
            </View></ScrollView></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Details</Text><TextInput style={styles.input} placeholder="e.g. GCash number" placeholderTextColor={colors.textLight} value={loanPayDetails} onChangeText={setLoanPayDetails} /></View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={addLoan}><Text style={styles.saveBtnText}>Create Loan</Text></TouchableOpacity>
        </ScrollView>
      </DraggableModal>

      <DraggableModal visible={showRecordPayment} onClose={() => setShowRecordPayment(false)}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Record Payment</Text>
          <TouchableOpacity onPress={() => setShowRecordPayment(false)} style={styles.modalClose}><Ionicons name="close" size={16} color={colors.textSecondary} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {selectedLoan && <View style={{ backgroundColor: colors.primary + '12', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: colors.primary + '30' }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Remaining Balance</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{formatCurrency(selectedLoan.amount_remaining)}</Text>
          </View>}
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Amount Paid (₱)</Text><TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Date</Text><TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textLight} value={payDate} onChangeText={setPayDate} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>
              {PAYMENT_METHODS.map(m => <TouchableOpacity key={m} style={[styles.chip, payMethod === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setPayMethod(m)}><Text style={[styles.chipText, payMethod === m && { color: '#fff', fontWeight: '700' }]}>{m}</Text></TouchableOpacity>)}
            </View></ScrollView></View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={recordPayment}><Text style={styles.saveBtnText}>Save Payment</Text></TouchableOpacity>
        </ScrollView>
      </DraggableModal>

      <AppModal visible={showPautangErr} onClose={() => setShowPautangErr(false)} icon="alert-circle" iconColor={colors.error} title="Error" message={pautangErrMsg} buttons={[{ label: 'Got It', onPress: () => setShowPautangErr(false) }]} />
      <AppModal visible={showSingilConfirm} onClose={() => setShowSingilConfirm(false)} icon="mail-outline" iconColor={colors.primary} title="Send Singil"
        message={`Send a debt collection email to ${singilTarget?.borrower?.email || singilTarget?.lender?.email || ''}?`}
        buttons={[{ label: 'Cancel', variant: 'secondary', onPress: () => setShowSingilConfirm(false) }, { label: 'Send', onPress: confirmSendSingil }]} />
      <AppModal visible={showSingilResult} onClose={() => setShowSingilResult(false)}
        icon={singilResultOk ? 'checkmark-circle' : 'close-circle'} iconColor={singilResultOk ? colors.success : colors.error}
        title={singilResultOk ? 'Sent!' : 'Failed'} message={singilResultMsg} buttons={[{ label: 'OK', onPress: () => setShowSingilResult(false) }]} />

      {/* ── Ambagan Modal ────────────────────────────────────────────────────── */}
      <DraggableModal visible={showCreate} onClose={() => { setShowCreate(false); resetGroupForm(); }}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Create Group Expense</Text>
          <TouchableOpacity onPress={() => { setShowCreate(false); resetGroupForm(); }} style={styles.modalClose}><Ionicons name="close" size={16} color={colors.textSecondary} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Dinner at Jollibee" placeholderTextColor={colors.textLight} value={groupTitle} onChangeText={setGroupTitle} /></View>
          <View style={styles.fieldGroup}><DateInput label="Expense Date" value={groupDate} onChange={setGroupDate} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Category</Text>
            <TextInput style={styles.input} placeholder="Food, Transport, etc." placeholderTextColor={colors.textLight} value={groupCategory} onChangeText={setGroupCategory} /></View>
          <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Split Method</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['equal', 'custom'] as const).map(m => (
                <TouchableOpacity key={m} style={[styles.splitOption, splitMode === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSplitMode(m)}>
                  <Ionicons name={m === 'equal' ? 'git-branch-outline' : 'options-outline'} size={15} color={splitMode === m ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.chipText, splitMode === m && { color: '#fff', fontWeight: '700' }]}>{m === 'equal' ? 'Equal Split' : 'Custom Split'}</Text>
                </TouchableOpacity>
              ))}
            </View></View>

          {splitMode === 'equal' ? (<>
            <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Total Amount (₱)</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" /></View>
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>Members</Text>
                {equalMembers.filter(Boolean).length > 0 && totalAmount
                  ? <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{equalMembers.filter(Boolean).length + 1} people · ₱{(parseFloat(totalAmount) / (equalMembers.filter(Boolean).length + 1)).toFixed(2)} each</Text>
                  : null}
              </View>
              <Text style={styles.helpText}>The total will be split equally including you.</Text>
              {equalMembers.map((email, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={`Member ${i + 1} email`} placeholderTextColor={colors.textLight} value={email}
                    onChangeText={v => setEqualMembers(prev => prev.map((e, idx) => idx === i ? v : e))} autoCapitalize="none" keyboardType="email-address" />
                  {equalMembers.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setEqualMembers(prev => prev.filter((_, idx) => idx !== i))}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} /></TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addMemberBtn} onPress={() => setEqualMembers(prev => [...prev, ''])}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>Add Another Member</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>
                {PAYMENT_METHODS.map(m => <TouchableOpacity key={m} style={[styles.chip, groupPayMethod === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setGroupPayMethod(m)}><Text style={[styles.chipText, groupPayMethod === m && { color: '#fff', fontWeight: '700' }]}>{m}</Text></TouchableOpacity>)}
              </View></ScrollView></View>
            <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Details</Text>
              <TextInput style={styles.input} placeholder="e.g. GCash number 09XXXXXXXXX" placeholderTextColor={colors.textLight} value={groupPayDetails} onChangeText={setGroupPayDetails} /></View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={createEqualGroup}><Text style={styles.saveBtnText}>Create Group</Text></TouchableOpacity>
          </>) : (<>
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>Members & Amounts</Text>
                {customTotal > 0 && <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Total: {formatCurrency(customTotal)}</Text>}
              </View>
              <Text style={styles.helpText}>Enter each member's email and how much they owe you.</Text>
              {customMembers.map((m, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <TextInput style={[styles.input, { flex: 2 }]} placeholder="email@example.com" placeholderTextColor={colors.textLight} value={m.email}
                    onChangeText={v => setCustomMembers(prev => prev.map((c, idx) => idx === i ? { ...c, email: v } : c))} autoCapitalize="none" keyboardType="email-address" />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="₱0.00" placeholderTextColor={colors.textLight} value={m.amount}
                    onChangeText={v => setCustomMembers(prev => prev.map((c, idx) => idx === i ? { ...c, amount: v } : c))} keyboardType="decimal-pad" />
                  {customMembers.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setCustomMembers(prev => prev.filter((_, idx) => idx !== i))}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} /></TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addMemberBtn} onPress={() => setCustomMembers(prev => [...prev, { email: '', amount: '' }])}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>Add Another Member</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>
                {PAYMENT_METHODS.map(m => <TouchableOpacity key={m} style={[styles.chip, groupPayMethod === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setGroupPayMethod(m)}><Text style={[styles.chipText, groupPayMethod === m && { color: '#fff', fontWeight: '700' }]}>{m}</Text></TouchableOpacity>)}
              </View></ScrollView></View>
            <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>Payment Details</Text>
              <TextInput style={styles.input} placeholder="e.g. GCash number 09XXXXXXXXX" placeholderTextColor={colors.textLight} value={groupPayDetails} onChangeText={setGroupPayDetails} /></View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={createCustomGroup}><Text style={styles.saveBtnText}>Create Group</Text></TouchableOpacity>
          </>)}
        </ScrollView>
      </DraggableModal>

    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── green header (matches Home / Budget style) ────────────────────────────
    greenHeader: {
      backgroundColor: colors.primary,
      paddingTop: 56,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },

    // ── main category chips (below header) ───────────────────────────────────
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
      gap: 8,
    },
    filterChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 6,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },

    // ── sub-tabs (same pattern as budget.tsx / pautang.tsx) ───────────────────
    tabsContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 10,
      padding: 3,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
    },
    tabs: { flexDirection: 'row', gap: 3 },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: 8,
    },
    tabText: { fontSize: 11, color: colors.textLight, fontWeight: '600', letterSpacing: 0.1 },

    // ── list content padding ──────────────────────────────────────────────────
    listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },

    // ── empty state ───────────────────────────────────────────────────────────
    emptyState: { alignItems: 'center', paddingTop: 56, gap: 12 },
    emptyText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },

    // ── personal item card ────────────────────────────────────────────────────
    itemCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    itemTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 3 },
    itemSub: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    itemDesc: { fontSize: 11, color: colors.textLight, marginTop: 3, fontStyle: 'italic', lineHeight: 16 },
    itemAmount: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    markPaidBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      elevation: 3, shadowColor: colors.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    },
    markPaidBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },

    // ── pautang loan card ─────────────────────────────────────────────────────
    loanCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    loanOverdue: { backgroundColor: colors.error + '18' },
    loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    loanName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 2 },
    loanPurpose: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    loanAmounts: {
      flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
      paddingTop: 10,
    },
    amountLabel: { fontSize: 10, color: colors.textSecondary, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    amountValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },
    loanActions: { flexDirection: 'row', gap: 8 },
    actionBtnSolid: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
    },
    actionBtnSolidText: { fontSize: 12, color: '#fff', fontWeight: '700' },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
      borderWidth: 1, borderColor: colors.primary + '35',
    },
    actionBtnText: { fontSize: 12, color: colors.primary, fontWeight: '700' },

    // ── ambagan group card ────────────────────────────────────────────────────
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    groupTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 2 },
    groupSub: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    groupAmount: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    groupFooter: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 8, marginBottom: 6,
    },

    // ── FAB ───────────────────────────────────────────────────────────────────
    fab: {
      position: 'absolute', bottom: 24, right: 24,
      width: 60, height: 60, borderRadius: 30,
      justifyContent: 'center', alignItems: 'center',
      elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    },

    // ── modal shared ──────────────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheetModal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32,
      maxHeight: '90%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
    modalClose: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.borderLight || colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
    },
    input: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
      paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: colors.textPrimary, backgroundColor: colors.background,
    },
    helpText: { fontSize: 12, color: colors.textLight, marginTop: 6, lineHeight: 17 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border, marginRight: 8, backgroundColor: colors.background,
    },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    saveBtn: {
      padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      marginTop: 8, marginBottom: 10,
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: 14, borderRadius: 14, marginBottom: 8,
      borderWidth: 1.5, borderColor: colors.error + '40', backgroundColor: colors.error + '08',
    },
    deleteBtnText: { color: colors.error, fontWeight: '700', fontSize: 14 },
    fundOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 14, borderRadius: 14, marginBottom: 10,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
    },
    splitOption: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 11, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
    },
    removeBtn: {
      padding: 10, borderRadius: 10, backgroundColor: colors.error + '15',
      justifyContent: 'center', alignItems: 'center',
    },
    addMemberBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
      justifyContent: 'center', marginTop: 4, marginBottom: 8,
    },
  });
