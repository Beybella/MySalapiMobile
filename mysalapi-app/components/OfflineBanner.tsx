/**
 * Offline Banner Component
 * Shows at top of screen when no internet connection
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-60));

  React.useEffect(() => {
    if (!isOnline || isSlowConnection) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: -60,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [isOnline, isSlowConnection]);

  if (isOnline && !isSlowConnection) return null;

  return (
    <Animated.View 
      style={[
        styles.banner,
        { 
          backgroundColor: isSlowConnection ? '#FF9800' : '#F44336',
          transform: [{ translateY: slideAnim }] 
        }
      ]}
    >
      <Ionicons 
        name={isSlowConnection ? 'speedometer-outline' : 'cloud-offline-outline'} 
        size={16} 
        color="#fff" 
      />
      <Text style={styles.text}>
        {isSlowConnection ? 'Slow connection' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
