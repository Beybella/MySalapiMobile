import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { setPendingRecordsNav } from '../../lib/navigationStore';
import { formatCurrency } from '../../constants/recordConstants';

interface Props {
  selectedDate: string | null;
  duesOnDate: { bills: any[]; loans: any[] };
  onClose: () => void;
}

export default function DuesModal({ selectedDate, duesOnDate, onClose }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = makeStyles(colors);
  const [modalTab, setModalTab] = useState<'unsettled' | 'paid'>('unsettled');

  const handleClose = () => {
    setModalTab('unsettled');
    onClose();
  };

  const navigateToBills = () => {
    setPendingRecordsNav({ tab: 'personal', sub: 'bills' });
    router.replace('/(tabs)/records');
    handleClose();
  };

  const navigateToLoans = () => {
    setPendingRecordsNav({ tab: 'pautang', sub: 'owed' });
    router.replace('/(tabs)/records');
    handleClose();
  };

  const filteredBills = duesOnDate.bills.filter((b: any) =>
    modalTab === 'paid' ? b.is_paid : !b.is_paid
  );
  const filteredLoans = duesOnDate.loans.filter((l: any) =>
    modalTab === 'paid' ? l.status === 'paid' : l.status !== 'paid'
  );

  return (
    <Modal
      visible={selectedDate !== null}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {selectedDate ? format(new Date(selectedDate), 'MMM d, yyyy') : ''}
              </Text>
              <Text style={styles.subtitle}>Dues on this date</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['unsettled', 'paid'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, modalTab === t && styles.tabActive]}
                onPress={() => setModalTab(t)}
              >
                <Text style={[styles.tabText, modalTab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View style={styles.scrollContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredBills.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.sectionTitle}>Bills ({filteredBills.length})</Text>
                  </View>
                  {filteredBills.map((bill: any, idx: number) => (
                    <TouchableOpacity key={idx} onPress={navigateToBills} activeOpacity={0.7}>
                      <View style={[styles.item, bill.is_paid && styles.itemPaid]}>
                        <Text style={[styles.itemTitle, bill.is_paid && styles.itemTitlePaid]}>
                          {bill.title}
                        </Text>
                        <Text style={[styles.itemAmount, bill.is_paid && styles.itemAmountPaid]}>
                          {formatCurrency(Number(bill.amount))}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {filteredLoans.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.dot, { backgroundColor: '#FF5252' }]} />
                    <Text style={styles.sectionTitle}>Loans ({filteredLoans.length})</Text>
                  </View>
                  {filteredLoans.map((loan: any, idx: number) => (
                    <TouchableOpacity key={idx} onPress={navigateToLoans} activeOpacity={0.7}>
                      <View style={[styles.item, loan.status === 'paid' && styles.itemPaid]}>
                        <Text style={[styles.itemTitle, loan.status === 'paid' && styles.itemTitlePaid]}>
                          {loan.borrower?.full_name || loan.lender?.full_name || 'Loan'}
                        </Text>
                        <Text style={[styles.itemAmount, loan.status === 'paid' && styles.itemAmountPaid]}>
                          {formatCurrency(Number(loan.amount_remaining))}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {filteredBills.length === 0 && filteredLoans.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
                  <Text style={styles.emptyText}>
                    No {modalTab === 'paid' ? 'paid' : 'unsettled'} dues on this date
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  closeBtn: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#ffffff' },
  scrollContainer: { padding: 20, height: 300 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemPaid: { backgroundColor: '#f0f0f0' },
  itemTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', flex: 1, marginRight: 12 },
  itemTitlePaid: { textDecorationLine: 'line-through', color: '#999' },
  itemAmount: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  itemAmountPaid: { textDecorationLine: 'line-through', color: '#999' },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
