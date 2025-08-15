import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme, spacing, typography } from '../theme/theme';

interface TrackingData {
  type: 'receipt' | 'service';
  data: any;
}

export default function TrackingScreen() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/track/${trackingNumber.trim()}`);
      
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      } else {
        Alert.alert('Not Found', 'Tracking number not found. Please check and try again.');
        setTrackingData(null);
      }
    } catch (error) {
      console.error('Tracking error:', error);
      Alert.alert('Error', 'Failed to track. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'In Process': return '#2196F3';
      case 'Product Ordered': return '#9C27B0';
      case 'Ready to Deliver': return '#4CAF50';
      case 'Delivered': return '#757575';
      default: return '#757575';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Pending': return 20;
      case 'In Process': return 40;
      case 'Product Ordered': return 60;
      case 'Ready to Deliver': return 80;
      case 'Delivered': return 100;
      default: return 0;
    }
  };

  const renderReceiptTracking = (receipt: any) => (
    <View style={styles.trackingContainer}>
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.receiptNumber}>{receipt.receiptNumber}</Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(receipt.status) }]}
              textStyle={styles.statusText}
            >
              {receipt.status}
            </Chip>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>{receipt.customerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>{receipt.mobile}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="phone-portrait" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>{receipt.product} - {receipt.model}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>₹{receipt.estimatedAmount.toLocaleString()}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Progress Tracker */}
      <Card style={styles.progressCard}>
        <Card.Content>
          <Text style={styles.progressTitle}>Repair Progress</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${getProgressPercentage(receipt.status)}%`,
                    backgroundColor: getStatusColor(receipt.status)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {getProgressPercentage(receipt.status)}% Complete
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {[
              { status: 'Pending', label: 'Received', icon: 'time' },
              { status: 'In Process', label: 'Processing', icon: 'construct' },
              { status: 'Product Ordered', label: 'Parts Ordered', icon: 'cube' },
              { status: 'Ready to Deliver', label: 'Ready', icon: 'checkmark-circle' },
              { status: 'Delivered', label: 'Delivered', icon: 'car' }
            ].map((step, index) => {
              const isActive = getProgressPercentage(receipt.status) >= (index + 1) * 20;
              const isCurrent = receipt.status === step.status;
              
              return (
                <View key={step.status} style={styles.stepItem}>
                  <View style={[
                    styles.stepIcon,
                    { 
                      backgroundColor: isActive ? getStatusColor(receipt.status) : theme.colors.outline,
                      borderWidth: isCurrent ? 3 : 0,
                      borderColor: theme.colors.primary
                    }
                  ]}>
                    <Ionicons 
                      name={step.icon as any} 
                      size={16} 
                      color={isActive ? '#FFFFFF' : theme.colors.onSurfaceVariant} 
                    />
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    { color: isActive ? theme.colors.onSurface : theme.colors.onSurfaceVariant }
                  ]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      {/* Problem Description */}
      <Card style={styles.problemCard}>
        <Card.Content>
          <Text style={styles.problemTitle}>Problem Description</Text>
          <Text style={styles.problemText}>{receipt.problemDescription}</Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.title}>Track Your Repair</Text>
        
        <TextInput
          label="Receipt/Service Number"
          value={trackingNumber}
          onChangeText={setTrackingNumber}
          mode="outlined"
          style={styles.input}
          placeholder="Enter TD001 or TE001"
          left={<TextInput.Icon icon="magnify" />}
        />

        <Button
          mode="contained"
          onPress={handleTrack}
          loading={loading}
          disabled={loading || !trackingNumber.trim()}
          style={styles.trackButton}
          contentStyle={styles.trackButtonContent}
        >
          Track Status
        </Button>
      </View>

      <ScrollView 
        style={styles.resultsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Tracking...</Text>
          </View>
        )}

        {trackingData && trackingData.type === 'receipt' && renderReceiptTracking(trackingData.data)}

        {trackingData && trackingData.type === 'service' && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.serviceTitle}>Service Request {trackingData.data.complaintNumber}</Text>
              <Text style={styles.serviceInfo}>Customer: {trackingData.data.customerName}</Text>
              <Text style={styles.serviceInfo}>Product: {trackingData.data.product}</Text>
              <Text style={styles.serviceInfo}>Status: {trackingData.data.status}</Text>
              <Text style={styles.serviceInfo}>Address: {trackingData.data.address}</Text>
            </Card.Content>
          </Card>
        )}

        {!loading && !trackingData && trackingNumber && (
          <View style={styles.notFoundContainer}>
            <Ionicons name="search" size={64} color={theme.colors.outline} />
            <Text style={styles.notFoundText}>No results found</Text>
            <Text style={styles.notFoundSubtext}>
              Please check your tracking number and try again
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchSection: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...typography.headingLarge,
    color: theme.colors.onSurface,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  trackButton: {
    borderRadius: theme.roundness,
  },
  trackButtonContent: {
    paddingVertical: spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  trackingContainer: {
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptNumber: {
    ...typography.headingMedium,
    color: theme.colors.primary,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodyMedium,
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
  },
  progressTitle: {
    ...typography.headingSmall,
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepLabel: {
    ...typography.labelSmall,
    textAlign: 'center',
  },
  problemCard: {
    backgroundColor: theme.colors.surface,
  },
  problemTitle: {
    ...typography.headingSmall,
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  problemText: {
    ...typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  serviceTitle: {
    ...typography.headingMedium,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  serviceInfo: {
    ...typography.bodyMedium,
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  notFoundContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  notFoundText: {
    ...typography.headingSmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  notFoundSubtext: {
    ...typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});