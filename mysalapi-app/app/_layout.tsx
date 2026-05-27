import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't navigate until auth state is resolved
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not logged in — go to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Logged in but on auth screen — go to app
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  // Show a spinner while Supabase resolves the session
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="loan-detail" options={{ presentation: 'card' }} />
      <Stack.Screen name="record-payment" options={{ presentation: 'card' }} />
      <Stack.Screen name="reports" options={{ presentation: 'card' }} />
      <Stack.Screen name="group-detail" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <RootLayoutNav />
      </PaperProvider>
    </AuthProvider>
  );
}
