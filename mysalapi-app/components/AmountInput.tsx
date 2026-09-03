/**
 * Enhanced Amount Input Component
 * Shows formatted preview, hints, and validation
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AmountInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
}

export default function AmountInput({
  label,
  value,
  onChangeText,
  placeholder = '0.00',
  min,
  max,
  hint,
  error,
  touched,
  disabled,
}: AmountInputProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const numValue = parseFloat(value);
  const hasValue = value && !isNaN(numValue);
  const formatted = hasValue ? `₱${numValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';

  // Validation states
  const showError = touched && error;
  const showMaxWarning = hasValue && max && numValue > max;
  const showMinWarning = hasValue && min && numValue < min;

  // Only allow valid decimal input
  const handleChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Only allow one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) return;
    
    onChangeText(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={[
        styles.inputWrapper,
        showError && styles.inputWrapperError,
        disabled && styles.inputWrapperDisabled,
      ]}>
        <Text style={styles.currencySymbol}>₱</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          keyboardType="decimal-pad"
          editable={!disabled}
        />
      </View>

      {hasValue && formatted && (
        <Text style={styles.formatted}>{formatted}</Text>
      )}

      {hint && !showError && (
        <Text style={styles.hint}>{hint}</Text>
      )}

      {showError && (
        <Text style={styles.error}>{error}</Text>
      )}

      {showMaxWarning && !showError && (
        <Text style={styles.warning}>
          Exceeds maximum of ₱{max!.toLocaleString()}
        </Text>
      )}

      {showMinWarning && !showError && (
        <Text style={styles.warning}>
          Below minimum of ₱{min!.toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  inputWrapperDisabled: {
    opacity: 0.6,
    backgroundColor: colors.borderLight,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  formatted: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    fontWeight: '500',
  },
  warning: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 6,
    fontWeight: '500',
  },
});
