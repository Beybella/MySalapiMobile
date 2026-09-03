/**
 * Hook to manage push notifications throughout the app
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  getBadgeCount,
  NotificationData,
} from '@/lib/notifications';
import { autoLogNotification } from '@/lib/notificationHistory';
import { useAuth } from '@/context/AuthContext';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token && user) {
        setExpoPushToken(token);
        savePushToken(user.id, token);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
      updateBadgeCount();
      
      // Auto-log to notification history
      autoLogNotification(notification);
    });

    // Listen for notification tap/press
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      handleNotificationTap(data);
      
      // Also log when user taps notification (in case they dismissed it)
      autoLogNotification(response.notification);
    });

    // Load initial badge count
    updateBadgeCount();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  const updateBadgeCount = async () => {
    const count = await getBadgeCount();
    setBadgeCount(count);
  };

  const handleNotificationTap = (data: NotificationData) => {
    if (!data) return;

    switch (data.type) {
      case 'bill':
        // Navigate to budget tab
        router.push('/(tabs)/budget');
        break;
      case 'loan':
        // Navigate to loan detail
        router.push({
          pathname: '/loan-detail',
          params: { id: data.id },
        });
        break;
      case 'overdue':
        // Navigate to relevant screen based on item type
        router.push('/(tabs)/budget');
        break;
    }
  };

  return {
    expoPushToken,
    notification,
    badgeCount,
    updateBadgeCount,
  };
}
