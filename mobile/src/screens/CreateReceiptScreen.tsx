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
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, typography } from '../theme/theme';

export default function CreateReceiptScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    isCompanyItem: false,
    companyName: '',
    companyMobile: '',
    product: '',
    model: '',
    problemDescription: '',
    estimatedAmount: '',
    estimatedDeliveryDate: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.customerName || !formData.mobile || !formData.product) {
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
      
      const receiptData = {
        customerName: formData.customerName,
        mobile: formData.mobile,
        isCompanyItem: formData.isCompanyItem,
        companyName: formData.companyName || undefined,
        companyMobile: formData.companyMobile || undefined,
        product: formData.product,
        model: formData.model || '',
        problemDescription: formData.problemDescription || '',
        estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : 0,
        estimatedDeliveryDate: formData.estimatedDeliveryDate || '',
        status: 'Pending',
      };

      const response = await fetch(`${baseUrl}/api/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        const newReceipt = await response.json();
        
        Alert.alert(
          'Success',
          `Receipt ${newReceipt.receiptNumber} created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  customerName: '',
                  mobile: '',
                  isCompanyItem: false,
                  companyName: '',
                  companyMobile: '',
                  product: '',
                  model: '',
                  problemDescription: '',
                  estimatedAmount: '',
                  estimatedDeliveryDate: '',
                });
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create receipt');
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
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
          <Text style={styles.title}>Create New Receipt</Text>
        </View>

        <Card style={styles.formCard}>
          <Card.Content style={styles.cardContent}>
            {/* Customer Information */}
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
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

            {/* Company Item Toggle */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Company Item</Text>
              <Switch
                value={formData.isCompanyItem}
                onValueChange={(value) => updateField('isCompanyItem', value)}
              />
            </View>

            {formData.isCompanyItem && (
              <>
                <TextInput
                  label="Company Name"
                  value={formData.companyName}
                  onChangeText={(text) => updateField('companyName', text)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="office-building" />}
                />

                <TextInput
                  label="Company Mobile"
                  value={formData.companyMobile}
                  onChangeText={(text) => updateField('companyMobile', text)}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                />
              </>
            )}

            {/* Product Information */}
            <Text style={styles.sectionTitle}>Product Information</Text>
            
            <TextInput
              label="Product Type *"
              value={formData.product}
              onChangeText={(text) => updateField('product', text)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Mobile, Laptop, TV"
              left={<TextInput.Icon icon="devices" />}
            />

            <TextInput
              label="Model"
              value={formData.model}
              onChangeText={(text) => updateField('model', text)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., iPhone 13, Dell Inspiron"
              left={<TextInput.Icon icon="information" />}
            />

            <TextInput
              label="Problem Description"
              value={formData.problemDescription}
              onChangeText={(text) => updateField('problemDescription', text)}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Describe the issue..."
              left={<TextInput.Icon icon="alert-circle" />}
            />

            <TextInput
              label="Estimated Amount (₹)"
              value={formData.estimatedAmount}
              onChangeText={(text) => updateField('estimatedAmount', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
            />

            <TextInput
              label="Estimated Delivery Date"
              value={formData.estimatedDeliveryDate}
              onChangeText={(text) => updateField('estimatedDeliveryDate', text)}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
              left={<TextInput.Icon icon="calendar" />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {loading ? 'Creating Receipt...' : 'Create Receipt'}
            </Button>
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
  sectionTitle: {
    ...typography.headingSmall,
    color: theme.colors.primary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  submitButton: {
    marginTop: spacing.lg,
    borderRadius: theme.roundness,
  },
  submitButtonContent: {
    paddingVertical: spacing.md,
  },
});