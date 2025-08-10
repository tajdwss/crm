import React from "react";
import { useWhatsappContacts, useSyncWhatsappFromCustomers, type WhatsappContact } from "@/hooks/use-whatsapp";
import { Button } from "@/components/ui/button";

export function WhatsappContactsList() {
  const { data: contacts = [], isLoading } = useWhatsappContacts();
  const sync = useSyncWhatsappFromCustomers();

  return (
    <div style={{ padding: "10px" }}>
      <h3>WhatsApp Contacts</h3>

      {isLoading ? (
        <div>Loading...</div>
      ) : contacts.length === 0 ? (
        <div style={{ color: "#666" }}>
          <div>No contacts yet</div>
          <Button style={{ marginTop: 8 }} size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            Sync customers to contacts
          </Button>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {contacts.map((contact: any) => (
            <li
              key={contact.id}
              style={{
                padding: "8px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
            >
              <strong>{contact.name}</strong>
              <div style={{ fontSize: "0.85em", color: "#555" }}>{contact.phoneNumber}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
