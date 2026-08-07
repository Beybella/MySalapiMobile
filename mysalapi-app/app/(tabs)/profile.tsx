import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AppModal from '../../components/AppModal';
import DraggableModal from '../../components/DraggableModal';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmptyNameModal, setShowEmptyNameModal] = useState(false);
  const [showSaveErrorModal, setShowSaveErrorModal] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  

  // Notification preferences
  const [billReminders, setBillReminders] = useState(true);
  const [loanReminders, setLoanReminders] = useState(true);
  const [groupReminders, setGroupReminders] = useState(true);

  // ── Security — Change PIN ─────────────────────────────────────────────
  const PIN_KEY = `mysalapi_pin_${user?.id}`;
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'verify' | 'new' | 'confirm'>('verify');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const openChangePinModal = () => {
    setPinStep('verify');
    setCurrentPinInput(''); setNewPinInput(''); setConfirmPinInput(''); setPinError('');
    setShowChangePinModal(true);
  };

  const handlePinStepSubmit = async () => {
    setPinError('');
    if (pinStep === 'verify') {
      const saved = await SecureStore.getItemAsync(PIN_KEY);
      if (!saved) {
        setPinStep('new');
        return;
      }
      if (currentPinInput.length !== 6) { setPinError('PIN must be exactly 6 digits.'); return; }
      if (currentPinInput !== saved) {
        setPinError('Incorrect current PIN.'); return;
      }
      setPinStep('new');
    } else if (pinStep === 'new') {
      if (newPinInput.length !== 6) { setPinError('PIN must be exactly 6 digits.'); return; }
      setPinStep('confirm');
    } else {
      if (confirmPinInput.length !== 6) { setPinError('PIN must be exactly 6 digits.'); return; }
      if (confirmPinInput !== newPinInput) { setPinError('PINs do not match.'); return; }
      await SecureStore.setItemAsync(PIN_KEY, newPinInput);
      setShowChangePinModal(false);
      setShowPinSuccessModal(true);
    }
  };
  const [showPinSuccessModal, setShowPinSuccessModal] = useState(false);

  // ── Security — Change Password ────────────────────────────────────────
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false);

  const openChangePasswordModal = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError('');
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.'); return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.'); return;
    }
    setPasswordLoading(true);
    // Verify current password first
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user!.email!, password: currentPassword,
    });
    if (verifyError) {
      setPasswordLoading(false);
      setPasswordError('Current password is incorrect.'); return;
    }
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (updateError) {
      setPasswordError(updateError.message); return;
    }
    setShowChangePasswordModal(false);
    setShowPasswordSuccessModal(true);
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
    }
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      setShowEmptyNameModal(true);
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user!.id);
    setLoading(false);
    if (error) {
      setSaveErrorMsg(error.message);
      setShowSaveErrorModal(true);
    } else {
      setEditing(false);
      loadProfile();
      setShowSavedModal(true);
    }
  };
const handleSignOut = () => {
    Alert.alert(
      'Sign Out', 
      'Are you sure you want to sign out?', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const styles = makeStyles(colors);

  const stats = [
    { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).getFullYear().toString() : '—' },
    { label: 'Email', value: user?.email || '—' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        {!editing ? (
          <>
            <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.textLight}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                onPress={saveProfile}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        {stats.map((s) => (
          <View key={s.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{s.label}</Text>
            <Text style={styles.infoValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.prefLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={isDark ? colors.primary : colors.textLight}
          />
        </View>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Notifications</Text>
        {[
          { label: 'Bill Reminders', value: billReminders, setter: setBillReminders },
          { label: 'Loan Collection (Singil)', value: loanReminders, setter: setLoanReminders },
          { label: 'Group Expense Reminders', value: groupReminders, setter: setGroupReminders },
        ].map((pref) => (
          <View key={pref.label} style={styles.prefRow}>
            <Text style={styles.prefLabel}>{pref.label}</Text>
            <Switch
              value={pref.value}
              onValueChange={pref.setter}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={pref.value ? colors.primary : colors.textLight}
            />
          </View>
        ))}
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.securityRow} onPress={openChangePinModal}>
          <View style={styles.securityLeft}>
            <View style={[styles.securityIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="keypad-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.securityLabel}>Change PIN</Text>
              <Text style={styles.securitySub}>Update your 6-digit app lock PIN</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.securityRow} onPress={openChangePasswordModal}>
          <View style={styles.securityLeft}>
            <View style={[styles.securityIcon, { backgroundColor: colors.pautangLedger + '15' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.pautangLedger} />
            </View>
            <View>
              <Text style={styles.securityLabel}>Change Password</Text>
              <Text style={styles.securitySub}>Update your account password</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About MySalapi</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>MySalapi v1.0.0</Text>
          <Text style={styles.aboutText}>
            A Tri-Ledger Mobile Application Financial Tracker with Integrated Email
            Notification APIs for Automated Debt Collection.
          </Text>
          <Text style={styles.aboutText}>
            Built for Filipino users managing personal expenses, peer-to-peer loans
            (pautang), shared group expenses (ambagan), and smart budget planning.
          </Text>
          <Text style={styles.aboutSub}>
            Technological University of the Philippines · 2026
          </Text>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* ── Change PIN Modal ── */}
      <DraggableModal visible={showChangePinModal} onClose={() => setShowChangePinModal(false)}>
        <Text style={styles.modalTitle}>
          {pinStep === 'verify' ? 'Verify Current PIN' : pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN'}
        </Text>
        <Text style={styles.modalSub}>
          {pinStep === 'verify' ? 'Enter your current 6-digit PIN to continue.' : pinStep === 'new' ? 'Choose a new 6-digit PIN.' : 'Re-enter your new PIN to confirm.'}
        </Text>

        {/* 6-dot indicator */}
        <View style={styles.pinDots}>
          {[0,1,2,3,4,5].map((i) => {
            const val = pinStep === 'verify' ? currentPinInput : pinStep === 'new' ? newPinInput : confirmPinInput;
            return (
              <View key={i} style={[styles.pinDot, i < val.length && styles.pinDotFilled]} />
            );
          })}
        </View>
        <Text style={styles.pinHint}>6 digits required</Text>

        {pinStep === 'verify' && (
          <TextInput
            style={styles.secInput} placeholder="Enter 6-digit PIN"
            placeholderTextColor={colors.textLight}
            value={currentPinInput} onChangeText={setCurrentPinInput}
            keyboardType="number-pad" secureTextEntry maxLength={6}
            autoFocus
          />
        )}
        {pinStep === 'new' && (
          <TextInput
            style={styles.secInput} placeholder="Enter 6-digit PIN"
            placeholderTextColor={colors.textLight}
            value={newPinInput} onChangeText={setNewPinInput}
            keyboardType="number-pad" secureTextEntry maxLength={6}
            autoFocus
          />
        )}
        {pinStep === 'confirm' && (
          <TextInput
            style={styles.secInput} placeholder="Re-enter 6-digit PIN"
            placeholderTextColor={colors.textLight}
            value={confirmPinInput} onChangeText={setConfirmPinInput}
            keyboardType="number-pad" secureTextEntry maxLength={6}
            autoFocus
          />
        )}
        {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
        <TouchableOpacity style={styles.secBtn} onPress={handlePinStepSubmit}>
          <Text style={styles.secBtnText}>{pinStep === 'confirm' ? 'Save PIN' : 'Continue'}</Text>
        </TouchableOpacity>
        {pinStep !== 'verify' && (
          <TouchableOpacity onPress={() => { setPinStep('verify'); setPinError(''); }} style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Back</Text>
          </TouchableOpacity>
        )}
      </DraggableModal>

      {/* ── Change Password Modal ── */}
      <DraggableModal visible={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)}>
        <Text style={styles.modalTitle}>Change Password</Text>
        <Text style={styles.modalSub}>Verify your current password before setting a new one.</Text>
        <Text style={styles.secFieldLabel}>Current Password</Text>
        <TextInput
          style={styles.secInput} placeholder="Enter current password" placeholderTextColor={colors.textLight}
          value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry
        />
        <Text style={styles.secFieldLabel}>New Password</Text>
        <TextInput
          style={styles.secInput} placeholder="Min. 8 characters" placeholderTextColor={colors.textLight}
          value={newPassword} onChangeText={setNewPassword} secureTextEntry
        />
        <Text style={styles.secFieldLabel}>Confirm New Password</Text>
        <TextInput
          style={styles.secInput} placeholder="Re-enter new password" placeholderTextColor={colors.textLight}
          value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        <TouchableOpacity style={[styles.secBtn, passwordLoading && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={passwordLoading}>
          <Text style={styles.secBtnText}>{passwordLoading ? 'Updating...' : 'Update Password'}</Text>
        </TouchableOpacity>
      </DraggableModal>

      <AppModal
        visible={showPinSuccessModal}
        onClose={() => setShowPinSuccessModal(false)}
        icon="checkmark-circle"
        title="PIN Updated!"
        message="Your new PIN has been saved successfully."
        buttons={[{ label: 'Great', onPress: () => setShowPinSuccessModal(false) }]}
      />

      <AppModal
        visible={showPasswordSuccessModal}
        onClose={() => setShowPasswordSuccessModal(false)}
        icon="checkmark-circle"
        title="Password Updated!"
        message="Your account password has been changed successfully."
        buttons={[{ label: 'Great', onPress: () => setShowPasswordSuccessModal(false) }]}
      />

      <AppModal
        visible={showEmptyNameModal}
        onClose={() => setShowEmptyNameModal(false)}
        icon="alert-circle"
        iconColor={colors.warning}
        title="Full Name Required"
        message="Please enter your full name before saving."
        buttons={[{ label: 'Got It', onPress: () => setShowEmptyNameModal(false) }]}
      />

      <AppModal
        visible={showSaveErrorModal}
        onClose={() => setShowSaveErrorModal(false)}
        icon="close-circle"
        iconColor={colors.error}
        title="Save Failed"
        message={saveErrorMsg}
        buttons={[{ label: 'Try Again', onPress: () => setShowSaveErrorModal(false) }]}
      />

      <AppModal
        visible={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        icon="checkmark-circle"
        title="Profile Saved!"
        message="Your profile has been updated successfully."
        buttons={[{ label: 'Great', onPress: () => setShowSavedModal(false) }]}
      />
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: 32,
      paddingHorizontal: 24,
    },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.25)',
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
    name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
    email: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 20,
    },
    editBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    editForm: { width: '100%', marginTop: 8 },
    input: {
      backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12,
      fontSize: 14, marginBottom: 10, color: '#fff',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    editActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
      flex: 1, padding: 12, borderRadius: 10,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center',
    },
    cancelBtnText: { color: '#fff', fontWeight: '600' },
    saveBtn: {
      flex: 1, padding: 12, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    section: { marginHorizontal: 16, marginBottom: 4, marginTop: 20 },
    sectionTitle: {
      fontSize: 11, fontWeight: '700', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
    },
    infoRow: {
      backgroundColor: colors.surface, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'center',
      padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1,
    },
    infoLabel: { fontSize: 14, color: colors.textSecondary },
    infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    prefRow: {
      backgroundColor: colors.surface, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'center',
      padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1,
    },
    prefLeft: { flexDirection: 'row', alignItems: 'center' },
    prefLabel: { fontSize: 14, color: colors.textPrimary },
    aboutCard: {
      backgroundColor: colors.surface, borderRadius: 12,
      padding: 16, elevation: 1,
    },
    aboutTitle: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 8 },
    aboutText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 6 },
    aboutSub: { fontSize: 12, color: colors.textLight, marginTop: 4 },
    signOutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, margin: 16, marginTop: 20, padding: 16,
      backgroundColor: colors.error + '15', borderRadius: 12,
      borderWidth: 1, borderColor: colors.error + '30',
    },
    signOutText: { fontSize: 15, color: colors.error, fontWeight: '700' },
    // Security section
    securityRow: {
      backgroundColor: colors.surface, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'center',
      padding: 16, borderRadius: 12, marginBottom: 8,
      borderWidth: 1, borderColor: colors.borderLight,
    },
    securityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    securityIcon: {
      width: 36, height: 36, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    securityLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    securitySub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    // Security modals
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
    modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },
    secFieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
    secInput: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 15, color: colors.textPrimary,
      backgroundColor: colors.background, marginBottom: 16,
    },
    secBtn: {
      backgroundColor: colors.primary, borderRadius: 12,
      padding: 15, alignItems: 'center', marginTop: 4,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
    },
    secBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    errorText: { color: colors.error, fontSize: 13, marginTop: -8, marginBottom: 12, fontWeight: '500' },
    // PIN dots
    pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
    pinDot: {
      width: 16, height: 16, borderRadius: 8,
      borderWidth: 2, borderColor: colors.primary,
      backgroundColor: 'transparent',
    },
    pinDotFilled: { backgroundColor: colors.primary },
    pinHint: { textAlign: 'center', fontSize: 12, color: colors.textLight, marginBottom: 20, fontWeight: '500' },
  });
