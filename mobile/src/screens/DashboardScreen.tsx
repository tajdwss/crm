import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { theme, spacing, typography } from '../theme/theme';

interface DashboardStats {
  todayReceipts: number;
  lastReceiptNumber: string;
  readyToDeliver: number;
}

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    loadUserInfo();
    fetchStats();
  }, []);

  const loadUserInfo = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const name = await AsyncStorage.getItem('username');
      setUserRole(role || '');
      setUsername(name || '');
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/stats`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userRole', 'username', 'userId', 'userToken']);
            // This would trigger app restart in the main App component
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.usernameText}>{username}</Text>
              <Text style={styles.roleText}>{userRole.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <Button
              mode="outlined"
              onPress={handleLogout}
              compact
              icon="logout"
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="receipt" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.statNumber}>{stats?.todayReceipts || 0}</Text>
              <Text style={styles.statLabel}>Today's Receipts</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={24} color={theme.colors.secondary} />
              </View>
              <Text style={styles.statNumber}>{stats?.lastReceiptNumber || 'TD000'}</Text>
              <Text style={styles.statLabel}>Last Receipt</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.tertiary} />
              </View>
              <Text style={styles.statNumber}>{stats?.readyToDeliver || 0}</Text>
              <Text style={styles.statLabel}>Ready to Deliver</Text>
              {(stats?.readyToDeliver || 0) > 0 && (
                <Badge style={styles.alertBadge}>Alert</Badge>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <Card style={styles.actionCard} onPress={() => navigation.navigate('CreateReceipt')}>
              <Card.Content style={styles.actionCardContent}>
                <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
                <Text style={styles.actionText}>Create Receipt</Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => navigation.navigate('Receipts')}>
              <Card.Content style={styles.actionCardContent}>
                <Ionicons name="list" size={32} color={theme.colors.secondary} />
                <Text style={styles.actionText}>View Receipts</Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => navigation.navigate('Service')}>
              <Card.Content style={styles.actionCardContent}>
                <Ionicons name="construct" size={32} color={theme.colors.tertiary} />
                <Text style={styles.actionText}>Service Calls</Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => navigation.navigate('Tracking')}>
              <Card.Content style={styles.actionCardContent}>
                <Ionicons name="search" size={32} color="#9C27B0" />
                <Text style={styles.actionText}>Track Status</Text>
              </Card.Content>
            </Card>
          </View>
        </div>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <Card.Content>
              <Text style={styles.activityText}>
                📱 New receipt TD{String((stats?.todayReceipts || 0) + 1).padStart(3, '0')} will be created next
              </Text>
              <Text style={styles.activityTime}>Ready to create</Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReceipt')}
        label="New Receipt"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...typography.bodyLarge,
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    ...typography.bodyMedium,
    color: theme.colors.onPrimary,
    opacity: 0.8,
  },
  usernameText: {
    ...typography.headingMedium,
    color: theme.colors.onPrimary,
    marginBottom: spacing.xs,
  },
  roleText: {
    ...typography.labelMedium,
    color: theme.colors.onPrimary,
    opacity: 0.9,
  },
  logoutButton: {
    borderColor: theme.colors.onPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statIconContainer: {
    marginBottom: spacing.sm,
  },
  statNumber: {
    ...typography.headingMedium,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  alertBadge: {
    backgroundColor: theme.colors.error,
    marginTop: spacing.xs,
  },
  quickActionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headingSmall,
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  actionText: {
    ...typography.labelLarge,
    color: theme.colors.onSurface,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  recentActivityContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
  },
  activityText: {
    ...typography.bodyMedium,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  activityTime: {
    ...typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});