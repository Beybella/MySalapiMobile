/**
 * Notification History Management
 * Stores and manages in-app notification history using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_HISTORY_KEY = '@mysalapi_notification_history';
const MAX_HISTORY_ITEMS = 50; // Keep last 50 notifications

export interface NotificationHistoryItem {
  id: string;
  type: 'bill' | 'loan' | 'singil' | 'overdue' | 'group' | 'budget';
  title: string;
  body: string;
  timestamp: string; // ISO date string
  read: boolean;
  data?: {
    itemId?: string;
    amount?: number;
    dueDate?: string;
    from?: string; // For Singil notifications
  };
}

/**
 * Add a notification to history
 */
export async function addNotificationToHistory(
  notification: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'>
): Promise<void> {
  try {
    const history = await getNotificationHistory();
    
    const newNotification: NotificationHistoryItem = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Add to beginning of array (newest first)
    history.unshift(newNotification);

    // Keep only MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error adding notification to history:', error);
  }
}

/**
 * Get all notification history
 */
export async function getNotificationHistory(): Promise<NotificationHistoryItem[]> {
  try {
    const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting notification history:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const history = await getNotificationHistory();
    return history.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const history = await getNotificationHistory();
    const updatedHistory = history.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  try {
    const history = await getNotificationHistory();
    const updatedHistory = history.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

/**
 * Delete a notification from history
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const history = await getNotificationHistory();
    const updatedHistory = history.filter(n => n.id !== notificationId);
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

/**
 * Clear all notification history
 */
export async function clearNotificationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing notification history:', error);
  }
}

/**
 * Get notifications grouped by date
 */
export async function getGroupedNotifications(): Promise<{
  today: NotificationHistoryItem[];
  yesterday: NotificationHistoryItem[];
  earlier: NotificationHistoryItem[];
}> {
  const history = await getNotificationHistory();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    today: history.filter(n => new Date(n.timestamp) >= today),
    yesterday: history.filter(n => {
      const date = new Date(n.timestamp);
      return date >= yesterday && date < today;
    }),
    earlier: history.filter(n => new Date(n.timestamp) < yesterday),
  };
}

/**
 * Auto-add notification when received (call this from notification listener)
 */
export async function autoLogNotification(
  notification: any
): Promise<void> {
  const { request } = notification;
  const { content } = request;
  
  // Extract notification type from data
  const notifData = content.data as any;
  const type = notifData?.type || 'bill';
  
  await addNotificationToHistory({
    type,
    title: content.title || 'Notification',
    body: content.body || '',
    data: {
      itemId: notifData?.id,
      amount: notifData?.amount,
      dueDate: notifData?.dueDate,
      from: notifData?.from,
    },
  });
}
