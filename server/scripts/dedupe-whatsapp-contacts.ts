import 'dotenv/config';
import { db } from "../db";
import {
  whatsappContacts,
  customers,
  type WhatsappContact,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

function normalizeMsisdn(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function msisdnVariants(raw: string): string[] {
  const n = normalizeMsisdn(raw);
  const local10 = n.slice(-10);
  return Array.from(new Set([n, local10, `0${local10}`, `+91${local10}`, `91${local10}`]));
}

async function main() {
  console.log("Starting WhatsApp contacts dedupe migration...");

  // Fetch all contacts
  const all: WhatsappContact[] = await db.select().from(whatsappContacts);
  console.log(`Loaded ${all.length} contacts.`);

  // Group by normalized number
  const buckets = new Map<string, WhatsappContact[]>();
  for (const c of all) {
    const key = normalizeMsisdn(c.phoneNumber);
    const arr = buckets.get(key) || [];
    arr.push(c);
    buckets.set(key, arr);
  }

  let merged = 0;

  for (const [normalized, list] of buckets.entries()) {
    if (list.length <= 1) continue;

    // Choose a primary record: latest updatedAt or createdAt fallback
    const primary = list.slice().sort((a, b) => {
      const atA = (a.updatedAt || a.createdAt || new Date(0)).valueOf();
      const atB = (b.updatedAt || b.createdAt || new Date(0)).valueOf();
      return atB - atA;
    })[0];

    // Merge data from others into primary (pick most recent lastSeen, and any available name/picture/customer)
    let bestName = primary.name && primary.name !== 'Unknown' ? primary.name : '';
    let bestPic = primary.profilePicture || '';
    let lastSeen: Date | undefined = primary.lastSeen ? new Date(primary.lastSeen) : undefined;
    let customerId = primary.customerId || undefined;

    for (const c of list) {
      if (!bestName && c.name && c.name !== 'Unknown') bestName = c.name;
      if (!bestPic && c.profilePicture) bestPic = c.profilePicture;
      if (c.lastSeen) {
        const ls = new Date(c.lastSeen);
        if (!lastSeen || ls > lastSeen) lastSeen = ls; // choose most recent
      }
      if (!customerId && c.customerId) customerId = c.customerId;
    }

    // Delete duplicates except primary FIRST to avoid unique conflicts
    const toDelete = list.filter(c => c.id !== primary.id);
    if (toDelete.length) {
      // Delete one-by-one for maximum compatibility
      for (const row of toDelete) {
        await db.delete(whatsappContacts).where(eq(whatsappContacts.id, row.id));
      }
    }

    // Now safely update primary with normalized number and merged fields
    await db.update(whatsappContacts)
      .set({
        phoneNumber: normalized,
        name: bestName || primary.name,
        profilePicture: bestPic || primary.profilePicture,
        lastSeen: lastSeen || primary.lastSeen,
        customerId: customerId || primary.customerId,
        updatedAt: new Date(),
      })
      .where(eq(whatsappContacts.id, primary.id));

    merged += toDelete.length;
    console.log(`Merged ${toDelete.length} duplicates into contact #${primary.id} (${normalized}).`);
  }

  console.log(`Done. Total merged duplicates: ${merged}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

