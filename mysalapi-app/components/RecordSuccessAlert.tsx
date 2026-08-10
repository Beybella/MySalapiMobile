import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecordSuccessType =
  | 'expense'
  | 'bill'
  | 'loan'
  | 'payment'
  | 'group'
  | 'generic';

interface RecordDetail {
  label: string;
  value: string;
}

interface RecordSuccessAlertProps {
  visible: boolean;
  type?: RecordSuccessType;
  title?: string;
  subtitle?: string;
  details?: RecordDetail[];
  onDismiss: () => void;
}

// ─── Config per record type ───────────────────────────────────────────────────

type TypeConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  bgAccent: string;
  defaultTitle: string;
  defaultSubtitle: string;
};

const TYPE_CONFIG: Record<RecordSuccessType, TypeConfig> = {
  expense: {
    icon: 'wallet',
    accent: '#5A7A5C',
    bgAccent: 'rgba(90, 122, 92, 0.13)',
    defaultTitle: 'Expense Added',
    defaultSubtitle: 'Your expense has been recorded.',
  },
  bill: {
    icon: 'receipt',
    accent: '#7A97B0',
    bgAccent: 'rgba(122, 151, 176, 0.13)',
    defaultTitle: 'Bill Saved',
    defaultSubtitle: "We'll remind you before it's due.",
  },
  loan: {
    icon: 'cash',
    accent: '#A67878',
    bgAccent: 'rgba(166, 120, 120, 0.13)',
    defaultTitle: 'Loan Recorded',
    defaultSubtitle: 'The loan has been added to Pautang.',
  },
  payment: {
    icon: 'checkmark-done',
    accent: '#5A7A5C',
    bgAccent: 'rgba(90, 122, 92, 0.13)',
    defaultTitle: 'Payment Recorded',
    defaultSubtitle: 'The payment has been applied.',
  },
  group: {
    icon: 'people',
    accent: '#A67878',
    bgAccent: 'rgba(166, 120, 120, 0.13)',
    defaultTitle: 'Group Created',
    defaultSubtitle: 'Ambagan group has been set up.',
  },
  generic: {
    icon: 'checkmark-circle',
    accent: '#5A7A5C',
    bgAccent: 'rgba(90, 122, 92, 0.13)',
    defaultTitle: 'Record Saved',
    defaultSubtitle: 'Your record was added successfully.',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
// NOTE: Rendered as an absolutely-positioned View overlay (not a Modal) so it
// doesn't conflict with other Modals already open in the parent screen.

export default function RecordSuccessAlert({
  visible,
  type = 'generic',
  title,
  subtitle,
  details,
  onDismiss,
}: RecordSuccessAlertProps) {
  const { colors } = useTheme();
  const config = TYPE_CONFIG[type];

  // Animations
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale      = useRef(new Animated.Value(0.85)).current;
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const iconScale      = useRef(new Animated.Value(0)).current;
  const iconRotate     = useRef(new Animated.Value(0)).current;
  const checkOpacity   = useRef(new Animated.Value(0)).current;
  const detailsSlide   = useRef(new Animated.Value(12)).current;
  const detailsAlpha   = useRef(new Animated.Value(0)).current;
  const buttonSlide    = useRef(new Animated.Value(8)).current;
  const buttonAlpha    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      overlayOpacity.setValue(0);
      cardScale.setValue(0.85);
      cardOpacity.setValue(0);
      iconScale.setValue(0);
      iconRotate.setValue(0);
      checkOpacity.setValue(0);
      detailsSlide.setValue(12);
      detailsAlpha.setValue(0);
      buttonSlide.setValue(8);
      buttonAlpha.setValue(0);

      Animated.sequence([
        // 1. Overlay fades in
        Animated.timing(overlayOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        // 2. Card pops in
        Animated.parallel([
          Animated.spring(cardScale,   { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]),
        // 3. Brief pause before icon
        Animated.delay(15),
        // 4. Icon bounces in with a little spin
        Animated.parallel([
          Animated.spring(iconScale,  { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
          Animated.timing(iconRotate, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        // 5. Icon check fades in
        Animated.timing(checkOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
        // 6. Brief pause before details
        Animated.delay(15),
        // 7. Details slide up
        Animated.parallel([
          Animated.timing(detailsSlide, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(detailsAlpha, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        // 8. Brief pause before button
        Animated.delay(15),
        // 9. Button slides up
        Animated.parallel([
          Animated.timing(buttonSlide, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.timing(buttonAlpha, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [visible]);

  // Don't render anything when not visible — avoids layout cost
  if (!visible) return null;

  const iconSpin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const styles = makeStyles(colors, config.accent, config.bgAccent);

  return (
    // Absolute overlay — sits on top of everything in the parent View
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      // Intercept touches so nothing behind can be tapped
      pointerEvents="box-none"
    >
      <View style={styles.overlayTouchBlock} />

      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: cardScale }],
            opacity: cardOpacity,
          },
        ]}
      >
        {/* ── Icon ring ────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.iconRing,
            { transform: [{ scale: iconScale }, { rotate: iconSpin }] },
          ]}
        >
          <View style={styles.iconRingInner} />
          <Animated.View style={{ opacity: checkOpacity }}>
            <Ionicons name={config.icon} size={36} color={config.accent} />
          </Animated.View>
        </Animated.View>

        {/* ── "Success" pill ───────────────────────────────────────────── */}
        <View style={styles.pill}>
          <Ionicons name="checkmark" size={11} color={config.accent} />
          <Text style={styles.pillText}>Recorded Successfully</Text>
        </View>

        {/* ── Title & subtitle ─────────────────────────────────────────── */}
        <Text style={styles.title}>{title ?? config.defaultTitle}</Text>
        <Text style={styles.subtitle}>{subtitle ?? config.defaultSubtitle}</Text>

        {/* ── Details card ─────────────────────────────────────────────── */}
        {details && details.length > 0 && (
          <Animated.View
            style={[
              styles.detailsCard,
              {
                transform: [{ translateY: detailsSlide }],
                opacity: detailsAlpha,
              },
            ]}
          >
            {details.map((row, idx) => (
              <View
                key={idx}
                style={[
                  styles.detailRow,
                  idx < details.length - 1 && styles.detailRowBorder,
                ]}
              >
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Dismiss button ───────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.buttonWrap,
            {
              transform: [{ translateY: buttonSlide }],
              opacity: buttonAlpha,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.82}
          >
            <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: any, accent: string, bgAccent: string) =>
  StyleSheet.create({
    overlay: {
      // Cover the entire parent View — must be inside a View with position relative
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.52)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      zIndex: 999,
      elevation: 999,
    },
    // Invisible full-screen touch blocker so taps on backdrop go nowhere
    overlayTouchBlock: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      paddingTop: 36,
      paddingBottom: 28,
      paddingHorizontal: 24,
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      zIndex: 1000,
    },

    // Icon
    iconRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: bgAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconRingInner: {
      position: 'absolute',
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 2.5,
      borderColor: accent + '66', // 40% opacity in hex
    },

    // Pill
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: accent + '2D', // 18% opacity in hex
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      marginBottom: 14,
    },
    pillText: {
      fontSize: 11,
      fontWeight: '700',
      color: accent,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },

    // Text
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
      fontWeight: '500',
    },

    // Details
    detailsCard: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingVertical: 4,
      paddingHorizontal: 16,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 11,
    },
    detailRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    detailValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '700',
      maxWidth: '55%',
      textAlign: 'right',
    },

    // Button
    buttonWrap: {
      width: '100%',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
      borderRadius: 14,
      paddingVertical: 15,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
