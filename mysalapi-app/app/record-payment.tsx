import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DateInput from '../components/DateInput';
import AppModal from '../components/AppModal';

const PAYMENT_METHODS = ['GCash', 'Maya', 'BDO', 'BPI', 'Cash', 'Other'];

export default function RecordPaymentScreen() {
  const { loanId, remaining } = useLocalSearchParams<{ loanId: string; remaining: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('GCash');
  const [loading, setLoading] = useState(false);

  // ── Reusable modals ──────────────────────────────────────────────────
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const showError = (msg: string) => { setErrorMsg(msg); setShowErrorModal(true); };

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const remainingAmount = parseFloat(remaining ?? '0');

  const handleSave = async () => {
    const paid = parseFloat(amount);
    if (isNaN(paid) || paid <= 0) { showError('Enter a valid amount.'); return; }
    if (paid > remainingAmount) { showError(`Amount exceeds remaining balance of ₱${remainingAmount.toFixed(2)}`); return; }
    setLoading(true);
    const newRemaining = remainingAmount - paid;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partial';
    const { error: payError } = await supabase.from('loan_payments').insert({
      loan_id: loanId, amount: paid, payment_date: payDate, payment_method: method, recorded_by: user!.id,
    });
    if (payError) { setLoading(false); showError(payError.message); return; }
    await supabase.from('loans').update({ amount_remaining: newRemaining, status: newStatus }).eq('id', loanId);
    setLoading(false);
    setSavedMsg(`Payment of ₱${paid.toFixed(2)} recorded.`);
    setShowSavedModal(true);
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Payment</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>Remaining Balance</Text>
          <Text style={styles.remainingAmount}>₱{remainingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Amount Paid (₱)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.textLight} keyboardType="decimal-pad" />
          <Text style={styles.label}>Payment Date</Text>
          <DateInput label="Payment Date" value={payDate} onChange={setPayDate} />
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity key={m} style={[styles.methodChip, method === m && styles.methodChipActive]} onPress={() => setMethod(m)}>
                <Text style={[styles.methodChipText, method === m && styles.methodChipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Payment'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

      {/* Saved Modal — OK navigates back to the loan detail screen */}
      <AppModal
        visible={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        icon="checkmark-circle"
        iconColor={colors.pautangLedger}
        title="Saved"
        message={savedMsg}
        buttons={[{ label: 'OK', onPress: () => { setShowSavedModal(false); router.back(); } }]}
      />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.pautangLedger, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },    backBtn: { padding: 8 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    content: { flex: 1 },
    remainingCard: { margin: 16, backgroundColor: colors.pautangLedger + '18', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.pautangLedger + '35' },
    remainingLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    remainingAmount: { fontSize: 32, fontWeight: '800', color: colors.pautangLedger },
    form: { margin: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16, color: colors.textPrimary },
    methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    methodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    methodChipActive: { backgroundColor: colors.pautangLedger, borderColor: colors.pautangLedger },
    methodChipText: { fontSize: 13, color: colors.textSecondary },
    methodChipTextActive: { color: '#fff', fontWeight: '600' },
    saveBtn: { backgroundColor: colors.pautangLedger, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
