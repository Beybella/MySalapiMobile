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

const PAYMENT_METHODS = ['GCash', 'Maya', 'BDO', 'BPI', 'Cash', 'Other'];

export default function PautangScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [loansGiven, setLoansGiven] = useState<any[]>([]);
  const [loansOwed, setLoansOwed] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'given' | 'owed'>('given');
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [paymentDetails, setPaymentDetails] = useState('');

  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('GCash');

  const loadData = async () => {
    if (!user) return;
    const { data: given } = await supabase.from('loans').select('*, borrower:borrower_id(full_name, email)').eq('lender_id', user.id).order('created_at', { ascending: false });
    const { data: owed } = await supabase.from('loans').select('*, lender:lender_id(full_name, email)').eq('borrower_id', user.id).order('created_at', { ascending: false });
    setLoansGiven(given || []);
    setLoansOwed(owed || []);
  };

  useEffect(() => { loadData(); }, [user]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const addLoan = async () => {
    if (!borrowerEmail || !loanAmount || !dueDate) { Alert.alert('Error', 'Borrower email, amount, and due date are required.'); return; }
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    const { data: borrower } = await supabase.from('users').select('id').eq('email', borrowerEmail.toLowerCase().trim()).single();
    if (!borrower) { Alert.alert('Error', 'No MySalapi user found with that email. They must register first.'); return; }
    const { error } = await supabase.from('loans').insert({
      lender_id: user!.id, borrower_id: borrower.id, amount, amount_remaining: amount,
      purpose: loanPurpose, loan_date: loanDate, due_date: dueDate,
      payment_method: paymentMethod, payment_details: paymentDetails, status: 'active',
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setShowAddLoan(false);
    setBorrowerEmail(''); setLoanAmount(''); setLoanPurpose(''); setDueDate(''); setPaymentDetails('');
    loadData();
  };

  const recordPayment = async () => {
    if (!payAmount || !selectedLoan) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (amount > selectedLoan.amount_remaining) { Alert.alert('Error', `Amount exceeds remaining balance of ₱${selectedLoan.amount_remaining}`); return; }
    const newRemaining = Number(selectedLoan.amount_remaining) - amount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
    await supabase.from('loan_payments').insert({ loan_id: selectedLoan.id, amount, payment_date: payDate, payment_method: payMethod, recorded_by: user!.id });
    await supabase.from('loans').update({ amount_remaining: newRemaining, status: newStatus }).eq('id', selectedLoan.id);
    setShowRecordPayment(false);
    setPayAmount(''); setSelectedLoan(null);
    loadData();
  };

  const sendSingilEmail = async (loan: any) => {
    Alert.alert('Send Singil', `Send a debt collection email to ${loan.borrower?.email || loan.lender?.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send', onPress: async () => {
          const { data: lenderProfile } = await supabase.from('users').select('full_name, email').eq('id', user!.id).single();
          const { data: notif } = await supabase.from('email_notifications').insert({
            recipient_email: loan.borrower?.email,
            subject_email: `Payment Reminder: ₱${loan.amount_remaining} due`,
            notification_type: 'singil', subject_cost_id: loan.id, status: 'pending',
          }).select().single();
          const result = await sendSingil({
            recipient_email: loan.borrower?.email,
            lender_name: lenderProfile?.full_name || lenderProfile?.email || 'Your lender',
            amount: Number(loan.amount_remaining), purpose: loan.purpose,
            due_date: loan.due_date, payment_method: loan.payment_method,
            payment_details: loan.payment_details, notification_id: notif?.id,
          });
          Alert.alert(result.success ? 'Sent!' : 'Failed', result.success ? 'Singil email has been sent to the borrower.' : (result.error ?? 'Could not send email.'));
        },
      },
    ]);
  };

  const formatCurrency = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const styles = makeStyles(colors);

  const renderLoan = (loan: any, isGiven: boolean) => {
    const isOverdue = loan.status !== 'paid' && loan.due_date && isPast(new Date(loan.due_date));
    const otherParty = isGiven ? loan.borrower : loan.lender;
    return (
      <TouchableOpacity
        key={loan.id}
        style={[styles.loanCard, isOverdue && styles.loanOverdue]}
        onPress={() => router.push({ pathname: '/loan-detail', params: { id: loan.id } })}
      >
        <View style={styles.loanHeader}>
          <View>
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
        {loan.status !== 'paid' && (
          <View style={styles.loanActions}>
            {isGiven && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedLoan(loan); setShowRecordPayment(true); }}>
                <Ionicons name="cash-outline" size={16} color={colors.primary} />
                <Text style={styles.actionBtnText}>Record Payment</Text>
              </TouchableOpacity>
            )}
            {isGiven && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary + '25' }]} onPress={() => sendSingilEmail(loan)}>
                <Ionicons name="mail-outline" size={16} color={colors.secondary} />
                <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Singil</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pautang Ledger</Text>
        <Text style={styles.headerSub}>Track loans given and owed</Text>
      </View>

      <View style={styles.tabs}>
        {(['given', 'owed'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'given' ? `Loans Given (${loansGiven.length})` : `Loans Owed (${loansOwed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} style={styles.list}>
        {activeTab === 'given' ? (
          loansGiven.length === 0 ? <Text style={styles.emptyText}>No loans given yet.</Text> : loansGiven.map((l) => renderLoan(l, true))
        ) : (
          loansOwed.length === 0 ? <Text style={styles.emptyText}>You don't owe anyone.</Text> : loansOwed.map((l) => renderLoan(l, false))
        )}
      </ScrollView>

      {activeTab === 'given' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddLoan(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={showAddLoan} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Loan</Text>
              <TouchableOpacity onPress={() => setShowAddLoan(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Borrower's email (must be MySalapi user)" placeholderTextColor={colors.textLight} value={borrowerEmail} onChangeText={setBorrowerEmail} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Amount (₱)" placeholderTextColor={colors.textLight} value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" />
              <TextInput style={styles.input} placeholder="Purpose" placeholderTextColor={colors.textLight} value={loanPurpose} onChangeText={setLoanPurpose} />
              <DateInput label="Loan Date" value={loanDate} onChange={setLoanDate} />
              <DateInput label="Due Date" value={dueDate} onChange={setDueDate} />
              <Text style={styles.inputLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity key={m} style={[styles.catChip, paymentMethod === m && styles.catChipActive]} onPress={() => setPaymentMethod(m)}>
                    <Text style={[styles.catChipText, paymentMethod === m && styles.catChipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={styles.input} placeholder="Payment details (e.g. GCash number)" placeholderTextColor={colors.textLight} value={paymentDetails} onChangeText={setPaymentDetails} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.pautangLedger }]} onPress={addLoan}>
                <Text style={styles.saveBtnText}>Create Loan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showRecordPayment} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowRecordPayment(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {selectedLoan && <Text style={styles.modalSub}>Remaining: {formatCurrency(selectedLoan.amount_remaining)}</Text>}
              <TextInput style={styles.input} placeholder="Amount paid (₱)" placeholderTextColor={colors.textLight} value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" />
              <TextInput style={styles.input} placeholder="Payment date (YYYY-MM-DD)" placeholderTextColor={colors.textLight} value={payDate} onChangeText={setPayDate} />
              <Text style={styles.inputLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity key={m} style={[styles.catChip, payMethod === m && styles.catChipActive]} onPress={() => setPayMethod(m)}>
                    <Text style={[styles.catChipText, payMethod === m && styles.catChipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.pautangLedger }]} onPress={recordPayment}>
                <Text style={styles.saveBtnText}>Save Payment</Text>
              </TouchableOpacity>
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
    header: { backgroundColor: colors.pautangLedger, padding: 24, paddingTop: 56 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 },
    tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, padding: 14, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.pautangLedger },
    tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    tabTextActive: { color: colors.pautangLedger },
    list: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: colors.textLight, padding: 32, fontSize: 14 },
    loanCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
    loanOverdue: { borderLeftWidth: 3, borderLeftColor: colors.error },
    loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    loanName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    loanPurpose: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    loanAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    amountLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
    amountValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    loanActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary + '20', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    actionBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.pautangLedger, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '82%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    closeBtn: { padding: 4, borderRadius: 20, backgroundColor: colors.border },
    modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, fontSize: 14, marginBottom: 10, color: colors.textPrimary, backgroundColor: colors.background },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    catChipActive: { backgroundColor: colors.pautangLedger, borderColor: colors.pautangLedger },
    catChipText: { fontSize: 13, color: colors.textSecondary },
    catChipTextActive: { color: '#fff', fontWeight: '600' },
    saveBtn: { padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', marginTop: 6, marginBottom: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
