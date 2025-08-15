import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { theme, spacing, typography } from '../theme/theme';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
      
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data
        await AsyncStorage.setItem('userRole', data.role);
        await AsyncStorage.setItem('username', data.username);
        await AsyncStorage.setItem('userId', data.id.toString());
        await AsyncStorage.setItem('userToken', data.token || 'demo_token');

        Alert.alert('Success', `Welcome ${data.name || data.username}!`);
        onLogin();
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="construct" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>TAJ Electronics</Text>
          <Text style={styles.subtitle}>Mobile CRM System</Text>
        </View>

        <Card style={styles.loginCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.loginTitle}>Sign In</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <View style={styles.demoCredentials}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Admin: admin / admin123</Text>
              <Text style={styles.demoText}>Technician: technician / password</Text>
              <Text style={styles.demoText}>Engineer: engineer / engineer123</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    ...typography.headingLarge,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: spacing.xl,
  },
  loginTitle: {
    ...typography.headingMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: theme.colors.onSurface,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    marginTop: spacing.lg,
    borderRadius: theme.roundness,
  },
  loginButtonContent: {
    paddingVertical: spacing.sm,
  },
  demoCredentials: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.roundness,
  },
  demoTitle: {
    ...typography.labelLarge,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  demoText: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs / 2,
  },
});