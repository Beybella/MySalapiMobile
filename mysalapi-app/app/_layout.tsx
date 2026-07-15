import { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Audio } from 'expo-av';

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const playSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/coinsound.wav')
        );
        await sound.playAsync();
      } catch (e) {}
    };
    playSound();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Animated.Image
        source={require('../assets/MySalapiLogo.png')}
        style={[styles.logo, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

function RootLayoutNav() {
  const { session, loading, pinVerified } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || showSplash) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onPinScreen = segments[1] === 'pin';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && !pinVerified && !onPinScreen) {
      router.replace('/(auth)/pin');
    } else if (session && pinVerified && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, pinVerified, loading, segments, showSplash]);

  if (showSplash || loading) {
    return <SplashScreen />;
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
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider>
          <RootLayoutNav />
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#2E9688',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
});