// Cross-platform database configuration for Replit and Windows local
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using fallback SQLite database");
  process.env.DATABASE_URL = "file:./data/sqlite.db";
}

const databaseUrl = process.env.DATABASE_URL;
const isLocalWindows = process.platform === 'win32' || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
const isNeonDB = databaseUrl.includes('neon.tech') || databaseUrl.includes('.neon.');

let db: any;

// Always use standard postgres connection for better compatibility
console.log("🔄 Connecting to PostgreSQL using standard connection...");
const client = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});
db = drizzlePg({ client, schema });

export { db };