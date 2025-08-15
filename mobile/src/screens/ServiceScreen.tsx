import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme, spacing, typography } from '../theme/theme';

export default function ServiceScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    location: '',
    product: '',
    issueDescription: '',
    priority: 'Normal',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.customerName || !formData.mobile || !formData.location || 
        !formData.product || !formData.issueDescription) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
      
      const serviceData = {
        customerName: formData.customerName,
        mobile: formData.mobile,
        address: formData.location,
        product: formData.product,
        model: '',
        issueDescription: formData.issueDescription,
        priority: formData.priority,
        status: 'Pending',
        assignedEngineerId: null,
      };

      const response = await fetch(`${baseUrl}/api/service-complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        const newComplaint = await response.json();
        
        Alert.alert(
          'Success',
          `Service request ${newComplaint.complaintNumber} submitted successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  customerName: '',
                  mobile: '',
                  location: '',
                  product: '',
                  issueDescription: '',
                  priority: 'Normal',
                });
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to submit service request');
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            icon="arrow-left"
            style={styles.backButton}
          >
            Back
          </Button>
          <Text style={styles.title}>Service Request</Text>
        </View>

        <Card style={styles.formCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="construct" size={48} color={theme.colors.primary} />
            </View>
            
            <Text style={styles.subtitle}>Submit Service Request</Text>
            <Text style={styles.description}>
              Fill out the form below to request a service engineer visit
            </Text>

            <TextInput
              label="Customer Name *"
              value={formData.customerName}
              onChangeText={(text) => updateField('customerName', text)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Mobile Number *"
              value={formData.mobile}
              onChangeText={(text) => updateField('mobile', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Service Location *"
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder="Enter complete address where service is required"
              left={<TextInput.Icon icon="map-marker" />}
            />

            <TextInput
              label="Device/Product Type *"
              value={formData.product}
              onChangeText={(text) => updateField('product', text)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Mobile Phone, Laptop, AC, TV"
              left={<TextInput.Icon icon="devices" />}
            />

            <TextInput
              label="Issue Description *"
              value={formData.issueDescription}
              onChangeText={(text) => updateField('issueDescription', text)}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Describe the problem with your device in detail"
              left={<TextInput.Icon icon="alert-circle" />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {loading ? 'Submitting Request...' : 'Submit Service Request'}
            </Button>

            <Text style={styles.noteText}>
              * Required fields. Our team will contact you within 24 hours.
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
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
  formCard: {
    margin: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.headingMedium,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: theme.roundness,
  },
  submitButtonContent: {
    paddingVertical: spacing.md,
  },
  noteText: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});