
import {
  whatsappContacts,
  whatsappMessages,
  whatsappCampaigns,
  whatsappTemplates,
  customers,
  type WhatsappContact,
  type WhatsappMessage,
  type WhatsappCampaign,
  type WhatsappTemplate,
  type InsertWhatsappContact,
  type InsertWhatsappMessage,
  type InsertWhatsappCampaign,
  type InsertWhatsappTemplate
} from "../shared/schema.js";
import { eq, desc, and, like, sql, or } from "drizzle-orm";
import { db } from "./db";
import fs from "fs/promises";
import path from "path";

import { broadcastWhatsAppEvent } from "./sse";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v22.0";
const ENV_WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
const ENV_WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'whatsapp-settings.json');

function sanitizeBaseUrl(url?: string): string {
  const fallback = "https://graph.facebook.com/v22.0";
  if (!url) return fallback;
  let u = url.trim();
  // Remove any trailing /messages or /{digits}/messages
  u = u.replace(/\/(\d+)\/messages\/?$/i, "");
  u = u.replace(/\/messages\/?$/i, "");
  // Remove trailing slash
  u = u.replace(/\/$/, "");
  return u || fallback;
}

async function getRuntimeCredentials(): Promise<{ accessToken?: string; phoneNumberId?: string; businessAccountId?: string; baseUrl: string }> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const json = JSON.parse(raw);
    const accessToken: string | undefined = json?.apiSettings?.accessToken || undefined;
    const phoneNumberId: string | undefined = json?.apiSettings?.phoneNumberId || undefined;
    const businessAccountId: string | undefined = json?.apiSettings?.businessAccountId || undefined;
    // Optionally allow apiBaseUrl in settings; fallback to env or default
    const apiBaseFromSettings: string | undefined = json?.apiSettings?.apiBaseUrl;
    const envBase = sanitizeBaseUrl(process.env.WHATSAPP_API_URL);
    const baseUrl = sanitizeBaseUrl(apiBaseFromSettings || envBase);
    return { accessToken, phoneNumberId, businessAccountId, baseUrl };
  } catch {
    // Fallback to environment variables if file not present or invalid
    const baseUrl = sanitizeBaseUrl(process.env.WHATSAPP_API_URL);
    return { accessToken: ENV_WHATSAPP_ACCESS_TOKEN, phoneNumberId: ENV_WHATSAPP_PHONE_NUMBER_ID, businessAccountId: undefined, baseUrl };
  }
}

function normalizeMsisdn(raw: string): string {
  // Remove non-digits
  let digits = (raw || '').replace(/\D/g, '');
  // If starts with 0 and total 11 digits, strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  // If 10-digit Indian mobile, prefix 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}


export interface WhatsAppAPIMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text" | "template" | "image" | "document";
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
}

// Health check using current credentials
export async function checkWhatsAppHealth(): Promise<{ connected: boolean; phoneNumber?: string; status?: string; error?: string }> {
  try {
    const { accessToken, phoneNumberId, baseUrl } = await getRuntimeCredentials();
    if (!accessToken || !phoneNumberId) return { connected: false, error: "credentials_missing" };
    const res = await fetch(`${baseUrl}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,id`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { connected: true, phoneNumber: data.display_phone_number, status: data.status ?? "ok" };
    return { connected: false, error: data?.error?.message || "failed" };
  } catch (e: any) {
    return { connected: false, error: e?.message || "failed" };
  }
}

export class WhatsAppService {
  // Simple cached health state to avoid spamming Graph
  private lastHealth: { connected: boolean; status?: string; at: number } | null = null;

  async checkHealth(): Promise<{ connected: boolean; phoneNumber?: string; status?: string; error?: string }> {
    const now = Date.now();
    if (this.lastHealth && now - this.lastHealth.at < 30000) {
      // Return cached within 30s
      return { connected: this.lastHealth.connected, status: this.lastHealth.status };
    }
    const { accessToken, phoneNumberId, baseUrl } = await getRuntimeCredentials();
    if (!accessToken || !phoneNumberId) {
      this.lastHealth = { connected: false, status: "credentials_missing", at: now };
      return { connected: false, error: "credentials_missing" };
    }
    try {
      const res = await fetch(`${baseUrl}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,id`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok;
      this.lastHealth = { connected: ok, status: ok ? (data.status ?? "ok") : "error", at: now };
      return ok ? { connected: true, phoneNumber: data.display_phone_number, status: data.status ?? "ok" } : { connected: false, error: data?.error?.message || "failed" };
    } catch (e: any) {
      this.lastHealth = { connected: false, status: "error", at: now };
      return { connected: false, error: e?.message || "failed" };
    }
  }


  // Contact Management
  async createContact(contactData: InsertWhatsappContact): Promise<WhatsappContact> {
    // Always normalize and dedupe by phone
    const normalized = normalizeMsisdn(contactData.phoneNumber);
    const existing = await this.getContactByPhone(normalized);
    const now = new Date();
    if (existing) {
      const updates: Partial<WhatsappContact> = {
        name: contactData.name || existing.name,
        profilePicture: contactData.profilePicture || existing.profilePicture,
        lastSeen: contactData.lastSeen || existing.lastSeen || now,
        customerId: contactData.customerId || existing.customerId,
        updatedAt: now,
      } as any;
      await db.update(whatsappContacts)
        .set(updates)
        .where(eq(whatsappContacts.id, existing.id));
      return (await this.getContact(existing.id))!;
    }
    const result = await db.insert(whatsappContacts).values({
      ...contactData,
      phoneNumber: normalized,
      lastSeen: contactData.lastSeen || now,
    }).returning();
    return result[0];
  }

  async getContact(id: number): Promise<WhatsappContact | undefined> {
    const result = await db.select().from(whatsappContacts).where(eq(whatsappContacts.id, id));
    return result[0];
  }

  private msisdnVariants(raw: string): string[] {
    const n = normalizeMsisdn(raw);
    const local10 = n.slice(-10);
    const vars = new Set<string>([n, local10, `0${local10}`, `+91${local10}`, `91${local10}`]);
    return Array.from(vars);
  }

  async getContactByPhone(phoneNumber: string): Promise<WhatsappContact | undefined> {
    const variants = this.msisdnVariants(phoneNumber);
    // Build OR chain for compatibility instead of sql.array
    const results = await db.select().from(whatsappContacts)
      .where(
        variants
          .map(v => sql`${whatsappContacts.phoneNumber} = ${v}`)
          .reduce((acc, cond) => acc ? sql`${acc} OR ${cond}` : cond, undefined as any)
      );
    // Pick the best match by preferring exact normalized match
    const normalized = normalizeMsisdn(phoneNumber);
    const exact = results.find((r: any) => r.phoneNumber === normalized);
    return exact || results[0];
  }

  async getAllContacts(): Promise<WhatsappContact[]> {
    return await db.select().from(whatsappContacts).orderBy(desc(whatsappContacts.updatedAt));
  }

  async searchContacts(query: string): Promise<WhatsappContact[]> {
    return await db.select().from(whatsappContacts)
      .where(
        sql`${whatsappContacts.name} ILIKE ${`%${query}%`} OR ${whatsappContacts.phoneNumber} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(whatsappContacts.updatedAt));
  }

  async updateContact(id: number, updates: Partial<WhatsappContact>): Promise<WhatsappContact | undefined> {
    await db.update(whatsappContacts).set({ ...updates, updatedAt: new Date() }).where(eq(whatsappContacts.id, id));
    const result = await db.select().from(whatsappContacts).where(eq(whatsappContacts.id, id));
    return result[0];
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(whatsappContacts).where(eq(whatsappContacts.id, id));
    return result.rowsAffected > 0;
  }

  // Message Management
  async createMessage(messageData: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const result = await db.insert(whatsappMessages).values(messageData).returning();
    return result[0];
  }

  async getMessages(contactId: number, limit: number = 50): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages)
      .where(eq(whatsappMessages.contactId, contactId))
      .orderBy(desc(whatsappMessages.timestamp))
      .limit(limit);
  }

  async getAllMessages(limit: number = 100): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages)
      .orderBy(desc(whatsappMessages.timestamp))
      .limit(limit);
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db.update(whatsappMessages)
      .set({ isRead: true })
      .where(eq(whatsappMessages.id, messageId));
  }

  async updateMessageStatus(messageId: string, status: "sent" | "delivered" | "read" | "failed"): Promise<void> {
    await db.update(whatsappMessages)
      .set({ status })
      .where(eq(whatsappMessages.messageId, messageId));

    broadcastWhatsAppEvent({ type: "message:status", payload: { messageId, status } });
  }

  // WhatsApp API Integration
  async sendTextMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { accessToken, phoneNumberId, baseUrl } = await getRuntimeCredentials();
      if (!accessToken || !phoneNumberId) {
        throw new Error("WhatsApp API credentials not configured");
      }

      const payload: WhatsAppAPIMessage = {
        messaging_product: "whatsapp",
        to: normalizeMsisdn(to), // Auto-add 91 for 10-digit numbers
        type: "text",
        text: {
          body: message
        }
      };

      const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        // Store message in database
        const contact = await this.getOrCreateContact(to, "Unknown");
        const saved = await this.createMessage({
          contactId: contact.id,
          messageId: result.messages[0].id,
          direction: "outbound",
          messageType: "text",
          content: message,
          status: "sent",
          timestamp: new Date(),
          isRead: false,
        });

        // Broadcast real-time event
        broadcastWhatsAppEvent({ type: "message:new", payload: { contactId: contact.id, message: saved } });

        return { success: true, messageId: result.messages[0].id };
      } else {
        console.error("WhatsApp API error:", result);
        return { success: false, error: result.error?.message || "Failed to send message" };
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return { success: false, error: (error as any)?.message || String(error) };
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: string[] = [],
    language: string = "en"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { accessToken, phoneNumberId, baseUrl } = await getRuntimeCredentials();
      if (!accessToken || !phoneNumberId) {
        throw new Error("WhatsApp API credentials not configured");
      }

      const payload: WhatsAppAPIMessage = {
        messaging_product: "whatsapp",
        to: normalizeMsisdn(to),
        type: "template",
        template: {
          name: templateName,
          language: {
            code: language
          },
          components: parameters.length > 0 ? [{
            type: "body",
            parameters: parameters.map(param => ({
              type: "text",
              text: param
            }))
          }] : undefined
        }
      };

      const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        // Store message in database
        const contact = await this.getOrCreateContact(to, "Unknown");
        const saved = await this.createMessage({
          contactId: contact.id,
          messageId: result.messages[0].id,
          direction: "outbound",
          messageType: "template",
          content: `Template: ${templateName}`,
          templateName,
          templateParams: JSON.stringify(parameters),
          status: "sent",
          timestamp: new Date(),
          isRead: false,
        });

        broadcastWhatsAppEvent({ type: "message:new", payload: { contactId: contact.id, message: saved } });

        return { success: true, messageId: result.messages[0].id };
      } else {
        console.error("WhatsApp API error:", result);
        return { success: false, error: result.error?.message || "Failed to send template" };
      }
    } catch (error) {
      console.error("Error sending WhatsApp template:", error);
      return { success: false, error: (error as any)?.message || String(error) };
    }
  }

  // Helper method to get or create contact
  async getOrCreateContact(phoneNumber: string, name: string): Promise<WhatsappContact> {
    const normalized = normalizeMsisdn(phoneNumber);
    let contact = await this.getContactByPhone(normalized);

    if (!contact) {
      // Try cross-linking with customers table
      const possibleCustomer = await db.select().from(customers).where(eq(customers.mobile, normalized));
      const customer = possibleCustomer[0];

      contact = await this.createContact({
        phoneNumber: normalized,
        name: name || customer?.name || "Unknown",
        isBlocked: false,
        lastSeen: new Date(),
        customerId: customer?.id,
      });
    } else {
      // If name blank, try to resolve from prior or customers
      if (!contact.name || contact.name.trim() === "" || contact.name === "Unknown") {
        const possibleCustomer = await db.select().from(customers).where(eq(customers.mobile, normalized));
        const customer = possibleCustomer[0];
        if (customer?.name) {
          contact = (await this.updateContact(contact.id, { name: customer.name }))!;
        }
      }
    }

    return contact;
  }

  // Handle incoming messages from webhook
  async handleIncomingMessage(
    from: string,
    messageId: string,
    messageType: string,
    content: string,
    mediaUrl?: string
  ): Promise<void> {
    try {
      const contact = await this.getOrCreateContact(from, "");

      // If WhatsApp webhook gives sender name/profile pic in future, update here
      // For now, just ensure lastSeen and message record
      const saved = await this.createMessage({
        contactId: contact.id,
        messageId,
        direction: "inbound",
        messageType: messageType as any,
        content,
        mediaUrl,
        status: "delivered",
        timestamp: new Date(),
        isRead: false,
      });

      // Update contact's last seen
      await this.updateContact(contact.id, { lastSeen: new Date() });

      broadcastWhatsAppEvent({ type: "message:new", payload: { contactId: contact.id, message: saved } });

    } catch (error) {
      console.error("Error handling incoming message:", error);
    }
  }

  // Get conversation between contact
  async getConversation(contactId: number): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages)
      .where(eq(whatsappMessages.contactId, contactId))
      .orderBy(whatsappMessages.timestamp);
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(whatsappMessages)
      .where(and(
        eq(whatsappMessages.direction, "inbound"),
        eq(whatsappMessages.isRead, false)
      ));

    return result[0]?.count || 0;
  }

  // Sync customers to WhatsApp contacts
  async syncCustomersToContacts(): Promise<{ synced: number; skipped: number; errors: number }> {
    try {
      const allCustomers = await db.select().from(customers);
      let synced = 0;
      let skipped = 0;
      let errors = 0;

      for (const customer of allCustomers) {
        try {
          // Check if contact already exists
          const existingContact = await this.getContactByPhone(customer.mobile);

          if (existingContact) {
            // Update existing contact with customer ID if not linked
            if (!existingContact.customerId) {
              await this.updateContact(existingContact.id, {
                customerId: customer.id,
                name: customer.name,
                notes: existingContact.notes || `Customer: ${customer.name}`,
              });
              synced++;
            } else {
              skipped++;
            }
          } else {
            // Create new WhatsApp contact from customer
            await this.createContact({
              phoneNumber: customer.mobile,
              name: customer.name,
              customerId: customer.id,
              notes: `Customer: ${customer.name}`,
              isBlocked: false,
            });
            synced++;
          }
        } catch (error) {
          console.error(`Error syncing customer ${customer.id}:`, error);
          errors++;
        }
      }

      return { synced, skipped, errors };
    } catch (error) {
      console.error("Error in syncCustomersToContacts:", error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();

