import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  type?: 'no-data' | 'no-results';
}

export default function EmptyState({
  icon,
  title,
  message,
  type = 'no-data',
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const defaultIcon = type === 'no-results' ? 'search-outline' : 'document-text-outline';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={(icon || defaultIcon) as any}
          size={48}
          color={colors.textLight}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 60,
    },
    iconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
