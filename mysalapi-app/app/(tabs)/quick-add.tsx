// Center + button quick-add: lets user pick Personal / Pautang / Ambagan then fills the form
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import DateInput from '../../components/DateInput';
import ResultAlert from '../../components/ResultAlert';
import RecordSuccessAlert from '../../components/RecordSuccessAlert';
import { EXP_CATEGORIES, BILL_CATEGORIES, PAYMENT_METHODS, formatCurrency } from '../../constants/recordConstants';
import { useRecordSuccess } from '../../hooks/useRecordSuccess';

type AddType = null | 'personal' | 'personal_expense' | 'personal_bill' | 'pautang' | 'ambagan';

export default function QuickAddScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);
  const [addType, setAddType] = useState<AddType>(null);
  const [loading, setLoading] = useState(false);
  const [resultAlert, setResultAlert] = useState({ visible: false, type: 'success' as 'success' | 'error' | 'info', title: '', message: '' });
  
  // Success alert for new record additions
  const { successAlert, showSuccess: baseShowSuccess, hideSuccess: baseHideSuccess } = useRecordSuccess();
  
  const showSuccess = baseShowSuccess;
  
  const hideSuccess = () => {
    baseHideSuccess();
    // Navigate to records after dismissing
    setTimeout(handleClose, 300);
  };

  // ── Personal ──────────────────────────────────────────────────────────────
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');

  // ── Bill ──────────────────────────────────────────────────────────────────
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billReminderDays, setBillReminderDays] = useState('3');
  const [billCategory, setBillCategory] = useState('Other');

  // ── Pautang ───────────────────────────────────────────────────────────────
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [loanPayMethod, setLoanPayMethod] = useState('GCash');
  const [loanPayDetails, setLoanPayDetails] = useState('');

  // ── Ambagan ───────────────────────────────────────────────────────────────
  const [groupTitle, setGroupTitle] = useState('');
  const [groupAmount, setGroupAmount] = useState('');
  const [groupDate, setGroupDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupCategory, setGroupCategory] = useState('Food');
  const [groupPayMethod, setGroupPayMethod] = useState('GCash');
  const [groupPayDetails, setGroupPayDetails] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customMembers, setCustomMembers] = useState<{ email: string; amount: string }[]>([{ email: '', amount: '' }]);
  const customTotal = customMembers.reduce((s, m) => { const n = parseFloat(m.amount); return s + (isNaN(n) ? 0 : n); }, 0);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(true);
      setAddType(null);
      return () => {};
    }, [])
  );

  const resetAll = () => {
    setAddType(null);
    setExpTitle(''); setExpAmount(''); setExpCategory('Food');
    setExpDate(new Date().toISOString().split('T')[0]); setExpDesc('');
    setBillTitle(''); setBillAmount(''); setBillDueDate(''); setBillReminderDays('3'); setBillCategory('Other');
    setBorrowerEmail(''); setLoanAmount(''); setLoanPurpose('');
    setLoanDate(new Date().toISOString().split('T')[0]); setDueDate('');
    setLoanPayMethod('GCash'); setLoanPayDetails('');
    setGroupTitle(''); setGroupAmount('');
    setGroupDate(new Date().toISOString().split('T')[0]);
    setGroupCategory('Food'); setGroupPayMethod('GCash'); setGroupPayDetails('');
    setMemberEmails(['']); setSplitMode('equal'); setCustomMembers([{ email: '', amount: '' }]);
  };

  const handleClose = () => {
    setVisible(false);
    resetAll();
    setTimeout(() => router.push('/(tabs)/records'), 100);
  };

  const showAlert = (type: 'success' | 'error' | 'info', title: string, message: string, callback?: () => void) => {
    setResultAlert({ visible: true, type, title, message });
    if (callback) {
      setTimeout(callback, 500);
    }
  };

  const saveExpense = async () => {
    if (!expTitle || !expAmount) { showAlert('error', 'Error', 'Title and amount are required.'); return; }
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) { showAlert('error', 'Error', 'Enter a valid amount.'); return; }
    setLoading(true);
    const { error } = await supabase.from('personal_expenses').insert({
      user_id: user!.id, title: expTitle, amount,
      category: expCategory, expense_date: expDate, description: expDesc,
    });
    setLoading(false);
    if (error) { showAlert('error', 'Error', error.message); return; }
    showSuccess('expense', 'Expense Added!', 'Your expense has been recorded.', [
      { label: 'Title', value: expTitle },
      { label: 'Amount', value: formatCurrency(amount) },
      { label: 'Category', value: expCategory },
      { label: 'Date', value: expDate },
    ]);
  };

  const saveBill = async () => {
    if (!billTitle || !billAmount || !billDueDate) { showAlert('error', 'Error', 'All fields are required.'); return; }
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) { showAlert('error', 'Error', 'Enter a valid amount.'); return; }
    setLoading(true);
    const { error } = await supabase.from('bill_reminders').insert({
      user_id: user!.id, title: billTitle, amount,
      due_date: billDueDate, reminder_days_before: parseInt(billReminderDays) || 3,
      category: billCategory,
    });
    setLoading(false);
    if (error) { showAlert('error', 'Error', error.message); return; }
    showSuccess('bill', 'Bill Saved!', "We'll remind you before it's due.", [
      { label: 'Bill', value: billTitle },
      { label: 'Amount', value: formatCurrency(amount) },
      { label: 'Due Date', value: billDueDate },
      { label: 'Remind', value: `${billReminderDays} days before` },
    ]);
  };

  const saveLoan = async () => {
    if (!borrowerEmail || !loanAmount || !dueDate) { showAlert('error', 'Error', 'Borrower email, amount, and due date are required.'); return; }
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) { showAlert('error', 'Error', 'Enter a valid amount.'); return; }
    setLoading(true);
    const { data: borrower } = await supabase.from('users').select('id').eq('email', borrowerEmail.toLowerCase().trim()).single();
    if (!borrower) { setLoading(false); showAlert('error', 'Error', 'No MySalapi user found with that email. They must register first.'); return; }
    const { error } = await supabase.from('loans').insert({
      lender_id: user!.id, borrower_id: borrower.id, amount, amount_remaining: amount,
      purpose: loanPurpose, loan_date: loanDate, due_date: dueDate,
      payment_method: loanPayMethod, payment_details: loanPayDetails, status: 'active',
    });
    setLoading(false);
    if (error) { showAlert('error', 'Error', error.message); return; }
    showSuccess('loan', 'Loan Recorded!', 'The loan has been added to Pautang.', [
      { label: 'Borrower', value: borrowerEmail },
      { label: 'Amount', value: formatCurrency(amount) },
      ...(loanPurpose ? [{ label: 'Purpose', value: loanPurpose }] : []),
      { label: 'Due', value: dueDate },
    ]);
  };

  const saveGroup = async () => {
    if (!groupTitle || !groupAmount) { showAlert('error', 'Error', 'Title and amount are required.'); return; }
    const amount = parseFloat(groupAmount);
    if (isNaN(amount) || amount <= 0) { showAlert('error', 'Error', 'Enter a valid amount.'); return; }
    const emails = memberEmails.map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) { showAlert('error', 'Error', 'Add at least one member email.'); return; }
    setLoading(true);
    const { data: memberUsers } = await supabase.from('users').select('id, email').in('email', emails);
    if (!memberUsers || memberUsers.length === 0) { setLoading(false); showAlert('error', 'Error', 'No valid MySalapi users found with those emails.'); return; }
    const sharePerPerson = amount / (memberUsers.length + 1);
    const { data: group, error } = await supabase.from('group_expenses').insert({
      payer_id: user!.id, title: groupTitle, total_amount: amount,
      expense_date: groupDate, category: groupCategory, split_method: 'equal', status: 'active',
      payment_method: groupPayMethod, payment_details: groupPayDetails,
    }).select().single();
    if (error || !group) { setLoading(false); showAlert('error', 'Error', error?.message || 'Failed to create group.'); return; }
    await supabase.from('group_participants').insert(
      memberUsers.map((u: any) => ({ group_expense_id: group.id, participant_id: u.id, share_amount: sharePerPerson, is_paid: false }))
    );
    setLoading(false);
    showSuccess('group', 'Group Created!', 'Ambagan group has been set up.', [
      { label: 'Title', value: groupTitle },
      { label: 'Total', value: formatCurrency(amount) },
      { label: 'Each Pays', value: formatCurrency(sharePerPerson) },
      { label: 'Members', value: `${memberUsers.length} person${memberUsers.length > 1 ? 's' : ''}` },
    ]);
  };

  const saveCustomGroup = async () => {
    if (!groupTitle) { showAlert('error', 'Error', 'Title is required.'); return; }
    const validMembers = customMembers.filter(m => m.email.trim() && parseFloat(m.amount) > 0);
    if (validMembers.length === 0) { showAlert('error', 'Error', 'Add at least one member with email and amount.'); return; }
    setLoading(true);
    const emails = validMembers.map(m => m.email.trim().toLowerCase());
    const { data: memberUsers } = await supabase.from('users').select('id, email').in('email', emails);
    if (!memberUsers || memberUsers.length === 0) { setLoading(false); showAlert('error', 'Error', 'No valid MySalapi users found with those emails.'); return; }
    const totalAmt = validMembers.reduce((s, m) => s + parseFloat(m.amount), 0);
    const { data: group, error } = await supabase.from('group_expenses').insert({
      payer_id: user!.id, title: groupTitle, total_amount: totalAmt,
      expense_date: groupDate, category: groupCategory, split_method: 'custom', status: 'active',
      payment_method: groupPayMethod, payment_details: groupPayDetails,
    }).select().single();
    if (error || !group) { setLoading(false); showAlert('error', 'Error', error?.message || 'Failed to create group.'); return; }
    const rows = validMembers.map(m => { const found = memberUsers.find((u: any) => u.email === m.email.trim().toLowerCase()); return found ? { group_expense_id: group.id, participant_id: found.id, share_amount: parseFloat(m.amount), is_paid: false } : null; }).filter(Boolean);
    if (rows.length > 0) await supabase.from('group_participants').insert(rows);
    setLoading(false);
    showSuccess('group', 'Group Created!', 'Ambagan group has been set up.', [
      { label: 'Title', value: groupTitle },
      { label: 'Total', value: formatCurrency(totalAmt) },
      { label: 'Split', value: 'Custom' },
      { label: 'Members', value: `${rows.length} person${rows.length > 1 ? 's' : ''}` },
    ]);
  };

  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.overlay} />
        <View style={styles.modal}>

          {/* Header - hide when success alert is shown */}
          {!successAlert.visible && (
            <View style={styles.header}>
              <TouchableOpacity onPress={addType ? () => addType === 'personal_expense' || addType === 'personal_bill' ? setAddType('personal') : setAddType(null) : handleClose} style={styles.closeBtn}>
                <Ionicons name={addType ? 'arrow-back' : 'close'} size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.title}>
                {addType === 'personal' ? 'Personal' : addType === 'personal_expense' ? 'Add Expense' : addType === 'personal_bill' ? 'Add Bill Reminder' : addType === 'pautang' ? 'Create Loan' : addType === 'ambagan' ? 'Group Expense' : 'Quick Add'}
              </Text>
              <View style={{ width: 38 }} />
            </View>
          )}

          {/* ── Type picker ── */}
          {!addType && !successAlert.visible && (
            <View style={styles.typePicker}>
              <Text style={styles.typePickerLabel}>What would you like to add?</Text>
              {[
                { type: 'personal' as AddType, icon: 'wallet-outline', label: 'Personal', sub: 'Expense or bill reminder' },
                { type: 'pautang' as AddType, icon: 'people-outline', label: 'Pautang', sub: 'Record a loan you gave' },
                { type: 'ambagan' as AddType, icon: 'grid-outline', label: 'Ambagan', sub: 'Split an expense with friends' },
              ].map(opt => (
                <TouchableOpacity key={opt.type} style={styles.typeCard} onPress={() => setAddType(opt.type)} activeOpacity={0.75}>
                  <View style={[styles.typeIconBox, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name={opt.icon as any} size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.typeLabel}>{opt.label}</Text>
                    <Text style={styles.typeSub}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Personal sub-picker ── */}
          {addType === 'personal' && !successAlert.visible && (
            <View style={styles.typePicker}>
              <Text style={styles.typePickerLabel}>Choose type</Text>
              {[
                { type: 'personal_expense' as AddType, icon: 'receipt-outline', label: 'Expense', sub: 'Record what you spent' },
                { type: 'personal_bill' as AddType, icon: 'calendar-outline', label: 'Bill Reminder', sub: 'Track upcoming bills' },
              ].map(opt => (
                <TouchableOpacity key={opt.type} style={styles.typeCard} onPress={() => setAddType(opt.type)} activeOpacity={0.75}>
                  <View style={[styles.typeIconBox, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name={opt.icon as any} size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.typeLabel}>{opt.label}</Text>
                    <Text style={styles.typeSub}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Personal Expense form ── */}
          {addType === 'personal_expense' && !successAlert.visible && (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput style={styles.input} placeholder="e.g. Lunch at SM" placeholderTextColor={colors.textLight} value={expTitle} onChangeText={setExpTitle} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount (₱)</Text>
                <TextInput style={[styles.input, styles.amountInput]} placeholder="0.00" placeholderTextColor={colors.textLight} value={expAmount} onChangeText={setExpAmount} keyboardType="decimal-pad" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chipGrid}>
                  {EXP_CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, expCategory === c && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setExpCategory(c)}>
                      <Text style={[styles.chipText, expCategory === c && { color: '#fff', fontWeight: '700' }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.fieldGroup}><DateInput label="Date" value={expDate} onChange={setExpDate} /></View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description (optional)</Text>
                <TextInput style={styles.input} placeholder="Add a note..." placeholderTextColor={colors.textLight} value={expDesc} onChangeText={setExpDesc} multiline numberOfLines={2} />
              </View>
              <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={saveExpense} disabled={loading}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Expense'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* ── Personal Bill form ── */}
          {addType === 'personal_bill' && !successAlert.visible && (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bill Name</Text>
                <TextInput style={styles.input} placeholder="e.g. Meralco Bill" placeholderTextColor={colors.textLight} value={billTitle} onChangeText={setBillTitle} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount (₱)</Text>
                <TextInput style={[styles.input, styles.amountInput]} placeholder="0.00" placeholderTextColor={colors.textLight} value={billAmount} onChangeText={setBillAmount} keyboardType="decimal-pad" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {BILL_CATEGORIES.map(c => (
                      <TouchableOpacity key={c} style={[styles.chip, billCategory === c && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setBillCategory(c)}>
                        <Text style={[styles.chipText, billCategory === c && { color: '#fff', fontWeight: '700' }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={styles.fieldGroup}>
                <DateInput label="Due Date" value={billDueDate} onChange={setBillDueDate} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Remind Me (days before)</Text>
                <TextInput style={styles.input} placeholder="e.g. 3" placeholderTextColor={colors.textLight} value={billReminderDays} onChangeText={setBillReminderDays} keyboardType="number-pad" />
                <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 6, lineHeight: 17 }}>You'll get an email this many days before the due date.</Text>
              </View>
              <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={saveBill} disabled={loading}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Bill'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* ── Pautang form ── */}
          {addType === 'pautang' && !successAlert.visible && (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Borrower's Email</Text>
                <TextInput style={styles.input} placeholder="must be a MySalapi user" placeholderTextColor={colors.textLight} value={borrowerEmail} onChangeText={setBorrowerEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount (₱)</Text>
                <TextInput style={[styles.input, styles.amountInput]} placeholder="0.00" placeholderTextColor={colors.textLight} value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Purpose</Text>
                <TextInput style={styles.input} placeholder="e.g. Emergency, Business" placeholderTextColor={colors.textLight} value={loanPurpose} onChangeText={setLoanPurpose} />
              </View>
              <View style={styles.fieldGroup}><DateInput label="Loan Date" value={loanDate} onChange={setLoanDate} /></View>
              <View style={styles.fieldGroup}><DateInput label="Due Date" value={dueDate} onChange={setDueDate} /></View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PAYMENT_METHODS.map(m => (
                      <TouchableOpacity key={m} style={[styles.chip, loanPayMethod === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setLoanPayMethod(m)}>
                        <Text style={[styles.chipText, loanPayMethod === m && { color: '#fff', fontWeight: '700' }]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Payment Details</Text>
                <TextInput style={styles.input} placeholder="e.g. GCash number" placeholderTextColor={colors.textLight} value={loanPayDetails} onChangeText={setLoanPayDetails} />
              </View>
              <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={saveLoan} disabled={loading}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Create Loan'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* ── Ambagan form ── */}
          {addType === 'ambagan' && !successAlert.visible && (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput style={styles.input} placeholder="e.g. Dinner at Jollibee" placeholderTextColor={colors.textLight} value={groupTitle} onChangeText={setGroupTitle} />
              </View>
              <View style={styles.fieldGroup}><DateInput label="Expense Date" value={groupDate} onChange={setGroupDate} /></View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput style={styles.input} placeholder="Food, Transport, etc." placeholderTextColor={colors.textLight} value={groupCategory} onChangeText={setGroupCategory} />
              </View>

              {/* Split Mode Toggle */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Split Method</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['equal', 'custom'] as const).map(m => (
                    <TouchableOpacity key={m}
                      style={[styles.splitOption, splitMode === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setSplitMode(m)}>
                      <Ionicons name={m === 'equal' ? 'git-branch-outline' : 'options-outline'} size={15} color={splitMode === m ? '#fff' : colors.textSecondary} />
                      <Text style={[styles.chipText, splitMode === m && { color: '#fff', fontWeight: '700' }]}>{m === 'equal' ? 'Equal Split' : 'Custom Split'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Equal Split */}
              {splitMode === 'equal' && (<>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Total Amount (₱)</Text>
                  <TextInput style={[styles.input, styles.amountInput]} placeholder="0.00" placeholderTextColor={colors.textLight} value={groupAmount} onChangeText={setGroupAmount} keyboardType="decimal-pad" />
                </View>
                <View style={styles.fieldGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.fieldLabel}>Members (emails)</Text>
                    {memberEmails.filter(Boolean).length > 0 && groupAmount
                      ? <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>₱{(parseFloat(groupAmount) / (memberEmails.filter(Boolean).length + 1)).toFixed(2)} each</Text>
                      : null}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textLight, marginBottom: 8 }}>Split equally including you.</Text>
                  {memberEmails.map((email, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                      <TextInput style={[styles.input, { flex: 1 }]} placeholder={`Member ${i + 1} email`} placeholderTextColor={colors.textLight}
                        value={email} onChangeText={v => setMemberEmails(prev => prev.map((e, idx) => idx === i ? v : e))} autoCapitalize="none" keyboardType="email-address" />
                      {memberEmails.length > 1 && (
                        <TouchableOpacity style={{ padding: 10, borderRadius: 10, backgroundColor: colors.error + '15' }}
                          onPress={() => setMemberEmails(prev => prev.filter((_, idx) => idx !== i))}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addMemberBtn} onPress={() => setMemberEmails(prev => [...prev, ''])}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>Add Another Member</Text>
                  </TouchableOpacity>
                </View>
              </>)}

              {/* Custom Split */}
              {splitMode === 'custom' && (
                <View style={styles.fieldGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.fieldLabel}>Members & Amounts</Text>
                    {customTotal > 0 && <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Total: ₱{customTotal.toFixed(2)}</Text>}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textLight, marginBottom: 8 }}>Enter each member's email and how much they owe you.</Text>
                  {customMembers.map((m, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                      <TextInput style={[styles.input, { flex: 2 }]} placeholder="email@example.com" placeholderTextColor={colors.textLight}
                        value={m.email} onChangeText={v => setCustomMembers(prev => prev.map((c, idx) => idx === i ? { ...c, email: v } : c))} autoCapitalize="none" keyboardType="email-address" />
                      <TextInput style={[styles.input, { flex: 1 }]} placeholder="₱0" placeholderTextColor={colors.textLight}
                        value={m.amount} onChangeText={v => setCustomMembers(prev => prev.map((c, idx) => idx === i ? { ...c, amount: v } : c))} keyboardType="decimal-pad" />
                      {customMembers.length > 1 && (
                        <TouchableOpacity style={{ padding: 10, borderRadius: 10, backgroundColor: colors.error + '15' }}
                          onPress={() => setCustomMembers(prev => prev.filter((_, idx) => idx !== i))}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addMemberBtn} onPress={() => setCustomMembers(prev => [...prev, { email: '', amount: '' }])}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>Add Another Member</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PAYMENT_METHODS.map(m => (
                      <TouchableOpacity key={m} style={[styles.chip, groupPayMethod === m && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setGroupPayMethod(m)}>
                        <Text style={[styles.chipText, groupPayMethod === m && { color: '#fff', fontWeight: '700' }]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Payment Details</Text>
                <TextInput style={styles.input} placeholder="e.g. GCash number 09XXXXXXXXX" placeholderTextColor={colors.textLight} value={groupPayDetails} onChangeText={setGroupPayDetails} />
              </View>
              <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={splitMode === 'equal' ? saveGroup : saveCustomGroup} disabled={loading}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Create Group'}</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

        </View>
      </KeyboardAvoidingView>

      {/* Result Alert Modal */}
      <ResultAlert
        visible={resultAlert.visible}
        type={resultAlert.type as 'success' | 'error' | 'info'}
        title={resultAlert.title}
        message={resultAlert.message}
        onButtonPress={() => setResultAlert({ ...resultAlert, visible: false })}
      />

      {/* Success Alert for new records - renders as its own full-screen modal */}
      <RecordSuccessAlert
        visible={successAlert.visible}
        type={successAlert.type}
        title={successAlert.title}
        subtitle={successAlert.subtitle}
        details={successAlert.details}
        onDismiss={hideSuccess}
      />
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    modal: { flex: 1, marginTop: '15%', backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight || colors.border },
    closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },

    // type picker
    typePicker: { padding: 24 },
    typePickerLabel: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 20, textAlign: 'center' },
    typeCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
    typeIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    typeLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    typeSub: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

    // form
    form: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.background },
    amountInput: { fontSize: 24, fontWeight: '700', borderColor: colors.primary, borderWidth: 2 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', marginTop: 4 },
    splitOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  });
