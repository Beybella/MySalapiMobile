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

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showSingilConfirm, setShowSingilConfirm] = useState(false);
  const [singilTarget, setSingilTarget] = useState<any>(null);

  const [showSingilResult, setShowSingilResult] = useState(false);
  const [singilResultOk, setSingilResultOk] = useState(true);
  const [singilResultMsg, setSingilResultMsg] = useState('');

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

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
    if (!borrowerEmail || !loanAmount || !dueDate) { showError('Borrower email, amount, and due date are required.'); return; }
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) { showError('Enter a valid amount.'); return; }
    const { data: borrower } = await supabase.from('users').select('id').eq('email', borrowerEmail.toLowerCase().trim()).single();
    if (!borrower) { showError('No MySalapi user found with that email. They must register first.'); return; }
    const { error } = await supabase.from('loans').insert({
      lender_id: user!.id, borrower_id: borrower.id, amount, amount_remaining: amount,
      purpose: loanPurpose, loan_date: loanDate, due_date: dueDate,
      payment_method: paymentMethod, payment_details: paymentDetails, status: 'active',
    });
    if (error) { showError(error.message); return; }
    setShowAddLoan(false);
    setBorrowerEmail(''); setLoanAmount(''); setLoanPurpose(''); setDueDate(''); setPaymentDetails('');
    loadData();
  };

  const recordPayment = async () => {
    if (!payAmount || !selectedLoan) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { showError('Enter a valid amount.'); return; }
    if (amount > selectedLoan.amount_remaining) { showError(`Amount exceeds remaining balance of ₱${selectedLoan.amount_remaining}`); return; }
    const newRemaining = Number(selectedLoan.amount_remaining) - amount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
    await supabase.from('loan_payments').insert({ loan_id: selectedLoan.id, amount, payment_date: payDate, payment_method: payMethod, recorded_by: user!.id });
    await supabase.from('loans').update({ amount_remaining: newRemaining, status: newStatus }).eq('id', selectedLoan.id);
    setShowRecordPayment(false);
    setPayAmount(''); setSelectedLoan(null);
    loadData();
  };

  const [sendingSingil, setSendingSingil] = React.useState<string | null>(null);

  const sendSingilEmail = (loan: any) => {
    setSingilTarget(loan);
    setShowSingilConfirm(true);
  };

  const confirmSendSingil = async () => {
    const loan = singilTarget;
    setShowSingilConfirm(false);
    if (!loan || sendingSingil === loan.id) return;

    setSendingSingil(loan.id);
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
    setSendingSingil(null);
    setSingilResultOk(result.success);
    setSingilResultMsg(result.success ? 'Singil email has been sent to the borrower.' : (result.error ?? 'Could not send email.'));
    setShowSingilResult(true);
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
              <TouchableOpacity style={styles.actionBtnSolid} onPress={() => { setSelectedLoan(loan); setShowRecordPayment(true); }}>
                <Ionicons name="cash-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnSolidText}>Record Payment</Text>
              </TouchableOpacity>
            )}
            {isGiven && (
              <TouchableOpacity
                style={[styles.actionBtn, sendingSingil === loan.id && { opacity: 0.5 }]}
                onPress={() => sendSingil === loan.id ? null : sendSingilEmail(loan)}
                disabled={sendingSingil === loan.id}
              >
                <Ionicons name="mail-outline" size={16} color={colors.pautangLedger} />
                <Text style={styles.actionBtnText}>
                  {sendingSingil === loan.id ? 'Sending...' : 'Singil'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pautang Ledger</Text>
          <Text style={styles.headerSubtitle}>Track loans given and owed</Text>
        </View>
      </View>

      {/* Modern Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {(['given', 'owed'] as const).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.tabActive]} 
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={tab === 'given' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} 
                size={18} 
                color={activeTab === tab ? colors.pautangLedger : colors.textLight} 
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'given' ? `Given (${loansGiven.length})` : `Owed (${loansOwed.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

      <DraggableModal visible={showAddLoan} onClose={() => setShowAddLoan(false)}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Loan</Text>
              <TouchableOpacity onPress={() => setShowAddLoan(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Borrower's Email</Text>
                <TextInput style={styles.input} placeholder="must be a MySalapi user" placeholderTextColor={colors.textLight} value={borrowerEmail} onChangeText={setBorrowerEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Amount (₱)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Purpose</Text>
                <TextInput style={styles.input} placeholder="e.g. Emergency, Business" placeholderTextColor={colors.textLight} value={loanPurpose} onChangeText={setLoanPurpose} />
              </View>
              <View style={styles.fieldGroup}>
                <DateInput label="Loan Date" value={loanDate} onChange={setLoanDate} />
              </View>
              <View style={styles.fieldGroup}>
                <DateInput label="Due Date" value={dueDate} onChange={setDueDate} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PAYMENT_METHODS.map((m) => (
                      <TouchableOpacity key={m} style={[styles.catChip, paymentMethod === m && styles.catChipActive]} onPress={() => setPaymentMethod(m)}>
                        <Text style={[styles.catChipText, paymentMethod === m && styles.catChipTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Details</Text>
                <TextInput style={styles.input} placeholder="e.g. GCash number" placeholderTextColor={colors.textLight} value={paymentDetails} onChangeText={setPaymentDetails} />
              </View>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.pautangLedger }]} onPress={addLoan}>
                <Text style={styles.saveBtnText}>Create Loan</Text>
              </TouchableOpacity>
            </ScrollView>
      </DraggableModal>

      <DraggableModal visible={showRecordPayment} onClose={() => setShowRecordPayment(false)}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowRecordPayment(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {selectedLoan && (
                <View style={{ backgroundColor: colors.pautangLedger + '12', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: colors.pautangLedger + '30' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Remaining Balance</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: colors.pautangLedger }}>{formatCurrency(selectedLoan.amount_remaining)}</Text>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Amount Paid (₱)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textLight} value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textLight} value={payDate} onChangeText={setPayDate} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PAYMENT_METHODS.map((m) => (
                      <TouchableOpacity key={m} style={[styles.catChip, payMethod === m && styles.catChipActive]} onPress={() => setPayMethod(m)}>
                        <Text style={[styles.catChipText, payMethod === m && styles.catChipTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.pautangLedger }]} onPress={recordPayment}>
                <Text style={styles.saveBtnText}>Save Payment</Text>
              </TouchableOpacity>
            </ScrollView>
      </DraggableModal>

      <AppModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        icon="alert-circle"
        iconColor={colors.error}
        title="Error"
        message={errorMsg}
        buttons={[{ label: 'Got It', onPress: () => setShowErrorModal(false) }]}
      />

      <AppModal
        visible={showSingilConfirm}
        onClose={() => setShowSingilConfirm(false)}
        icon="mail-outline"
        iconColor={colors.pautangLedger}
        title="Send Singil"
        message={`Send a debt collection email to ${singilTarget?.borrower?.email || singilTarget?.lender?.email || ''}?`}
        buttons={[
          { label: 'Cancel', variant: 'secondary', onPress: () => setShowSingilConfirm(false) },
          { label: 'Send', onPress: confirmSendSingil },
        ]}
      />

      <AppModal
        visible={showSingilResult}
        onClose={() => setShowSingilResult(false)}
        icon={singilResultOk ? 'checkmark-circle' : 'close-circle'}
        iconColor={singilResultOk ? colors.success : colors.error}
        title={singilResultOk ? 'Sent!' : 'Failed'}
        message={singilResultMsg}
        buttons={[{ label: 'OK', onPress: () => setShowSingilResult(false) }]}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { 
      backgroundColor: colors.pautangLedger, 
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
      backgroundColor: colors.pautangLedger + '15',
    },
    tabText: { 
      fontSize: 13, 
      color: colors.textLight, 
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    tabTextActive: { 
      color: colors.pautangLedger,
      fontWeight: '700',
    },
    list: { flex: 1, padding: 16, paddingTop: 0 },
    emptyText: { textAlign: 'center', color: colors.textLight, padding: 40, fontSize: 14, fontWeight: '500' },
    loanCard: { 
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
    loanOverdue: { 
      borderLeftWidth: 3, 
      borderLeftColor: colors.error,
      backgroundColor: colors.error + '03',
    },
    loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    loanName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 2 },
    loanPurpose: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    loanAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight || colors.border },
    amountLabel: { fontSize: 10, color: colors.textSecondary, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    amountValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },
    loanActions: { flexDirection: 'row', gap: 6 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.pautangLedger + '15', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: colors.pautangLedger + '30' },
    actionBtnText: { fontSize: 12, color: colors.pautangLedger, fontWeight: '700' },
    actionBtnSolid: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.pautangLedger, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
    actionBtnSolidText: { fontSize: 12, color: '#fff', fontWeight: '700' },
    fab: { 
      position: 'absolute', 
      bottom: 24, 
      right: 24, 
      backgroundColor: colors.pautangLedger, 
      width: 60, 
      height: 60, 
      borderRadius: 30, 
      justifyContent: 'center', 
      alignItems: 'center',
      shadowColor: colors.pautangLedger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalBackdrop: { flex: 1 },
    modal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32,
      maxHeight: '82%',
    },
    modalDragHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
    closeBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.borderLight,
      justifyContent: 'center', alignItems: 'center',
    },
    modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
    fieldGroup: { marginBottom: 20 },
    input: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
      paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: colors.textPrimary, backgroundColor: colors.background,
    },
    inputLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
    },
    catChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, marginRight: 8,
      backgroundColor: colors.background,
    },
    catChipActive: { backgroundColor: colors.pautangLedger, borderColor: colors.pautangLedger },
    catChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    catChipTextActive: { color: '#fff', fontWeight: '700' },
    saveBtn: {
      padding: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center',
      marginTop: 8, marginBottom: 10,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  });
