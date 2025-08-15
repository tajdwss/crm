import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

export class ApiService {
  static async request(endpoint: string, options: RequestInit = {}) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async get(endpoint: string) {
    return this.request(endpoint);
  }

  static async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async patch(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Specific API methods
  static async login(username: string, password: string) {
    return this.post('/api/login', { username, password });
  }

  static async getReceipts() {
    return this.get('/api/receipts');
  }

  static async createReceipt(receiptData: any) {
    return this.post('/api/receipts', receiptData);
  }

  static async updateReceipt(id: number, updates: any) {
    return this.patch(`/api/receipts/${id}`, updates);
  }

  static async trackItem(trackingNumber: string) {
    return this.get(`/api/track/${trackingNumber}`);
  }

  static async createServiceComplaint(complaintData: any) {
    return this.post('/api/service-complaints', complaintData);
  }

  static async getStats() {
    return this.get('/api/stats');
  }

  static async updatePushToken(userId: number, pushToken: string) {
    return this.post(`/api/users/${userId}/push-token`, { pushToken });
  }
}