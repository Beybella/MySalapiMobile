import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import AppModal from '../../components/AppModal';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const router = useRouter();
  const { colors } = useTheme();

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters.';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter.';
    return null;
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms & Conditions', 'Please agree to the Terms and Conditions to continue.');
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
      setRegisteredEmail(email);
      setShowEmailModal(true);
    }
  };

  const showTerms = () => {
    Alert.alert(
      'Terms and Conditions',
      'MySalapi is a personal financial management application.\n\n' +
      '1. This app is for personal use only.\n\n' +
      '2. All data entry is manual and purely the responsibility of the user.\n\n' +
      '3. MySalapi is not liable for any financial decisions made based on the data entered.\n\n' +
      '4. The app does not provide financial advice.\n\n' +
      '5. Scope and delimitations: MySalapi tracks personal expenses, loans (Pautang), and group shared expenses (Ambagan) only.\n\n' +
      'By using this app, you agree to these terms.',
      [{ text: 'Close' }]
    );
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
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 chars, 1 Uppercaseletter, 1 number"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {password && confirmPassword && password !== confirmPassword && (
            <Text style={styles.errorText}>⚠️ Passwords do not match!</Text>
          )}

          <View style={styles.termsContainer}>
            <TouchableOpacity
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              style={styles.checkbox}
            >
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={24}
                color={agreedToTerms ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>I agree to the </Text>
              <TouchableOpacity onPress={showTerms}>
                <Text style={styles.termsLink}>Terms and Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>

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

      <AppModal
        visible={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        icon="mail-outline"
        title="Check Your Email"
        message={`A verification link was sent to your inbox. Click the link to activate your account, then come back and log in.`}
        highlight={registeredEmail}
        buttons={[
          {
            label: 'Go to Login',
            onPress: () => {
              setShowEmailModal(false);
              router.replace('/(auth)/login');
            },
          },
        ]}
      />
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
    passwordContainer: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 12, marginBottom: 14,
    },
    passwordInput: { flex: 1, padding: 14, fontSize: 15, color: colors.textPrimary },
    eyeButton: { padding: 14 },
    errorText: { color: 'red', fontSize: 12, marginBottom: 10, marginTop: -8 },
    termsContainer: {
      flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4,
    },
    checkbox: { marginRight: 8 },
    termsTextContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
    termsText: { color: colors.textSecondary, fontSize: 13 },
    termsLink: { color: colors.primary, fontSize: 13, fontWeight: '700' },
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