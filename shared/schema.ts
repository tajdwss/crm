import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
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
  technicianNotes: text("technician_notes"),
});

export const serviceComplaints = pgTable("service_complaints", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  complaintNumber: text("complaint_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address"), // Made optional
  product: text("product").notNull(),
  model: text("model"), // Made optional
  issueDescription: text("issue_description").notNull(),
  status: text("status").notNull().default("Pending"),
  assignedEngineerId: integer("assigned_engineer_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  priority: text("priority").default("Normal"), // Add priority field
});

export const serviceVisits = pgTable("service_visits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  complaintId: integer("complaint_id").notNull().references(() => serviceComplaints.id),
  engineerId: integer("engineer_id").notNull().references(() => users.id),
  teamMembers: text("team_members"), // JSON array of user IDs who worked together
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  receiptId: integer("receipt_id").references(() => receipts.id),
  complaintId: integer("complaint_id").references(() => serviceComplaints.id),
  mobile: text("mobile").notNull(),
  otp: text("otp").notNull(),
  otpType: text("otp_type", { enum: ["person", "company", "custom"] }).default("person").notNull(),
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workAssignments = pgTable("work_assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").notNull().references(() => users.id), // Keep for backward compatibility
  assignedUsers: text("assigned_users"), // JSON array of user IDs
  workType: text("work_type", { enum: ["receipt", "service_complaint"] }).notNull(),
  workId: integer("work_id").notNull(), // Receipt ID or Service Complaint ID
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).default("pending").notNull(),
  assignmentNotes: text("assignment_notes"),
  dueDate: timestamp("due_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workCheckins = pgTable("work_checkins", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assignmentId: integer("assignment_id").notNull().references(() => workAssignments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  checkedInWith: text("checked_in_with"), // JSON array of user IDs who checked in together
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
  checkOutTime: timestamp("check_out_time"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WhatsApp Integration Tables
export const whatsappContacts = pgTable("whatsapp_contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  lastSeen: timestamp("last_seen"),
  customerId: integer("customer_id").references(() => customers.id),
  tags: text("tags"), // JSON array of tags
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contactId: integer("contact_id").references(() => whatsappContacts.id),
  messageId: text("message_id").unique(), // WhatsApp message ID
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  messageType: text("message_type", { enum: ["text", "image", "document", "audio", "video", "template"] }).notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  templateName: text("template_name"),
  templateParams: text("template_params"), // JSON array
  status: text("status", { enum: ["sent", "delivered", "read", "failed"] }).default("sent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whatsappCampaigns = pgTable("whatsapp_campaigns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  templateName: text("template_name").notNull(),
  targetAudience: text("target_audience"), // JSON criteria
  scheduledAt: timestamp("scheduled_at"),
  status: text("status", { enum: ["draft", "scheduled", "running", "completed", "failed"] }).default("draft"),
  totalContacts: integer("total_contacts").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  category: text("category", { enum: ["MARKETING", "UTILITY", "AUTHENTICATION"] }).notNull(),
  language: text("language").default("en").notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).default("PENDING"),
  headerType: text("header_type", { enum: ["TEXT", "IMAGE", "VIDEO", "DOCUMENT"] }),
  headerContent: text("header_content"),
  bodyContent: text("body_content").notNull(),
  footerContent: text("footer_content"),
  buttons: text("buttons"), // JSON array of buttons
  variables: text("variables"), // JSON array of variable placeholders
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  receiptNumber: true,
  createdAt: true,
  deliveredAt: true,
  paymentDate: true,
});

export const insertServiceComplaintSchema = createInsertSchema(serviceComplaints).omit({
  id: true,
  complaintNumber: true,
  createdAt: true,
  completedAt: true,
});

export const insertServiceVisitSchema = createInsertSchema(serviceVisits).omit({
  id: true,
  createdAt: true,
});

export const insertWorkAssignmentSchema = createInsertSchema(workAssignments).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
}).extend({
  dueDate: z.string().optional(),
  assignedUsers: z.string().optional(),
});

export const insertWorkCheckinSchema = createInsertSchema(workCheckins).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappContactSchema = createInsertSchema(whatsappContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappCampaignSchema = createInsertSchema(whatsappCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type ServiceComplaint = typeof serviceComplaints.$inferSelect;
export type InsertServiceComplaint = z.infer<typeof insertServiceComplaintSchema>;
export type ServiceVisit = typeof serviceVisits.$inferSelect;
export type InsertServiceVisit = z.infer<typeof insertServiceVisitSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type WorkAssignment = typeof workAssignments.$inferSelect;
export type InsertWorkAssignment = z.infer<typeof insertWorkAssignmentSchema>;
export type WorkCheckin = typeof workCheckins.$inferSelect;
export type InsertWorkCheckin = z.infer<typeof insertWorkCheckinSchema>;
export type WhatsappContact = typeof whatsappContacts.$inferSelect;
export type InsertWhatsappContact = z.infer<typeof insertWhatsappContactSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappCampaign = typeof whatsappCampaigns.$inferSelect;
export type InsertWhatsappCampaign = z.infer<typeof insertWhatsappCampaignSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;

// Define table relationships
export const usersRelations = relations(users, ({ many }) => ({
  serviceComplaints: many(serviceComplaints),
  serviceVisits: many(serviceVisits),
  assignedWork: many(workAssignments, { relationName: "assignedTo" }),
  createdAssignments: many(workAssignments, { relationName: "assignedBy" }),
}));

export const receiptsRelations = relations(receipts, ({ many }) => ({
  otpVerifications: many(otpVerifications),
}));

export const serviceComplaintsRelations = relations(serviceComplaints, ({ one, many }) => ({
  assignedEngineer: one(users, {
    fields: [serviceComplaints.assignedEngineerId],
    references: [users.id],
  }),
  serviceVisits: many(serviceVisits),
  otpVerifications: many(otpVerifications),
}));

export const serviceVisitsRelations = relations(serviceVisits, ({ one }) => ({
  serviceComplaint: one(serviceComplaints, {
    fields: [serviceVisits.complaintId],
    references: [serviceComplaints.id],
  }),
  engineer: one(users, {
    fields: [serviceVisits.engineerId],
    references: [users.id],
  }),
}));

export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
  receipt: one(receipts, {
    fields: [otpVerifications.receiptId],
    references: [receipts.id],
  }),
  serviceComplaint: one(serviceComplaints, {
    fields: [otpVerifications.complaintId],
    references: [serviceComplaints.id],
  }),
}));

export const workAssignmentsRelations = relations(workAssignments, ({ one }) => ({
  assignedByUser: one(users, {
    fields: [workAssignments.assignedBy],
    references: [users.id],
    relationName: "assignedBy",
  }),
  assignedToUser: one(users, {
    fields: [workAssignments.assignedTo],
    references: [users.id],
    relationName: "assignedTo",
  }),
}));

export const whatsappContactsRelations = relations(whatsappContacts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [whatsappContacts.customerId],
    references: [customers.id],
  }),
  messages: many(whatsappMessages),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  contact: one(whatsappContacts, {
    fields: [whatsappMessages.contactId],
    references: [whatsappContacts.id],
  }),
}));

export const whatsappCampaignsRelations = relations(whatsappCampaigns, ({ one }) => ({
  createdByUser: one(users, {
    fields: [whatsappCampaigns.createdBy],
    references: [users.id],
  }),
}));
