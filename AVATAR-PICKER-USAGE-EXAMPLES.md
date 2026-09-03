# Avatar Picker - Usage Examples

Complete code examples for integrating the Avatar Picker into your MySalapi app.

## Example 1: Registration Flow with Avatar Setup

Add avatar selection as the final step of registration:

```typescript
// File: mysalapi-app/app/(auth)/register.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import AvatarPicker from '../../components/AvatarPicker';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'avatar'>('credentials');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Register with email/password
  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
      return;
    }

    if (data.user) {
      setUserId(data.user.id);
      setStep('avatar'); // Move to avatar selection
    }
  };

  // Step 2: Save avatar and username
  const handleAvatarComplete = async (data: { username: string; avatarId: number }) => {
    if (!userId) return;

    setLoading(true);

    // Check username availability first
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username)
      .single();

    if (existingUser) {
      setLoading(false);
      Alert.alert('Username Taken', 'Please choose a different username');
      return;
    }

    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        username: data.username,
        avatar_id: data.avatarId,
        profile_completed: true,
      })
      .eq('id', userId);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      return;
    }

    // Registration complete! Navigate to main app
    Alert.alert('Welcome!', 'Your account has been created successfully', [
      {
        text: 'Get Started',
        onPress: () => {
          // Navigation will be handled by auth state change
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {step === 'credentials' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', padding: 20 }}
        >
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
            Create Account
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
            Join MySalapi to manage your finances
          </Text>

          <TextInput
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
            }}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              fontSize: 16,
            }}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
              {loading ? 'Creating Account...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {step === 'avatar' && (
        <Modal visible={true} animationType="slide">
          <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 20 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <AvatarPicker
                title="Welcome to MySalapi!"
                subtitle="Choose your avatar and username"
                buttonText="Complete Setup"
                onComplete={handleAvatarComplete}
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
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}
```

## Example 2: Profile Editing

Allow users to update their avatar and username:

```typescript
// File: mysalapi-app/app/(tabs)/profile.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AvatarPicker from '../../components/AvatarPicker';
import AvatarDisplay from '../../components/AvatarDisplay'; // You'll create this

export default function ProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('username, avatar_id')
      .eq('id', user.id)
      .single();

    if (data) {
      setUsername(data.username || '');
      setAvatarId(data.avatar_id || 1);
    }
  };

  const handleProfileUpdate = async (data: { username: string; avatarId: number }) => {
    if (!user) return;

    setLoading(true);

    // Check if username changed and if new username is available
    if (data.username !== username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', data.username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        setLoading(false);
        Alert.alert('Username Taken', 'Please choose a different username');
        return;
      }
    }

    // Update profile
    const { error } = await supabase
      .from('users')
      .update({
        username: data.username,
        avatar_id: data.avatarId,
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
      return;
    }

    setUsername(data.username);
    setAvatarId(data.avatarId);
    setEditingProfile(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Profile Header */}
      <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.primary }}>
        <View style={{ marginBottom: 16 }}>
          <AvatarDisplay avatarId={avatarId} size={100} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
          {username || 'No username set'}
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          {user?.email}
        </Text>
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: colors.surface,
          marginTop: 16,
          marginHorizontal: 16,
          borderRadius: 12,
        }}
        onPress={() => setEditingProfile(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              Edit Profile
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Change your avatar and username
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editingProfile} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 20, paddingTop: 60, flex: 1 }}>
            {/* Close Button */}
            <TouchableOpacity
              style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
              onPress={() => setEditingProfile(false)}
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Avatar Picker */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <AvatarPicker
                initialUsername={username}
                initialAvatarId={avatarId}
                title="Update Profile"
                subtitle="Change your avatar and username"
                buttonText={loading ? 'Saving...' : 'Save Changes'}
                onComplete={handleProfileUpdate}
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
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
```

## Example 3: AvatarDisplay Component

Create a reusable component to display avatars throughout your app:

```typescript
// File: mysalapi-app/components/AvatarDisplay.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, G, Path, Mask } from 'react-native-svg';

interface AvatarDisplayProps {
  avatarId: number;
  size?: number;
  style?: any;
}

// Mini avatar components (same as in AvatarPicker)
const Avatar1Mini = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask1">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask1)">
      <Rect width={36} height={36} fill="#ff005b" />
      <Rect width={36} height={36} fill="#ffb238" rx={6} transform="translate(9 -5) rotate(219 18 18) scale(1)" />
      <G transform="translate(4.5 -4) rotate(9 18 18)">
        <Path d="M15 19c2 1 4 1 6 0" fill="none" stroke="#000000" strokeLinecap="round" />
        <Rect width={1.5} height={2} x={10} y={14} fill="#000000" rx={1} />
        <Rect width={1.5} height={2} x={24} y={14} fill="#000000" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar2Mini = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask2">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask2)">
      <Rect width={36} height={36} fill="#ff7d10" />
      <Rect width={36} height={36} fill="#0a0310" rx={6} transform="translate(5 -1) rotate(55 18 18) scale(1.1)" />
      <G transform="translate(7 -6) rotate(-5 18 18)">
        <Path d="M15 20c2 1 4 1 6 0" fill="none" stroke="#FFFFFF" strokeLinecap="round" />
        <Rect width={1.5} height={2} x={14} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={20} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar3Mini = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask3">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask3)">
      <Rect width={36} height={36} fill="#0a0310" />
      <Rect width={36} height={36} fill="#ff005b" rx={36} transform="translate(-3 7) rotate(227 18 18) scale(1.2)" />
      <G transform="translate(-3 3.5) rotate(7 18 18)">
        <Path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
        <Rect width={1.5} height={2} x={12} y={14} fill="#FFFFFF" rx={1} />
        <Rect width={1.5} height={2} x={22} y={14} fill="#FFFFFF" rx={1} />
      </G>
    </G>
  </Svg>
);

const Avatar4Mini = () => (
  <Svg width={40} height={40} viewBox="0 0 36 36">
    <Mask id="mask4">
      <Rect width={36} height={36} fill="#FFFFFF" rx={72} />
    </Mask>
    <G mask="url(#mask4)">
      <Rect width={36} height={36} fill="#d8fcb3" />
      <Rect width={36} height={36} fill="#89fcb3" rx={6} transform="translate(9 -5) rotate(219 18 18) scale(1)" />
      <G transform="translate(4.5 -4) rotate(9 18 18)">
        <Path d="M15 19c2 1 4 1 6 0" fill="none" stroke="#000000" strokeLinecap="round" />
        <Rect width={1.5} height={2} x={10} y={14} fill="#000000" rx={1} />
        <Rect width={1.5} height={2} x={24} y={14} fill="#000000" rx={1} />
      </G>
    </G>
  </Svg>
);

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ avatarId, size = 40, style }) => {
  const avatars: { [key: number]: JSX.Element } = {
    1: <Avatar1Mini />,
    2: <Avatar2Mini />,
    3: <Avatar3Mini />,
    4: <Avatar4Mini />,
  };

  const scale = size / 40;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <View style={{ transform: [{ scale }] }}>
        {avatars[avatarId] || avatars[1]}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AvatarDisplay;
```

## Example 4: First-Time Setup Check

Check if user needs to complete profile setup:

```typescript
// File: mysalapi-app/app/_layout.tsx or main navigation file

import React, { useState, useEffect } from 'react';
import { Modal, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AvatarPicker from '../components/AvatarPicker';

export default function RootLayout() {
  const { user } = useAuth();
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    checkProfileSetup();
  }, [user]);

  const checkProfileSetup = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('username, avatar_id, profile_completed')
      .eq('id', user.id)
      .single();

    // Show avatar picker if profile not completed
    if (!data?.profile_completed || !data?.username || !data?.avatar_id) {
      setNeedsProfileSetup(true);
    }
  };

  const handleSetupComplete = async (data: { username: string; avatarId: number }) => {
    if (!user) return;

    await supabase
      .from('users')
      .update({
        username: data.username,
        avatar_id: data.avatarId,
        profile_completed: true,
      })
      .eq('id', user.id);

    setNeedsProfileSetup(false);
  };

  return (
    <>
      {/* Your main app navigation */}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* ... other screens */}
      </Stack>

      {/* Profile Setup Modal */}
      <Modal visible={needsProfileSetup} animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' }}>
          <AvatarPicker
            title="Welcome to MySalapi!"
            subtitle="Let's set up your profile"
            buttonText="Complete Setup"
            onComplete={handleSetupComplete}
          />
        </View>
      </Modal>
    </>
  );
}
```

## Summary

These examples show:
1. ✅ Two-step registration with avatar setup
2. ✅ Profile editing functionality
3. ✅ Reusable AvatarDisplay component
4. ✅ First-time setup flow
5. ✅ Username availability checking
6. ✅ Full integration with Supabase

Choose the integration pattern that works best for your app flow!
