import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { format } from 'date-fns';
import DateInput from '../../components/DateInput';

export default function AmbaganScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food');
  const [memberEmails, setMemberEmails] = useState('');

  const loadGroups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('group_expenses')
      .select('*')
      .or(`payer_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setGroups(data || []);
  };

  useEffect(() => { loadGroups(); }, [user]);
  const onRefresh = async () => { setRefreshing(true); await loadGroups(); setRefreshing(false); };

  const createGroup = async () => {
    if (!title || !totalAmount || !memberEmails) {
      Alert.alert('Error', 'Title, amount, and at least one member email are required.');
      return;
    }
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    const emails = memberEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

    const { data: memberUsers } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('email', emails);

    if (!memberUsers || memberUsers.length === 0) {
      Alert.alert('Error', 'No valid MySalapi users found with those emails.');
      return;
    }

    const totalMembers = memberUsers.length + 1; // +1 for payer
    const sharePerPerson = amount / totalMembers;

    const { data: group, error } = await supabase
      .from('group_expenses')
      .insert({
        payer_id: user!.id,
        title,
        total_amount: amount,
        expense_date: expenseDate,
        category,
        split_method: 'equal',
        status: 'active',
      })
      .select()
      .single();

    if (error || !group) { Alert.alert('Error', error?.message || 'Failed to create group.'); return; }

    const participantRows = memberUsers.map((u: any) => ({
      group_expense_id: group.id,
      participant_id: u.id,
      share_amount: sharePerPerson,
      is_paid: false,
    }));

    await supabase.from('group_participants').insert(participantRows);

    setShowCreate(false);
    setTitle(''); setTotalAmount(''); setMemberEmails('');
    loadGroups();
  };

  const formatCurrency = (n: number) =>
    `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ambagan Ledger</Text>
        <Text style={styles.headerSub}>Shared group expenses</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.list}
      >
        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No group expenses yet</Text>
            <Text style={styles.emptyText}>Tap + to create a shared expense with friends</Text>
          </View>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => router.push({ pathname: '/group-detail' as any, params: { id: group.id } })}
            >
              <View style={styles.groupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Text style={styles.groupDate}>
                    {format(new Date(group.expense_date), 'MMM d, yyyy')} · {group.category}
                  </Text>
                </View>
                <Text style={styles.groupAmount}>{formatCurrency(group.total_amount)}</Text>
              </View>
              <View style={styles.groupFooter}>
                <Text style={styles.groupSub}>Equal split</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: group.status === 'settled'
                    ? Colors.success + '20' : Colors.warning + '20',
                }]}>
                  <Text style={[styles.statusText, {
                    color: group.status === 'settled' ? Colors.success : Colors.warning,
                  }]}>
                    {group.status === 'settled' ? 'Settled' : 'Active'}
                  </Text>
                </View>
              </View>
              <View style={styles.tapHint}>
                <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
                <Text style={styles.tapHintText}>Tap to view participants</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Create Group Expense</Text>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dinner at Jollibee"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Total Amount (₱)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="decimal-pad"
              />

              <DateInput label="Expense Date" value={expenseDate} onChange={setExpenseDate} />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Food, Transport, etc."
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.inputLabel}>Member Emails</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="email1@example.com, email2@example.com"
                value={memberEmails}
                onChangeText={setMemberEmails}
                multiline
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text style={styles.inputNote}>
                Members must have a MySalapi account. The total will be split equally among all members including you.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: Colors.ambaganLedger }]}
                  onPress={createGroup}
                >
                  <Text style={styles.saveBtnText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.ambaganLedger, padding: 24, paddingTop: 56 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  list: { flex: 1, padding: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 20 },
  groupCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16,
    marginBottom: 10, elevation: 1,
  },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  groupDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  groupAmount: { fontSize: 16, fontWeight: '800', color: Colors.ambaganLedger },
  groupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupSub: { fontSize: 12, color: Colors.textLight },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapHintText: { fontSize: 11, color: Colors.textLight },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: Colors.ambaganLedger, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, marginBottom: 12, color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputNote: { fontSize: 12, color: Colors.textLight, marginBottom: 16, lineHeight: 18 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
