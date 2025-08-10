import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface WhatsappContact {
  id: number;
  phoneNumber: string;
  name: string;
  profilePicture?: string;
  isBlocked: boolean;
  lastSeen?: Date;
  customerId?: number;
  tags?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsappMessage {
  id: number;
  contactId: number;
  messageId?: string;
  direction: "inbound" | "outbound";
  messageType: "text" | "image" | "document" | "audio" | "video" | "template";
  content: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
  isRead: boolean;
  createdAt: Date;
}

export interface SendMessageRequest {
  to: string;
  message: string;
  contactId?: number;
}

export interface SendTemplateRequest {
  to: string;
  templateName: string;
  parameters?: string[];
  language?: string;
}

// Get all WhatsApp contacts
export function useWhatsappContacts() {
  return useQuery({
    queryKey: ["/api/whatsapp/contacts"],
    queryFn: () => apiRequest("/api/whatsapp/contacts"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Search WhatsApp contacts
export function useSearchWhatsappContacts(query: string) {
  return useQuery({
    queryKey: ["/api/whatsapp/contacts/search", query],
    queryFn: () => apiRequest(`/api/whatsapp/contacts/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 2,
  });
}

// Get contact by ID
export function useWhatsappContact(id: number) {
  return useQuery({
    queryKey: ["/api/whatsapp/contacts", id],
    queryFn: () => apiRequest(`/api/whatsapp/contacts/${id}`),
    enabled: !!id,
  });
}

// Get messages for a contact
export function useWhatsappMessages(contactId: number) {
  return useQuery({
    queryKey: ["/api/whatsapp/contacts", contactId, "messages"],
    queryFn: () => apiRequest(`/api/whatsapp/contacts/${contactId}/messages`),
    enabled: !!contactId,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  });
}

// Get conversation for a contact
export function useWhatsappConversation(contactId: number) {
  return useQuery({
    queryKey: ["/api/whatsapp/contacts", contactId, "conversation"],
    queryFn: () => apiRequest(`/api/whatsapp/contacts/${contactId}/conversation`),
    enabled: !!contactId,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time conversation
  });
}

// Get all recent messages
export function useWhatsappAllMessages(limit: number = 100) {
  return useQuery({
    queryKey: ["/api/whatsapp/messages", limit],
    queryFn: () => apiRequest(`/api/whatsapp/messages?limit=${limit}`),
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Get unread message count
export function useWhatsappUnreadCount() {
  return useQuery({
    queryKey: ["/api/whatsapp/messages/unread/count"],
    queryFn: () => apiRequest("/api/whatsapp/messages/unread/count"),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

// Create new contact
export function useCreateWhatsappContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contactData: Partial<WhatsappContact>) => {
      const response = await apiRequest("/api/whatsapp/contacts", {
        method: "POST",
        body: contactData,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      toast({
        title: "Contact Created",
        description: `Contact ${data.name} has been added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Update contact
export function useUpdateWhatsappContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<WhatsappContact> }) => {
      const response = await apiRequest(`/api/whatsapp/contacts/${id}`, {
        method: "PUT",
        body: updates,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", data.id] });
      toast({
        title: "Contact Updated",
        description: `Contact ${data.name} has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Delete contact
export function useDeleteWhatsappContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/whatsapp/contacts/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      toast({
        title: "Contact Deleted",
        description: "Contact has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Send text message
export function useSendWhatsappMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (messageData: SendMessageRequest) => {
      const response = await apiRequest("/api/whatsapp/messages/send", {
        method: "POST",
        body: messageData,
      });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      if (variables.contactId) {
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", variables.contactId, "messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", variables.contactId, "conversation"] });
      }
      
      toast({
        title: "Message Sent",
        description: "Your WhatsApp message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Failed to send WhatsApp message. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Send greeting message
export function useSendWhatsappGreeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { to: string; contactId?: number; customMessage?: string }) => {
      return apiRequest("/api/whatsapp/send/greeting", { method: "POST", body: data });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      if (variables.contactId) {
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", variables.contactId, "messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", variables.contactId, "conversation"] });
      }
      
      toast({
        title: "Greeting Sent",
        description: "Welcome message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Greeting",
        description: error.message || "Failed to send greeting message. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Send template message
export function useSendWhatsappTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateData: SendTemplateRequest) => {
      const response = await apiRequest("/api/whatsapp/messages/template", {
        method: "POST",
        body: templateData,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      toast({
        title: "Template Sent",
        description: "Your WhatsApp template has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Template",
        description: error.message || "Failed to send WhatsApp template. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Mark message as read
export function useMarkWhatsappMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest(`/api/whatsapp/messages/${messageId}/read`, {
        method: "PUT",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages/unread/count"] });
    },
  });
}

// Sync customers into WhatsApp contacts
export function useSyncWhatsappFromCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/whatsapp/sync-customers", {
        method: "POST",
      });
      return response as { synced: number; skipped: number; errors: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      toast({
        title: "Contacts Synced",
        description: `${data.synced} added, ${data.skipped} skipped${data.errors ? `, ${data.errors} errors` : ""}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync customers to WhatsApp contacts.",
        variant: "destructive",
      });
    },
  });
}
