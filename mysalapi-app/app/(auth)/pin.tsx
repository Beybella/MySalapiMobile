import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Vibration,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const PIN_KEY = 'mysalapi_pin';

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'enter' | 'setup' | 'confirm'>('enter');
  const [tempPin, setTempPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { setPinVerified } = useAuth();

  useEffect(() => {
    checkSetup();
  }, []);

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
      fallbackLabel: 'Use PIN instead',
    });
    if (result.success) {
      setPinVerified(true);
      router.replace('/(tabs)');
    }
  };

  const handlePress = (digit: string) => {
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

  const handlePinComplete = async (enteredPin: string) => {
    if (mode === 'setup') {
      setTempPin(enteredPin);
      setPin('');
      setMode('confirm');
    } else if (mode === 'confirm') {
      if (enteredPin === tempPin) {
        await SecureStore.setItemAsync(PIN_KEY, enteredPin);
        Alert.alert('PIN Set!', 'Your PIN has been set successfully!');
        setPinVerified(true);
        router.replace('/(tabs)');
      } else {
        Vibration.vibrate(500);
        Alert.alert('Error', 'PINs do not match! Please try again.');
        setPin('');
        setMode('setup');
        setTempPin('');
      }
    } else {
      const savedPin = await SecureStore.getItemAsync(PIN_KEY);
      if (enteredPin === savedPin) {
        setPinVerified(true);
        router.replace('/(tabs)');
      } else {
        Vibration.vibrate(500);
        Alert.alert('Wrong PIN', 'Incorrect PIN. Please try again.');
        setPin('');
      }
    }
  };

  const styles = makeStyles(colors);

  const getTitle = () => {
    if (mode === 'setup') return 'Set up your PIN';
    if (mode === 'confirm') return 'Confirm your PIN';
    return 'Enter your PIN';
  };

  const getSubtitle = () => {
    if (mode === 'setup') return 'Choose a 6-digit PIN';
    if (mode === 'confirm') return 'Re-enter your PIN to confirm';
    return 'Welcome back!';
  };

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
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.skipText}>Login with email instead</Text>
        </TouchableOpacity>
      )}
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
    fontSize: 15, color: colors.textSecondary, marginBottom: 40,
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
    marginTop: 40,
  },
  skipText: {
    color: colors.primary, fontSize: 14, fontWeight: '600',
  },
});