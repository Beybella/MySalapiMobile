/**
 * @author: MySalapi Team (adapted from @dorianbaffier)
 * @description: Avatar Picker for React Native
 * @version: 1.0.0
 * @date: 2026-08-29
 * @license: MIT
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, G, Path, Mask } from 'react-native-svg';

interface Avatar {
  id: number;
  component: React.ReactNode;
  primaryColor: string;
  secondaryColor: string;
  ringColor: string;
}

// Avatar Components
const Avatar1 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__0__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__0__)">
      <Rect width={36} height={36} fill="#ff005b" />
      <Rect
        width={36}
        height={36}
        fill="#ffb238"
        rx={6}
        transform="translate(9 -5) rotate(219 18 18) scale(1)"
      />
      <G transform="translate(4.5 -4) rotate(9 18 18)">
        <Path
          d="M15 19c2 1 4 1 6 0"
          fill="none"
          stroke="#000000"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={10} y={14} fill="#000000" rx={1} />
        <Rect width={1.5} height={2} x={24} y={14} fill="#000000" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar2 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__1__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__1__)">
      <Rect width={36} height={36} fill="#ff7d10" />
      <Rect
        width={36}
        height={36}
        fill="#0a0310"
        rx={6}
        transform="translate(5 -1) rotate(55 18 18) scale(1.1)"
      />
      <G transform="translate(7 -6) rotate(-5 18 18)">
        <Path
          d="M15 20c2 1 4 1 6 0"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={14} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={20} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar3 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__2__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__2__)">
      <Rect width={36} height={36} fill="#0a0310" />
      <Rect
        width={36}
        height={36}
        fill="#ff005b"
        rx={36}
        transform="translate(-3 7) rotate(227 18 18) scale(1.2)"
      />
      <G transform="translate(-3 3.5) rotate(7 18 18)">
        <Path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
        <Rect width={1.5} height={2} x={12} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={22} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar4 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__3__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__3__)">
      <Rect width={36} height={36} fill="#d8fcb3" />
      <Rect
        width={36}
        height={36}
        fill="#89fcb3"
        rx={6}
        transform="translate(9 -5) rotate(219 18 18) scale(1)"
      />
      <G transform="translate(4.5 -4) rotate(9 18 18)">
        <Path
          d="M15 19c2 1 4 1 6 0"
          fill="none"
          stroke="#000000"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={10} y={14} fill="#000000" rx={1} />
        <Rect width={1.5} height={2} x={24} y={14} fill="#000000" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar5 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__4__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__4__)">
      <Rect width={36} height={36} fill="#007AFF" />
      <Rect
        width={36}
        height={36}
        fill="#5AC8FA"
        rx={36}
        transform="translate(6 8) rotate(180 18 18) scale(1)"
      />
      <G transform="translate(0 2) rotate(-3 18 18)">
        <Path d="M13,19 a1,0.8 0 0,0 10,0" fill="#FFFFFF" />
        <Rect width={1.5} height={2} x={11} y={13} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={23} y={13} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar6 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__5__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__5__)">
      <Rect width={36} height={36} fill="#5856D6" />
      <Rect
        width={36}
        height={36}
        fill="#AF52DE"
        rx={6}
        transform="translate(-4 6) rotate(45 18 18) scale(1.2)"
      />
      <G transform="translate(5 -2) rotate(5 18 18)">
        <Path
          d="M15 20c2 1 4 1 6 0"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={13} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={21} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar7 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__6__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__6__)">
      <Rect width={36} height={36} fill="#FF9500" />
      <Rect
        width={36}
        height={36}
        fill="#FFCC00"
        rx={36}
        transform="translate(8 -6) rotate(135 18 18) scale(1.1)"
      />
      <G transform="translate(3 -3) rotate(-8 18 18)">
        <Path
          d="M15 19c2 1 4 1 6 0"
          fill="none"
          stroke="#000000"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={12} y={14} fill="#000000" rx={1} />
        <Rect width={1.5} height={2} x={22} y={14} fill="#000000" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar8 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__7__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__7__)">
      <Rect width={36} height={36} fill="#34C759" />
      <Rect
        width={36}
        height={36}
        fill="#30D158"
        rx={6}
        transform="translate(-5 5) rotate(90 18 18) scale(1.15)"
      />
      <G transform="translate(4 0) rotate(3 18 18)">
        <Path d="M14,20 a1,0.6 0 0,0 8,0" fill="#FFFFFF" />
        <Rect width={1.5} height={2} x={11} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={23} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar9 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__8__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__8__)">
      <Rect width={36} height={36} fill="#FF375F" />
      <Rect
        width={36}
        height={36}
        fill="#FF6482"
        rx={36}
        transform="translate(-3 9) rotate(270 18 18) scale(1.3)"
      />
      <G transform="translate(2 1) rotate(-5 18 18)">
        <Path
          d="M15 19c2 1 4 1 6 0"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={12} y={13} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={22} y={13} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar10 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__9__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__9__)">
      <Rect width={36} height={36} fill="#00C7BE" />
      <Rect
        width={36}
        height={36}
        fill="#64D2FF"
        rx={6}
        transform="translate(7 -4) rotate(315 18 18) scale(1.1)"
      />
      <G transform="translate(-2 3) rotate(8 18 18)">
        <Path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
        <Rect width={1.5} height={2} x={10} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={24} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar11 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__10__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__10__)">
      <Rect width={36} height={36} fill="#BF5AF2" />
      <Rect
        width={36}
        height={36}
        fill="#DA8FFF"
        rx={36}
        transform="translate(4 7) rotate(225 18 18) scale(1.2)"
      />
      <G transform="translate(6 -1) rotate(-2 18 18)">
        <Path
          d="M15 20c2 1 4 1 6 0"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
        />
        <Rect width={1.5} height={2} x={14} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={20} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar12 = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask__11__">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask__11__)">
      <Rect width={36} height={36} fill="#8E8E93" />
      <Rect
        width={36}
        height={36}
        fill="#C7C7CC"
        rx={6}
        transform="translate(-6 4) rotate(160 18 18) scale(1.25)"
      />
      <G transform="translate(1 -2) rotate(4 18 18)">
        <Path d="M14,19 a1,0.7 0 0,0 8,0" fill="#000000" />
        <Rect width={1.5} height={2} x={11} y={13} fill="#000000" rx={1} />
        <Rect width={1.5} height={2} x={23} y={13} fill="#000000" rx={1} />
      </G>
    </G>
  </Svg>
);

const avatars: Avatar[] = [
  {
    id: 1,
    component: <Avatar1 />,
    primaryColor: '#ff005b',
    secondaryColor: '#ffb238',
    ringColor: 'rgba(255, 0, 91, 0.4)',
  },
  {
    id: 2,
    component: <Avatar2 />,
    primaryColor: '#ff7d10',
    secondaryColor: '#0a0310',
    ringColor: 'rgba(255, 125, 16, 0.4)',
  },
  {
    id: 3,
    component: <Avatar3 />,
    primaryColor: '#0a0310',
    secondaryColor: '#ff005b',
    ringColor: 'rgba(255, 0, 91, 0.4)',
  },
  {
    id: 4,
    component: <Avatar4 />,
    primaryColor: '#d8fcb3',
    secondaryColor: '#89fcb3',
    ringColor: 'rgba(137, 252, 179, 0.4)',
  },
  {
    id: 5,
    component: <Avatar5 />,
    primaryColor: '#007AFF',
    secondaryColor: '#5AC8FA',
    ringColor: 'rgba(0, 122, 255, 0.4)',
  },
  {
    id: 6,
    component: <Avatar6 />,
    primaryColor: '#5856D6',
    secondaryColor: '#AF52DE',
    ringColor: 'rgba(88, 86, 214, 0.4)',
  },
  {
    id: 7,
    component: <Avatar7 />,
    primaryColor: '#FF9500',
    secondaryColor: '#FFCC00',
    ringColor: 'rgba(255, 149, 0, 0.4)',
  },
  {
    id: 8,
    component: <Avatar8 />,
    primaryColor: '#34C759',
    secondaryColor: '#30D158',
    ringColor: 'rgba(52, 199, 89, 0.4)',
  },
  {
    id: 9,
    component: <Avatar9 />,
    primaryColor: '#FF375F',
    secondaryColor: '#FF6482',
    ringColor: 'rgba(255, 55, 95, 0.4)',
  },
  {
    id: 10,
    component: <Avatar10 />,
    primaryColor: '#00C7BE',
    secondaryColor: '#64D2FF',
    ringColor: 'rgba(0, 199, 190, 0.4)',
  },
  {
    id: 11,
    component: <Avatar11 />,
    primaryColor: '#BF5AF2',
    secondaryColor: '#DA8FFF',
    ringColor: 'rgba(191, 90, 242, 0.4)',
  },
  {
    id: 12,
    component: <Avatar12 />,
    primaryColor: '#8E8E93',
    secondaryColor: '#C7C7CC',
    ringColor: 'rgba(142, 142, 147, 0.4)',
  },
];

interface AvatarPickerProps {
  onComplete?: (data: { avatarId: number }) => void;
  initialAvatarId?: number;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  containerStyle?: any;
  colors?: {
    background?: string;
    surface?: string;
    primary?: string;
    textPrimary?: string;
    textSecondary?: string;
    border?: string;
    error?: string;
  };
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  onComplete,
  initialAvatarId = 1,
  title = 'Pick Your Avatar',
  subtitle = 'Choose one to get started',
  buttonText = 'Continue',
  containerStyle,
  colors = {},
}) => {
  const defaultColors = {
    background: '#f5f5f5',
    surface: '#ffffff',
    primary: '#007AFF',
    textPrimary: '#000000',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#ff3b30',
    ...colors,
  };

  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(
    avatars.find((a) => a.id === initialAvatarId) || avatars[0]
  );

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const avatarOpacity = useRef(new Animated.Value(1)).current;
  const thumbnailAnims = useRef(
    avatars.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Stagger thumbnail animations
    Animated.stagger(
      60,
      thumbnailAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  useEffect(() => {
    // Pulse ring animation when avatar changes
    Animated.sequence([
      Animated.timing(ringScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(ringScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade avatar
    Animated.sequence([
      Animated.timing(avatarOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedAvatar.id]);

  const handleAvatarSelect = (avatar: Avatar) => {
    if (avatar.id === selectedAvatar.id) return;
    setSelectedAvatar(avatar);
  };

  const handleSubmit = () => {
    if (onComplete) {
      onComplete({
        avatarId: selectedAvatar.id,
      });
    }
  };

  const styles = makeStyles(defaultColors);

  return (
    <Animated.View style={[styles.container, containerStyle, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Avatar Stage */}
        <View style={styles.stageContainer}>
          {/* Large Avatar Display */}
          <View style={styles.avatarStage}>
            <Animated.View
              style={[
                styles.avatarRing,
                {
                  borderColor: selectedAvatar.ringColor,
                  shadowColor: selectedAvatar.primaryColor,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <Animated.View style={[styles.avatarCircle, { opacity: avatarOpacity }]}>
              <View style={styles.avatarContent}>
                {selectedAvatar.component}
              </View>
            </Animated.View>
          </View>

          {/* Thumbnail Strip */}
          <View style={styles.thumbnailWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {avatars.map((avatar, index) => {
                const isSelected = selectedAvatar.id === avatar.id;
                return (
                  <Animated.View
                    key={avatar.id}
                    style={{
                      opacity: thumbnailAnims[index],
                      transform: [
                        {
                          translateY: thumbnailAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.thumbnail,
                        isSelected && styles.thumbnailSelected,
                        { borderColor: isSelected ? defaultColors.textPrimary : defaultColors.border },
                      ]}
                      onPress={() => handleAvatarSelect(avatar)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.thumbnailContent}>
                        {avatar.component}
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
        </View>


        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: defaultColors.primary },
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 32,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    content: {
      gap: 32,
    },
    header: {
      alignItems: 'center',
      gap: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    stageContainer: {
      alignItems: 'center',
      gap: 16,
    },
    avatarStage: {
      width: 160,
      height: 160,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarRing: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 2,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    avatarCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      overflow: 'hidden',
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarContent: {
      transform: [{ scale: 4 }],
    },
    thumbnailWrapper: {
      width: '100%',
      marginTop: 8,
    },
    thumbnailScrollContent: {
      paddingHorizontal: 4,
      gap: 12,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: 12,
      borderWidth: 2,
      overflow: 'hidden',
      backgroundColor: colors.background,
      opacity: 0.5,
    },
    thumbnailSelected: {
      opacity: 1,
      borderWidth: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    thumbnailContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ scale: 2.3 }],
    },
    checkmark: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.textPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      height: 44,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
  });

export default AvatarPicker;
