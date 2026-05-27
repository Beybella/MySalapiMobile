import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email Not Verified',
          'Your email address has not been verified yet.\n\nWould you like us to resend the verification email?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Resend Email',
              onPress: async () => {
                const { error: resendError } = await supabase.auth.resend({
                  type: 'signup',
                  email,
                });
                if (resendError) {
                  Alert.alert('Error', resendError.message);
                } else {
                  Alert.alert('Sent!', `Verification email resent to ${email}`);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>MySalapi</Text>
          <Text style={styles.tagline}>Your personal finance tracker</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign up</Text>
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
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
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
