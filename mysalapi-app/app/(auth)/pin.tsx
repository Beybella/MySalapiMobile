import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Vibration, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AppModal from '../../components/AppModal';

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30000; // 30 seconds

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'enter' | 'setup' | 'confirm' | 'forgot'>('enter');
  const [tempPin, setTempPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { setPinVerified, user, signOut } = useAuth();
  const PIN_KEY = `mysalapi_pin_${user?.id}`;
  const ATTEMPTS_KEY = `mysalapi_pin_attempts_${user?.id}`;
  const LOCKOUT_KEY = `mysalapi_pin_lockout_${user?.id}`;

  const [showSetModal, setShowSetModal] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showWrongModal, setShowWrongModal] = useState(false);

  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotErrorModal, setShowForgotErrorModal] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  useEffect(() => {
    checkSetup();
    checkLockout();
  }, []);

  useEffect(() => {
    if (lockedUntil) {
      tickRef.current = setInterval(() => {
        const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (secs <= 0) {
          setLockedUntil(null);
          setRemainingSeconds(0);
          if (tickRef.current) clearInterval(tickRef.current);
        } else {
          setRemainingSeconds(secs);
        }
      }, 500);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [lockedUntil]);

  const checkLockout = async () => {
    const stored = await SecureStore.getItemAsync(LOCKOUT_KEY);
    if (stored) {
      const until = parseInt(stored, 10);
      if (until > Date.now()) {
        setLockedUntil(until);
        setRemainingSeconds(Math.ceil((until - Date.now()) / 1000));
      } else {
        await SecureStore.deleteItemAsync(LOCKOUT_KEY);
      }
    }
  };

  const checkSetup = async () => {
    const savedPin = await SecureStore.getItemAsync(PIN_KEY);
    const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
    setHasBiometrics(biometricAvailable);

    if (!savedPin) {
      setMode('setup');
    } else {
      setMode('enter');
      if (biometricAvailable) {
        triggerBiometric();
      }
    }
  };

  const triggerBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Use fingerprint to login',
      disableDeviceFallback: true,
      cancelLabel: 'Use App PIN instead',
    });
    if (result.success) {
      setPinVerified(true);
      router.replace('/(tabs)');
    }
  };

  const handlePress = (digit: string) => {
    if (lockedUntil) return;
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        handlePinComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const registerWrongAttempt = async () => {
    const stored = await SecureStore.getItemAsync(ATTEMPTS_KEY);
    const attempts = (stored ? parseInt(stored, 10) : 0) + 1;

    if (attempts >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_MS;
      await SecureStore.setItemAsync(LOCKOUT_KEY, until.toString());
      await SecureStore.setItemAsync(ATTEMPTS_KEY, '0');
      setLockedUntil(until);
      setRemainingSeconds(Math.ceil(LOCKOUT_MS / 1000));
    } else {
      await SecureStore.setItemAsync(ATTEMPTS_KEY, attempts.toString());
    }
  };

  const handlePinComplete = async (enteredPin: string) => {
    if (mode === 'setup') {
      setTempPin(enteredPin);
      setPin('');
      setMode('confirm');
    } else if (mode === 'confirm') {
      if (enteredPin === tempPin) {
        await SecureStore.setItemAsync(PIN_KEY, enteredPin);
        await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(LOCKOUT_KEY);
        setPinVerified(true);
        setShowSetModal(true);
      } else {
        Vibration.vibrate(500);
        setShowMismatchModal(true);
        setPin('');
        setMode('setup');
        setTempPin('');
      }
    } else {
      const savedPin = await SecureStore.getItemAsync(PIN_KEY);
      if (enteredPin === savedPin) {
        await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
        setPinVerified(true);
        router.replace('/(tabs)');
      } else {
        Vibration.vibrate(500);
        await registerWrongAttempt();
        setShowWrongModal(true);
        setPin('');
      }
    }
  };

  const handleForgotPin = async () => {
    if (!forgotPassword) {
      Alert.alert('Error', 'Please enter your account password.');
      return;
    }
    if (!user?.email) return;

    setForgotLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: forgotPassword,
    });
    setForgotLoading(false);

    if (error) {
      setForgotErrorMsg('Incorrect password. Please try again.');
      setShowForgotErrorModal(true);
      return;
    }

    // Password verified — clear old PIN and lockout state, go to setup
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(LOCKOUT_KEY);
    setLockedUntil(null);
    setForgotPassword('');
    setPin('');
    setTempPin('');
    setMode('setup');
  };

  const styles = makeStyles(colors);

  const getTitle = () => {
    if (mode === 'setup') return 'Set up your PIN';
    if (mode === 'confirm') return 'Confirm your PIN';
    if (mode === 'forgot') return 'Verify your identity';
    return 'Enter your PIN';
  };

  const getSubtitle = () => {
    if (mode === 'setup') return 'Choose a 6-digit PIN';
    if (mode === 'confirm') return 'Re-enter your PIN to confirm';
    if (mode === 'forgot') return 'Enter your account password to reset your PIN';
    return 'Welcome back!';
  };

  // ── Locked out view ──
  if (lockedUntil) {
    return (
      <View style={styles.container}>
        <View style={styles.lockIconCircle}>
          <Ionicons name="lock-closed" size={32} color={colors.error} />
        </View>
        <Text style={styles.title}>Too Many Attempts</Text>
        <Text style={styles.subtitle}>Please wait before trying again</Text>
        <Text style={styles.countdown}>{remainingSeconds}s</Text>
      </View>
    );
  }

  // ── Forgot PIN view ──
  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        <TextInput
          style={styles.passwordInput}
          value={forgotPassword}
          onChangeText={setForgotPassword}
          placeholder="Account password"
          placeholderTextColor={colors.textLight}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.verifyButton, forgotLoading && { opacity: 0.6 }]}
          onPress={handleForgotPin}
          disabled={forgotLoading}
        >
          <Text style={styles.verifyButtonText}>
            {forgotLoading ? 'Verifying...' : 'Verify & Reset PIN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => { setMode('enter'); setForgotPassword(''); }}
        >
          <Text style={styles.skipText}>Back to PIN entry</Text>
        </TouchableOpacity>

        <AppModal
          visible={showForgotErrorModal}
          onClose={() => setShowForgotErrorModal(false)}
          icon="close-circle"
          iconColor={colors.error}
          title="Verification Failed"
          message={forgotErrorMsg}
          buttons={[{ label: 'Try Again', onPress: () => setShowForgotErrorModal(false) }]}
        />
      </KeyboardAvoidingView>
    );
  }

  // ── Normal PIN entry / setup / confirm view ──
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>{getSubtitle()}</Text>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.key}
            onPress={() => handlePress(digit)}
          >
            <Text style={styles.keyText}>{digit}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.key}
          onPress={() => hasBiometrics && mode === 'enter' && triggerBiometric()}
        >
          {hasBiometrics && mode === 'enter' ? (
            <Ionicons name="finger-print" size={28} color={colors.primary} />
          ) : (
            <Text />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.key}
          onPress={() => handlePress('0')}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {mode === 'enter' && (
        <>
          <TouchableOpacity
            style={styles.forgotPinButton}
            onPress={() => setMode('forgot')}
          >
            <Text style={styles.forgotPinText}>Forgot PIN?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
          >
            <Text style={styles.skipText}>Login with email instead</Text>
          </TouchableOpacity>
        </>
      )}

      <AppModal
        visible={showSetModal}
        onClose={() => setShowSetModal(false)}
        icon="checkmark-circle"
        title="PIN Set!"
        message="Your PIN has been set successfully."
        buttons={[{ label: 'Continue', onPress: () => { setShowSetModal(false); router.replace('/(tabs)'); } }]}
      />

      <AppModal
        visible={showMismatchModal}
        onClose={() => setShowMismatchModal(false)}
        icon="close-circle"
        iconColor={colors.error}
        title="PINs Don't Match"
        message="The PINs you entered don't match. Please try again."
        buttons={[{ label: 'Try Again', onPress: () => setShowMismatchModal(false) }]}
      />

      <AppModal
        visible={showWrongModal}
        onClose={() => setShowWrongModal(false)}
        icon="close-circle"
        iconColor={colors.error}
        title="Wrong PIN"
        message="Incorrect PIN. Please try again."
        buttons={[{ label: 'Try Again', onPress: () => setShowWrongModal(false) }]}
      />
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8,
  },
  subtitle: {
    fontSize: 15, color: colors.textSecondary, marginBottom: 40, textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row', marginBottom: 48, gap: 16,
  },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.primary,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  keypad: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', width: 300, gap: 16,
  },
  key: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surface, alignItems: 'center',
    justifyContent: 'center', elevation: 2,
  },
  keyText: {
    fontSize: 24, fontWeight: '600', color: colors.textPrimary,
  },
  skipButton: {
    marginTop: 16,
  },
  skipText: {
    color: colors.primary, fontSize: 14, fontWeight: '600',
  },
  forgotPinButton: {
    marginTop: 40,
  },
  forgotPinText: {
    color: colors.textSecondary, fontSize: 13, fontWeight: '600',
  },
  lockIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.error + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  countdown: {
    fontSize: 42, fontWeight: '800', color: colors.error, marginTop: 24,
  },
  passwordInput: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, padding: 14, fontSize: 15, color: colors.textPrimary,
    width: '100%', marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: colors.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', width: '100%',
  },
  verifyButtonText: {
    color: '#fff', fontSize: 15, fontWeight: '700',
  },
});
