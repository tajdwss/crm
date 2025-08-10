var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  customers: () => customers,
  insertCustomerSchema: () => insertCustomerSchema,
  insertOtpSchema: () => insertOtpSchema,
  insertReceiptSchema: () => insertReceiptSchema,
  insertServiceComplaintSchema: () => insertServiceComplaintSchema,
  insertServiceVisitSchema: () => insertServiceVisitSchema,
  insertUserSchema: () => insertUserSchema,
  insertWorkAssignmentSchema: () => insertWorkAssignmentSchema,
  insertWorkCheckinSchema: () => insertWorkCheckinSchema,
  otpVerifications: () => otpVerifications,
  otpVerificationsRelations: () => otpVerificationsRelations,
  receipts: () => receipts,
  receiptsRelations: () => receiptsRelations,
  serviceComplaints: () => serviceComplaints,
  serviceComplaintsRelations: () => serviceComplaintsRelations,
  serviceVisits: () => serviceVisits,
  serviceVisitsRelations: () => serviceVisitsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  workAssignments: () => workAssignments,
  workAssignmentsRelations: () => workAssignmentsRelations,
  workCheckins: () => workCheckins
});
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, customers, receipts, serviceComplaints, serviceVisits, otpVerifications, workAssignments, workCheckins, insertUserSchema, insertCustomerSchema, insertReceiptSchema, insertServiceComplaintSchema, insertServiceVisitSchema, insertWorkAssignmentSchema, insertWorkCheckinSchema, insertOtpSchema, usersRelations, receiptsRelations, serviceComplaintsRelations, serviceVisitsRelations, otpVerificationsRelations, workAssignmentsRelations;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      role: text("role", { enum: ["admin", "technician", "service_engineer"] }).notNull(),
      name: text("name"),
      mobile: text("mobile").unique(),
      email: text("email").unique(),
      address: text("address"),
      isActive: boolean("is_active").default(true).notNull(),
      isDeleted: boolean("is_deleted").default(false).notNull(),
      deletedAt: timestamp("deleted_at"),
      deletedBy: integer("deleted_by"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    customers = pgTable("customers", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      name: text("name").notNull(),
      mobile: text("mobile").notNull().unique(),
      email: text("email"),
      address: text("address"),
      whoBought: text("who_bought"),
      isActive: boolean("is_active").default(true).notNull(),
      isDeleted: boolean("is_deleted").default(false).notNull(),
      deletedAt: timestamp("deleted_at"),
      deletedBy: integer("deleted_by"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    receipts = pgTable("receipts", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      receiptNumber: text("receipt_number").notNull().unique(),
      customerName: text("customer_name").notNull(),
      mobile: text("mobile").notNull(),
      isCompanyItem: boolean("is_company_item").default(false).notNull(),
      companyName: text("company_name"),
      companyMobile: text("company_mobile"),
      rgpNumber: text("rgp_number"),
      rgpDate: text("rgp_date"),
      product: text("product").notNull(),
      model: text("model"),
      problemDescription: text("problem_description"),
      additionalAccessories: text("additional_accessories"),
      estimatedAmount: integer("estimated_amount"),
      estimatedDeliveryDate: text("estimated_delivery_date"),
      status: text("status").notNull().default("Pending"),
      paymentStatus: text("payment_status").notNull().default("Pending"),
      amountReceived: integer("amount_received").default(0),
      paymentDate: timestamp("payment_date"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      deliveredAt: timestamp("delivered_at"),
      technicianNotes: text("technician_notes")
    });
    serviceComplaints = pgTable("service_complaints", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      complaintNumber: text("complaint_number").notNull().unique(),
      customerName: text("customer_name").notNull(),
      mobile: text("mobile").notNull(),
      address: text("address"),
      // Made optional
      product: text("product").notNull(),
      model: text("model"),
      // Made optional
      issueDescription: text("issue_description").notNull(),
      status: text("status").notNull().default("Pending"),
      assignedEngineerId: integer("assigned_engineer_id").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      completedAt: timestamp("completed_at"),
      latitude: text("latitude"),
      longitude: text("longitude"),
      priority: text("priority").default("Normal")
      // Add priority field
    });
    serviceVisits = pgTable("service_visits", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      complaintId: integer("complaint_id").notNull().references(() => serviceComplaints.id),
      engineerId: integer("engineer_id").notNull().references(() => users.id),
      teamMembers: text("team_members"),
      // JSON array of user IDs who worked together
      checkInTime: text("check_in_time"),
      checkOutTime: text("check_out_time"),
      checkInLatitude: text("check_in_latitude"),
      checkInLongitude: text("check_in_longitude"),
      checkInAddress: text("check_in_address"),
      checkOutLatitude: text("check_out_latitude"),
      checkOutLongitude: text("check_out_longitude"),
      checkOutAddress: text("check_out_address"),
      partsIssued: text("parts_issued"),
      workDescription: text("work_description"),
      visitNotes: text("visit_notes"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    otpVerifications = pgTable("otp_verifications", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      receiptId: integer("receipt_id").references(() => receipts.id),
      complaintId: integer("complaint_id").references(() => serviceComplaints.id),
      mobile: text("mobile").notNull(),
      otp: text("otp").notNull(),
      otpType: text("otp_type", { enum: ["person", "company", "custom"] }).default("person").notNull(),
      verified: boolean("verified").default(false),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    workAssignments = pgTable("work_assignments", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      assignedBy: integer("assigned_by").notNull().references(() => users.id),
      assignedTo: integer("assigned_to").notNull().references(() => users.id),
      // Keep for backward compatibility
      assignedUsers: text("assigned_users"),
      // JSON array of user IDs
      workType: text("work_type", { enum: ["receipt", "service_complaint"] }).notNull(),
      workId: integer("work_id").notNull(),
      // Receipt ID or Service Complaint ID
      priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium").notNull(),
      status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).default("pending").notNull(),
      assignmentNotes: text("assignment_notes"),
      dueDate: timestamp("due_date"),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    workCheckins = pgTable("work_checkins", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      assignmentId: integer("assignment_id").notNull().references(() => workAssignments.id),
      userId: integer("user_id").notNull().references(() => users.id),
      checkedInWith: text("checked_in_with"),
      // JSON array of user IDs who checked in together
      checkInTime: timestamp("check_in_time").defaultNow().notNull(),
      checkOutTime: timestamp("check_out_time"),
      location: text("location"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      deletedAt: true
    });
    insertCustomerSchema = createInsertSchema(customers).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true
    });
    insertReceiptSchema = createInsertSchema(receipts).omit({
      id: true,
      receiptNumber: true,
      createdAt: true,
      deliveredAt: true,
      paymentDate: true
    });
    insertServiceComplaintSchema = createInsertSchema(serviceComplaints).omit({
      id: true,
      complaintNumber: true,
      createdAt: true,
      completedAt: true
    });
    insertServiceVisitSchema = createInsertSchema(serviceVisits).omit({
      id: true,
      createdAt: true
    });
    insertWorkAssignmentSchema = createInsertSchema(workAssignments).omit({
      id: true,
      createdAt: true,
      startedAt: true,
      completedAt: true
    }).extend({
      dueDate: z.string().optional(),
      assignedUsers: z.string().optional()
    });
    insertWorkCheckinSchema = createInsertSchema(workCheckins).omit({
      id: true,
      createdAt: true
    });
    insertOtpSchema = createInsertSchema(otpVerifications).omit({
      id: true,
      createdAt: true
    });
    usersRelations = relations(users, ({ many }) => ({
      serviceComplaints: many(serviceComplaints),
      serviceVisits: many(serviceVisits),
      assignedWork: many(workAssignments, { relationName: "assignedTo" }),
      createdAssignments: many(workAssignments, { relationName: "assignedBy" })
    }));
    receiptsRelations = relations(receipts, ({ many }) => ({
      otpVerifications: many(otpVerifications)
    }));
    serviceComplaintsRelations = relations(serviceComplaints, ({ one, many }) => ({
      assignedEngineer: one(users, {
        fields: [serviceComplaints.assignedEngineerId],
        references: [users.id]
      }),
      serviceVisits: many(serviceVisits),
      otpVerifications: many(otpVerifications)
    }));
    serviceVisitsRelations = relations(serviceVisits, ({ one }) => ({
      serviceComplaint: one(serviceComplaints, {
        fields: [serviceVisits.complaintId],
        references: [serviceComplaints.id]
      }),
      engineer: one(users, {
        fields: [serviceVisits.engineerId],
        references: [users.id]
      })
    }));
    otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
      receipt: one(receipts, {
        fields: [otpVerifications.receiptId],
        references: [receipts.id]
      }),
      serviceComplaint: one(serviceComplaints, {
        fields: [otpVerifications.complaintId],
        references: [serviceComplaints.id]
      })
    }));
    workAssignmentsRelations = relations(workAssignments, ({ one }) => ({
      assignedByUser: one(users, {
        fields: [workAssignments.assignedBy],
        references: [users.id],
        relationName: "assignedBy"
      }),
      assignedToUser: one(users, {
        fields: [workAssignments.assignedTo],
        references: [users.id],
        relationName: "assignedTo"
      })
    }));
  }
});

// server/db.ts
import "dotenv/config";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var databaseUrl, isLocalWindows, isNeonDB, db, client;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    databaseUrl = process.env.DATABASE_URL;
    isLocalWindows = process.platform === "win32" || databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    isNeonDB = databaseUrl.includes("neon.tech") || databaseUrl.includes(".neon.");
    console.log("\u{1F504} Connecting to PostgreSQL using standard connection...");
    client = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
    });
    db = drizzlePg({ client, schema: schema_exports });
  }
});

// server/utils/auth.ts
import bcrypt from "bcryptjs";
var SALT_ROUNDS, AuthUtils;
var init_auth = __esm({
  "server/utils/auth.ts"() {
    "use strict";
    SALT_ROUNDS = 12;
    AuthUtils = class {
      static async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
      }
      static async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
      }
      static generateOTP() {
        return Math.floor(1e5 + Math.random() * 9e5).toString();
      }
      static isPasswordStrong(password) {
        if (password.length < 8) {
          return { isValid: false, message: "Password must be at least 8 characters long" };
        }
        if (!/[A-Z]/.test(password)) {
          return { isValid: false, message: "Password must contain at least one uppercase letter" };
        }
        if (!/[a-z]/.test(password)) {
          return { isValid: false, message: "Password must contain at least one lowercase letter" };
        }
        if (!/[0-9]/.test(password)) {
          return { isValid: false, message: "Password must contain at least one number" };
        }
        return { isValid: true };
      }
    };
  }
});

// server/backup-routes.ts
var backup_routes_exports = {};
__export(backup_routes_exports, {
  default: () => backup_routes_default
});
import "dotenv/config";
import { Router } from "express";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
function ensureDirectories() {
  const dirs = [CONFIG.BACKUP_DIR, "./logs"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}
function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parsed.port || "5432",
      username: parsed.username || "postgres",
      password: parsed.password || "",
      database: parsed.pathname.slice(1) || "postgres"
    };
  } catch (error) {
    return {
      host: "localhost",
      port: "5432",
      username: "taj_user",
      password: process.env.DATABASE_PASSWORD || "",
      database: "taj_crm"
    };
  }
}
function generateBackupFilename() {
  const now = /* @__PURE__ */ new Date();
  const timestamp2 = now.toISOString().replace(/:/g, "-").replace(/\..+/, "").replace("T", "_");
  return `${CONFIG.BACKUP_PREFIX}_${timestamp2}.sql`;
}
function log(message) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `[${timestamp2}] ${message}`;
  console.log(logMessage);
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + "\n");
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}
function getBackupStats() {
  try {
    ensureDirectories();
    const files = fs.readdirSync(CONFIG.BACKUP_DIR);
    const backupFiles = files.filter((file) => file.startsWith(CONFIG.BACKUP_PREFIX));
    let totalSize = 0;
    const stats = backupFiles.map((filename) => {
      const filePath = path.join(CONFIG.BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      totalSize += stat.size;
      return {
        filename,
        size: stat.size,
        created: stat.mtime,
        sizeMB: Math.round(stat.size / 1024 / 1024 * 100) / 100
      };
    });
    return {
      success: true,
      count: backupFiles.length,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      files: stats.sort((a, b) => b.created.getTime() - a.created.getTime())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      count: 0,
      totalSize: 0,
      totalSizeMB: 0,
      files: []
    };
  }
}
function createBackup() {
  return new Promise((resolve) => {
    try {
      ensureDirectories();
      if (!CONFIG.DATABASE_URL) {
        resolve({ success: false, message: "DATABASE_URL not configured" });
        return;
      }
      const dbConfig = parseDatabaseUrl(CONFIG.DATABASE_URL);
      console.log("Database config:", { ...dbConfig, password: "***" });
      const backupFilename = generateBackupFilename().replace(".gz", "");
      const backupPath = path.join(CONFIG.BACKUP_DIR, backupFilename);
      log(`Starting manual backup: ${backupFilename}`);
      log(`Database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password,
        PGHOST: dbConfig.host,
        PGPORT: dbConfig.port.toString(),
        PGUSER: dbConfig.username,
        PGDATABASE: dbConfig.database
      };
      const testArgs = ["--version"];
      const testPgDump = spawn("pg_dump", testArgs, { stdio: "pipe" });
      testPgDump.on("error", (error) => {
        log(`pg_dump not found: ${error.message}`);
        resolve({
          success: false,
          message: "pg_dump command not found. Please install PostgreSQL client tools."
        });
        return;
      });
      testPgDump.on("close", (code) => {
        if (code !== 0) {
          resolve({ success: false, message: "pg_dump command failed" });
          return;
        }
        const pgDumpArgs = [
          "--verbose",
          "--clean",
          "--no-owner",
          "--no-privileges",
          "--format=plain",
          "--file",
          backupPath,
          dbConfig.database
        ];
        log(`Running: pg_dump ${pgDumpArgs.join(" ")}`);
        const pgDump = spawn("pg_dump", pgDumpArgs, {
          env,
          stdio: ["ignore", "pipe", "pipe"]
        });
        let errorOutput = "";
        let stdOutput = "";
        pgDump.stdout.on("data", (data) => {
          stdOutput += data.toString();
        });
        pgDump.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });
        pgDump.on("error", (error) => {
          log(`pg_dump spawn error: ${error.message}`);
          resolve({ success: false, message: `Spawn error: ${error.message}` });
        });
        pgDump.on("close", (code2) => {
          log(`pg_dump exited with code: ${code2}`);
          log(`stderr: ${errorOutput}`);
          log(`stdout: ${stdOutput}`);
          if (code2 === 0) {
            try {
              if (fs.existsSync(backupPath)) {
                const stats = fs.statSync(backupPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                log(`Backup completed successfully: ${backupFilename} (${sizeMB} MB)`);
                resolve({
                  success: true,
                  message: "Backup created successfully",
                  filename: backupFilename,
                  sizeMB: parseFloat(sizeMB)
                });
              } else {
                resolve({ success: false, message: "Backup file was not created" });
              }
            } catch (err) {
              resolve({ success: false, message: `File verification failed: ${err.message}` });
            }
          } else {
            resolve({
              success: false,
              message: `pg_dump failed (code ${code2}): ${errorOutput || "Unknown error"}`
            });
          }
        });
      });
    } catch (error) {
      log(`Backup error: ${error.message}`);
      resolve({ success: false, message: error.message });
    }
  });
}
var router, CONFIG, backup_routes_default;
var init_backup_routes = __esm({
  "server/backup-routes.ts"() {
    "use strict";
    router = Router();
    CONFIG = {
      DATABASE_URL: process.env.DATABASE_URL,
      BACKUP_DIR: process.env.BACKUP_DIR || "./backups",
      BACKUP_PREFIX: "taj_crm_backup",
      LOG_FILE: "./logs/backup.log"
    };
    router.get("/stats", async (req, res) => {
      try {
        const stats = getBackupStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    router.post("/create", async (req, res) => {
      try {
        log("Manual backup requested from admin panel");
        const result = await createBackup();
        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });
    router.get("/download/:filename", (req, res) => {
      try {
        const filename = req.params.filename;
        if (!filename.startsWith(CONFIG.BACKUP_PREFIX) || !filename.endsWith(".sql.gz")) {
          return res.status(400).json({ error: "Invalid backup filename" });
        }
        const filePath = path.join(CONFIG.BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Backup file not found" });
        }
        log(`Backup download requested: ${filename}`);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/gzip");
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        fileStream.on("error", (error) => {
          console.error("Download error:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Download failed" });
          }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    router.delete("/delete/:filename", (req, res) => {
      try {
        const filename = req.params.filename;
        if (!filename.startsWith(CONFIG.BACKUP_PREFIX)) {
          return res.status(400).json({ error: "Invalid backup filename" });
        }
        const filePath = path.join(CONFIG.BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Backup file not found" });
        }
        fs.unlinkSync(filePath);
        log(`Backup deleted: ${filename}`);
        res.json({
          success: true,
          message: `Backup ${filename} deleted successfully`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    backup_routes_default = router;
  }
});

// server/seed.ts
var seed_exports = {};
__export(seed_exports, {
  seedDatabase: () => seedDatabase
});
import "dotenv/config";
async function seedDatabase() {
  try {
    console.log("\u{1F331} Starting database seeding...");
    const defaultUsers = [
      {
        username: "javed",
        password: "admin123",
        role: "admin",
        name: "Javed Khan",
        mobile: "07272-356183",
        email: "javed@newrajelectronics.com",
        address: "New Taj Electronics, Main Market",
        isActive: true
      },
      {
        username: "raaj",
        password: "password",
        role: "service_engineer",
        name: "Raaj Kumar",
        mobile: "07272-220005",
        email: "raaj@newrajelectronics.com",
        address: "New Taj Electronics, Service Department",
        isActive: true
      },
      {
        username: "technician",
        password: "password",
        role: "technician",
        name: "Amit Technician",
        mobile: "07272-356184",
        email: "technician@newrajelectronics.com",
        address: "New Taj Electronics, Repair Department",
        isActive: true
      },
      {
        username: "tech1",
        password: "tech123",
        role: "technician",
        name: "Rohit Sharma",
        mobile: "07272-356185",
        email: "rohit@newrajelectronics.com",
        address: "New Taj Electronics, Workshop",
        isActive: true
      },
      {
        username: "service1",
        password: "service123",
        role: "service_engineer",
        name: "Vikram Singh",
        mobile: "07272-356186",
        email: "vikram@newrajelectronics.com",
        address: "New Taj Electronics, Field Service",
        isActive: true
      }
    ];
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("\u{1F465} Seeding default users...");
      const usersWithHashedPasswords = await Promise.all(
        defaultUsers.map(async (user) => ({
          ...user,
          password: await AuthUtils.hashPassword(user.password)
        }))
      );
      await db.insert(users).values(usersWithHashedPasswords);
      console.log("\u2705 Default users created successfully with encrypted passwords!");
    } else {
      console.log("\u{1F465} Users already exist, skipping user seeding");
    }
    const sampleReceipts = [
      {
        receiptNumber: "TD001",
        customerName: "Rajesh Kumar",
        mobile: "9876543210",
        rgpNumber: "RGP001",
        rgpDate: "2025-01-10",
        product: "iPhone 13",
        model: "A2482",
        problemDescription: "Screen not working, touch issue",
        estimatedAmount: 5e3,
        estimatedDeliveryDate: "2025-01-20",
        status: "In Process",
        technicianNotes: "Screen replacement required"
      },
      {
        receiptNumber: "TD002",
        customerName: "Priya Sharma",
        mobile: "9876543211",
        product: "Samsung Galaxy S21",
        model: "SM-G991B",
        problemDescription: "Battery draining fast",
        estimatedAmount: 2500,
        estimatedDeliveryDate: "2025-01-18",
        status: "Pending",
        technicianNotes: null
      },
      {
        receiptNumber: "TD003",
        customerName: "Amit Patel",
        mobile: "9876543212",
        rgpNumber: "RGP002",
        rgpDate: "2025-01-12",
        product: "OnePlus 9",
        model: "LE2113",
        problemDescription: "Charging port not working",
        estimatedAmount: 1800,
        estimatedDeliveryDate: "2025-01-22",
        status: "Ready to Deliver",
        technicianNotes: "Charging port replaced, tested OK"
      },
      {
        receiptNumber: "TD004",
        customerName: "Sunita Devi",
        mobile: "9876543213",
        product: "Redmi Note 10",
        model: "M2101K7AI",
        problemDescription: "Speaker not working",
        estimatedAmount: 1200,
        estimatedDeliveryDate: "2025-01-25",
        status: "Product Ordered",
        technicianNotes: "Speaker part ordered from supplier"
      },
      {
        receiptNumber: "TD005",
        customerName: "Ravi Gupta",
        mobile: "9876543214",
        product: "iPhone 12",
        model: "A2172",
        problemDescription: "Camera not focusing",
        estimatedAmount: 4500,
        estimatedDeliveryDate: "2025-01-15",
        status: "Delivered",
        deliveredAt: /* @__PURE__ */ new Date("2025-01-15T10:30:00Z"),
        technicianNotes: "Camera module replaced, customer satisfied"
      }
    ];
    const existingReceipts = await db.select().from(receipts);
    if (existingReceipts.length === 0) {
      console.log("\u{1F4F1} Seeding sample receipts...");
      await db.insert(receipts).values(sampleReceipts);
      console.log("\u2705 Sample receipts created successfully!");
    } else {
      console.log("\u{1F4F1} Receipts already exist, skipping receipt seeding");
    }
    const sampleComplaints = [
      {
        complaintNumber: "TE001",
        customerName: "Mohan Lal",
        mobile: "9876543215",
        address: "123 Gandhi Nagar, New Delhi",
        product: "LED TV",
        model: "Samsung 43 inch",
        issueDescription: "TV not turning on, power issue",
        status: "Engineer Assigned",
        assignedEngineerId: 2,
        // Raaj
        latitude: "28.6139",
        longitude: "77.2090"
      },
      {
        complaintNumber: "TE002",
        customerName: "Kavita Singh",
        mobile: "9876543216",
        address: "456 Karol Bagh, New Delhi",
        product: "Washing Machine",
        model: "LG 7kg Front Load",
        issueDescription: "Not spinning, making noise",
        status: "Pending",
        assignedEngineerId: null,
        latitude: "28.6508",
        longitude: "77.1951"
      },
      {
        complaintNumber: "TE003",
        customerName: "Deepak Kumar",
        mobile: "9876543217",
        address: "789 Lajpat Nagar, New Delhi",
        product: "Air Conditioner",
        model: "Voltas 1.5 Ton",
        issueDescription: "Not cooling properly",
        status: "In Progress",
        assignedEngineerId: 5,
        // Vikram
        latitude: "28.5667",
        longitude: "77.2431"
      },
      {
        complaintNumber: "TE004",
        customerName: "Rekha Devi",
        mobile: "9876543218",
        address: "321 Rohini, New Delhi",
        product: "Refrigerator",
        model: "Whirlpool Double Door",
        issueDescription: "Freezer not working",
        status: "Completed",
        assignedEngineerId: 2,
        // Raaj
        completedAt: /* @__PURE__ */ new Date("2025-01-14T16:00:00Z"),
        latitude: "28.7041",
        longitude: "77.1025"
      }
    ];
    const existingComplaints = await db.select().from(serviceComplaints);
    if (existingComplaints.length === 0) {
      console.log("\u{1F527} Seeding sample service complaints...");
      await db.insert(serviceComplaints).values(sampleComplaints);
      console.log("\u2705 Sample service complaints created successfully!");
    } else {
      console.log("\u{1F527} Service complaints already exist, skipping complaint seeding");
    }
    console.log("\u{1F389} Database seeding completed successfully!");
  } catch (error) {
    console.error("\u274C Error seeding database:", error);
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        console.error("\u274C Database connection refused. Check if DATABASE_URL is correct and database is accessible.");
      } else if (error.message.includes("timeout")) {
        console.error("\u274C Database connection timeout. Database might be slow or unavailable.");
      } else {
        console.error("\u274C Database error:", error.message);
      }
    }
    console.log("\u26A0\uFE0F Continuing server startup without seeding...");
    return;
  }
}
var init_seed = __esm({
  "server/seed.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_auth();
    seedDatabase();
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();
init_db();
import { eq, desc, sql } from "drizzle-orm";
var PostgreSQLStorage = class {
  db;
  constructor() {
    this.db = db;
  }
  async getUser(id) {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserById(id) {
    return this.getUser(id);
  }
  async getUserByUsername(username) {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async getUserByMobile(mobile) {
    const result = await this.db.select().from(users).where(eq(users.mobile, mobile));
    return result[0];
  }
  async createUser(user) {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }
  async getAllUsers() {
    return await this.db.select().from(users);
  }
  async updateUser(id, updates) {
    await this.db.update(users).set(updates).where(eq(users.id, id));
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async deleteUser(id) {
    await this.db.delete(users).where(eq(users.id, id));
  }
  async deactivateUser(id) {
    await this.db.update(users).set({ isActive: false }).where(eq(users.id, id));
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async createCustomer(customer) {
    const result = await this.db.insert(customers).values(customer).returning();
    return result[0];
  }
  async getCustomer(id) {
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }
  async getCustomerByMobile(mobile) {
    const result = await this.db.select().from(customers).where(eq(customers.mobile, mobile));
    return result[0];
  }
  async getCustomerByEmail(email) {
    const result = await this.db.select().from(customers).where(eq(customers.email, email));
    return result[0];
  }
  async getAllCustomers() {
    return await this.db.select().from(customers);
  }
  async updateCustomer(id, updates) {
    await this.db.update(customers).set(updates).where(eq(customers.id, id));
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }
  async deleteCustomer(id) {
    const result = await this.db.delete(customers).where(eq(customers.id, id));
    return result.rowsAffected > 0;
  }
  async searchCustomers(query) {
    const result = await this.db.select().from(customers).where(sql`LOWER(name) LIKE LOWER('%${query}%') OR LOWER(mobile) LIKE LOWER('%${query}%') OR LOWER(email) LIKE LOWER('%${query}%')`);
    return result;
  }
  async createReceipt(receipt) {
    const lastReceipt = await this.db.select().from(receipts).orderBy(desc(receipts.createdAt)).limit(1);
    let nextNumber = 1;
    if (lastReceipt.length > 0) {
      const lastNumber = parseInt(lastReceipt[0].receiptNumber.replace("TD", ""));
      nextNumber = lastNumber + 1;
    }
    const receiptNumber = `TD${nextNumber.toString().padStart(3, "0")}`;
    const result = await this.db.insert(receipts).values({
      ...receipt,
      receiptNumber
    }).returning();
    return result[0];
  }
  async getReceipt(id) {
    const result = await this.db.select().from(receipts).where(eq(receipts.id, id));
    return result[0];
  }
  async getReceiptById(id) {
    return this.getReceipt(id);
  }
  async getAllReceipts() {
    return await this.db.select().from(receipts).orderBy(desc(receipts.createdAt));
  }
  async updateReceipt(id, updates) {
    await this.db.update(receipts).set(updates).where(eq(receipts.id, id));
    const result = await this.db.select().from(receipts).where(eq(receipts.id, id));
    return result[0];
  }
  async getReceiptByNumber(receiptNumber) {
    const result = await this.db.select().from(receipts).where(eq(receipts.receiptNumber, receiptNumber));
    return result[0];
  }
  async createOtpVerification(otp) {
    const result = await this.db.insert(otpVerifications).values(otp).returning();
    return result[0];
  }
  // Service Complaint methods
  async createServiceComplaint(complaint) {
    const lastComplaint = await this.db.select().from(serviceComplaints).orderBy(desc(serviceComplaints.createdAt)).limit(1);
    let nextNumber = 1;
    if (lastComplaint.length > 0) {
      const lastNumber = parseInt(lastComplaint[0].complaintNumber.replace("TE", ""));
      nextNumber = lastNumber + 1;
    }
    const complaintNumber = `TE${nextNumber.toString().padStart(3, "0")}`;
    const result = await this.db.insert(serviceComplaints).values({
      ...complaint,
      complaintNumber
    }).returning();
    return result[0];
  }
  async getServiceComplaint(id) {
    const result = await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.id, id));
    return result[0];
  }
  async getAllServiceComplaints() {
    return await this.db.select().from(serviceComplaints).orderBy(desc(serviceComplaints.createdAt));
  }
  async updateServiceComplaint(id, updates) {
    await this.db.update(serviceComplaints).set(updates).where(eq(serviceComplaints.id, id));
    const result = await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.id, id));
    return result[0];
  }
  async getServiceComplaintByNumber(complaintNumber) {
    const result = await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.complaintNumber, complaintNumber));
    return result[0];
  }
  async getServiceComplaintsByEngineer(engineerId) {
    return await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.assignedEngineerId, engineerId)).orderBy(desc(serviceComplaints.createdAt));
  }
  // Service Visit methods
  async createServiceVisit(visit) {
    const result = await this.db.insert(serviceVisits).values(visit).returning();
    return result[0];
  }
  async getServiceVisitsByComplaint(complaintId) {
    return await this.db.select().from(serviceVisits).where(eq(serviceVisits.complaintId, complaintId)).orderBy(desc(serviceVisits.createdAt));
  }
  async getAllServiceVisits() {
    return await this.db.select().from(serviceVisits).orderBy(desc(serviceVisits.createdAt));
  }
  async updateServiceVisit(id, updates) {
    await this.db.update(serviceVisits).set(updates).where(eq(serviceVisits.id, id));
    const result = await this.db.select().from(serviceVisits).where(eq(serviceVisits.id, id));
    return result[0];
  }
  async getOtpByReceiptId(receiptId) {
    const result = await this.db.select().from(otpVerifications).where(eq(otpVerifications.receiptId, receiptId));
    return result[0];
  }
  async getOtpByComplaintId(complaintId) {
    const result = await this.db.select().from(otpVerifications).where(eq(otpVerifications.complaintId, complaintId));
    return result[0];
  }
  async markOtpVerified(id) {
    await this.db.update(otpVerifications).set({ verified: true }).where(eq(otpVerifications.id, id));
  }
  // Work Assignment methods
  async createWorkAssignment(assignment) {
    const result = await this.db.insert(workAssignments).values(assignment).returning();
    return result[0];
  }
  async getWorkAssignment(id) {
    const result = await this.db.select().from(workAssignments).where(eq(workAssignments.id, id));
    return result[0];
  }
  async getAllWorkAssignments() {
    return await this.db.select().from(workAssignments).orderBy(desc(workAssignments.createdAt));
  }
  async getWorkAssignmentsByUser(userId) {
    return await this.db.select().from(workAssignments).where(eq(workAssignments.assignedTo, userId)).orderBy(desc(workAssignments.createdAt));
  }
  async getWorkAssignmentsByMultipleUsers(userIds) {
    const assignments = await this.db.select().from(workAssignments).orderBy(desc(workAssignments.createdAt));
    return assignments.filter((assignment) => {
      if (assignment.assignedUsers) {
        try {
          const assignedUserIds = JSON.parse(assignment.assignedUsers);
          return userIds.some((userId) => assignedUserIds.includes(userId));
        } catch {
          return false;
        }
      }
      return userIds.includes(assignment.assignedTo);
    });
  }
  async updateWorkAssignment(id, updates) {
    await this.db.update(workAssignments).set(updates).where(eq(workAssignments.id, id));
    const result = await this.db.select().from(workAssignments).where(eq(workAssignments.id, id));
    return result[0];
  }
  async deleteWorkAssignment(id) {
    const result = await this.db.delete(workAssignments).where(eq(workAssignments.id, id));
    return result.rowsAffected > 0;
  }
  // Work Checkin methods
  async createWorkCheckin(checkin) {
    const result = await this.db.insert(workCheckins).values(checkin).returning();
    return result[0];
  }
  async getWorkCheckinsByAssignment(assignmentId) {
    return await this.db.select().from(workCheckins).where(eq(workCheckins.assignmentId, assignmentId)).orderBy(desc(workCheckins.createdAt));
  }
  async getWorkCheckinsByUser(userId) {
    return await this.db.select().from(workCheckins).where(eq(workCheckins.userId, userId)).orderBy(desc(workCheckins.createdAt));
  }
  async updateWorkCheckin(id, updates) {
    await this.db.update(workCheckins).set(updates).where(eq(workCheckins.id, id));
    const result = await this.db.select().from(workCheckins).where(eq(workCheckins.id, id));
    return result[0];
  }
};
var storage = new PostgreSQLStorage();

// server/routes.ts
init_schema();

// server/notification-service.ts
import "dotenv/config";
var AISENSY_API_KEY = process.env.AISENSY_API_KEY || "";
var AISENSY_PHONE_NUMBER_ID = process.env.AISENSY_PHONE_NUMBER_ID || "";
var AISENSY_BASE_URL = process.env.AISENSY_BASE_URL || "https://backend.aisensy.com";
var SMS_API_URL = process.env.SMS_API_URL || "";
var SMS_API_KEY = process.env.SMS_API_KEY || "";
var SMS_SENDER_ID = process.env.SMS_SENDER_ID || "TAJCRM";
var NotificationService = class {
  // Aisensy WhatsApp API Methods
  async sendAisensyCampaign(message) {
    try {
      if (!AISENSY_API_KEY) {
        console.log("Aisensy API key not configured");
        return false;
      }
      const response = await fetch(`${AISENSY_BASE_URL}/campaign/t1/api/v2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      });
      const result = await response.json();
      if (response.ok) {
        console.log("Aisensy campaign sent successfully:", result);
        return true;
      } else {
        console.error("Aisensy API error:", result);
        return false;
      }
    } catch (error) {
      console.error("Error sending Aisensy campaign:", error);
      return false;
    }
  }
  // Helper method to send WhatsApp messages using Aisensy
  async sendWhatsAppMessage(to, userName, campaignName, templateParams, source) {
    const message = {
      apiKey: AISENSY_API_KEY,
      campaignName,
      destination: to,
      userName,
      source: source || "TAJ_CRM",
      templateParams: templateParams || []
    };
    return await this.sendAisensyCampaign(message);
  }
  // SMS Gateway Methods
  async sendSMS(smsData) {
    try {
      if (!SMS_API_KEY || !SMS_API_URL) {
        console.log(`SMS for ${smsData.to}: ${smsData.message}`);
        return true;
      }
      const response = await fetch(SMS_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SMS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: smsData.to,
          from: SMS_SENDER_ID,
          text: smsData.message
        })
      });
      const result = await response.json();
      if (response.ok) {
        console.log("SMS sent successfully:", result);
        return true;
      } else {
        console.error("SMS API error:", result);
        return false;
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }
  // Receipt Notifications
  async sendReceiptCreatedNotification(receipt) {
    const baseUrl = process.env.BASE_URL || "https://your-domain.com";
    const trackingUrl = `${baseUrl}/track/${receipt.receiptNumber}`;
    const templateParams = [
      receipt.customerName || "",
      receipt.receiptNumber || "",
      trackingUrl,
      receipt.product || "",
      receipt.model || "",
      (receipt.estimatedAmount || 0).toString(),
      receipt.status || ""
    ];
    await this.sendWhatsAppMessage(
      receipt.mobile,
      receipt.customerName,
      "receipt_created",
      templateParams,
      "TAJ_CRM"
    );
  }
  async sendReceiptStatusUpdate(receipt, oldStatus) {
    const baseUrl = process.env.BASE_URL || "https://your-domain.com";
    const trackingUrl = `${baseUrl}/track/${receipt.receiptNumber}`;
    const templateParams = [
      receipt.customerName || "",
      receipt.receiptNumber || "",
      receipt.status || "",
      trackingUrl,
      oldStatus,
      receipt.product || ""
    ];
    await this.sendWhatsAppMessage(
      receipt.mobile,
      receipt.customerName || "",
      "status_update",
      templateParams,
      "TAJ_CRM"
    );
    if (receipt.status === "Ready to Deliver" || receipt.status === "Delivered" || receipt.status === "Not Repaired - Return As It Is") {
      let smsText = "";
      if (receipt.status === "Not Repaired - Return As It Is") {
        smsText = `New Taj Electronics: Your device ${receipt.product} could not be repaired. Please collect as is. No charges. Receipt: ${receipt.receiptNumber}. Contact: 07272-356183`;
      } else {
        smsText = `New Taj Electronics: Your device ${receipt.product} is ${receipt.status}. Receipt: ${receipt.receiptNumber}. Contact: 07272-356183`;
      }
      const smsMessage = {
        to: receipt.mobile,
        message: smsText,
        type: "STATUS_UPDATE"
      };
      await this.sendSMS(smsMessage);
    }
  }
  // OTP Delivery System
  async sendDeliveryOTP(mobile, otp, receiptNumber) {
    const smsMessage = {
      to: mobile,
      message: `New Taj Electronics
Delivery OTP for Receipt ${receiptNumber}: ${otp}
Valid for 10 minutes only.
Do not share this OTP.`,
      type: "OTP"
    };
    const templateParams = [
      receiptNumber,
      otp,
      "10 minutes"
    ];
    const smsResult = await this.sendSMS(smsMessage);
    const whatsappResult = await this.sendWhatsAppMessage(
      mobile,
      "Customer",
      "delivery_otp",
      templateParams,
      "TAJ_CRM"
    );
    return smsResult || whatsappResult;
  }
  // Service Complaint Notifications
  async sendServiceComplaintCreated(complaint) {
    const templateParams = [
      complaint.customerName || "",
      complaint.complaintNumber || "",
      complaint.product || "",
      complaint.model || "",
      complaint.issueDescription || "",
      complaint.status || ""
    ];
    await this.sendWhatsAppMessage(
      complaint.mobile,
      complaint.customerName || "",
      "service_complaint_created",
      templateParams,
      "TAJ_CRM"
    );
  }
  async sendServiceStatusUpdate(complaint, oldStatus) {
    const templateParams = [
      complaint.customerName || "",
      complaint.complaintNumber || "",
      complaint.status || "",
      oldStatus,
      complaint.product || ""
    ];
    await this.sendWhatsAppMessage(
      complaint.mobile,
      complaint.customerName || "",
      "service_status_update",
      templateParams,
      "TAJ_CRM"
    );
  }
  // Auto-reply for customer messages
  async handleCustomerMessage(from, messageText) {
    const lowerMessage = messageText.toLowerCase();
    let replyText = "";
    if (lowerMessage.includes("status") || lowerMessage.includes("update")) {
      replyText = `\u{1F527} *New Taj Electronics* \u{1F527}

For status updates, please visit:
https://your-domain.com/track

Enter your receipt number (TD***) or complaint number (TE***)

\u{1F4DE} Call: 07272-356183, 07272-220005
\u{1F4E7} Email: tajdws@gmail.com`;
    } else if (lowerMessage.includes("track") || lowerMessage.includes("receipt")) {
      replyText = `\u{1F4F1} *New Taj Electronics* \u{1F4F1}

To track your repair/service:
1. Visit: https://your-domain.com/track
2. Enter your receipt/complaint number
3. Get real-time status updates

\u{1F4DE} Support: 07272-356183`;
    } else {
      replyText = `\u{1F44B} *New Taj Electronics* \u{1F44B}

Thank you for contacting us!

\u{1F4F1} Track repairs: https://your-domain.com/track
\u{1F4DE} Call us: 07272-356183, 07272-220005
\u{1F4E7} Email: tajdws@gmail.com

We'll respond to your message soon!`;
    }
    const templateParams = [
      "https://your-domain.com/track",
      "07272-356183",
      "07272-220005",
      "tajdws@gmail.com"
    ];
    await this.sendWhatsAppMessage(
      from,
      "Customer",
      "auto_reply",
      templateParams,
      "TAJ_CRM"
    );
  }
};
var notificationService = new NotificationService();

// server/routes.ts
init_auth();
async function registerRoutes(app2) {
  app2.get("/api/receipts", async (req, res) => {
    try {
      const receipts2 = await storage.getAllReceipts();
      res.json(receipts2);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ error: "Failed to fetch receipts" });
    }
  });
  app2.post("/api/receipts", async (req, res) => {
    try {
      console.log("Receipt creation request body:", req.body);
      const parsed = insertReceiptSchema.parse(req.body);
      console.log("Parsed receipt data:", parsed);
      const receipt = await storage.createReceipt(parsed);
      console.log("Created receipt:", receipt);
      try {
        await notificationService.sendReceiptCreatedNotification(receipt);
      } catch (notificationError) {
        console.error("Failed to send receipt notification:", notificationError);
      }
      res.json(receipt);
    } catch (error) {
      console.error("Receipt creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to create receipt", details: error.message });
      }
    }
  });
  app2.patch("/api/receipts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const currentReceipt = await storage.getReceiptById(id);
      if (!currentReceipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }
      const receipt = await storage.updateReceipt(id, updates);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }
      if (updates.status && updates.status !== currentReceipt.status) {
        try {
          await notificationService.sendReceiptStatusUpdate(receipt, currentReceipt.status);
        } catch (notificationError) {
          console.error("Failed to send status update notification:", notificationError);
        }
      }
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ error: "Failed to update receipt" });
    }
  });
  app2.get("/api/stats", async (req, res) => {
    try {
      const receipts2 = await storage.getAllReceipts();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayReceipts = receipts2.filter((receipt) => {
        const receiptDate = new Date(receipt.createdAt);
        return receiptDate >= today && receiptDate < tomorrow;
      }).length;
      const lastReceiptNumber = receipts2.length > 0 ? receipts2[0].receiptNumber : "TD000";
      const readyToDeliver = receipts2.filter((receipt) => receipt.status === "Ready to Deliver").length;
      res.json({
        todayReceipts,
        lastReceiptNumber,
        readyToDeliver
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  app2.get("/api/track/:trackingNumber", async (req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;
      if (trackingNumber.startsWith("TD")) {
        const receipt = await storage.getReceiptByNumber(trackingNumber);
        if (receipt) {
          return res.json({
            type: "receipt",
            data: receipt
          });
        }
      }
      if (trackingNumber.startsWith("TE")) {
        const complaint = await storage.getServiceComplaintByNumber(trackingNumber);
        if (complaint) {
          const visits = await storage.getServiceVisitsByComplaint(complaint.id);
          return res.json({
            type: "service",
            data: {
              ...complaint,
              visits
            }
          });
        }
      }
      return res.status(404).json({ error: "Tracking number not found" });
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      res.status(500).json({ error: "Failed to fetch tracking information" });
    }
  });
  app2.post("/api/send-otp", async (req, res) => {
    try {
      const { mobile, receiptId, otpType = "person", recipientName } = req.body;
      const receipt = await storage.getReceiptById(receiptId);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }
      const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.createOtpVerification({
        receiptId,
        mobile,
        otp,
        otpType,
        verified: false,
        expiresAt
      });
      try {
        const otpSent = await notificationService.sendDeliveryOTP(
          mobile,
          otp,
          receipt.receiptNumber,
          recipientName || "Customer"
        );
        if (otpSent) {
          res.json({ success: true, message: `OTP sent successfully to ${recipientName || "Customer"}` });
        } else {
          res.json({ success: true, message: "OTP generated (check console for demo)" });
          console.log(`OTP for ${mobile} (${recipientName}): ${otp}`);
        }
      } catch (notificationError) {
        console.error("Failed to send OTP:", notificationError);
        console.log(`OTP for ${mobile} (${recipientName}): ${otp}`);
        res.json({ success: true, message: "OTP generated (notification service error)" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });
  app2.post("/api/verify-otp", async (req, res) => {
    try {
      const { receiptId, otp } = req.body;
      const verification = await storage.getOtpByReceiptId(receiptId);
      if (!verification || verification.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      if (verification.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "OTP expired" });
      }
      await storage.markOtpVerified(verification.id);
      res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });
  app2.get("/api/service-complaints", async (req, res) => {
    try {
      const complaints = await storage.getAllServiceComplaints();
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service complaints" });
    }
  });
  app2.post("/api/service-complaints", async (req, res) => {
    try {
      console.log("Service complaint request body:", req.body);
      const parsed = insertServiceComplaintSchema.parse(req.body);
      console.log("Parsed complaint data:", parsed);
      const complaint = await storage.createServiceComplaint(parsed);
      console.log("Created complaint:", complaint);
      try {
        await notificationService.sendServiceComplaintCreated(complaint);
      } catch (notificationError) {
        console.error("Failed to send service complaint notification:", notificationError);
      }
      res.json(complaint);
    } catch (error) {
      console.error("Service complaint creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to create service complaint", details: error.message });
      }
    }
  });
  app2.patch("/api/service-complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const currentComplaint = await storage.getServiceComplaint(id);
      if (!currentComplaint) {
        return res.status(404).json({ error: "Service complaint not found" });
      }
      const complaint = await storage.updateServiceComplaint(id, updates);
      if (!complaint) {
        return res.status(404).json({ error: "Service complaint not found" });
      }
      if (updates.status && updates.status !== currentComplaint.status) {
        try {
          await notificationService.sendServiceStatusUpdate(complaint, currentComplaint.status);
        } catch (notificationError) {
          console.error("Failed to send service status update:", notificationError);
        }
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service complaint" });
    }
  });
  app2.get("/api/service-complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const complaint = await storage.getServiceComplaint(id);
      if (!complaint) {
        return res.status(404).json({ error: "Service complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service complaint" });
    }
  });
  app2.get("/api/service-complaints/engineer/:engineerId", async (req, res) => {
    try {
      const engineerId = parseInt(req.params.engineerId);
      const complaints = await storage.getServiceComplaintsByEngineer(engineerId);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch engineer complaints" });
    }
  });
  app2.get("/api/service-visits/complaint/:complaintId", async (req, res) => {
    try {
      const complaintId = parseInt(req.params.complaintId);
      const visits = await storage.getServiceVisitsByComplaint(complaintId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service visits" });
    }
  });
  app2.get("/api/service-visits/all", async (req, res) => {
    try {
      const visits = await storage.getAllServiceVisits();
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all service visits" });
    }
  });
  app2.post("/api/service-visits", async (req, res) => {
    try {
      console.log("Service visit request body:", req.body);
      const parsed = insertServiceVisitSchema.parse(req.body);
      console.log("Parsed visit data:", parsed);
      const visit = await storage.createServiceVisit(parsed);
      console.log("Created visit:", visit);
      res.json(visit);
    } catch (error) {
      console.error("Service visit creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to create service visit", details: error.message });
      }
    }
  });
  app2.patch("/api/service-visits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const visit = await storage.updateServiceVisit(id, updates);
      if (!visit) {
        return res.status(404).json({ error: "Service visit not found" });
      }
      res.json(visit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service visit" });
    }
  });
  app2.get("/api/track-service/:complaintNumber", async (req, res) => {
    try {
      const complaint = await storage.getServiceComplaintByNumber(req.params.complaintNumber);
      if (!complaint) {
        return res.status(404).json({ error: "Service complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service complaint" });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.isActive || user.isDeleted) {
        return res.status(401).json({ error: "Account is deactivated or deleted. Please contact administrator." });
      }
      let isValidPassword = false;
      if (user.password.startsWith("$2")) {
        isValidPassword = await AuthUtils.verifyPassword(password, user.password);
      } else {
        if (user.password === password) {
          isValidPassword = true;
          const hashedPassword = await AuthUtils.hashPassword(password);
          await storage.updateUser(user.id, { password: hashedPassword });
        }
      }
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.isActive || user.isDeleted) {
        return res.status(401).json({ error: "Account is deactivated or deleted. Please contact administrator." });
      }
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      console.log("User creation request:", req.body);
      const parsed = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", parsed);
      if (parsed.email) {
        const existingUserByEmail = await storage.getUserByEmail(parsed.email);
        if (existingUserByEmail) {
          return res.status(400).json({ error: "Email already exists. Please use a different email address." });
        }
      }
      if (parsed.mobile) {
        const existingUserByMobile = await storage.getUserByMobile(parsed.mobile);
        if (existingUserByMobile) {
          return res.status(400).json({ error: "Mobile number already exists. Please use a different mobile number." });
        }
      }
      const passwordValidation = AuthUtils.isPasswordStrong(parsed.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      const hashedPassword = await AuthUtils.hashPassword(parsed.password);
      const userDataWithHashedPassword = {
        ...parsed,
        password: hashedPassword
      };
      const user = await storage.createUser(userDataWithHashedPassword);
      console.log("Created user:", user);
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("User creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        if (error.message && error.message.includes("unique constraint")) {
          if (error.message.includes("users_email_unique")) {
            return res.status(400).json({ error: "Email already exists. Please use a different email address." });
          } else if (error.message.includes("users_mobile_unique")) {
            return res.status(400).json({ error: "Mobile number already exists. Please use a different mobile number." });
          } else if (error.message.includes("users_username_unique")) {
            return res.status(400).json({ error: "Username already exists. Please choose a different username." });
          }
        }
        res.status(500).json({ error: "Failed to create user", details: error.message });
      }
    }
  });
  app2.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      if (updates.password) {
        const passwordValidation = AuthUtils.isPasswordStrong(updates.password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({ error: passwordValidation.message });
        }
        updates.password = await AuthUtils.hashPassword(updates.password);
      }
      const user = await storage.updateUser(id, updates);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deletedBy = parseInt(req.body.deletedBy) || 1;
      const user = await storage.updateUser(id, {
        isDeleted: true,
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy,
        isActive: false
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const { password: _, ...userInfo } = user;
      res.json({ success: true, message: "User soft deleted successfully", user: userInfo });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app2.patch("/api/users/:id/deactivate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.deactivateUser(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });
  app2.patch("/api/users/:id/change-password", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      const user = await storage.getUserById ? await storage.getUserById(id) : await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isCurrentPasswordValid = await AuthUtils.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      const passwordValidation = AuthUtils.isPasswordStrong(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      const hashedNewPassword = await AuthUtils.hashPassword(newPassword);
      await storage.updateUser(id, { password: hashedNewPassword });
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById ? await storage.getUserById(id) : await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.get("/api/work-assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllWorkAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work assignments" });
    }
  });
  app2.get("/api/work-assignments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const assignments = await storage.getWorkAssignmentsByUser(userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });
  app2.post("/api/work-assignments", async (req, res) => {
    try {
      console.log("Work assignment creation request:", req.body);
      const requestData = { ...req.body };
      console.log("Original request data:", requestData);
      if (requestData.assignedUserIds && Array.isArray(requestData.assignedUserIds)) {
        requestData.assignedUsers = JSON.stringify(requestData.assignedUserIds);
        delete requestData.assignedUserIds;
      } else if (requestData.assignedUsers && Array.isArray(requestData.assignedUsers)) {
        requestData.assignedUsers = JSON.stringify(requestData.assignedUsers);
      }
      console.log("Processed request data:", requestData);
      const parsed = insertWorkAssignmentSchema.parse(requestData);
      const workAssignmentData = {
        ...parsed,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null
      };
      console.log("Parsed assignment data:", workAssignmentData);
      const assignment = await storage.createWorkAssignment(workAssignmentData);
      console.log("Created assignment:", assignment);
      res.json({
        success: true,
        message: "Assignment created successfully",
        data: assignment
      });
    } catch (error) {
      console.error("Work assignment creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to create work assignment", details: error.message });
      }
    }
  });
  app2.patch("/api/work-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = { ...req.body };
      if (updates.assignedUserIds && Array.isArray(updates.assignedUserIds)) {
        updates.assignedUsers = JSON.stringify(updates.assignedUserIds);
        delete updates.assignedUserIds;
      } else if (updates.assignedUsers && Array.isArray(updates.assignedUsers)) {
        updates.assignedUsers = JSON.stringify(updates.assignedUsers);
      }
      const assignment = await storage.updateWorkAssignment(id, updates);
      if (!assignment) {
        res.status(404).json({ error: "Work assignment not found" });
        return;
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update work assignment" });
    }
  });
  app2.delete("/api/work-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkAssignment(id);
      if (!success) {
        res.status(404).json({ error: "Work assignment not found" });
        return;
      }
      res.json({ success: true, message: "Work assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete work assignment" });
    }
  });
  app2.get("/api/work-assignments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const assignments = await storage.getWorkAssignmentsByMultipleUsers([userId]);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });
  app2.get("/api/work-assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllWorkAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work assignments" });
    }
  });
  app2.post("/api/work-checkins", async (req, res) => {
    try {
      console.log("Work checkin creation request:", req.body);
      const parsed = insertWorkCheckinSchema.parse(req.body);
      console.log("Parsed checkin data:", parsed);
      const checkin = await storage.createWorkCheckin(parsed);
      console.log("Created checkin:", checkin);
      res.json(checkin);
    } catch (error) {
      console.error("Work checkin creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        res.status(500).json({ error: "Failed to create work checkin", details: error.message });
      }
    }
  });
  app2.get("/api/work-checkins/assignment/:assignmentId", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const checkins = await storage.getWorkCheckinsByAssignment(assignmentId);
      res.json(checkins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignment checkins" });
    }
  });
  app2.get("/api/work-checkins/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const checkins = await storage.getWorkCheckinsByUser(userId);
      res.json(checkins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user checkins" });
    }
  });
  app2.patch("/api/work-checkins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const checkin = await storage.updateWorkCheckin(id, updates);
      if (!checkin) {
        return res.status(404).json({ error: "Work checkin not found" });
      }
      res.json(checkin);
    } catch (error) {
      res.status(500).json({ error: "Failed to update work checkin" });
    }
  });
  app2.get("/api/webhooks/whatsapp", (req, res) => {
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
    }
  });
  app2.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      if (body.object === "whatsapp_business_account") {
        body.entry?.forEach((entry) => {
          entry.changes?.forEach((change) => {
            if (change.field === "messages") {
              const messages = change.value.messages;
              messages?.forEach(async (message) => {
                const from = message.from;
                const messageText = message.text?.body || "";
                if (messageText) {
                  try {
                    await notificationService.handleCustomerMessage(from, messageText);
                  } catch (error) {
                    console.error("Failed to handle customer message:", error);
                  }
                }
              });
            }
          });
        });
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      res.status(500).send("Error");
    }
  });
  app2.post("/api/webhooks/sms", async (req, res) => {
    try {
      const { status, messageId, mobile, message } = req.body;
      console.log(`SMS Status: ${status} for ${mobile}`);
      res.status(200).send("OK");
    } catch (error) {
      console.error("SMS webhook error:", error);
      res.status(500).send("Error");
    }
  });
  app2.delete("/api/admin/cleanup-all-data", async (req, res) => {
    try {
      const user = await AuthUtils.getUser(req);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      await storage.deleteAllWorkCheckins();
      await storage.deleteAllWorkAssignments();
      await storage.deleteAllOtpVerifications();
      await storage.deleteAllServiceVisits();
      await storage.deleteAllServiceComplaints();
      await storage.deleteAllReceipts();
      res.json({
        success: true,
        message: "All data deleted successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data" });
    }
  });
  app2.use("/api/backup", (await Promise.resolve().then(() => (init_backup_routes(), backup_routes_exports))).default);
  app2.post("/api/send-receipt-whatsapp", async (req, res) => {
    try {
      const { receiptId, mobile, customerName } = req.body;
      const receipt = await storage.getReceiptById(receiptId);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }
      const baseUrl = process.env.BASE_URL || "http://localhost:5000";
      const trackingUrl = `${baseUrl}/track/${receipt.receiptNumber}`;
      const whatsappMessage = {
        to: mobile,
        type: "text",
        text: {
          body: `\u{1F4CB} *New Taj Electronics - Receipt Details* \u{1F4CB}

Receipt No: *${receipt.receiptNumber}*
Customer: ${customerName}
Product: ${receipt.product} - ${receipt.model}
Issue: ${receipt.issueDescription}
Estimated Amount: \u20B9${receipt.estimatedAmount.toLocaleString()}
Status: ${receipt.status}
Date: ${new Date(receipt.createdAt).toLocaleDateString("en-IN")}

\u{1F517} Track your repair: ${trackingUrl}

\u{1F4DE} Contact: 07272-356183, 07272-220005
\u{1F4E7} Email: tajdws@gmail.com

Thank you for choosing New Taj Electronics!`
        }
      };
      const success = await notificationService.sendWhatsAppMessage(whatsappMessage);
      if (success) {
        res.json({ success: true, message: "Receipt sent via WhatsApp successfully" });
      } else {
        res.status(500).json({ error: "Failed to send WhatsApp message" });
      }
    } catch (error) {
      console.error("Error sending receipt via WhatsApp:", error);
      res.status(500).json({ error: "Failed to send receipt via WhatsApp" });
    }
  });
  app2.get("/api/customer-search", async (req, res) => {
    try {
      const searchTerm = req.query.q;
      if (!searchTerm) {
        return res.json({
          receipts: [],
          services: [],
          totalRecords: 0
        });
      }
      const search = searchTerm.toLowerCase();
      const allReceipts = await storage.getAllReceipts();
      const receipts2 = allReceipts.filter(
        (receipt) => receipt.receiptNumber.toLowerCase().includes(search) || receipt.customerName.toLowerCase().includes(search) || receipt.mobile.includes(searchTerm) || receipt.rgpNumber && receipt.rgpNumber.toLowerCase().includes(search) || receipt.product.toLowerCase().includes(search) || receipt.model.toLowerCase().includes(search)
      );
      const allServices = await storage.getAllServiceComplaints();
      const services = allServices.filter(
        (service) => service.complaintNumber.toLowerCase().includes(search) || service.customerName.toLowerCase().includes(search) || service.mobile.includes(searchTerm) || service.productType.toLowerCase().includes(search)
      );
      res.json({
        receipts: receipts2,
        services,
        totalRecords: receipts2.length + services.length
      });
    } catch (error) {
      console.error("Customer search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.get("/api/customers", async (req, res) => {
    try {
      const customers2 = await storage.getAllCustomers();
      res.json(customers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.post("/api/customers", async (req, res) => {
    try {
      const { name, mobile, email, address, whoBought } = req.body;
      if (!name || !mobile) {
        return res.status(400).json({ error: "Name and mobile are required" });
      }
      const existingCustomer = await storage.getCustomerByMobile(mobile);
      if (existingCustomer) {
        return res.status(400).json({ error: "Customer with this mobile number already exists" });
      }
      const customer = await storage.createCustomer({
        name,
        mobile,
        email: email || null,
        address: address || null,
        whoBought: whoBought || null
      });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });
  app2.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });
  app2.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      if (updates.mobile) {
        const existingCustomer = await storage.getCustomerByMobile(updates.mobile);
        if (existingCustomer && existingCustomer.id !== id) {
          return res.status(400).json({ error: "Customer with this mobile number already exists" });
        }
      }
      const customer = await storage.updateCustomer(id, updates);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });
  app2.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });
  app2.get("/api/customers/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const customers2 = await storage.searchCustomers(query);
      res.json(customers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to search customers" });
    }
  });
  app2.post("/api/customers/import", async (req, res) => {
    try {
      const { customers: customersData } = req.body;
      if (!Array.isArray(customersData)) {
        return res.status(400).json({ error: "Invalid data format" });
      }
      const results = [];
      const errors = [];
      for (const customerData of customersData) {
        try {
          if (!customerData.name || !customerData.mobile) {
            errors.push({ data: customerData, error: "Name and mobile are required" });
            continue;
          }
          const existingCustomer = await storage.getCustomerByMobile(customerData.mobile);
          if (existingCustomer) {
            errors.push({ data: customerData, error: "Customer with this mobile already exists" });
            continue;
          }
          const customer = await storage.createCustomer({
            name: customerData.name,
            mobile: customerData.mobile,
            email: customerData.email || null,
            address: customerData.address || null,
            whoBought: customerData.whoBought || null
          });
          results.push(customer);
        } catch (error) {
          errors.push({ data: customerData, error: error.message });
        }
      }
      res.json({
        success: true,
        imported: results.length,
        errors: errors.length,
        results,
        errors
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to import customers" });
    }
  });
  app2.get("/api/customers/export", async (req, res) => {
    try {
      const customers2 = await storage.getAllCustomers();
      const csvData = customers2.map((customer) => ({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || "",
        address: customer.address || "",
        whoBought: customer.whoBought || "",
        createdAt: customer.createdAt
      }));
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
      const csvHeaders = "Name,Mobile,Email,Address,Who Bought,Created At\n";
      const csvRows = csvData.map(
        (row) => `"${row.name}","${row.mobile}","${row.email}","${row.address}","${row.whoBought}","${row.createdAt}"`
      ).join("\n");
      res.send(csvHeaders + csvRows);
    } catch (error) {
      res.status(500).json({ error: "Failed to export customers" });
    }
  });
  app2.post("/api/customers/:id/statement", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const allReceipts = await storage.getAllReceipts();
      const allComplaints = await storage.getAllServiceComplaints();
      const customerReceipts = allReceipts.filter(
        (receipt) => receipt.mobile === customer.mobile || receipt.customerName === customer.name
      );
      const customerComplaints = allComplaints.filter(
        (complaint) => complaint.mobile === customer.mobile || complaint.customerName === customer.name
      );
      const totalReceipts = customerReceipts.length;
      const totalComplaints = customerComplaints.length;
      const totalAmount = customerReceipts.reduce((sum, receipt) => sum + (receipt.estimatedAmount || 0), 0);
      const pendingAmount = customerReceipts.filter((receipt) => receipt.status !== "completed").reduce((sum, receipt) => sum + (receipt.estimatedAmount || 0), 0);
      const statementMessage = {
        to: customer.mobile,
        type: "text",
        text: {
          body: `\u{1F4CB} *Customer Statement - ${customer.name}* \u{1F4CB}

\u{1F4F1} Mobile: ${customer.mobile}
\u{1F4E7} Email: ${customer.email || "Not provided"}
\u{1F4CD} Address: ${customer.address || "Not provided"}

\u{1F4CA} *Summary:*
\u2022 Total Receipts: ${totalReceipts}
\u2022 Total Service Requests: ${totalComplaints}
\u2022 Total Amount: \u20B9${totalAmount.toLocaleString()}
\u2022 Pending Amount: \u20B9${pendingAmount.toLocaleString()}

\u{1F4CB} *Recent Receipts:*
` + customerReceipts.slice(0, 5).map(
            (receipt) => `\u2022 ${receipt.receiptNumber}: ${receipt.product} - \u20B9${receipt.estimatedAmount?.toLocaleString()} (${receipt.status})`
          ).join("\n") + (customerReceipts.length > 5 ? `
... and ${customerReceipts.length - 5} more` : "") + `

\u{1F4DE} Contact: 07272-356183, 07272-220005
\u{1F4E7} Email: tajdws@gmail.com

Thank you for choosing New Taj Electronics!`
        }
      };
      const success = await notificationService.sendWhatsAppMessage(statementMessage);
      if (success) {
        res.json({
          success: true,
          message: "Customer statement sent via WhatsApp successfully",
          customer: customer.name,
          totalReceipts,
          totalComplaints,
          totalAmount,
          pendingAmount
        });
      } else {
        res.status(500).json({ error: "Failed to send WhatsApp message" });
      }
    } catch (error) {
      console.error("Error sending customer statement:", error);
      res.status(500).json({ error: "Failed to send customer statement" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  try {
    const { seedDatabase: seedDatabase2 } = await Promise.resolve().then(() => (init_seed(), seed_exports));
  } catch (error) {
    console.error("\u26A0\uFE0F Database seeding failed:", error instanceof Error ? error.message : error);
    console.log("\u{1F4A1} To seed database manually, run: npm run db:seed");
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: false
  }, () => {
    log2(`serving on port ${port}`);
  });
})();
