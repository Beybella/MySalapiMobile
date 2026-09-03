import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getUnreadCount } from '../../lib/notificationHistory';

interface Props {
  userName: string;
  onSignOut?: () => void;
}

export default function HomeHeader({ userName }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = makeStyles(colors);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  return (
    <View style={styles.modernHeader}>
      {/* Notification Bell - Top Right */}
      <TouchableOpacity onPress={handleNotificationPress} style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={26} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.modernHeaderTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.currentDate}>{format(new Date(), 'EEEE, d MMMM, yyyy')}</Text>
        </View>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/MySalapiLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  modernHeader: {
    backgroundColor: colors.primary,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  logoContainer: {
    marginBottom: 8,
  },
  notificationButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#DC3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  currentDate: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
});
