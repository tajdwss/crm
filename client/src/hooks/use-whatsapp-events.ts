
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useWhatsappEvents(activeContactId?: number, onHealth?: (h: {connected: boolean; status?: string}) => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const es = new EventSource("/api/whatsapp/events");

    es.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data);
        if (evt.type === "message:new") {
          const { contactId, message } = evt.payload || {};

          // Update messages list cache for that contact
          if (contactId) {
            queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", contactId, "messages"] });
            queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", contactId, "conversation"] });
          }
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages/unread/count"] });

          // Toast only for inbound, and if not on that active conversation
          if (message?.direction === "inbound" && activeContactId !== contactId) {
            toast({ title: "New WhatsApp message", description: message?.content });
          }
        }
        if (evt.type === "whatsapp:health") {
          onHealth?.(evt.payload || { connected: false });
        }
        if (evt.type === "message:status") {
          const { messageId, status } = evt.payload || {};
          // For now, just refresh caches; can be optimized by updating specific message
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
          if (activeContactId) {
            queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", activeContactId, "messages"] });
            queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts", activeContactId, "conversation"] });
          }
          if (status === "delivered" || status === "read") {
            toast({ title: "WhatsApp", description: `Message ${status}.` });
          }
        }
      } catch (e) {
        // ignore malformed
      }
    };

    es.onerror = () => {
      // The browser will retry automatically; no toast spam
    };

    return () => {
      es.close();
    };
  }, [queryClient, toast, activeContactId]);
}


