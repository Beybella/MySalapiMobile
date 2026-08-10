import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { setPendingRecordsNav } from '../../lib/navigationStore';
import AppModal from '../AppModal';
import { formatCurrency } from '../../constants/recordConstants';

interface Props {
  bills: any[];        // upcoming (due today → 7 days ahead)
  overdueBills: any[]; // overdue (past due date, unpaid)
}

export default function UpcomingBills({ bills, overdueBills }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = makeStyles(colors);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillAlert, setShowBillAlert] = useState(false);

  const navigateToBills = () => {
    setPendingRecordsNav({ tab: 'personal', sub: 'bills' });
    router.replace('/(tabs)/records');
  };

  const handleBillPress = (bill: any, isOverdue: boolean) => {
    setSelectedBill({ ...bill, isOverdue });
    setShowBillAlert(true);
  };

  const handleRecordPayment = () => {
    setShowBillAlert(false);
    setPendingRecordsNav({ tab: 'personal', sub: 'bills' });
    router.replace('/(tabs)/records');
  };

  const hasAny = bills.length > 0 || overdueBills.length > 0;

  const renderBillCard = (bill: any, isOverdue: boolean) => {
    const billDate = new Date(bill.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    billDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.floor((billDate.getTime() - today.getTime()) / 86400000);
    const isToday = daysLeft === 0;

    return (
      <TouchableOpacity
        key={bill.id}
        style={[styles.billItem, isOverdue && styles.billItemOverdue]}
        onPress={() => handleBillPress(bill, isOverdue)}
        activeOpacity={0.75}
      >
        <View style={[styles.billDot, {
          backgroundColor: isOverdue ? colors.error : daysLeft <= 1 ? colors.warning : colors.primary,
        }]} />
        <View style={styles.billInfo}>
          <Text style={styles.billName}>{bill.title}</Text>
          <Text style={[styles.billDate, isOverdue && { color: colors.error }]}>
            {format(new Date(bill.due_date), 'MMM d, yyyy')}
            {isOverdue ? ' · Overdue' : isToday ? ' · Today' : ` · ${daysLeft}d left`}
          </Text>
        </View>
        <Text style={[styles.billAmount, isOverdue && { color: colors.error }]}>
          {formatCurrency(Number(bill.amount))}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bills</Text>
        <TouchableOpacity onPress={navigateToBills}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {!hasAny ? (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
          <Text style={styles.emptyText}>No bills due or overdue</Text>
        </View>
      ) : (
        <>
          {/* Overdue section */}
          {overdueBills.length > 0 && (
            <View style={styles.group}>
              <View style={styles.groupLabelRow}>
                <View style={[styles.groupLabelDot, { backgroundColor: colors.error }]} />
                <Text style={[styles.groupLabel, { color: colors.error }]}>
                  Overdue ({overdueBills.length})
                </Text>
              </View>
              {overdueBills.map(bill => renderBillCard(bill, true))}
            </View>
          )}

          {/* Upcoming section */}
          {bills.length > 0 && (
            <View style={styles.group}>
              <View style={styles.groupLabelRow}>
                <View style={[styles.groupLabelDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.groupLabel, { color: colors.primary }]}>
                  Upcoming ({bills.length})
                </Text>
              </View>
              {bills.map(bill => renderBillCard(bill, false))}
            </View>
          )}
        </>
      )}

      {/* Bill Alert Modal */}
      {selectedBill && (
        <AppModal
          visible={showBillAlert}
          onClose={() => setShowBillAlert(false)}
          icon={selectedBill.isOverdue ? 'alert-circle' : 'calendar'}
          iconColor={selectedBill.isOverdue ? colors.error : colors.warning}
          title={selectedBill.isOverdue ? 'Overdue Bill' : 'Upcoming Bill'}
          message={`You have a ${selectedBill.isOverdue ? 'past due' : 'scheduled'} bill payment for ${selectedBill.title}.`}
          highlight={formatCurrency(Number(selectedBill.amount))}
          buttons={[
            {
              label: 'Settle Bill',
              onPress: handleRecordPayment,
              variant: 'primary',
            },
            {
              label: 'Dismiss',
              onPress: () => setShowBillAlert(false),
              variant: 'secondary',
            },
          ]}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  group: { marginBottom: 12 },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupLabelDot: { width: 8, height: 8, borderRadius: 4 },
  groupLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    elevation: 1,
  },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  billItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    elevation: 0,
  },
  billItemOverdue: {
    backgroundColor: colors.error + '12',
  },
  billDot: { width: 8, height: 8, borderRadius: 4 },
  billInfo: { flex: 1 },
  billName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  billDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  billAmount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
