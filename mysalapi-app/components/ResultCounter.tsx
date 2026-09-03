import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ResultCounterProps {
  filteredCount: number;
  totalCount: number;
  itemLabel?: string;
}

export default function ResultCounter({
  filteredCount,
  totalCount,
  itemLabel = 'items',
}: ResultCounterProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const isFiltered = filteredCount !== totalCount;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="documents" size={14} color={colors.primary} />
      </View>
      <Text style={styles.text}>
        Showing <Text style={styles.highlight}>{filteredCount}</Text>
        {isFiltered && (
          <>
            {' '}
            of <Text style={styles.total}>{totalCount}</Text>
          </>
        )}{' '}
        {itemLabel}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    highlight: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    total: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
