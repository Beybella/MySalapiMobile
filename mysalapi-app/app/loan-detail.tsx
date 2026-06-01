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

  const handleSingil = async () => {
    if (!loan) return;
    Alert.alert('Send Singil', `Send a payment reminder to ${loan.borrower?.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        const { data: lenderProfile } = await supabase.from('users').select('full_name, email').eq('id', user!.id).single();
        const { data: notif } = await supabase.from('email_notifications').insert({ recipient_email: loan.borrower?.email, subject_email: `Payment Reminder: ₱${loan.amount_remaining}`, notification_type: 'singil', subject_cost_id: loan.id, status: 'pending' }).select().single();
        const result = await sendSingil({ recipient_email: loan.borrower?.email, lender_name: lenderProfile?.full_name || lenderProfile?.email || 'Your lender', amount: Number(loan.amount_remaining), purpose: loan.purpose, due_date: loan.due_date, payment_method: loan.payment_method, payment_details: loan.payment_details, notification_id: notif?.id });
        Alert.alert(result.success ? 'Sent!' : 'Failed', result.success ? 'Singil email sent to borrower.' : (result.error ?? 'Could not send email.'));
      }},
    ]);
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
            { label: 'Loan Date', value: format(new Date(loan.loan_date), 'MMMM d, yyyy') },
            { label: 'Due Date', value: format(new Date(loan.due_date), 'MMMM d, yyyy'), highlight: isOverdue },
            { label: 'Payment Method', value: loan.payment_method },
            { label: 'Payment Details', value: loan.payment_details || '—' },
          ].map((row) => (
            <View key={row.label} style={styles.infoRow}>
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
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleSingil}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Send Singil</Text>
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
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: colors.textSecondary, fontSize: 15 },
    header: { backgroundColor: colors.pautangLedger, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 8 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    content: { flex: 1 },
    statusCard: { margin: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 20, elevation: 2 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    partyLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    partyName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    partyEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 13, fontWeight: '700' },
    purpose: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, fontStyle: 'italic' },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    amountBox: { alignItems: 'center' },
    amountLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    amountValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    progressBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: colors.success, borderRadius: 4 },
    progressLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 6, textAlign: 'right' },
    infoCard: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, padding: 4, elevation: 1 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    infoLabel: { fontSize: 13, color: colors.textSecondary },
    infoValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
    actionsRow: { flexDirection: 'row', gap: 12, margin: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    section: { margin: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
    emptyText: { color: colors.textLight, fontSize: 14, textAlign: 'center', padding: 16 },
    paymentRow: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, elevation: 1 },
    paymentDate: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    paymentMethod: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    paymentAmount: { fontSize: 16, fontWeight: '800', color: colors.success },
  });
