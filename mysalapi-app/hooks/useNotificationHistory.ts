/**
 * Hook for managing notification history
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getNotificationHistory,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotificationHistory,
  getGroupedNotifications,
  NotificationHistoryItem,
} from '@/lib/notificationHistory';

export function useNotificationHistory() {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getNotificationHistory();
      const count = await getUnreadCount();
      setNotifications(history);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
    await loadNotifications();
  }, [loadNotifications]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
    await loadNotifications();
  }, [loadNotifications]);

  // Delete notification
  const handleDelete = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId);
    await loadNotifications();
  }, [loadNotifications]);

  // Clear all
  const handleClearAll = useCallback(async () => {
    await clearNotificationHistory();
    await loadNotifications();
  }, [loadNotifications]);

  // Load on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: loadNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    clearAll: handleClearAll,
  };
}

export function useGroupedNotifications() {
  const [grouped, setGrouped] = useState<{
    today: NotificationHistoryItem[];
    yesterday: NotificationHistoryItem[];
    earlier: NotificationHistoryItem[];
  }>({ today: [], yesterday: [], earlier: [] });
  const [loading, setLoading] = useState(true);

  const loadGrouped = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGroupedNotifications();
      setGrouped(data);
    } catch (error) {
      console.error('Error loading grouped notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrouped();
  }, [loadGrouped]);

  return { grouped, loading, refresh: loadGrouped };
}
