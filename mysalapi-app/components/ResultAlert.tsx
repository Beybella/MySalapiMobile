import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type ResultType = 'success' | 'error' | 'info';

interface ResultAlertProps {
  visible: boolean;
  type?: ResultType;
  title: string;
  message: string;
  buttonLabel?: string;
  onButtonPress: () => void;
}

const ICONS: Record<ResultType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const COLORS: Record<ResultType, { bg: string; icon: string; button: string }> = {
  success: { bg: '#F1F8F4', icon: '#2E7D32', button: '#2E7D32' },
  error: { bg: '#FEF3F2', icon: '#D32F2F', button: '#D32F2F' },
  info: { bg: '#F3E5F5', icon: '#6A1B9A', button: '#6A1B9A' },
};

export default function ResultAlert({
  visible,
  type = 'success',
  title,
  message,
  buttonLabel = 'OK',
  onButtonPress,
}: ResultAlertProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 70,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const colorScheme = COLORS[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onButtonPress}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onButtonPress}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colorScheme.bg },
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colorScheme.icon + '20' }]}>
              <Ionicons
                name={ICONS[type]}
                size={48}
                color={colorScheme.icon}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>

            {/* Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colorScheme.button }]}
              onPress={onButtonPress}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>{buttonLabel}</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
