/**
 * Avatar Picker Test Screen
 * 
 * Standalone test screen for the Avatar Picker component
 * No database connection required - just UI testing
 * 
 * To access: Navigate to /avatar-test in your app
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import AvatarPicker from '../components/AvatarPicker';

export default function AvatarTestScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [lastResult, setLastResult] = useState<{
    avatarId: number;
  } | null>(null);

  const handleComplete = (data: { avatarId: number }) => {
    console.log('✅ Avatar Picker Result:', data);
    setLastResult(data);
    
    Alert.alert(
      'Success! 🎉',
      `Avatar ID: ${data.avatarId}\n\nCheck console for details.`,
      [
        {
          text: 'Test Again',
          onPress: () => setLastResult(null),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Avatar Picker Test</Text>
          <Text style={styles.headerSubtitle}>Test Avatar Selection UI</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Test Mode - 12 Unique Avatars!</Text>
            <Text style={styles.infoText}>
              Choose from 12 colorful avatar designs. No data will be saved - this is just for testing the UI!
            </Text>
          </View>
        </View>

        {/* Avatar Picker Component */}
        <View style={styles.pickerContainer}>
          <AvatarPicker
            onComplete={handleComplete}
            title="Pick Your Avatar"
            subtitle="Choose one to get started"
            buttonText="Test Complete"
            colors={{
              primary: colors.primary,
              background: colors.background,
              surface: colors.surface,
              textPrimary: colors.textPrimary,
              textSecondary: colors.textSecondary,
              border: colors.border,
              error: colors.error,
            }}
          />
        </View>

        {/* Last Result Display */}
        {lastResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.resultTitle}>Last Result</Text>
            </View>
            <View style={styles.resultContent}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Avatar ID:</Text>
                <Text style={styles.resultValue}>{lastResult.avatarId}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setLastResult(null)}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.resetButtonText}>Test Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Avatar IDs List */}
        <View style={styles.avatarListCard}>
          <Text style={styles.avatarListTitle}>All 12 Avatars</Text>
          <View style={styles.avatarList}>
            {Array.from({ length: 12 }, (_, index) => (
              <View key={index} style={styles.avatarItem}>
                <View style={styles.avatarNumber}>
                  <Text style={styles.avatarNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.avatarItemText}>Avatar {index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Features Being Tested</Text>
          <View style={styles.featuresList}>
            {[
              '12 unique colorful avatars',
              'Scrollable avatar selection strip',
              'Avatar selection with ring animations',
              'Theme color integration',
              'Touch interactions with smooth animations',
              'Selected avatar checkmark indicator',
              'Smooth transitions between selections',
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Test Cases */}
        <View style={styles.testCasesCard}>
          <Text style={styles.testCasesTitle}>Try These Test Cases</Text>
          <View style={styles.testCasesList}>
            <View style={styles.testCase}>
              <Text style={styles.testCaseNumber}>1.</Text>
              <Text style={styles.testCaseText}>
                Scroll through all 12 avatars - watch the ring animation
              </Text>
            </View>
            <View style={styles.testCase}>
              <Text style={styles.testCaseNumber}>2.</Text>
              <Text style={styles.testCaseText}>
                Select different avatars - notice the smooth crossfade
              </Text>
            </View>
            <View style={styles.testCase}>
              <Text style={styles.testCaseNumber}>3.</Text>
              <Text style={styles.testCaseText}>
                Try different color schemes - each avatar has unique colors
              </Text>
            </View>
            <View style={styles.testCase}>
              <Text style={styles.testCaseNumber}>4.</Text>
              <Text style={styles.testCaseText}>
                Watch the selection checkmark appear on thumbnails
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    infoIconContainer: {
      marginRight: 12,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    pickerContainer: {
      marginBottom: 20,
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    resultContent: {
      gap: 8,
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resultLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    resultValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary + '15',
    },
    resetButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    avatarListCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    avatarListTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    avatarList: {
      gap: 10,
    },
    avatarItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNumberText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    avatarItemText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    featuresCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    featuresTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    featuresList: {
      gap: 10,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    featureText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    testCasesCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    testCasesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    testCasesList: {
      gap: 12,
    },
    testCase: {
      flexDirection: 'row',
      gap: 8,
    },
    testCaseNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      width: 20,
    },
    testCaseText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
