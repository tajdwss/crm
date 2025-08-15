import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export class NotificationService {
  static async scheduleReceiptAlert(receiptNumber: string, customerName: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Receipt Ready!',
          body: `Receipt ${receiptNumber} for ${customerName} is ready for delivery`,
          data: { 
            type: 'receipt_ready',
            receiptNumber,
            customerName 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error scheduling receipt notification:', error);
    }
  }

  static async scheduleServiceAlert(complaintNumber: string, customerName: string, status: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔧 Service Update',
          body: `Service ${complaintNumber} for ${customerName} - Status: ${status}`,
          data: { 
            type: 'service_update',
            complaintNumber,
            customerName,
            status 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error scheduling service notification:', error);
    }
  }

  static async schedulePaymentAlert(receiptNumber: string, amount: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Payment Received',
          body: `Payment of ₹${amount.toLocaleString()} received for ${receiptNumber}`,
          data: { 
            type: 'payment_received',
            receiptNumber,
            amount 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error scheduling payment notification:', error);
    }
  }

  static async scheduleWorkAssignmentAlert(assignmentId: number, workType: string, workId: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 New Work Assignment',
          body: `You have been assigned ${workType} work: ${workId}`,
          data: { 
            type: 'work_assignment',
            assignmentId,
            workType,
            workId 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error scheduling work assignment notification:', error);
    }
  }

  static async sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}