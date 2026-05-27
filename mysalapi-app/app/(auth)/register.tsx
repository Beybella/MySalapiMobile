import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      // Email confirmation disabled — logged in immediately
      router.replace('/(tabs)');
    } else {
      // Email confirmation enabled — verification email sent
      Alert.alert(
        '✉️ Check Your Email',
        `A verification link was sent to:\n\n${email}\n\nClick the link in the email to activate your account, then come back and log in.`,
        [{ text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>MySalapi</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Get started</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Juan dela Cruz" />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input} value={phone} onChangeText={setPhone}
            placeholder="09XXXXXXXXX" keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input} value={password} onChangeText={setPassword}
            placeholder="Min. 6 characters" secureTextEntry
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logo: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: Colors.accentLight, marginTop: 6 },
  form: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 28, paddingTop: 36,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16, color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
