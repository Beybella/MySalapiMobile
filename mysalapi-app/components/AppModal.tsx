import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

interface AppModalButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  icon?: IconName;
  iconColor?: string;
  title: string;
  message: string;
  highlight?: string;
  buttons: AppModalButton[];
}

export default function AppModal({
  visible, onClose, icon = 'checkmark-circle', iconColor, title, message, highlight, buttons,
}: AppModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconCircle, { backgroundColor: (iconColor || colors.primary) + '20' }]}>
            <Ionicons name={icon} size={32} color={iconColor || colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {highlight ? (
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.button,
                  btn.variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
                  buttons.length > 1 && { flex: 1 },
                ]}
                onPress={btn.onPress}
              >
                <Text style={btn.variant === 'secondary' ? styles.buttonTextSecondary : styles.buttonTextPrimary}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 4,
  },
  highlightBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    width: '100%',
  },
  highlightText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  buttonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    flex: 1,
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
