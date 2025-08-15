import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Searchbar,
  FAB,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme, spacing, typography } from '../theme/theme';

interface Receipt {
  id: number;
  receiptNumber: string;
  customerName: string;
  mobile: string;
  product: string;
  model: string;
  estimatedAmount: number;
  status: string;
  createdAt: string;
  problemDescription: string;
}

export default function ReceiptsScreen({ navigation }: any) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [searchQuery, receipts]);

  const fetchReceipts = async () => {
    try {
      const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/receipts`);
      
      if (response.ok) {
        const data = await response.json();
        setReceipts(data);
      } else {
        throw new Error('Failed to fetch receipts');
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      Alert.alert('Error', 'Failed to load receipts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterReceipts = () => {
    if (!searchQuery) {
      setFilteredReceipts(receipts);
      return;
    }

    const filtered = receipts.filter(receipt =>
      receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.mobile.includes(searchQuery) ||
      receipt.product.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredReceipts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
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

  const handleWhatsApp = (receipt: Receipt) => {
    const message = `Hello ${receipt.customerName}, your repair receipt ${receipt.receiptNumber} status: ${receipt.status}. Track: https://tajdws.com/track/${receipt.receiptNumber}`;
    const url = `whatsapp://send?phone=${receipt.mobile}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  const handleCall = (mobile: string) => {
    Linking.openURL(`tel:${mobile}`);
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <Card style={styles.receiptCard}>
      <Card.Content>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptNumber}>{item.receiptNumber}</Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status}
          </Chip>
        </View>

        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.deviceInfo}>{item.product} - {item.model}</Text>
        <Text style={styles.amount}>₹{item.estimatedAmount.toLocaleString()}</Text>
        
        <Text style={styles.problemText} numberOfLines={2}>
          {item.problemDescription}
        </Text>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => handleCall(item.mobile)}
            style={styles.actionButton}
            icon="phone"
            compact
          >
            Call
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleWhatsApp(item)}
            style={styles.actionButton}
            icon="message"
            compact
          >
            WhatsApp
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search receipts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No receipts found</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReceipt')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  searchbar: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: spacing.md,
  },
  receiptCard: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  receiptNumber: {
    ...typography.headingSmall,
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
  customerName: {
    ...typography.bodyLarge,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  deviceInfo: {
    ...typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.headingSmall,
    color: theme.colors.tertiary,
    marginBottom: spacing.sm,
  },
  problemText: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
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
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});