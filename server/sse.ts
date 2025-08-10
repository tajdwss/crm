
import { Response } from "express";

export type WhatsAppEvent =
  | { type: "message:new"; payload: any }
  | { type: "message:status"; payload: any }
  | { type: "whatsapp:health"; payload: any };

const clients = new Set<Response>();
let heartbeatTimer: NodeJS.Timer | null = null;

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    clients.forEach((res) => {
      try { res.write(":hb\n\n"); } catch {}
    });
  }, 25000);
}

export function addSSEClient(res: Response) { clients.add(res); startHeartbeat(); }
export function broadcastWhatsAppEvent(evt: WhatsAppEvent) {
  const data = `data: ${JSON.stringify(evt)}\n\n`;
  for (const res of clients) res.write(data);
}


export function removeSSEClient(res: Response) { clients.delete(res); }

