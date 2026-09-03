/**
 * UX Enhancements Test Screen
 * Test all new features before applying to main screens
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import { getFriendlyError } from '../lib/errorMessages';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast, showUndoToast } from '../lib/toast';
import AmountInput from '../components/AmountInput';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export default function TestUXScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const styles = makeStyles(colors);
  
  // Network status
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();
  
  // Test form fields
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  
  // Email validation
  const emailValidation = useEmailValidation(email, true);
  
  // Form validation
  const validation = useFormValidation({
    fields: { email, amount, purpose },
    rules: {
      email: ValidationRules.email,
      amount: ValidationRules.positiveNumber,
      purpose: ValidationRules.required('Purpose'),
    },
  });

  // Test functions
  const testToasts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showSuccessToast('Success!', 'This is a success message');
    
    setTimeout(() => {
      showErrorToast('Error!', 'This is an error message');
    }, 1000);
    
    setTimeout(() => {
      showInfoToast('Info', 'This is an info message');
    }, 2000);
    
    setTimeout(() => {
      showWarningToast('Warning!', 'This is a warning');
    }, 3000);
  };

  const testHaptics = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showInfoToast('Success Haptic', 'You should feel a vibration');
    
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showInfoToast('Error Haptic', 'Different vibration pattern');
    }, 1500);
    
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      showInfoToast('Heavy Impact', 'Strong vibration');
    }, 3000);
  };

  const testErrorMessages = () => {
    const errors = [
      'Failed to fetch',
      'Network request failed',
      'duplicate key value',
      'No MySalapi user found',
      'Invalid login credentials',
      'Some random technical error that user should not see',
    ];
    
    errors.forEach((error, i) => {
      setTimeout(() => {
        const friendly = getFriendlyError(error);
        showErrorToast('Error Test', friendly);
      }, i * 1500);
    });
  };

  const testFormValidation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!validation.validateAll()) {
      validation.markAllTouched();
      showErrorToast('Form Invalid', 'Please check all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    showSuccessToast('Form Valid!', 'All fields are correct');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const testLoadingState = async () => {
    setTestLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showInfoToast('Loading...', 'Simulating 3 second operation');
    
    setTimeout(() => {
      setTestLoading(false);
      showSuccessToast('Done!', 'Operation completed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  const testUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showUndoToast('Item deleted', () => {
      showSuccessToast('Undone!', 'Item restored');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>UX Test Screen</Text>
          <Text style={styles.headerSubtitle}>Test all new features</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* Network Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📡 Network Status</Text>
          <View style={[styles.card, !isOnline && styles.cardError]}>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: isOnline ? colors.success : colors.error }]}>
                {isOnline ? '✓ Online' : '✗ Offline'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Connection:</Text>
              <Text style={styles.value}>{connectionType || 'Unknown'}</Text>
            </View>
            {isSlowConnection && (
              <Text style={styles.warning}>⚠️ Slow connection detected</Text>
            )}
          </View>
          <Text style={styles.hint}>Turn off WiFi to see offline banner at top</Text>
        </View>

        {/* Toast Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Toast Notifications</Text>
          <TouchableOpacity style={styles.testBtn} onPress={testToasts}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.testBtnText}>Test All Toasts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testBtn} onPress={testUndo}>
            <Ionicons name="arrow-undo-outline" size={20} color="#fff" />
            <Text style={styles.testBtnText}>Test Undo Toast</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Watch the top of your screen for messages</Text>
        </View>

        {/* Haptic Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📳 Haptic Feedback</Text>
          <TouchableOpacity style={styles.testBtn} onPress={testHaptics}>
            <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
            <Text style={styles.testBtnText}>Test Haptics</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>You should feel different vibrations (device only)</Text>
        </View>

        {/* Error Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Error Messages</Text>
          <TouchableOpacity style={styles.testBtn} onPress={testErrorMessages}>
            <Ionicons name="alert-circle-outline" size={20} color="#fff" />
            <Text style={styles.testBtnText}>Test Error Translation</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Technical errors → Friendly messages</Text>
        </View>

        {/* Email Validation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✉️ Email Validation</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              emailValidation.status === 'valid' && styles.inputValid,
              emailValidation.status === 'invalid' && styles.inputInvalid,
            ]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  validation.markTouched('email');
                  validation.validate('email', text);
                }}
                placeholder="Enter any email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailValidation.status === 'checking' && (
                <Text style={styles.statusText}>⏳</Text>
              )}
              {emailValidation.status === 'valid' && (
                <Text style={styles.statusText}>✓</Text>
              )}
              {emailValidation.status === 'invalid' && (
                <Text style={styles.statusText}>✗</Text>
              )}
            </View>
            {emailValidation.message && (
              <Text style={[
                styles.validationMsg,
                { color: emailValidation.status === 'valid' ? colors.success : colors.error }
              ]}>
                {emailValidation.message}
              </Text>
            )}
          </View>
          <Text style={styles.hint}>Try: your email, invalid format, non-existent email</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Amount Input</Text>
          <View style={styles.card}>
            <AmountInput
              label="Test Amount"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                validation.markTouched('amount');
                validation.validate('amount', text);
              }}
              min={100}
              max={10000}
              hint="Min: ₱100, Max: ₱10,000"
              error={validation.errors.amount}
              touched={validation.touched.amount}
            />
          </View>
          <Text style={styles.hint}>Watch the formatted preview and validation</Text>
        </View>

        {/* Form Validation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Form Validation</Text>
          <View style={styles.card}>
            {/* Email already tested above */}
            
            {/* Purpose */}
            <Text style={styles.inputLabel}>Purpose (Required)</Text>
            <TextInput
              style={[
                styles.inputField,
                validation.touched.purpose && validation.errors.purpose && styles.inputFieldError
              ]}
              value={purpose}
              onChangeText={(text) => {
                setPurpose(text);
                validation.markTouched('purpose');
                validation.validate('purpose', text);
              }}
              placeholder="Enter purpose"
              placeholderTextColor={colors.textLight}
            />
            {validation.touched.purpose && validation.errors.purpose && (
              <Text style={styles.error}>{validation.errors.purpose}</Text>
            )}

            <TouchableOpacity 
              style={[styles.testBtn, { marginTop: 16 }]} 
              onPress={testFormValidation}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.testBtnText}>Validate Form</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Fill all fields correctly then validate</Text>
        </View>

        {/* Loading State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Loading State</Text>
          <TouchableOpacity 
            style={[styles.testBtn, testLoading && styles.testBtnDisabled]} 
            onPress={testLoadingState}
            disabled={testLoading}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.testBtnText}>
              {testLoading ? 'Loading... (3s)' : 'Test Loading'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Button disables during operation</Text>
        </View>

        {/* Avatar Picker Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Avatar Picker (NEW!)</Text>
          <TouchableOpacity 
            style={[styles.testBtn, { backgroundColor: '#FF2D55' }]}
            onPress={() => router.push('/avatar-test')}
          >
            <Ionicons name="person-circle-outline" size={20} color="#fff" />
            <Text style={styles.testBtnText}>Test Avatar Picker →</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Beautiful animated avatar selection component</Text>
        </View>

        {/* Summary */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>✅ Test Checklist</Text>
          <View style={styles.card}>
            <Text style={styles.checkItem}>☐ Toast notifications appear</Text>
            <Text style={styles.checkItem}>☐ Haptic feedback works (device)</Text>
            <Text style={styles.checkItem}>☐ Offline banner shows (turn off WiFi)</Text>
            <Text style={styles.checkItem}>☐ Email validation works</Text>
            <Text style={styles.checkItem}>☐ Amount input formats correctly</Text>
            <Text style={styles.checkItem}>☐ Form validation shows errors</Text>
            <Text style={styles.checkItem}>☐ Loading state disables button</Text>
            <Text style={styles.checkItem}>☐ Error messages are friendly</Text>
            <Text style={styles.checkItem}>☐ Avatar Picker works (NEW!)</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight || colors.border,
  },
  cardError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  warning: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 8,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  testBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  testBtnDisabled: {
    opacity: 0.5,
  },
  testBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  inputLabel: {
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
    marginBottom: 8,
  },
  inputValid: {
    borderColor: colors.success,
  },
  inputInvalid: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 18,
    marginLeft: 8,
  },
  validationMsg: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  inputFieldError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 8,
    fontWeight: '500',
  },
  checkItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});
