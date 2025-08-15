import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { theme, spacing, typography } from '../theme/theme';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: any;
  date: Date;
  read: boolean;
}

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Listen for new notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const newNotification: NotificationItem = {
        id: notification.request.identifier,
        title: notification.request.content.title || 'TAJ Electronics',
        body: notification.request.content.body || '',
        data: notification.request.content.data || {},
        date: new Date(),
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => subscription.remove();
  }, []);

  const loadNotifications = async () => {
    try {
      // In a real app, you'd fetch from your server
      // For now, we'll show some sample notifications
      const sampleNotifications: NotificationItem[] = [
        {
          id: '1',
          title: 'Receipt Ready',
          body: 'Receipt TD001 is ready for delivery',
          data: { receiptNumber: 'TD001' },
          date: new Date(),
          read: false,
        },
        {
          id: '2',
          title: 'Service Assigned',
          body: 'Service engineer assigned to TE001',
          data: { complaintNumber: 'TE001' },
          date: new Date(Date.now() - 3600000), // 1 hour ago
          read: true,
        },
        {
          id: '3',
          title: 'Payment Received',
          body: 'Payment received for TD002',
          data: { receiptNumber: 'TD002' },
          date: new Date(Date.now() - 7200000), // 2 hours ago
          read: true,
        },
      ];
      
      setNotifications(sampleNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('Receipt')) return 'receipt';
    if (title.includes('Service')) return 'construct';
    if (title.includes('Payment')) return 'card';
    return 'notifications';
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <Card 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleContainer}>
            <Ionicons 
              name={getNotificationIcon(item.title) as any} 
              size={20} 
              color={theme.colors.primary} 
            />
            <Text style={styles.notificationTitle}>{item.title}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationBody}>{item.body}</Text>
        
        <Text style={styles.notificationTime}>
          {item.date.toLocaleString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Back
        </Button>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    color: theme.colors.onSurface,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  unreadCard: {
    backgroundColor: theme.colors.primaryContainer,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  notificationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTitle: {
    ...typography.headingSmall,
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  notificationBody: {
    ...typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  notificationTime: {
    ...typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
});