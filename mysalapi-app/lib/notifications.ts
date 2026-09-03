/**
 * MySalapi Push Notification Service
 * Handles local and push notifications for bills and loans
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData extends Record<string, unknown> {
  type: 'bill' | 'loan' | 'overdue';
  id: string;
  title: string;
  amount?: number;
  dueDate?: string;
}

/**
 * Request notification permissions from the user
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#32A08E',
        sound: 'default',
      });

      // Create separate channels for different notification types
      await Notifications.setNotificationChannelAsync('bills', {
        name: 'Bill Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for upcoming bill payments',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#32A08E',
      });

      await Notifications.setNotificationChannelAsync('loans', {
        name: 'Loan Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for loan due dates',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D9BF77',
      });

      await Notifications.setNotificationChannelAsync('overdue', {
        name: 'Overdue Alerts',
        importance: Notifications.AndroidImportance.MAX,
        description: 'Urgent notifications for overdue items',
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#DC3545',
      });
    }

    // Get push token for remote notifications (optional - for future use)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (projectId) {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    }

    return 'local-only';
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to user profile in Supabase
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Schedule a notification for a bill due date
 */
export async function scheduleBillNotification(
  billId: string,
  title: string,
  amount: number,
  dueDate: Date,
  daysBeforeArray: number[] = [7, 3, 0] // Notify 7 days before, 3 days before, and on due date
): Promise<string[]> {
  const notificationIds: string[] = [];

  for (const daysBefore of daysBeforeArray) {
    const notificationDate = new Date(dueDate);
    notificationDate.setDate(notificationDate.getDate() - daysBefore);
    notificationDate.setHours(9, 0, 0, 0); // Schedule for 9 AM

    // Only schedule if notification date is in the future
    if (notificationDate > new Date()) {
      try {
        let notificationTitle: string;
        let bodyText: string;
        
        if (daysBefore === 0) {
          notificationTitle = 'Bill Due Today';
          bodyText = `Your bill "${title}" of ₱${amount.toFixed(2)} is due TODAY!`;
        } else if (daysBefore === 1) {
          notificationTitle = 'Bill Reminder';
          bodyText = `Your bill "${title}" of ₱${amount.toFixed(2)} is due TOMORROW`;
        } else {
          notificationTitle = 'Bill Reminder';
          bodyText = `Your bill "${title}" of ₱${amount.toFixed(2)} is due in ${daysBefore} days`;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationTitle,
            body: bodyText,
            data: {
              type: 'bill',
              id: billId,
              title,
              amount,
              dueDate: dueDate.toISOString(),
            } satisfies NotificationData,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationDate,
          },
        });

        notificationIds.push(notificationId);
      } catch (error) {
        console.error('Error scheduling bill notification:', error);
      }
    }
  }

  return notificationIds;
}

/**
 * Schedule a notification for a loan due date
 */
export async function scheduleLoanNotification(
  loanId: string,
  title: string,
  amount: number,
  dueDate: Date,
  isLender: boolean,
  daysBeforeArray: number[] = [7, 3, 0] // Notify 7 days before, 3 days before, and on due date
): Promise<string[]> {
  const notificationIds: string[] = [];

  for (const daysBefore of daysBeforeArray) {
    const notificationDate = new Date(dueDate);
    notificationDate.setDate(notificationDate.getDate() - daysBefore);
    notificationDate.setHours(9, 0, 0, 0);

    if (notificationDate > new Date()) {
      try {
        let notificationTitle: string;
        let bodyText: string;
        const role = isLender ? 'receive' : 'pay';
        
        if (daysBefore === 0) {
          notificationTitle = 'Loan Due Today';
          bodyText = `Loan "${title}" (₱${amount.toFixed(2)}) is due TODAY - ${role} payment`;
        } else if (daysBefore === 1) {
          notificationTitle = 'Loan Reminder';
          bodyText = `Loan "${title}" (₱${amount.toFixed(2)}) is due TOMORROW - ${role} payment`;
        } else {
          notificationTitle = 'Loan Reminder';
          bodyText = `Loan "${title}" (₱${amount.toFixed(2)}) is due in ${daysBefore} days - ${role} payment`;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationTitle,
            body: bodyText,
            data: {
              type: 'loan',
              id: loanId,
              title,
              amount,
              dueDate: dueDate.toISOString(),
            } satisfies NotificationData,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationDate,
          },
        });

        notificationIds.push(notificationId);
      } catch (error) {
        console.error('Error scheduling loan notification:', error);
      }
    }
  }

  return notificationIds;
}

/**
 * Schedule overdue notification (for items past due date)
 */
export async function scheduleOverdueNotification(
  itemId: string,
  itemType: 'bill' | 'loan',
  title: string,
  amount: number,
  daysPastDue: number
): Promise<string | null> {
  try {
    // Schedule for next hour
    const trigger = new Date();
    trigger.setHours(trigger.getHours() + 1);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${itemType === 'bill' ? 'Bill' : 'Loan'} Overdue`,
        body: `"${title}" (₱${amount.toFixed(2)}) is ${daysPastDue} day(s) overdue!`,
        data: {
          type: 'overdue',
          id: itemId,
          title,
          amount,
        } satisfies NotificationData,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling overdue notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Send immediate notification (for testing or urgent alerts)
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: NotificationData
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as Record<string, unknown>,
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0);
}
