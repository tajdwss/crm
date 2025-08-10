import { users, receipts, serviceComplaints, serviceVisits, otpVerifications, workAssignments, workCheckins, customers, whatsappContacts, type User, type InsertUser, type Receipt, type InsertReceipt, type ServiceComplaint, type InsertServiceComplaint, type ServiceVisit, type InsertServiceVisit, type OtpVerification, type InsertOtp, type WorkAssignment, type InsertWorkAssignment, type WorkCheckin, type InsertWorkCheckin, type Customer, type InsertCustomer } from "../shared/schema.js";
import { eq, desc, and, gte, lt, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  deactivateUser(id: number): Promise<User | undefined>;

  // Customer methods
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByMobile(mobile: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  searchCustomers(query: string): Promise<Customer[]>;

  // Receipt methods
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  getReceiptById(id: number): Promise<Receipt | undefined>;
  getAllReceipts(): Promise<Receipt[]>;
  updateReceipt(id: number, updates: Partial<Receipt>): Promise<Receipt | undefined>;
  getReceiptByNumber(receiptNumber: string): Promise<Receipt | undefined>;

  // Service Complaint methods
  createServiceComplaint(complaint: InsertServiceComplaint): Promise<ServiceComplaint>;
  getServiceComplaint(id: number): Promise<ServiceComplaint | undefined>;
  getAllServiceComplaints(): Promise<ServiceComplaint[]>;
  updateServiceComplaint(id: number, updates: Partial<ServiceComplaint>): Promise<ServiceComplaint | undefined>;
  getServiceComplaintByNumber(complaintNumber: string): Promise<ServiceComplaint | undefined>;
  getServiceComplaintsByEngineer(engineerId: number): Promise<ServiceComplaint[]>;

  // Service Visit methods
  createServiceVisit(visit: InsertServiceVisit): Promise<ServiceVisit>;
  getServiceVisitsByComplaint(complaintId: number): Promise<ServiceVisit[]>;
  getAllServiceVisits(): Promise<ServiceVisit[]>;
  updateServiceVisit(id: number, updates: Partial<ServiceVisit>): Promise<ServiceVisit | undefined>;

  // OTP methods
  createOtpVerification(otp: InsertOtp): Promise<OtpVerification>;
  getOtpByReceiptId(receiptId: number): Promise<OtpVerification | undefined>;
  getOtpByComplaintId(complaintId: number): Promise<OtpVerification | undefined>;
  markOtpVerified(id: number): Promise<void>;

  // Work Assignment methods
  createWorkAssignment(assignment: InsertWorkAssignment): Promise<WorkAssignment>;
  getWorkAssignment(id: number): Promise<WorkAssignment | undefined>;
  getWorkAssignmentsByMultipleUsers(userIds: number[]): Promise<WorkAssignment[]>;
  getAllWorkAssignments(): Promise<WorkAssignment[]>;
  getWorkAssignmentsByUser(userId: number): Promise<WorkAssignment[]>;
  updateWorkAssignment(id: number, updates: Partial<WorkAssignment>): Promise<WorkAssignment | undefined>;
  deleteWorkAssignment(id: number): Promise<boolean>;

  // Work Checkin methods
  createWorkCheckin(checkin: InsertWorkCheckin): Promise<WorkCheckin>;
  getWorkCheckinsByAssignment(assignmentId: number): Promise<WorkCheckin[]>;
  getWorkCheckinsByUser(userId: number): Promise<WorkCheckin[]>;
  updateWorkCheckin(id: number, updates: Partial<WorkCheckin>): Promise<WorkCheckin | undefined>;
  // Admin cleanup methods
  deleteReceipt(id: number): Promise<boolean>;
  deleteServiceComplaint(id: number): Promise<boolean>;
}

export class InMemoryStorage implements IStorage {
  private customers = new Map<number, any>();
  private currentCustomerId = 1;
  private users: Map<number, User>;
  private receipts: Map<number, Receipt>;
  private serviceComplaints: Map<number, ServiceComplaint>;
  private serviceVisits: Map<number, ServiceVisit>;
  private otpVerifications: Map<number, OtpVerification>;
  private workAssignments: Map<number, WorkAssignment>;
  private currentUserId: number;
  private currentReceiptId: number;
  private currentComplaintId: number;
  private currentVisitId: number;
  private currentOtpId: number;
  private currentAssignmentId: number;

  constructor() {
    this.users = new Map();
    this.receipts = new Map();
    this.serviceComplaints = new Map();
    this.serviceVisits = new Map();
    this.otpVerifications = new Map();
    this.workAssignments = new Map();
    this.currentUserId = 1;
    this.currentReceiptId = 1;
    this.currentComplaintId = 1;
    this.currentVisitId = 1;
    this.currentOtpId = 1;
    this.currentAssignmentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.mobile === mobile,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, isActive: false };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByMobile(mobile: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.mobile === mobile,
    );
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email,
    );
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(
      (customer) =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.mobile.toLowerCase().includes(query.toLowerCase()) ||
        customer.email.toLowerCase().includes(query.toLowerCase())
    );
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const id = this.currentReceiptId++;

    // Generate receipt number
    const receiptNumber = `TD${id.toString().padStart(3, "0")}`;

    const receipt: Receipt = {
      ...insertReceipt,
      id,
      receiptNumber,
      status: insertReceipt.status || "Pending",
      rgpNumber: insertReceipt.rgpNumber || null,
      rgpDate: insertReceipt.rgpDate || null,
      technicianNotes: insertReceipt.technicianNotes || null,
      createdAt: new Date(),
      deliveredAt: null,
    };

    this.receipts.set(id, receipt);
    return receipt;
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async getReceiptById(id: number): Promise<Receipt | undefined> {
    return this.getReceipt(id);
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateReceipt(id: number, updates: Partial<Receipt>): Promise<Receipt | undefined> {
    const receipt = this.receipts.get(id);
    if (!receipt) return undefined;

    const updatedReceipt = { ...receipt, ...updates };
    this.receipts.set(id, updatedReceipt);
    return updatedReceipt;
  }

  async getReceiptByNumber(receiptNumber: string): Promise<Receipt | undefined> {
    return Array.from(this.receipts.values()).find(
      (receipt) => receipt.receiptNumber === receiptNumber
    );
  }

  async createOtpVerification(insertOtp: InsertOtp): Promise<OtpVerification> {
    const id = this.currentOtpId++;
    const otp: OtpVerification = {
      ...insertOtp,
      id,
      verified: insertOtp.verified || false,
      createdAt: new Date(),
    };

    this.otpVerifications.set(id, otp);
    return otp;
  }

  // Service Complaint methods
  async createServiceComplaint(insertComplaint: InsertServiceComplaint): Promise<ServiceComplaint> {
    const id = this.currentComplaintId++;
    const lastComplaint = Array.from(this.serviceComplaints.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    let nextNumber = 1;
    if (lastComplaint) {
      const lastNumber = parseInt(lastComplaint.complaintNumber.replace("TE", ""));
      nextNumber = lastNumber + 1;
    }

    const complaintNumber = `TE${nextNumber.toString().padStart(3, "0")}`;

    const complaint: ServiceComplaint = {
      ...insertComplaint,
      id,
      complaintNumber,
      createdAt: new Date(),
      completedAt: null,
    };

    this.serviceComplaints.set(id, complaint);
    return complaint;
  }

  async getServiceComplaint(id: number): Promise<ServiceComplaint | undefined> {
    return this.serviceComplaints.get(id);
  }

  async getAllServiceComplaints(): Promise<ServiceComplaint[]> {
    return Array.from(this.serviceComplaints.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateServiceComplaint(id: number, updates: Partial<ServiceComplaint>): Promise<ServiceComplaint | undefined> {
    const complaint = this.serviceComplaints.get(id);
    if (!complaint) return undefined;

    const updatedComplaint = { ...complaint, ...updates };
    this.serviceComplaints.set(id, updatedComplaint);
    return updatedComplaint;
  }

  async getServiceComplaintByNumber(complaintNumber: string): Promise<ServiceComplaint | undefined> {
    return Array.from(this.serviceComplaints.values()).find(
      (complaint) => complaint.complaintNumber === complaintNumber
    );
  }

  async getServiceComplaintsByEngineer(engineerId: number): Promise<ServiceComplaint[]> {
    return Array.from(this.serviceComplaints.values())
      .filter(complaint => complaint.assignedEngineerId === engineerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteReceipt(id: number): Promise<boolean> {
    return this.receipts.delete(id);
  }

  async deleteServiceComplaint(id: number): Promise<boolean> {
    return this.serviceComplaints.delete(id);
  }

  // Service Visit methods
  async createServiceVisit(insertVisit: InsertServiceVisit): Promise<ServiceVisit> {
    const id = this.currentVisitId++;
    const visit: ServiceVisit = {
      ...insertVisit,
      id,
      createdAt: new Date(),
    };

    this.serviceVisits.set(id, visit);
    return visit;
  }

  async getServiceVisitsByComplaint(complaintId: number): Promise<ServiceVisit[]> {
    return Array.from(this.serviceVisits.values())
      .filter(visit => visit.complaintId === complaintId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllServiceVisits(): Promise<ServiceVisit[]> {
    return Array.from(this.serviceVisits.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateServiceVisit(id: number, updates: Partial<ServiceVisit>): Promise<ServiceVisit | undefined> {
    const visit = this.serviceVisits.get(id);
    if (!visit) return undefined;

    const updatedVisit = { ...visit, ...updates };
    this.serviceVisits.set(id, updatedVisit);
    return updatedVisit;
  }

  async getOtpByReceiptId(receiptId: number): Promise<OtpVerification | undefined> {
    return Array.from(this.otpVerifications.values())
      .find(otp => otp.receiptId === receiptId && !otp.verified);
  }

  async getOtpByComplaintId(complaintId: number): Promise<OtpVerification | undefined> {
    return Array.from(this.otpVerifications.values())
      .find(otp => otp.complaintId === complaintId && !otp.verified);
  }

  async markOtpVerified(id: number): Promise<void> {
    const otp = this.otpVerifications.get(id);
    if (otp) {
      this.otpVerifications.set(id, { ...otp, verified: true });
    }
  }

  // Work Assignment methods
  async createWorkAssignment(assignment: InsertWorkAssignment): Promise<WorkAssignment> {
    const id = this.currentAssignmentId++;
    const newAssignment: WorkAssignment = {
      ...assignment,
      id,
      createdAt: new Date(),
    };
    this.workAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async getWorkAssignment(id: number): Promise<WorkAssignment | undefined> {
    return this.workAssignments.get(id);
  }

  async getAllWorkAssignments(): Promise<WorkAssignment[]> {
    return Array.from(this.workAssignments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWorkAssignmentsByUser(userId: number): Promise<WorkAssignment[]> {
    return Array.from(this.workAssignments.values())
      .filter(assignment => assignment.assignedTo === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateWorkAssignment(id: number, updates: Partial<WorkAssignment>): Promise<WorkAssignment | undefined> {
    const assignment = this.workAssignments.get(id);
    if (!assignment) return undefined;

    const updatedAssignment = { ...assignment, ...updates };
    this.workAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteWorkAssignment(id: number): Promise<boolean> {
    return this.workAssignments.delete(id);
  }
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private db: typeof db;

  constructor() {
    this.db = db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.mobile, mobile));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    await this.db.update(users).set(updates).where(eq(users.id, id));
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    await this.db.update(users).set({ isActive: false }).where(eq(users.id, id));
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await this.db.insert(customers).values(customer).returning();
    return result[0];
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getCustomerByMobile(mobile: string): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.mobile, mobile));
    return result[0];
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.email, email));
    return result[0];
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await this.db.select().from(customers);
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    await this.db.update(customers).set(updates).where(eq(customers.id, id));
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async deleteCustomer(id: number): Promise<boolean> {
    // First, detach WhatsApp contacts linked to this customer to satisfy FK
    await this.db.update(whatsappContacts).set({ customerId: null }).where(eq(whatsappContacts.customerId, id));
    const result = await this.db.delete(customers).where(eq(customers.id, id));
    return result.rowsAffected > 0;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const result = await this.db.select().from(customers)
      .where(sql`LOWER(name) LIKE LOWER('%${query}%') OR LOWER(mobile) LIKE LOWER('%${query}%') OR LOWER(email) LIKE LOWER('%${query}%')`);
    return result;
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    // Generate receipt number
    const lastReceipt = await this.db.select().from(receipts)
      .orderBy(desc(receipts.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastReceipt.length > 0) {
      const lastNumber = parseInt(lastReceipt[0].receiptNumber.replace("TD", ""));
      nextNumber = lastNumber + 1;
    }

    const receiptNumber = `TD${nextNumber.toString().padStart(3, "0")}`;

    const result = await this.db.insert(receipts).values({
      ...receipt,
      receiptNumber,
    }).returning();

    return result[0];
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    const result = await this.db.select().from(receipts).where(eq(receipts.id, id));
    return result[0];
  }

  async getReceiptById(id: number): Promise<Receipt | undefined> {
    return this.getReceipt(id);
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return await this.db.select().from(receipts).orderBy(desc(receipts.createdAt));
  }

  async updateReceipt(id: number, updates: Partial<Receipt>): Promise<Receipt | undefined> {
    await this.db.update(receipts).set(updates).where(eq(receipts.id, id));
    const result = await this.db.select().from(receipts).where(eq(receipts.id, id));
    return result[0];
  }

  async getReceiptByNumber(receiptNumber: string): Promise<Receipt | undefined> {
    const result = await this.db.select().from(receipts).where(eq(receipts.receiptNumber, receiptNumber));
    return result[0];
  }

  async createOtpVerification(otp: InsertOtp): Promise<OtpVerification> {
    const result = await this.db.insert(otpVerifications).values(otp).returning();
    return result[0];
  }

  // Service Complaint methods
  async createServiceComplaint(complaint: InsertServiceComplaint): Promise<ServiceComplaint> {
    // Generate complaint number
    const lastComplaint = await this.db.select().from(serviceComplaints)
      .orderBy(desc(serviceComplaints.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastComplaint.length > 0) {
      const lastNumber = parseInt(lastComplaint[0].complaintNumber.replace("TE", ""));
      nextNumber = lastNumber + 1;
    }

    const complaintNumber = `TE${nextNumber.toString().padStart(3, "0")}`;

    const result = await this.db.insert(serviceComplaints).values({
      ...complaint,
      complaintNumber,
    }).returning();

    return result[0];
  }

  async getServiceComplaint(id: number): Promise<ServiceComplaint | undefined> {
    const result = await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.id, id));
    return result[0];
  }

  async getAllServiceComplaints(): Promise<ServiceComplaint[]> {
    return await this.db.select().from(serviceComplaints).orderBy(desc(serviceComplaints.createdAt));
  }

  async updateServiceComplaint(id: number, updates: Partial<ServiceComplaint>): Promise<ServiceComplaint | undefined> {
    await this.db.update(serviceComplaints).set(updates).where(eq(serviceComplaints.id, id));
    const result = await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.id, id));
    return result[0];
  }

  async deleteReceipt(id: number): Promise<boolean> {
    // Delete dependents first to satisfy FK constraints
    await this.db.delete(otpVerifications).where(eq(otpVerifications.receiptId, id));
    const result = await this.db.delete(receipts).where(eq(receipts.id, id));
    return result.rowsAffected > 0;
  }

  async deleteServiceComplaint(id: number): Promise<boolean> {
    // Delete dependents: service visits and OTP verifications
    await this.db.delete(serviceVisits).where(eq(serviceVisits.complaintId, id));
    await this.db.delete(otpVerifications).where(eq(otpVerifications.complaintId, id));
    const result = await this.db.delete(serviceComplaints).where(eq(serviceComplaints.id, id));
    return result.rowsAffected > 0;
  }

  async getServiceComplaintByNumber(complaintNumber: string): Promise<ServiceComplaint | undefined> {
    const result = await this.db.select().from(serviceComplaints).where(eq(serviceComplaints.complaintNumber, complaintNumber));
    return result[0];
  }

  async getServiceComplaintsByEngineer(engineerId: number): Promise<ServiceComplaint[]> {
    return await this.db.select().from(serviceComplaints)
      .where(eq(serviceComplaints.assignedEngineerId, engineerId))
      .orderBy(desc(serviceComplaints.createdAt));
  }

  // Service Visit methods
  async createServiceVisit(visit: InsertServiceVisit): Promise<ServiceVisit> {
    const result = await this.db.insert(serviceVisits).values(visit).returning();
    return result[0];
  }

  async getServiceVisitsByComplaint(complaintId: number): Promise<ServiceVisit[]> {
    return await this.db.select().from(serviceVisits)
      .where(eq(serviceVisits.complaintId, complaintId))
      .orderBy(desc(serviceVisits.createdAt));
  }

  async getAllServiceVisits(): Promise<ServiceVisit[]> {
    return await this.db.select().from(serviceVisits)
      .orderBy(desc(serviceVisits.createdAt));
  }

  async updateServiceVisit(id: number, updates: Partial<ServiceVisit>): Promise<ServiceVisit | undefined> {
    await this.db.update(serviceVisits).set(updates).where(eq(serviceVisits.id, id));
    const result = await this.db.select().from(serviceVisits).where(eq(serviceVisits.id, id));
    return result[0];
  }

  async getOtpByReceiptId(receiptId: number): Promise<OtpVerification | undefined> {
    const result = await this.db.select().from(otpVerifications).where(eq(otpVerifications.receiptId, receiptId));
    return result[0];
  }

  async getOtpByComplaintId(complaintId: number): Promise<OtpVerification | undefined> {
    const result = await this.db.select().from(otpVerifications).where(eq(otpVerifications.complaintId, complaintId));
    return result[0];
  }

  async markOtpVerified(id: number): Promise<void> {
    await this.db.update(otpVerifications).set({ verified: true }).where(eq(otpVerifications.id, id));
  }

  // Work Assignment methods
  async createWorkAssignment(assignment: InsertWorkAssignment): Promise<WorkAssignment> {
    const result = await this.db.insert(workAssignments).values(assignment).returning();
    return result[0];
  }

  async getWorkAssignment(id: number): Promise<WorkAssignment | undefined> {
    const result = await this.db.select().from(workAssignments).where(eq(workAssignments.id, id));
    return result[0];
  }

  async getAllWorkAssignments(): Promise<WorkAssignment[]> {
    return await this.db.select().from(workAssignments).orderBy(desc(workAssignments.createdAt));
  }

  async getWorkAssignmentsByUser(userId: number): Promise<WorkAssignment[]> {
    return await this.db.select().from(workAssignments)
      .where(eq(workAssignments.assignedTo, userId))
      .orderBy(desc(workAssignments.createdAt));
  }

  async getWorkAssignmentsByMultipleUsers(userIds: number[]): Promise<WorkAssignment[]> {
    const assignments = await this.db.select().from(workAssignments)
      .orderBy(desc(workAssignments.createdAt));

    // Filter assignments that include any of the user IDs in assignedUsers field
    return assignments.filter(assignment => {
      if (assignment.assignedUsers) {
        try {
          const assignedUserIds = JSON.parse(assignment.assignedUsers);
          return userIds.some(userId => assignedUserIds.includes(userId));
        } catch {
          return false;
        }
      }
      // Fallback to old single assignment logic
      return userIds.includes(assignment.assignedTo);
    });
  }

  async updateWorkAssignment(id: number, updates: Partial<WorkAssignment>): Promise<WorkAssignment | undefined> {
    await this.db.update(workAssignments).set(updates).where(eq(workAssignments.id, id));
    const result = await this.db.select().from(workAssignments).where(eq(workAssignments.id, id));
    return result[0];
  }

  async deleteWorkAssignment(id: number): Promise<boolean> {
    const result = await this.db.delete(workAssignments).where(eq(workAssignments.id, id));
    return result.rowsAffected > 0;
  }

  // Work Checkin methods
  async createWorkCheckin(checkin: InsertWorkCheckin): Promise<WorkCheckin> {
    const result = await this.db.insert(workCheckins).values(checkin).returning();
    return result[0];
  }

  async getWorkCheckinsByAssignment(assignmentId: number): Promise<WorkCheckin[]> {
    return await this.db.select().from(workCheckins)
      .where(eq(workCheckins.assignmentId, assignmentId))
      .orderBy(desc(workCheckins.createdAt));
  }

  async getWorkCheckinsByUser(userId: number): Promise<WorkCheckin[]> {
    return await this.db.select().from(workCheckins)
      .where(eq(workCheckins.userId, userId))
      .orderBy(desc(workCheckins.createdAt));
  }

  async updateWorkCheckin(id: number, updates: Partial<WorkCheckin>): Promise<WorkCheckin | undefined> {
    await this.db.update(workCheckins).set(updates).where(eq(workCheckins.id, id));
    const result = await this.db.select().from(workCheckins).where(eq(workCheckins.id, id));
    return result[0];
  }
}

// Use PostgreSQL storage for persistent data
export const storage = new PostgreSQLStorage();


