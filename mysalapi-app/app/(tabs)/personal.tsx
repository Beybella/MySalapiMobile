import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { format } from 'date-fns';
import DateInput from '../../components/DateInput';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Others'];

export default function PersonalScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'bills'>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');

  // Bill form
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billReminderDays, setBillReminderDays] = useState('3');

  const loadData = async () => {
    if (!user) return;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data: exp } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('expense_date', startOfMonth)
      .order('expense_date', { ascending: false });

    const { data: b } = await supabase
      .from('bill_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    setExpenses(exp || []);
    setBills(b || []);
  };

  useEffect(() => { loadData(); }, [user]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const addExpense = async () => {
    if (!expTitle || !expAmount) { Alert.alert('Error', 'Title and amount are required.'); return; }
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    const { error } = await supabase.from('personal_expenses').insert({
      user_id: user!.id, title: expTitle, amount, category: expCategory,
      expense_date: expDate, description: expDesc,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setShowAddExpense(false);
    setExpTitle(''); setExpAmount(''); setExpCategory('Food'); setExpDesc('');
    loadData();
  };

  const addBill = async () => {
    if (!billTitle || !billAmount || !billDueDate) { Alert.alert('Error', 'All fields are required.'); return; }
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    const { error } = await supabase.from('bill_reminders').insert({
      user_id: user!.id, title: billTitle, amount,
      due_date: billDueDate, reminder_days_before: parseInt(billReminderDays) || 3,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setShowAddBill(false);
    setBillTitle(''); setBillAmount(''); setBillDueDate(''); setBillReminderDays('3');
    loadData();
  };

  const markBillPaid = async (id: string) => {
    await supabase.from('bill_reminders').update({ is_paid: true }).eq('id', id);
    loadData();
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const formatCurrency = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Ledger</Text>
        <Text style={styles.headerSub}>This month: {formatCurrency(totalExpenses)}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['expenses', 'bills'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'expenses' ? 'Expenses' : 'Bill Reminders'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {activeTab === 'expenses' ? (
          <View style={styles.list}>
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>No expenses this month yet.</Text>
            ) : (
              expenses.map((exp) => (
                <View key={exp.id} style={styles.item}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.categoryBadge, { backgroundColor: Colors.primary + '20' }]}>
                      <Text style={[styles.categoryText, { color: Colors.primary }]}>{exp.category}</Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemSub}>{format(new Date(exp.expense_date), 'MMM d, yyyy')}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemAmount}>{formatCurrency(Number(exp.amount))}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {bills.length === 0 ? (
              <Text style={styles.emptyText}>No bill reminders set.</Text>
            ) : (
              bills.map((bill) => {
                const isOverdue = !bill.is_paid && new Date(bill.due_date) < new Date();
                const isDueSoon = !bill.is_paid && !isOverdue &&
                  (new Date(bill.due_date).getTime() - Date.now()) < 3 * 86400000;
                return (
                  <View key={bill.id} style={[styles.item, isOverdue && styles.itemOverdue]}>
                    <View style={styles.itemLeft}>
                      <Ionicons
                        name={bill.is_paid ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time-outline'}
                        size={24}
                        color={bill.is_paid ? Colors.success : isOverdue ? Colors.error : isDueSoon ? Colors.warning : Colors.textSecondary}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.itemTitle}>{bill.title}</Text>
                        <Text style={[styles.itemSub, isOverdue && { color: Colors.error }]}>
                          {bill.is_paid ? 'Paid' : `Due: ${format(new Date(bill.due_date), 'MMM d, yyyy')}`}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.itemAmount}>{formatCurrency(Number(bill.amount))}</Text>
                      {!bill.is_paid && (
                        <TouchableOpacity onPress={() => markBillPaid(bill.id)}>
                          <Text style={styles.markPaid}>Mark Paid</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => activeTab === 'expenses' ? setShowAddExpense(true) : setShowAddBill(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAddExpense} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TextInput style={styles.input} placeholder="Title" value={expTitle} onChangeText={setExpTitle} />
            <TextInput style={styles.input} placeholder="Amount (₱)" value={expAmount} onChangeText={setExpAmount} keyboardType="decimal-pad" />
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.catChip, expCategory === cat && styles.catChipActive]} onPress={() => setExpCategory(cat)}>
                  <Text style={[styles.catChipText, expCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <DateInput label="Date" value={expDate} onChange={setExpDate} />
            <TextInput style={styles.input} placeholder="Description (optional)" value={expDesc} onChangeText={setExpDesc} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddExpense(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addExpense}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Bill Modal */}
      <Modal visible={showAddBill} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Bill Reminder</Text>
            <TextInput style={styles.input} placeholder="Bill name" value={billTitle} onChangeText={setBillTitle} />
            <TextInput style={styles.input} placeholder="Amount (₱)" value={billAmount} onChangeText={setBillAmount} keyboardType="decimal-pad" />
            <DateInput label="Due Date" value={billDueDate} onChange={setBillDueDate} />
            <TextInput style={styles.input} placeholder="Remind X days before (default: 3)" value={billReminderDays} onChangeText={setBillReminderDays} keyboardType="number-pad" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddBill(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addBill}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.personalLedger, padding: 24, paddingTop: 56 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSub: { color: Colors.accentLight, fontSize: 14, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.personalLedger },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.personalLedger },
  list: { padding: 12 },
  emptyText: { textAlign: 'center', color: Colors.textLight, padding: 32, fontSize: 14 },
  item: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, elevation: 1,
  },
  itemOverdue: { borderLeftWidth: 3, borderLeftColor: Colors.error },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  markPaid: { fontSize: 11, color: Colors.success, fontWeight: '600', marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: Colors.personalLedger, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, marginBottom: 12, color: Colors.textPrimary,
  },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
  },
  catChipActive: { backgroundColor: Colors.personalLedger, borderColor: Colors.personalLedger },
  catChipText: { fontSize: 13, color: Colors.textSecondary },
  catChipTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.personalLedger, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
