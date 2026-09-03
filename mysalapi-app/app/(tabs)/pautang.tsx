import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { format, isPast } from 'date-fns';
import { sendSingil } from '../../lib/api';
import { getFriendlyError, logError } from '../../lib/errorMessages';
import { showSuccessToast, showErrorToast } from '../../lib/toast';
import { useEmailValidation } from '../../hooks/useEmailValidation';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import DateInput from '../../components/DateInput';
import AppModal from '../../components/AppModal';
import DraggableModal from '../../components/DraggableModal';
import UserOrContactPicker from '../../components/UserOrContactPicker';
import AmountInput from '../../components/AmountInput';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import SearchBar from '../../components/SearchBar';
import FilterModal from '../../components/FilterModal';
import ResultCounter from '../../components/ResultCounter';
import EmptyState from '../../components/EmptyState';

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
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Loading states
  const [creating, setCreating] = useState(false);
  const [recording, setRecording] = useState(false);

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

  // Email validation for borrower
  const emailValidation = useEmailValidation(borrowerEmail, showAddLoan);

  // Form validation
  const validation = useFormValidation({
    fields: { borrowerEmail, loanAmount, loanPurpose, dueDate, loanDate },
    rules: {
      borrowerEmail: ValidationRules.email,
      loanAmount: ValidationRules.positiveNumber,
      loanPurpose: ValidationRules.required('Purpose'),
      dueDate: (value, fields) => {
        if (!value) return 'Due date is required';
        if (fields.loanDate && new Date(value) <= new Date(fields.loanDate)) {
          return 'Due date must be after loan date';
        }
        return '';
      },
    },
  });

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
    // Validate form first
    validation.markAllTouched();
    if (!validation.validateAll()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorToast('Please fix the errors before submitting');
      return;
    }

    // Check if email is valid
    if (!emailValidation.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorToast('Please enter a valid registered email');
      return;
    }

    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const amount = parseFloat(loanAmount);
      
      // Get borrower info
      const { data: borrower, error: borrowerError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', borrowerEmail.toLowerCase().trim())
        .single();
      
      if (borrowerError || !borrower) {
        throw new Error('No MySalapi user found with that email');
      }
      
      // Create loan
      const { error: insertError } = await supabase.from('loans').insert({
        lender_id: user!.id,
        borrower_id: borrower.id,
        amount,
        amount_remaining: amount,
        purpose: loanPurpose,
        loan_date: loanDate,
        due_date: dueDate,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'active',
      });
      
      if (insertError) throw insertError;
      
      // Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddLoan(false);
      setBorrowerEmail('');
      setLoanAmount('');
      setLoanPurpose('');
      setDueDate('');
      setPaymentDetails('');
      validation.reset();
      
      await loadData();
      
      showSuccessToast('💰 Loan created successfully!');
      
      // Check if borrower is already in contacts
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user!.id)
        .eq('email', borrower.email.toLowerCase())
        .single();
      
      // Offer to save contact
      if (!existingContact) {
        setTimeout(() => {
          Alert.alert(
            'Save to Contacts?',
            `Would you like to save ${borrower.full_name || borrower.email} to your contacts for quick access next time?`,
            [
              { text: 'No, Thanks', style: 'cancel' },
              {
                text: 'Save',
                onPress: async () => {
                  const { error: contactError } = await supabase
                    .from('contacts')
                    .insert({
                      user_id: user!.id,
                      email: borrower.email.toLowerCase(),
                      full_name: borrower.full_name || '',
                    });
                  
                  if (!contactError) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    showSuccessToast(`✓ ${borrower.full_name || borrower.email} added to contacts`);
                  }
                },
              },
            ]
          );
        }, 500);
      }
    } catch (error: any) {
      logError(error, 'addLoan');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const friendlyMessage = getFriendlyError(error);
      showErrorToast(friendlyMessage);
    } finally {
      setCreating(false);
    }
  };

  const recordPayment = async () => {
    if (!payAmount || !selectedLoan) return;
    
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorToast('Enter a valid amount');
      return;
    }
    
    if (amount > selectedLoan.amount_remaining) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorToast(`Amount exceeds remaining balance of ₱${selectedLoan.amount_remaining.toLocaleString()}`);
      return;
    }
    
    setRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const newRemaining = Number(selectedLoan.amount_remaining) - amount;
      const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
      
      // Insert payment record
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
          loan_id: selectedLoan.id,
          amount,
          payment_date: payDate,
          payment_method: payMethod,
          recorded_by: user!.id,
        });
      
      if (paymentError) throw paymentError;
      
      // Update loan status
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          amount_remaining: newRemaining,
          status: newStatus,
        })
        .eq('id', selectedLoan.id);
      
      if (updateError) throw updateError;
      
      // Check if loan is fully paid
      const isFullyPaid = newRemaining <= 0;
      
      if (isFullyPaid) {
        // Celebration for full payment!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
        showSuccessToast('🎉 Loan fully paid!', 'Congratulations!');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccessToast('✓ Payment recorded', `₱${newRemaining.toLocaleString()} remaining`);
      }
      
      setShowRecordPayment(false);
      setPayAmount('');
      setSelectedLoan(null);
      await loadData();
    } catch (error: any) {
      logError(error, 'recordPayment');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const friendlyMessage = getFriendlyError(error);
      showErrorToast(friendlyMessage);
    } finally {
      setRecording(false);
    }
  };

  const [sendingSingil, setSendingSingil] = React.useState<string | null>(null);

  // Get active data based on tab and add overdue status
  const activeData = (activeTab === 'given' ? loansGiven : loansOwed).map((loan) => {
    const isOverdue = loan.status !== 'paid' && loan.due_date && isPast(new Date(loan.due_date));
    return { ...loan, displayStatus: isOverdue ? 'overdue' : loan.status };
  });

  // Apply search & filter
  const {
    filters,
    filteredData,
    hasActiveFilters,
    totalItems,
    filteredCount,
    updateFilter,
    toggleCategory,
    toggleStatus,
    clearFilters,
  } = useSearchFilter({
    data: activeData,
    searchFields: activeTab === 'given' 
      ? ['borrower.full_name' as any, 'borrower.email' as any, 'purpose' as any]
      : ['lender.full_name' as any, 'lender.email' as any, 'purpose' as any],
    categoryField: 'payment_method' as any,
    dateField: 'due_date' as any,
    statusField: 'displayStatus' as any,
    amountField: 'amount_remaining' as any,
    nameField: activeTab === 'given' ? 'borrower.full_name' as any : 'lender.full_name' as any,
  });

  // Available statuses with colors
  const LOAN_STATUSES = [
    { value: 'active', label: 'Active', color: colors.warning },
    { value: 'partial', label: 'Partial', color: colors.info || colors.primary },
    { value: 'paid', label: 'Paid', color: colors.success },
    { value: 'overdue', label: 'Overdue', color: colors.error },
  ];

  const sendSingilEmail = (loan: any) => {
    setSingilTarget(loan);
    setShowSingilConfirm(true);
  };

  const confirmSendSingil = async () => {
    const loan = singilTarget;
    setShowSingilConfirm(false);
    if (!loan || sendingSingil === loan.id) return;

    setSendingSingil(loan.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: lenderProfile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user!.id)
        .single();
      
      const { data: notif } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: loan.borrower?.email,
          subject_email: `Payment Reminder: ₱${loan.amount_remaining} due`,
          notification_type: 'singil',
          subject_cost_id: loan.id,
          status: 'pending',
        })
        .select()
        .single();
      
      const result = await sendSingil({
        recipient_email: loan.borrower?.email,
        lender_name: lenderProfile?.full_name || lenderProfile?.email || 'Your lender',
        amount: Number(loan.amount_remaining),
        purpose: loan.purpose,
        due_date: loan.due_date,
        payment_method: loan.payment_method,
        payment_details: loan.payment_details,
        notification_id: notif?.id,
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccessToast('📧 Singil email sent!', `Sent to ${loan.borrower?.email}`);
      } else {
        throw new Error(result.error || 'Could not send email');
      }
      
      setSingilResultOk(result.success);
      setSingilResultMsg(result.success ? 'Singil email has been sent to the borrower.' : (result.error ?? 'Could not send email.'));
      setShowSingilResult(true);
    } catch (error: any) {
      logError(error, 'confirmSendSingil');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const friendlyMessage = getFriendlyError(error);
      showErrorToast(friendlyMessage);
      
      setSingilResultOk(false);
      setSingilResultMsg(friendlyMessage);
      setShowSingilResult(true);
    } finally {
      setSendingSingil(null);
    }
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
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
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

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={(text) => updateFilter('searchQuery', text)}
        placeholder={`Search ${activeTab === 'given' ? 'borrowers' : 'lenders'}...`}
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Result Counter */}
      {totalItems > 0 && (
        <ResultCounter
          filteredCount={filteredCount}
          totalCount={totalItems}
          itemLabel="loans"
        />
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} style={styles.list}>
        {filteredData.length === 0 ? (
          totalItems === 0 ? (
            <EmptyState
              icon={activeTab === 'given' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
              title={activeTab === 'given' ? 'No Loans Given' : 'No Loans Owed'}
              message={
                activeTab === 'given'
                  ? 'Start tracking loans by tapping the + button below.'
                  : "You don't owe anyone. Great job!"
              }
              type="no-data"
            />
          ) : (
            <EmptyState
              title="No Matches Found"
              message="Try adjusting your search or filters to find what you're looking for."
              type="no-results"
            />
          )
        ) : (
          filteredData.map((loan) => renderLoan(loan, activeTab === 'given'))
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
              <UserOrContactPicker
                label="Borrower's Email"
                value={borrowerEmail}
                onChangeText={(text) => {
                  setBorrowerEmail(text);
                  if (validation.touched.borrowerEmail) {
                    validation.validate('borrowerEmail', text);
                  }
                }}
                placeholder="must be a MySalapi user or contact"
                userId={user!.id}
              />
              
              {/* Email validation feedback */}
              {borrowerEmail && (
                <View style={styles.validationRow}>
                  {emailValidation.status === 'checking' && (
                    <>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.validationChecking}>Checking...</Text>
                    </>
                  )}
                  {emailValidation.status === 'valid' && (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <Text style={[styles.validationText, { color: colors.success }]}>
                        {emailValidation.message}
                      </Text>
                    </>
                  )}
                  {emailValidation.status === 'invalid' && (
                    <>
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                      <Text style={[styles.validationText, { color: colors.error }]}>
                        {emailValidation.message}
                      </Text>
                    </>
                  )}
                </View>
              )}
              
              {validation.touched.borrowerEmail && validation.errors.borrowerEmail && (
                <Text style={styles.errorText}>{validation.errors.borrowerEmail}</Text>
              )}
              
              <AmountInput
                label="Loan Amount"
                value={loanAmount}
                onChangeText={(text) => {
                  setLoanAmount(text);
                  if (validation.touched.loanAmount) {
                    validation.validate('loanAmount', text);
                  }
                }}
                min={100}
                hint="Minimum: ₱100"
                error={validation.errors.loanAmount}
                touched={validation.touched.loanAmount}
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Purpose</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Emergency, Business"
                  placeholderTextColor={colors.textLight}
                  value={loanPurpose}
                  onChangeText={(text) => {
                    setLoanPurpose(text);
                    if (validation.touched.loanPurpose) {
                      validation.validate('loanPurpose', text);
                    }
                  }}
                  onBlur={() => {
                    validation.markTouched('loanPurpose');
                    validation.validate('loanPurpose', loanPurpose);
                  }}
                  maxLength={100}
                />
                {loanPurpose && (
                  <Text style={styles.charCount}>{loanPurpose.length}/100</Text>
                )}
                {validation.touched.loanPurpose && validation.errors.loanPurpose && (
                  <Text style={styles.errorText}>{validation.errors.loanPurpose}</Text>
                )}
              </View>
              <View style={styles.fieldGroup}>
                <DateInput label="Loan Date" value={loanDate} onChange={setLoanDate} />
              </View>
              <View style={styles.fieldGroup}>
                <DateInput
                  label="Due Date"
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date);
                    if (validation.touched.dueDate) {
                      validation.validate('dueDate', date);
                    }
                  }}
                />
                {validation.touched.dueDate && validation.errors.dueDate && (
                  <Text style={styles.errorText}>{validation.errors.dueDate}</Text>
                )}
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PAYMENT_METHODS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.catChip, paymentMethod === m && styles.catChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setPaymentMethod(m);
                        }}
                      >
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
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.pautangLedger },
                  (creating || !emailValidation.isValid) && styles.saveBtnDisabled
                ]}
                onPress={addLoan}
                disabled={creating || !emailValidation.isValid}
              >
                {creating ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Creating...</Text>
                  </>
                ) : (
                  <Text style={styles.saveBtnText}>Create Loan</Text>
                )}
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
              
              <AmountInput
                label="Payment Amount"
                value={payAmount}
                onChangeText={setPayAmount}
                max={selectedLoan?.amount_remaining}
                hint={selectedLoan ? `Max: ₱${selectedLoan.amount_remaining.toLocaleString()}` : undefined}
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textLight} value={payDate} onChangeText={setPayDate} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PAYMENT_METHODS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.catChip, payMethod === m && styles.catChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setPayMethod(m);
                        }}
                      >
                        <Text style={[styles.catChipText, payMethod === m && styles.catChipTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.pautangLedger },
                  recording && styles.saveBtnDisabled
                ]}
                onPress={recordPayment}
                disabled={recording}
              >
                {recording ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Recording...</Text>
                  </>
                ) : (
                  <Text style={styles.saveBtnText}>Save Payment</Text>
                )}
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

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onUpdateFilter={updateFilter}
        onToggleCategory={toggleCategory}
        onToggleStatus={toggleStatus}
        onClearAll={clearFilters}
        availableCategories={PAYMENT_METHODS}
        availableStatuses={LOAN_STATUSES}
        categoryLabel="Payment Method"
        statusLabel="Loan Status"
        showDateFilter={true}
        showSortOptions={true}
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
      backgroundColor: colors.error + '18',
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
      shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
      flexDirection: 'row', justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    validationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: -12,
      marginBottom: 16,
    },
    validationChecking: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    validationText: {
      fontSize: 13,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: -10,
      marginBottom: 12,
      fontWeight: '500',
    },
    charCount: {
      fontSize: 11,
      color: colors.textLight,
      textAlign: 'right',
      marginTop: 4,
    },
  });
