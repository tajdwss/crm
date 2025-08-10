import 'dotenv/config';
import { Receipt, ServiceComplaint } from "../shared/schema.js";
import { whatsappService } from "./whatsapp-service";

// SMS Gateway Configuration
const SMS_API_URL = process.env.SMS_API_URL || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'TAJCRM';


interface SMSMessage {
  to: string;
  message: string;
  type: 'OTP' | 'STATUS_UPDATE' | 'NOTIFICATION';
}


function getUsageMappingSync(): any | undefined {
  try {
    const fs = require('fs');
    const path = require('path');
    const p = path.join(process.cwd(), 'data', 'whatsapp-settings.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw)?.templateUsage;
    }
  } catch {}
  return undefined;
}

export class NotificationService {

  // WhatsApp message via Meta Graph API using saved settings
  async sendWhatsAppMessage(to: string, userName: string, campaignName: string, templateParams?: string[], source?: string): Promise<boolean> {
    try {
      // Map legacy campaignName/templateParams to either a text or template send
      // If there are template params, assume a template with same name
      const toSanitized = to?.replace(/\D/g, '');
      if (!toSanitized) return false;

      if (templateParams && templateParams.length > 0) {
        const result = await whatsappService.sendTemplateMessage(toSanitized, campaignName, templateParams);
        return !!result.success;
      } else {
        // Fallback to a plain text message that includes campaign name
        const text = `${userName ? userName + ': ' : ''}${campaignName}`;
        const result = await whatsappService.sendTextMessage(toSanitized, text);
        return !!result.success;
      }
    } catch (e) {
      console.error('Error sending WhatsApp via Graph API:', e);
      return false;
    }
  }

  // SMS Gateway Methods
  async sendSMS(smsData: SMSMessage): Promise<boolean> {
    try {
      if (!SMS_API_KEY || !SMS_API_URL) {
        console.log(`SMS for ${smsData.to}: ${smsData.message}`);
        return true; // For demo purposes
      }

      // Generic SMS API implementation (adapt for your provider)
      const response = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: smsData.to,
          from: SMS_SENDER_ID,
          text: smsData.message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('SMS sent successfully:', result);
        return true;
      } else {
        console.error('SMS API error:', result);
        return false;
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  // Receipt Notifications
  async sendReceiptCreatedNotification(receipt: Receipt): Promise<{ success: boolean; error?: string }> {
    const baseUrl = process.env.BASE_URL || 'https://tajdws.com';
    const trackingUrl = `${baseUrl}/track/${receipt.receiptNumber}`;

    // Build token map for flexible template param ordering
    const tokens: Record<string, string> = {
      receiptNumber: receipt.receiptNumber,
      customerName: receipt.customerName || '',
      productModel: `${receipt.product || ''} ${receipt.model || ''}`.trim(),
      estimatedAmount: String(receipt.estimatedAmount ?? 0),
      status: receipt.status || '',
      trackingUrl,
    };

    // Load saved UI settings if present (falls back to env if not)
    let tmplName = (process.env.WHATSAPP_RECEIPT_TEMPLATE || 'receipt_created').trim();
    let tmplLang = (process.env.WHATSAPP_RECEIPT_TEMPLATE_LANGUAGE || 'en').trim();
    let orderStr = (process.env.WHATSAPP_RECEIPT_TEMPLATE_PARAMS_ORDER || 'receiptNumber,customerName,productModel,estimatedAmount,status,trackingUrl');
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const settingsPath = path.join(process.cwd(), 'data', 'whatsapp-settings.json');
      const raw = await fs.readFile(settingsPath, 'utf-8');
      const saved = JSON.parse(raw);
      if (saved?.templateSettings) {
        tmplName = saved.templateSettings.receiptTemplateName || tmplName;
        tmplLang = saved.templateSettings.receiptTemplateLanguage || tmplLang;
        orderStr = saved.templateSettings.receiptTemplateParamsOrder || orderStr;
      }
    } catch {}

    // Comma separated keys choosing order and count, e.g.: "customerName,receiptNumber,trackingUrl"
    const order = orderStr.split(',').map(s => s.trim()).filter(Boolean);

    const templateParams = order.map((k) => tokens[k] ?? '');

    // Try mapping from Template Usage if present
    const usage = getUsageMappingSync()?.receipt_created;
    if (usage?.name) {
      try {
        const params = (usage.paramsOrder || '').split(',').map((k: string) => tokens[k.trim()] ?? '').filter((x: string) => x !== undefined);
        const tResult = await whatsappService.sendTemplateMessage(receipt.mobile, usage.name, params, usage.language || tmplLang);
        if (tResult.success) return { success: true };
        console.warn(`Template send failed for usage mapping ${usage.name}:`, tResult.error);
      } catch (e) {
        console.warn(`Template send threw for usage mapping:`, (e as any)?.message || e);
      }
    }

    try {
      const tResult = await whatsappService.sendTemplateMessage(receipt.mobile, tmplName, templateParams, tmplLang);
      if (tResult.success) return { success: true };
      console.warn(`Template send failed for ${tmplName}:`, tResult.error);
    } catch (e) {
      console.warn(`Template send threw for ${tmplName}:`, (e as any)?.message || e);
    }

    // Fallback: plain text message (may fail if outside 24h window)
    const text = `New Taj Electronics\n` +
      `Receipt Created: ${receipt.receiptNumber}\n` +
      `Name: ${receipt.customerName || ''}\n` +
      `Product: ${receipt.product || ''} ${receipt.model || ''}\n` +
      `Est. Amount: ${receipt.estimatedAmount ?? 0}\n` +
      `Status: ${receipt.status || ''}\n` +
      `Track: ${trackingUrl}`;

    const result = await whatsappService.sendTextMessage(receipt.mobile, text);
    if (!result.success) {
      console.error('Plain text send failed for receipt:', result.error);
    }
    return { success: result.success, error: result.error };
  }

  async sendReceiptStatusUpdate(receipt: Receipt, oldStatus: string): Promise<void> {
    const baseUrl = process.env.BASE_URL || 'https://tajdws.com';
    const trackingUrl = `${baseUrl}/track/${receipt.receiptNumber}`;

    // Plain text status update (no template required)
    const text = `New Taj Electronics\n` +
      `Status Updated for ${receipt.receiptNumber}\n` +
      `Name: ${receipt.customerName || ''}\n` +
      `Product: ${receipt.product || ''}\n` +
      `Old Status: ${oldStatus}\n` +
      `New Status: ${receipt.status || ''}\n` +
      `Track: ${trackingUrl}`;

    await whatsappService.sendTextMessage(receipt.mobile, text);

    // SMS for critical status updates
    if (receipt.status === 'Ready to Deliver' || receipt.status === 'Delivered' || receipt.status === 'Not Repaired - Return As It Is') {
      let smsText = '';
      if (receipt.status === 'Not Repaired - Return As It Is') {
        smsText = `New Taj Electronics: Your device ${receipt.product} could not be repaired. Please collect as is. No charges. Receipt: ${receipt.receiptNumber}. Contact: 07272-356183`;
      } else {
        smsText = `New Taj Electronics: Your device ${receipt.product} is ${receipt.status}. Receipt: ${receipt.receiptNumber}. Contact: 07272-356183`;
      }

      const smsMessage: SMSMessage = {
        to: receipt.mobile,
        message: smsText,
        type: 'STATUS_UPDATE'
      };

      await this.sendSMS(smsMessage);
    }
  }

  // OTP Delivery System
  async sendDeliveryOTP(mobile: string, otp: string, receiptNumber: string): Promise<boolean> {
    const smsMessage: SMSMessage = {
      to: mobile,
      message: `New Taj Electronics\nDelivery OTP for Receipt ${receiptNumber}: ${otp}\nValid for 10 minutes only.\nDo not share this OTP.`,
      type: 'OTP'
    };

    // Also send via WhatsApp for better delivery
    const templateParams = [
      receiptNumber,
      otp,
      '10 minutes'
    ];

    const smsResult = await this.sendSMS(smsMessage);

    // Send plain text OTP on WhatsApp
    const text = `New Taj Electronics\nDelivery OTP for Receipt ${receiptNumber}: ${otp}\nValid for 10 minutes only. Do not share this OTP.`;
    const w = await whatsappService.sendTextMessage(mobile, text);

    return smsResult || w.success; // Success if either method works
  }

  // Service Complaint Notifications
  async sendServiceComplaintCreated(complaint: ServiceComplaint): Promise<void> {
    const templateParams = [
      complaint.customerName || '',
      complaint.complaintNumber || '',
      complaint.product || '',
      complaint.model || '',
      complaint.issueDescription || '',
      complaint.status || ''
    ];

    await this.sendWhatsAppMessage(
      complaint.mobile,
      complaint.customerName || '',
      'service_complaint_created',
      templateParams,
      'TAJ_CRM'
    );
  }

  async sendServiceStatusUpdate(complaint: ServiceComplaint, oldStatus: string): Promise<void> {
    const templateParams = [
      complaint.customerName || '',
      complaint.complaintNumber || '',
      complaint.status || '',
      oldStatus,
      complaint.product || ''
    ];

    await this.sendWhatsAppMessage(
      complaint.mobile,
      complaint.customerName || '',
      'service_status_update',
      templateParams,
      'TAJ_CRM'
    );
  }

  // Auto-reply for customer messages
  async handleCustomerMessage(from: string, messageText: string): Promise<void> {
    // Simple auto-reply logic
    const lowerMessage = messageText.toLowerCase();

    let replyText = '';

    if (lowerMessage.includes('status') || lowerMessage.includes('update')) {
      replyText = `🔧 *New Taj Electronics* 🔧\n\n` +
                  `For status updates, please visit:\n` +
                  `https://tajdws.com/track\n\n` +
                  `Enter your receipt number (TD***) or complaint number (TE***)\n\n` +
                  `📞 Call: 07272-356183, 07272-220005\n` +
                  `📧 Email: tajdws@gmail.com`;
    } else if (lowerMessage.includes('track') || lowerMessage.includes('receipt')) {
      replyText = `📱 *New Taj Electronics* 📱\n\n` +
                  `To track your repair/service:\n` +
                  `1. Visit: https://tajdws.com/track\n` +
                  `2. Enter your receipt/complaint number\n` +
                  `3. Get real-time status updates\n\n` +
                  `📞 Support: 07272-356183`;
    } else {
      replyText = `👋 *New Taj Electronics* 👋\n\n` +
                  `Thank you for contacting us!\n\n` +
                  `📱 Track repairs: https://tajdws.com/track\n` +
                  `📞 Call us: 07272-356183, 07272-220005\n` +
                  `📧 Email: tajdws@gmail.com\n\n` +
                  `We'll respond to your message soon!`;
    }

    // For auto-replies, we'll use a simple text campaign
    const templateParams = [
      'https://tajdws.com/track',
      '07272-356183',
      '07272-220005',
      'tajdws@gmail.com'
    ];

    await this.sendWhatsAppMessage(
      from,
      'Customer',
      'auto_reply',
      templateParams,
      'TAJ_CRM'
    );
  }
}

export const notificationService = new NotificationService();