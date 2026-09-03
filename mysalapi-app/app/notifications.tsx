/**
 * Notification Center Screen
 * Shows notification history with grouping by date
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotificationHistory, useGroupedNotifications } from '../hooks/useNotificationHistory';
import { NotificationHistoryItem } from '../lib/notificationHistory';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { unreadCount, markAllAsRead, clearAll, refresh } = useNotificationHistory();
  const { grouped, loading } = useGroupedNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await refresh();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notification history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
          },
        },
      ]
    );
  };

  const totalNotifications =
    grouped.today.length + grouped.yesterday.length + grouped.earlier.length;

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerButton}>
                  <Ionicons name="checkmark-done" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalNotifications}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, unreadCount > 0 && { color: colors.primary }]}>
              {unreadCount}
            </Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>

        {/* Empty State */}
        {totalNotifications === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={80} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You'll see notifications here when you receive bill reminders, loan alerts, and
              payment requests.
            </Text>
          </View>
        )}

        {/* Today Section */}
        {grouped.today.length > 0 && (
          <NotificationSection
            title="Today"
            notifications={grouped.today}
            onRefresh={refresh}
          />
        )}

        {/* Yesterday Section */}
        {grouped.yesterday.length > 0 && (
          <NotificationSection
            title="Yesterday"
            notifications={grouped.yesterday}
            onRefresh={refresh}
          />
        )}

        {/* Earlier Section */}
        {grouped.earlier.length > 0 && (
          <NotificationSection
            title="Earlier"
            notifications={grouped.earlier}
            onRefresh={refresh}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface NotificationSectionProps {
  title: string;
  notifications: NotificationHistoryItem[];
  onRefresh: () => void;
}

function NotificationSection({ title, notifications, onRefresh }: NotificationSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRefresh={onRefresh}
        />
      ))}
    </View>
  );
}

interface NotificationCardProps {
  notification: NotificationHistoryItem;
  onRefresh: () => void;
}

function NotificationCard({ notification, onRefresh }: NotificationCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { markAsRead, deleteNotification } = useNotificationHistory();

  const getIcon = () => {
    switch (notification.type) {
      case 'bill':
        return { name: 'receipt-outline' as const, color: colors.primary };
      case 'loan':
        return { name: 'hand-right-outline' as const, color: colors.pautangLedger };
      case 'singil':
        return { name: 'mail-outline' as const, color: colors.warning };
      case 'overdue':
        return { name: 'alert-circle-outline' as const, color: colors.error };
      case 'group':
        return { name: 'people-outline' as const, color: colors.ambaganLedger };
      case 'budget':
        return { name: 'wallet-outline' as const, color: colors.budgetPlanner };
      default:
        return { name: 'notifications-outline' as const, color: colors.textSecondary };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleTap = async () => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
      await onRefresh();
    }

    // Navigate based on type
    const itemId = notification.data?.itemId;
    if (!itemId) return;

    switch (notification.type) {
      case 'bill':
        router.push('/(tabs)/budget');
        break;
      case 'loan':
      case 'singil':
        router.push({ pathname: '/loan-detail', params: { id: itemId } });
        break;
      case 'group':
        router.push({ pathname: '/group-detail', params: { id: itemId } });
        break;
      case 'budget':
        router.push('/(tabs)/budget');
        break;
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Notification', 'Remove this notification from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNotification(notification.id);
          await onRefresh();
        },
      },
    ]);
  };

  const icon = getIcon();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.card, !notification.read && styles.cardUnread]}
      onPress={handleTap}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
        <Ionicons name={icon.name} size={24} color={icon.color} />
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !notification.read && styles.textUnread]}>
          {notification.title}
        </Text>
        <Text style={styles.cardBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.cardTime}>{formatTime(notification.timestamp)}</Text>
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Ionicons name="close-circle" size={20} color={colors.textLight} />
      </TouchableOpacity>

      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof import('../context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRight: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerButton: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: 16,
    marginTop: 24,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  cardUnread: {
    borderLeftColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  textUnread: {
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  deleteButton: {
    padding: 4,
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 40,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
