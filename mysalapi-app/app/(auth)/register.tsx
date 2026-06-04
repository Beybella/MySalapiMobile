import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else if (data.session) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Check Your Email',
        `A verification link was sent to:\n\n${email}\n\nClick the link in the email to activate your account, then come back and log in.`,
        [{ text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../assets/MySalapiLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Get started</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input} value={fullName} onChangeText={setFullName}
            placeholder="Juan dela Cruz" placeholderTextColor={colors.textLight}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@email.com" placeholderTextColor={colors.textLight}
            keyboardType="email-address" autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input} value={phone} onChangeText={setPhone}
            placeholder="09XXXXXXXXX" placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input} value={password} onChangeText={setPassword}
            placeholder="Min. 6 characters" placeholderTextColor={colors.textLight}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Log in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primary },
    scroll: { flexGrow: 1 },
    header: { alignItems: 'center', paddingTop: 56, paddingBottom: 28 },
    logo: { width: 170, height: 170, marginBottom: 0 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 0, letterSpacing: 0.3 },
    form: {
      flex: 1, backgroundColor: colors.background,
      borderTopLeftRadius: 36, borderTopRightRadius: 36,
      padding: 28, paddingTop: 32,
    },
    title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 22 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14, color: colors.textPrimary,
    },
    button: {
      backgroundColor: colors.primary, borderRadius: 12,
      padding: 16, alignItems: 'center', marginTop: 10,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: colors.textSecondary, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  });
