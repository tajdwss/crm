import { Router } from "express";
import { whatsappService } from "./whatsapp-service";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Settings file path
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'whatsapp-settings.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load WhatsApp settings
router.get("/settings", async (req, res) => {
  try {
    await ensureDataDirectory();

    try {
      const settingsData = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(settingsData);
      res.json(settings);
    } catch (error) {
      // If file doesn't exist or is invalid, return default settings
      const defaultSettings = {
        apiSettings: {
          accessToken: "",
          phoneNumberId: "",
          businessAccountId: "",
          apiBaseUrl: "https://graph.facebook.com/v22.0",
          webhookUrl: "https://your-domain.com/api/whatsapp/webhook",
          verifyToken: "TAJ_ELECTRONICS_2025",
        },
        notificationSettings: {
          enableIncomingMessages: true,
          enableDeliveryReports: true,
          enableReadReceipts: true,
          enableAutoReply: false,
          autoReplyMessage: "Thank you for your message. We'll get back to you soon!",
        },
        templateSettings: {
          receiptTemplateName: "receipt_created",
          receiptTemplateLanguage: "en",
          receiptTemplateParamsOrder: "customerName,receiptNumber,trackingUrl"
        },
        templateUsage: {
          receipt_created: { name: "receipt_created", language: "en", paramsOrder: "customerName,receiptNumber,trackingUrl" },
          receipt_status_update: { name: "status_update", language: "en", paramsOrder: "customerName,receiptNumber,status,trackingUrl,estimatedAmount" },
          service_complaint_created: { name: "service_complaint_created", language: "en", paramsOrder: "customerName,complaintNumber,product,model,issueDescription,status" },
          service_status_update: { name: "service_status_update", language: "en", paramsOrder: "customerName,complaintNumber,status,oldStatus,product" },
          delivery_otp: { name: "otp_verification", language: "en", paramsOrder: "receiptNumber,otp,validityWindow" },
          ready_for_delivery: { name: "ready_for_delivery", language: "en", paramsOrder: "customerName,receiptNumber,estimatedAmount" },
          payment_reminder: { name: "payment_reminder", language: "en", paramsOrder: "customerName,receiptNumber,estimatedAmount,dueDate" },
          auto_reply: { name: "auto_reply", language: "en", paramsOrder: "trackUrl,phone1,phone2,email" }
        }
      };
      res.json(defaultSettings);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// Save WhatsApp settings
router.post("/settings", async (req, res) => {
  try {
    await ensureDataDirectory();

    const { apiSettings, notificationSettings, templateSettings, templateUsage } = req.body;

    if (!apiSettings || !notificationSettings) {
      return res.status(400).json({ error: "Missing required settings data" });
    }

    const settings = {
      apiSettings,
      notificationSettings,
      templateSettings,
      templateUsage,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));

    res.json({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// Test WhatsApp API connection (uses body credentials, else saved settings, else env)
router.post("/test-connection", async (req, res) => {
  try {
    let { accessToken, phoneNumberId, apiBaseUrl } = req.body || {};

    // Try saved settings if not provided
    if (!accessToken || !phoneNumberId || !apiBaseUrl) {
      try {
        const settingsRaw = await fs.readFile(SETTINGS_FILE, "utf-8");
        const saved = JSON.parse(settingsRaw);
        accessToken = accessToken || saved?.apiSettings?.accessToken;
        phoneNumberId = phoneNumberId || saved?.apiSettings?.phoneNumberId;
        apiBaseUrl = apiBaseUrl || saved?.apiSettings?.apiBaseUrl;
      } catch {}
    }

    // Fallback to environment variables and default Graph URL
    accessToken = accessToken || process.env.WHATSAPP_API_TOKEN;
    phoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    apiBaseUrl = apiBaseUrl || process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v22.0";

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        error: "WhatsApp API credentials not configured",
        connected: false,
      });
    }

    // Normalize base URL (no trailing slash)
    apiBaseUrl = String(apiBaseUrl).replace(/\/$/, "");

    // Test the connection by making a simple API call to get phone number info
    const response = await fetch(`${apiBaseUrl}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,id`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {

      res.json({
        connected: true,
        phoneNumber: data.display_phone_number,
        status: data.status ?? "ok",
      });
    } else {
      res.status(400).json({
        connected: false,
        error: data?.error?.message || "Failed to connect to WhatsApp API",
      });
    }
  } catch (error) {
    console.error("WhatsApp connection test error:", error);
    res.status(500).json({
      connected: false,
      error: "Failed to test WhatsApp connection",
    });
  }
});

// Sync customers to WhatsApp contacts
router.post("/sync-customers", async (req, res) => {
  try {
    const syncResult = await whatsappService.syncCustomersToContacts();
    res.json(syncResult);
  } catch (error) {
    console.error("Error syncing customers:", error);
    res.status(500).json({ error: "Failed to sync customers" });
  }
});

// Get all contacts
router.get("/contacts", async (req, res) => {
  try {
    const contacts = await whatsappService.getAllContacts();
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Connection health endpoint (GET) for polling
router.get("/health", async (req, res) => {
  try {
    // Load saved settings if available
    let accessToken = process.env.WHATSAPP_API_TOKEN || "";
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    let apiBaseUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v22.0";
    try {
      const settingsRaw = await fs.readFile(SETTINGS_FILE, "utf-8");
      const saved = JSON.parse(settingsRaw);
      accessToken = saved?.apiSettings?.accessToken || accessToken;
      phoneNumberId = saved?.apiSettings?.phoneNumberId || phoneNumberId;
      apiBaseUrl = saved?.apiSettings?.apiBaseUrl || apiBaseUrl;
    } catch {}

    const response = await fetch(`${String(apiBaseUrl).replace(/\/$/, "")}/${encodeURIComponent(phoneNumberId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      res.json({ connected: true, phoneNumber: data.display_phone_number, status: data.status ?? "ok" });
    } else {
      res.status(200).json({ connected: false, error: data?.error?.message || "failed" });
    }
  } catch (error) {
    res.status(200).json({ connected: false, error: "failed" });
  }
});

// Search contacts
router.get("/contacts/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const contacts = await whatsappService.searchContacts(q);
    res.json(contacts);
  } catch (error) {
    console.error("Error searching contacts:", error);
    res.status(500).json({ error: "Failed to search contacts" });
  }
});

// Get contact by ID
router.get("/contacts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contact = await whatsappService.getContact(id);

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: "Failed to fetch contact" });
  }
});

// Create new contact
router.post("/contacts", async (req, res) => {
  try {
    const { phoneNumber, name, notes, tags } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({ error: "Phone number and name are required" });
    }

    const contact = await whatsappService.createContact({
      phoneNumber,
      name,
      notes,
      tags,
      isBlocked: false,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// Update contact
router.put("/contacts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const contact = await whatsappService.updateContact(id, updates);

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete contact
router.delete("/contacts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await whatsappService.deleteContact(id);

    if (!success) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

// Get messages for a contact
router.get("/contacts/:id/messages", async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await whatsappService.getMessages(contactId, limit);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get conversation for a contact
router.get("/contacts/:id/conversation", async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const conversation = await whatsappService.getConversation(contactId);
    res.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Send text message
router.post("/messages/send", async (req, res) => {
  try {
    const { to, message, contactId } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Phone number and message are required" });
    }

    const result = await whatsappService.sendTextMessage(to, message);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Send template message
router.post("/messages/template", async (req, res) => {
  try {
    const { to, templateName, parameters, language } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({ error: "Phone number and template name are required" });
    }

    const result = await whatsappService.sendTemplateMessage(to, templateName, parameters, language);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error sending template:", error);
    res.status(500).json({ error: "Failed to send template" });
  }
});

// Mark message as read
router.put("/messages/:id/read", async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    await whatsappService.markMessageAsRead(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

// Get all messages (recent)
router.get("/messages", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const messages = await whatsappService.getAllMessages(limit);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get unread message count
router.get("/messages/unread/count", async (req, res) => {
  try {
    const count = await whatsappService.getUnreadCount();
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// WhatsApp webhook verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "TAJ_ELECTRONICS_2025";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// WhatsApp webhook for incoming messages
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === "messages") {
            const messages = change.value.messages;
            const statuses = change.value.statuses;

            // Handle incoming messages
            messages?.forEach(async (message: any) => {
              const from = message.from;
              const messageId = message.id;
              const messageType = message.type;
              let content = "";
              let mediaUrl = "";

              switch (messageType) {
                case "text":
                  content = message.text?.body || "";
                  break;
                case "image":
                  content = message.image?.caption || "Image";
                  mediaUrl = message.image?.id || "";
                  break;
                case "document":
                  content = message.document?.filename || "Document";
                  mediaUrl = message.document?.id || "";
                  break;
                case "audio":
                  content = "Audio message";
                  mediaUrl = message.audio?.id || "";
                  break;
                case "video":
                  content = message.video?.caption || "Video";
                  mediaUrl = message.video?.id || "";
                  break;
                default:
                  content = `${messageType} message`;
              }

              await whatsappService.handleIncomingMessage(from, messageId, messageType, content, mediaUrl);
            });

            // Handle message status updates
            statuses?.forEach(async (status: any) => {
              const messageId = status.id;
              const statusType = status.status;

              await whatsappService.updateMessageStatus(messageId, statusType);
            });
          }
        });
      });
    }


// Send a receipt summary to a given mobile via WhatsApp (text or template fallback)
router.post("/send/receipt", async (req, res) => {
  try {
    const { receiptNumber, to } = req.body || {};
    if (!receiptNumber || !to) return res.status(400).json({ error: "receiptNumber and to are required" });

    const { storage } = await import("../server/storage");
    const receipt = await storage.getReceiptByNumber(receiptNumber);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });

    const { notificationService } = await import("./notification-service");
    const result = await notificationService.sendReceiptCreatedNotification(receipt);
    if (result.success) return res.json({ success: true });
    return res.status(400).json({ success: false, error: result.error || "Failed to send" });
  } catch (e: any) {
    console.error("/whatsapp/send/receipt error:", e);
    res.status(500).json({ error: e?.message || "Failed" });
  }
});

// Send a service status update to a given mobile via WhatsApp
router.post("/send/service-status", async (req, res) => {
  try {
    const { complaintNumber } = req.body || {};
    if (!complaintNumber) return res.status(400).json({ error: "complaintNumber is required" });

    const { storage } = await import("../server/storage");
    const complaint = await storage.getServiceComplaintByNumber(complaintNumber);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const { notificationService } = await import("./notification-service");
    await notificationService.sendServiceStatusUpdate(complaint, complaint.status || "");
    return res.json({ success: true });
  } catch (e: any) {
    console.error("/whatsapp/send/service-status error:", e);
    res.status(500).json({ error: e?.message || "Failed" });
  }
});

// Send greeting message
router.post("/send/greeting", async (req, res) => {
  try {
    const { to, contactId, customMessage } = req.body || {};
    if (!to) return res.status(400).json({ error: "Phone number (to) is required" });

    const greetingMessage = customMessage || "Hello! Welcome to TAJ Electronics. How can we help you today?";

    const result = await whatsappService.sendTextMessage(to, greetingMessage);
    if (result.success) {
      return res.json({ success: true, messageId: result.messageId });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (e: any) {
    console.error("/whatsapp/send/greeting error:", e);
    res.status(500).json({ error: e?.message || "Failed to send greeting" });
  }
});

// Bulk send notifications
router.post("/send/bulk", async (req, res) => {
  try {
    const { type, recipients, message, templateName, templateParams } = req.body || {};

    if (!type || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: "type and recipients array are required" });
    }

    const results = [];

    for (const recipient of recipients) {
      try {
        let result;

        if (type === "text") {
          result = await whatsappService.sendTextMessage(recipient.phone, message || recipient.message);
        } else if (type === "template") {
          result = await whatsappService.sendTemplateMessage(
            recipient.phone,
            templateName || recipient.templateName,
            templateParams || recipient.templateParams
          );
        }

        results.push({
          phone: recipient.phone,
          success: result?.success || false,
          messageId: result?.messageId,
          error: result?.error
        });
      } catch (error) {
        results.push({
          phone: recipient.phone,
          success: false,
          error: error?.message || "Unknown error"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return res.json({
      success: true,
      summary: { total: results.length, success: successCount, failed: failCount },
      details: results
    });
  } catch (e: any) {
    console.error("/whatsapp/send/bulk error:", e);
    res.status(500).json({ error: e?.message || "Failed to send bulk messages" });
  }
});

    res.status(200).send("OK");
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    res.status(500).send("Error");
  }
});

export default router;
