import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ContactsModal from './ContactsModal';

interface UserOrContactPickerProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  userId: string;
}

/**
 * A text input with a contact book icon that opens ContactsModal
 * for quickly selecting from saved contacts
 */
export default function UserOrContactPicker({
  label,
  value,
  onChangeText,
  placeholder = 'email@example.com',
  userId,
}: UserOrContactPickerProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const handleSelectContact = (email: string, name: string) => {
    onChangeText(email);
    setShowContactsModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowContactsModal(true)}
        >
          <Ionicons name="people" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Tap <Ionicons name="people" size={12} color={colors.primary} /> to select from your contacts
      </Text>

      <ContactsModal
        visible={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        onSelectContact={handleSelectContact}
        userId={userId}
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    input: {
      flex: 1,
      padding: 14,
      fontSize: 15,
      color: colors.textPrimary,
    },
    iconButton: {
      padding: 14,
      paddingLeft: 8,
    },
    hint: {
      fontSize: 11,
      color: colors.textLight,
      marginTop: 4,
      marginLeft: 4,
    },
  });
