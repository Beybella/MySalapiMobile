import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  notes?: string;
}

interface ContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact?: (email: string, name: string) => void;
  userId: string;
}

export default function ContactsModal({ visible, onClose, onSelectContact, userId }: ContactsModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error loading contacts:', error);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const addContact = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Duplicate', 'This email is already in your contacts.');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    // Reset form
    setEmail('');
    setFullName('');
    setPhone('');
    setNotes('');
    setShowAddForm(false);

    // Reload contacts
    loadContacts();
    Alert.alert('Success', 'Contact added successfully!');
  };

  const deleteContact = async (contactId: string, contactName: string) => {
    Alert.alert(
      'Delete Contact',
      `Remove ${contactName} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('contacts')
              .delete()
              .eq('id', contactId);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              loadContacts();
            }
          },
        },
      ]
    );
  };

  const handleSelectContact = (contact: Contact) => {
    if (onSelectContact) {
      onSelectContact(contact.email, contact.full_name);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Contacts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Ionicons
                name={showAddForm ? 'remove-circle' : 'add-circle'}
                size={20}
                color="#fff"
              />
              <Text style={styles.addButtonText}>
                {showAddForm ? 'Cancel' : 'Add Contact'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@example.com"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor={colors.textLight}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.formLabel}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor={colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Friend from college"
                placeholderTextColor={colors.textLight}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={addContact}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Contact'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {loading && contacts.length === 0 ? (
              <Text style={styles.emptyText}>Loading contacts...</Text>
            ) : contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No Contacts Yet</Text>
                <Text style={styles.emptyText}>
                  Add contacts to quickly select them when creating loans or group expenses.
                </Text>
              </View>
            ) : (
              contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactCard}
                  onPress={() => handleSelectContact(contact)}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {contact.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.full_name}</Text>
                    <Text style={styles.contactEmail}>{contact.email}</Text>
                    {contact.phone && (
                      <Text style={styles.contactPhone}>{contact.phone}</Text>
                    )}
                    {contact.notes && (
                      <Text style={styles.contactNotes}>{contact.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteContact(contact.id, contact.full_name)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '85%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    actionBar: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 10,
      gap: 8,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    addForm: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    formLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.textPrimary,
    },
    textArea: {
      height: 60,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: colors.success,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 12,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
      lineHeight: 20,
    },
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    contactAvatarText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '700',
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    contactEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    contactPhone: {
      fontSize: 12,
      color: colors.textLight,
      marginBottom: 2,
    },
    contactNotes: {
      fontSize: 11,
      color: colors.textLight,
      fontStyle: 'italic',
      marginTop: 4,
    },
    deleteButton: {
      padding: 8,
    },
  });
