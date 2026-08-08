import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import AppModal from '../../components/AppModal';
import { sendPasswordReset } from '../../lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  const [showResentModal, setShowResentModal] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotSentModal, setShowForgotSentModal] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setShowUnverifiedModal(true);
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } else {
      router.replace('/(auth)/pin');
    }
  };

  const handleResendEmail = async () => {
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    setShowUnverifiedModal(false);
    if (resendError) { Alert.alert('Error', resendError.message); }
    else { setShowResentModal(true); }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first, then tap Forgot Password.');
      return;
    }
    setForgotLoading(true);
    const result = await sendPasswordReset({ email });
    setForgotLoading(false);
    if (!result.success) {
      if (result.error?.includes('No account found') || result.error?.includes('not found')) {
        Alert.alert('Not Found', 'No MySalapi account exists with that email address.');
      } else if (result.error?.includes('timed out') || result.error?.includes('server')) {
        Alert.alert('Server Offline', 'Could not reach the server. Make sure the Laravel server is running on your PC.');
      } else {
        Alert.alert('Error', result.error ?? 'Could not send reset email.');
      }
      return;
    }
    setShowForgotSentModal(true);
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/MySalapiLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
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
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotContainer} disabled={forgotLoading}>
              <Text style={styles.forgotText}>{forgotLoading ? 'Sending...' : 'Forgot Password?'}</Text>
            </TouchableOpacity>

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
      </TouchableWithoutFeedback>

      <AppModal visible={showUnverifiedModal} onClose={() => setShowUnverifiedModal(false)}
        icon="mail-unread-outline" iconColor={colors.warning} title="Email Not Verified"
        message="Your email address hasn't been verified yet. Want us to resend the verification email?"
        buttons={[
          { label: 'Cancel', variant: 'secondary', onPress: () => setShowUnverifiedModal(false) },
          { label: 'Resend Email', onPress: handleResendEmail },
        ]}
      />
      <AppModal visible={showResentModal} onClose={() => setShowResentModal(false)}
        icon="checkmark-circle" title="Verification Sent!"
        message="A new verification link was sent to your inbox." highlight={email}
        buttons={[{ label: 'Got It', onPress: () => setShowResentModal(false) }]}
      />
      <AppModal visible={showForgotSentModal} onClose={() => setShowForgotSentModal(false)}
        icon="lock-open-outline" title="Reset Link Sent!"
        message="Check your inbox for a password reset link." highlight={email}
        buttons={[{ label: 'Got It', onPress: () => setShowForgotSentModal(false) }]}
      />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primary },
    scroll: { flexGrow: 1, paddingBottom: 20 },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
    logo: { width: 160, height: 160, marginBottom: 0 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 0, letterSpacing: 0.3 },
    form: {
      flex: 1, backgroundColor: colors.background,
      borderTopLeftRadius: 36, borderTopRightRadius: 36,
      padding: 28, paddingTop: 32, minHeight: 500,
    },
    title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 22 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14, color: colors.textPrimary,
    },
    passwordContainer: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 12, marginBottom: 8,
    },
    passwordInput: { flex: 1, padding: 14, fontSize: 15, color: colors.textPrimary },
    eyeButton: { padding: 14 },
    forgotContainer: { alignItems: 'flex-end', marginBottom: 10 },
    forgotText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
    button: {
      backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: colors.textSecondary, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  });
