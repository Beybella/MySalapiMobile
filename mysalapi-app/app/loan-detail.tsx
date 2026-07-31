import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { format, isPast } from 'date-fns';
import { sendSingil } from '../lib/api';
import AppModal from '../components/AppModal';

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [loan, setLoan] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLoan = async () => {
    const { data: loanData } = await supabase.from('loans').select('*, borrower:borrower_id(full_name, email), lender:lender_id(full_name, email)').eq('id', id).single();
    const { data: paymentData } = await supabase.from('loan_payments').select('*').eq('loan_id', id).order('payment_date', { ascending: false });
    setLoan(loanData);
    setPayments(paymentData || []);
    setLoading(false);
  };

  useEffect(() => { loadLoan(); }, [id]);

  const isLender = loan?.lender_id === user?.id;
  const isOverdue = loan && loan.status !== 'paid' && loan.due_date && isPast(new Date(loan.due_date));

  const [sendingLoanSingil, setSendingLoanSingil] = useState(false);
  const [showSingilConfirm, setShowSingilConfirm] = useState(false);
  const [showSingilResult, setShowSingilResult] = useState(false);
  const [singilResultOk, setSingilResultOk] = useState(true);
  const [singilResultMsg, setSingilResultMsg] = useState('');

  const handleSingil = () => {
    if (!loan || sendingLoanSingil) return;
    setShowSingilConfirm(true);
  };

  const confirmSendSingil = async () => {
    setShowSingilConfirm(false);
    if (!loan) return;
    setSendingLoanSingil(true);
    const { data: lenderProfile } = await supabase.from('users').select('full_name, email').eq('id', user!.id).single();
    const { data: notif } = await supabase.from('email_notifications').insert({ recipient_email: loan.borrower?.email, subject_email: `Payment Reminder: ₱${loan.amount_remaining}`, notification_type: 'singil', subject_cost_id: loan.id, status: 'pending' }).select().single();
    const result = await sendSingil({ recipient_email: loan.borrower?.email, lender_name: lenderProfile?.full_name || lenderProfile?.email || 'Your lender', amount: Number(loan.amount_remaining), purpose: loan.purpose, due_date: loan.due_date, payment_method: loan.payment_method, payment_details: loan.payment_details, notification_id: notif?.id });
    setSendingLoanSingil(false);
    setSingilResultOk(result.success);
    setSingilResultMsg(result.success ? 'Singil email sent to borrower.' : (result.error ?? 'Could not send email.'));
    setShowSingilResult(true);
  };
  const formatCurrency = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const styles = makeStyles(colors);

  if (loading) return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  if (!loan) return <View style={styles.center}><Text style={styles.loadingText}>Loan not found.</Text></View>;

  const paidAmount = Number(loan.amount) - Number(loan.amount_remaining);
  const progressPct = Math.min(100, (paidAmount / Number(loan.amount)) * 100);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isOverdue && { backgroundColor: colors.error }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.partyLabel}>{isLender ? 'Borrower' : 'Lender'}</Text>
              <Text style={styles.partyName}>{isLender ? (loan.borrower?.full_name || loan.borrower?.email) : (loan.lender?.full_name || loan.lender?.email)}</Text>
              <Text style={styles.partyEmail}>{isLender ? loan.borrower?.email : loan.lender?.email}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: loan.status === 'paid' ? colors.success + '25' : isOverdue ? colors.error + '25' : colors.warning + '25' }]}>
              <Text style={[styles.statusText, { color: loan.status === 'paid' ? colors.success : isOverdue ? colors.error : colors.warning }]}>
                {loan.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Active'}
              </Text>
            </View>
          </View>
          {loan.purpose ? <Text style={styles.purpose}>Purpose: {loan.purpose}</Text> : null}
          <View style={styles.amountRow}>
            <View style={styles.amountBox}><Text style={styles.amountLabel}>Original</Text><Text style={styles.amountValue}>{formatCurrency(loan.amount)}</Text></View>
            <View style={styles.amountBox}><Text style={styles.amountLabel}>Paid</Text><Text style={[styles.amountValue, { color: colors.success }]}>{formatCurrency(paidAmount)}</Text></View>
            <View style={styles.amountBox}><Text style={styles.amountLabel}>Remaining</Text><Text style={[styles.amountValue, { color: loan.status === 'paid' ? colors.success : colors.error }]}>{formatCurrency(loan.amount_remaining)}</Text></View>
          </View>
          <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${progressPct}%` as any }]} /></View>
          <Text style={styles.progressLabel}>{progressPct.toFixed(0)}% paid</Text>
        </View>

        <View style={styles.infoCard}>
          {[
            { label: 'Loan Date', value: format(new Date(loan.loan_date), 'MMMM d, yyyy'), icon: 'calendar-outline' },
            { label: 'Due Date', value: format(new Date(loan.due_date), 'MMMM d, yyyy'), highlight: isOverdue, icon: 'alarm-outline' },
            { label: 'Payment Method', value: loan.payment_method, icon: 'card-outline' },
            { label: 'Payment Details', value: loan.payment_details || '—', icon: 'information-circle-outline' },
          ].map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name={row.icon as any} size={16} color={colors.pautangLedger} />
              </View>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, row.highlight && { color: colors.error, fontWeight: '700' }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {isLender && loan.status !== 'paid' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.pautangLedger }]} onPress={() => router.push({ pathname: '/record-payment', params: { loanId: loan.id, remaining: loan.amount_remaining } })}>
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Record Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.secondary }, sendingLoanSingil && { opacity: 0.6 }]}
                onPress={handleSingil}
                disabled={sendingLoanSingil}
              >
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{sendingLoanSingil ? 'Sending...' : 'Send Singil'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length === 0 ? <Text style={styles.emptyText}>No payments recorded yet.</Text> : (
            payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View><Text style={styles.paymentDate}>{format(new Date(p.payment_date), 'MMM d, yyyy')}</Text><Text style={styles.paymentMethod}>{p.payment_method}</Text></View>
                <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AppModal
        visible={showSingilConfirm}
        onClose={() => setShowSingilConfirm(false)}
        icon="mail-outline"
        iconColor={colors.pautangLedger}
        title="Send Singil"
        message={`Send a payment reminder to ${loan?.borrower?.email || ''}?`}
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

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
    
    // Modern Header
    header: { 
      backgroundColor: colors.pautangLedger, 
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
    
    content: { flex: 1 },
    
    // Status Card - Keep Original Simple Style
    statusCard: { 
      margin: 16, 
      backgroundColor: colors.surface, 
      borderRadius: 16, 
      padding: 20,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statusRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: 12,
    },
    partyLabel: { 
      fontSize: 11, 
      color: colors.textSecondary, 
      fontWeight: '600', 
      textTransform: 'uppercase', 
      marginBottom: 2 
    },
    partyName: { 
      fontSize: 17, 
      fontWeight: '700', 
      color: colors.textPrimary,
    },
    partyEmail: { 
      fontSize: 12, 
      color: colors.textSecondary, 
      marginTop: 2,
    },
    statusBadge: { 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 20,
    },
    statusText: { 
      fontSize: 13, 
      fontWeight: '700',
    },
    purpose: { 
      fontSize: 13, 
      color: colors.textSecondary, 
      marginBottom: 16,
      fontStyle: 'italic',
    },
    
    // Amount Display - Keep Original Simple Style
    amountRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginBottom: 14,
    },
    amountBox: { 
      alignItems: 'center',
    },
    amountLabel: { 
      fontSize: 11, 
      color: colors.textSecondary, 
      marginBottom: 4,
    },
    amountValue: { 
      fontSize: 15, 
      fontWeight: '800', 
      color: colors.textPrimary,
    },
    
    // Progress Bar - Keep Simple
    progressBg: { 
      height: 8, 
      backgroundColor: colors.border, 
      borderRadius: 4, 
      overflow: 'hidden',
    },
    progressFill: { 
      height: 8, 
      backgroundColor: colors.success, 
      borderRadius: 4,
    },
    progressLabel: { 
      fontSize: 12, 
      color: colors.textSecondary, 
      marginTop: 6,
      textAlign: 'right',
    },
    
    // Modern Info Card - Compact to Save Space
    infoCard: { 
      marginHorizontal: 16, 
      marginBottom: 16,
      backgroundColor: colors.surface, 
      borderRadius: 14, 
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    infoRow: { 
      flexDirection: 'row', 
      alignItems: 'center',
      paddingVertical: 8,
      gap: 10,
    },
    infoIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.pautangLedger + '15',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    infoLabel: { 
      fontSize: 13, 
      color: colors.textSecondary,
      fontWeight: '600',
      flex: 1,
    },
    infoValue: { 
      fontSize: 14, 
      fontWeight: '600', 
      color: colors.textPrimary,
      flex: 1.3,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    
    // Enhanced Action Buttons
    actionsRow: { 
      flexDirection: 'row', 
      gap: 12, 
      marginHorizontal: 16,
      marginBottom: 16,
    },
    actionBtn: { 
      flex: 1, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 8, 
      padding: 16, 
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    actionBtnText: { 
      color: '#fff', 
      fontSize: 14, 
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    
    // Payment History Section
    section: { margin: 16 },
    sectionTitle: { 
      fontSize: 15, 
      fontWeight: '700', 
      color: colors.textPrimary, 
      marginBottom: 12,
      letterSpacing: 0.2,
    },
    emptyText: { 
      color: colors.textLight, 
      fontSize: 14, 
      textAlign: 'center', 
      padding: 20,
      fontWeight: '500',
    },
    
    // Enhanced Payment Cards
    paymentRow: { 
      backgroundColor: colors.surface, 
      borderRadius: 14, 
      padding: 16, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    paymentDate: { 
      fontSize: 14, 
      fontWeight: '600', 
      color: colors.textPrimary,
      letterSpacing: 0.2,
      marginBottom: 3,
    },
    paymentMethod: { 
      fontSize: 12, 
      color: colors.textSecondary,
      fontWeight: '500',
    },
    paymentAmount: { 
      fontSize: 17, 
      fontWeight: '800', 
      color: colors.success,
      letterSpacing: 0.2,
    },
  });
