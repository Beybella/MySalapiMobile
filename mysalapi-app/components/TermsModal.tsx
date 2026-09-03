import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsModal({ visible, onClose }: TermsModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Terms and Conditions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.lastUpdated}>Last Updated: February 2025</Text>

            <Text style={styles.intro}>
              Welcome to MySalapi! By creating an account and using this application, you agree to the following terms and conditions. Please read them carefully.
            </Text>

            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By registering and using MySalapi, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </Text>

            <Text style={styles.sectionTitle}>2. Personal Use Only</Text>
            <Text style={styles.paragraph}>
              MySalapi is designed for personal financial management. The application is intended for individual use to track personal expenses, loans (Pautang), and shared group expenses (Ambagan).
            </Text>

            <Text style={styles.sectionTitle}>3. User Responsibility</Text>
            <Text style={styles.paragraph}>
              • All data entry is manual and entirely your responsibility.{'\n'}
              • You are responsible for the accuracy and completeness of all information entered into the app.{'\n'}
              • You must maintain the confidentiality of your account credentials.{'\n'}
              • You are responsible for all activities that occur under your account.
            </Text>

            <Text style={styles.sectionTitle}>4. No Financial Advice</Text>
            <Text style={styles.paragraph}>
              MySalapi is a tracking and management tool only. The app does not provide financial advice, recommendations, or professional guidance. Any financial decisions you make based on data entered or reports generated are solely your responsibility.
            </Text>

            <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MySalapi and its developers are not liable for:{'\n'}
              • Any financial losses or decisions made based on app data{'\n'}
              • Data loss due to device issues, app errors, or user error{'\n'}
              • Disputes arising from loans or shared expenses tracked in the app{'\n'}
              • Any direct, indirect, incidental, or consequential damages
            </Text>

            <Text style={styles.sectionTitle}>6. Scope of Features</Text>
            <Text style={styles.paragraph}>
              MySalapi tracks:{'\n'}
              • Personal expenses and budgets{'\n'}
              • Loans given or received (Pautang){'\n'}
              • Group shared expenses (Ambagan){'\n\n'}
              The app does not integrate with banks, financial institutions, or payment systems.
            </Text>

            <Text style={styles.sectionTitle}>7. Data Privacy</Text>
            <Text style={styles.paragraph}>
              • Your personal and financial data is stored securely.{'\n'}
              • We do not sell or share your data with third parties.{'\n'}
              • You can request data deletion by contacting support.{'\n'}
              • Email notifications are sent for account verification and reminders only.
            </Text>

            <Text style={styles.sectionTitle}>8. App Security</Text>
            <Text style={styles.paragraph}>
              • You can enable optional PIN protection for additional security.{'\n'}
              • You are responsible for keeping your PIN secure.{'\n'}
              • We recommend using strong passwords for your account.
            </Text>

            <Text style={styles.sectionTitle}>9. Modifications</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the updated terms.
            </Text>

            <Text style={styles.sectionTitle}>10. Termination</Text>
            <Text style={styles.paragraph}>
              You may delete your account at any time through the app settings. We reserve the right to terminate accounts that violate these terms.
            </Text>

            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.paragraph}>
              For questions or concerns about these terms, please contact us through the app's support section.
            </Text>

            <View style={styles.acknowledgment}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.acknowledgmentText}>
                By checking the agreement box, you confirm that you have read and accept these Terms and Conditions.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
              <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
      height: '90%',
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
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    lastUpdated: {
      fontSize: 12,
      color: colors.textLight,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    intro: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    acknowledgment: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    acknowledgmentText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      marginLeft: 12,
      flex: 1,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    acceptButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    acceptButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
