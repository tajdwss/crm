import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { theme, spacing, typography } from '../theme/theme';

export default function ProfileScreen({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadUserInfo();
    checkNotificationSettings();
  }, []);

  const loadUserInfo = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      const userRole = await AsyncStorage.getItem('userRole');
      const userId = await AsyncStorage.getItem('userId');
      
      setUserInfo({
        username,
        role: userRole,
        id: userId,
      });
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationSettings = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking notification settings:', error);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive alerts.'
          );
        }
      } else {
        setNotificationsEnabled(false);
        // Note: You can't programmatically disable notifications,
        // user needs to do it in device settings
        Alert.alert(
          'Disable Notifications',
          'To disable notifications, please go to your device settings.'
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
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
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color={theme.colors.onPrimary} />
        </View>
        <Text style={styles.username}>{userInfo?.username}</Text>
        <Text style={styles.role}>{userInfo?.role?.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive alerts for new receipts and updates"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                />
              )}
            />

            <List.Item
              title="App Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />

            <List.Item
              title="About"
              description="TAJ Electronics Mobile CRM"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Notifications')}
              style={styles.actionButton}
              icon="bell"
            >
              View All Notifications
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert('Support', 'Contact: +91 98765 43210\nEmail: support@tajelectronics.com');
              }}
              style={styles.actionButton}
              icon="help-circle"
            >
              Contact Support
            </Button>

            <Button
              mode="contained"
              onPress={handleLogout}
              style={[styles.actionButton, styles.logoutButton]}
              buttonColor={theme.colors.error}
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
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
  },
  header: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  username: {
    ...typography.headingLarge,
    color: theme.colors.onPrimary,
    marginBottom: spacing.xs,
  },
  role: {
    ...typography.bodyMedium,
    color: theme.colors.onPrimary,
    opacity: 0.8,
  },
  content: {
    padding: spacing.md,
  },
  settingsCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  actionsCard: {
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    ...typography.headingSmall,
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});