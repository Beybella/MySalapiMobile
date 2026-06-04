import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Notification preferences
  const [billReminders, setBillReminders] = useState(true);
  const [loanReminders, setLoanReminders] = useState(true);
  const [groupReminders, setGroupReminders] = useState(true);

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
      Alert.alert('Error', 'Full name cannot be empty.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user!.id);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEditing(false);
      loadProfile();
      Alert.alert('Saved', 'Profile updated successfully.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
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
  });
