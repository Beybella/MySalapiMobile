import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../constants/recordConstants';

interface Props {
  totalExpenses: number;
  totalLoansGiven: number;
  totalLoansOwed: number;
  upcomingBillsCount: number;
}

export default function StatsCard({ totalExpenses, totalLoansGiven, totalLoansOwed, upcomingBillsCount }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>Monthly Overview</Text>
        <Text style={styles.statsAmount}>{formatCurrency(totalExpenses)}</Text>
      </View>
      <View style={styles.statsDivider} />
      <View style={styles.statsRow}>
        <View style={styles.statsItem}>
          <Text style={styles.statsItemValue} numberOfLines={1}>{formatCurrency(totalLoansGiven)}</Text>
          <Text style={styles.statsItemLabel}>To Collect</Text>
        </View>
        <View style={styles.statsSep} />
        <View style={styles.statsItem}>
          <Text style={[styles.statsItemValue, { color: colors.error }]} numberOfLines={1}>
            {formatCurrency(totalLoansOwed)}
          </Text>
          <Text style={styles.statsItemLabel}>I Owe</Text>
        </View>
        <View style={styles.statsSep} />
        <View style={styles.statsItem}>
          <Text style={styles.statsItemValue}>{upcomingBillsCount}</Text>
          <Text style={styles.statsItemLabel}>Bills Due</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  statsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  statsHeader: { marginBottom: 20 },
  statsTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  statsDivider: {
    height: 1.5,
    backgroundColor: colors.border,
    marginBottom: 20,
    opacity: 0.5,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsItem: { flex: 1, alignItems: 'center' },
  statsItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  statsItemLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsSep: {
    width: 1.5,
    height: 36,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
});
