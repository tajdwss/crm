import type { Express } from "express";
import { addSSEClient, removeSSEClient } from "./sse";

import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReceiptSchema, insertServiceComplaintSchema, insertServiceVisitSchema, insertOtpSchema, insertUserSchema, insertWorkAssignmentSchema, insertWorkCheckinSchema } from "../shared/schema.js";
import { notificationService } from "./notification-service";

import { AuthUtils } from "./utils/auth";
import { dbAdminRouter } from "./db-admin.js";
import whatsappRoutes from "./whatsapp-routes";

export async function registerRoutes(app: Express): Promise<Server> {

  // Database admin interface
  app.use('/api/db-admin', dbAdminRouter);

  // WhatsApp Business API routes
  app.use("/api/whatsapp", whatsappRoutes);

  // Get all receipts
  app.get("/api/receipts", async (req, res) => {
    try {
      const receipts = await storage.getAllReceipts();
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ error: "Failed to fetch receipts" });
    }
  });

  // Create a new receipt
  app.post("/api/receipts", async (req, res) => {
    try {
      console.log("Receipt creation request body:", req.body);
      const parsed = insertReceiptSchema.parse(req.body);
      console.log("Parsed receipt data:", parsed);
      const receipt = await storage.createReceipt(parsed);
      console.log("Created receipt:", receipt);

      // Send WhatsApp notification for new receipt
      try {
        const notif = await notificationService.sendReceiptCreatedNotification(receipt);
        if (!notif.success) {
          console.warn("WhatsApp notification failed:", notif.error);
        }
        // Attach notification status to response
        (receipt as any)._whatsappNotification = notif;
      } catch (notificationError) {
        console.error("Failed to send receipt notification:", notificationError);
        (receipt as any)._whatsappNotification = { success: false, error: (notificationError as any)?.message };
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

  // Update a receipt
  app.patch("/api/receipts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Get current receipt for status comparison
      const currentReceipt = await storage.getReceiptById(id);
      if (!currentReceipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      const receipt = await storage.updateReceipt(id, updates);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      // Send notification if status changed
      if (updates.status && updates.status !== currentReceipt.status) {
        try {
  // Server-Sent Events for WhatsApp real-time updates
  app.get("/api/whatsapp/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    addSSEClient(res);
    req.on("close", () => removeSSEClient(res));
  });

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

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const receipts = await storage.getAllReceipts();

      // Today's receipts count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayReceipts = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.createdAt);
        return receiptDate >= today && receiptDate < tomorrow;
      }).length;

      // Last receipt number
      const lastReceiptNumber = receipts.length > 0 ? receipts[0].receiptNumber : "TD000";

      // Ready to deliver count
      const readyToDeliver = receipts.filter(receipt => receipt.status === "Ready to Deliver").length;

      res.json({
        todayReceipts,
        lastReceiptNumber,
        readyToDeliver,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Enhanced tracking endpoint for both receipts and service complaints
  app.get("/api/track/:trackingNumber", async (req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber;

      // Try to find as receipt first (starts with TD)
      if (trackingNumber.startsWith("TD")) {
        const receipt = await storage.getReceiptByNumber(trackingNumber);
        if (receipt) {
          return res.json({
            type: "receipt",
            data: receipt
          });
        }
      }

      // Try to find as service complaint (starts with TE)
      if (trackingNumber.startsWith("TE")) {
        const complaint = await storage.getServiceComplaintByNumber(trackingNumber);
        if (complaint) {
          // Get associated visits for this complaint
          const visits = await storage.getServiceVisitsByComplaint(complaint.id);
          return res.json({
            type: "service",
            data: {
              ...complaint,
              visits: visits
            }
          });
        }
      }

      // If not found in either, return 404
      return res.status(404).json({ error: "Tracking number not found" });
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      res.status(500).json({ error: "Failed to fetch tracking information" });
    }
  });
  // SMS OTP endpoint
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { mobile, receiptId, otpType = "person", recipientName } = req.body;

      const receipt = await storage.getReceiptById(receiptId);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtpVerification({
        receiptId,
        mobile,
        otp,
        otpType,
        verified: false,
        expiresAt,
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

  // Verify OTP endpoint
  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { receiptId, otp } = req.body;

      const verification = await storage.getOtpByReceiptId(receiptId);

      if (!verification || verification.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      if (verification.expiresAt < new Date()) {
        return res.status(400).json({ error: "OTP expired" });
      }

      await storage.markOtpVerified(verification.id);

      res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Service Complaint routes
  app.get("/api/service-complaints", async (req, res) => {
    try {
      const complaints = await storage.getAllServiceComplaints();
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service complaints" });
    }
  });

  app.post("/api/service-complaints", async (req, res) => {
    try {
      console.log("Service complaint request body:", req.body);
      const parsed = insertServiceComplaintSchema.parse(req.body);
      console.log("Parsed complaint data:", parsed);
      const complaint = await storage.createServiceComplaint(parsed);
      console.log("Created complaint:", complaint);

      // Send WhatsApp notification for new service complaint
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

  app.patch("/api/service-complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Get current complaint for status comparison
      const currentComplaint = await storage.getServiceComplaint(id);
      if (!currentComplaint) {
        return res.status(404).json({ error: "Service complaint not found" });
      }

      const complaint = await storage.updateServiceComplaint(id, updates);
      if (!complaint) {
        return res.status(404).json({ error: "Service complaint not found" });
      }

      // Send notification if status changed
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

  app.get("/api/service-complaints/:id", async (req, res) => {
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

  app.get("/api/service-complaints/engineer/:engineerId", async (req, res) => {
    try {
      const engineerId = parseInt(req.params.engineerId);
      const complaints = await storage.getServiceComplaintsByEngineer(engineerId);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch engineer complaints" });
    }
  });

  // Service Visit routes
  app.get("/api/service-visits/complaint/:complaintId", async (req, res) => {
    try {
      const complaintId = parseInt(req.params.complaintId);
      const visits = await storage.getServiceVisitsByComplaint(complaintId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service visits" });
    }
  });

  // Get all service visits for admin dashboard
  app.get("/api/service-visits/all", async (req, res) => {
    try {
      // For now, we'll get all visits. In a real app, you'd implement proper pagination
      const visits = await storage.getAllServiceVisits();
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all service visits" });
    }
  });

  app.post("/api/service-visits", async (req, res) => {
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

  app.patch("/api/service-visits/:id", async (req, res) => {
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

  // Service complaint tracking
  app.get("/api/track-service/:complaintNumber", async (req, res) => {
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

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user account is active and not deleted
      if (!user.isActive || user.isDeleted) {
        return res.status(401).json({ error: "Account is deactivated or deleted. Please contact administrator." });
      }

      // Check if password is already hashed (for backward compatibility)
      let isValidPassword = false;
      if (user.password.startsWith('$2')) {
        // Already hashed password
        isValidPassword = await AuthUtils.verifyPassword(password, user.password);
      } else {
        // Plain text password (legacy), compare directly then hash and update
        if (user.password === password) {
          isValidPassword = true;
          // Hash the password and update in database for security
          const hashedPassword = await AuthUtils.hashPassword(password);
          await storage.updateUser(user.id, { password: hashedPassword });
        }
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get single user by ID (for session validation)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user account is still active
      if (!user.isActive || user.isDeleted) {
        return res.status(401).json({ error: "Account is deactivated or deleted. Please contact administrator." });
      }

      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      console.log("User creation request:", req.body);
      const parsed = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", parsed);

      // Check for duplicate email and mobile
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

      // Validate password strength
      const passwordValidation = AuthUtils.isPasswordStrong(parsed.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      // Hash the password before storing
      const hashedPassword = await AuthUtils.hashPassword(parsed.password);
      const userDataWithHashedPassword = {
        ...parsed,
        password: hashedPassword
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      console.log("Created user:", user);

      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("User creation error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data format", details: error.issues });
      } else {
        // Handle database unique constraint violations
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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // If password is being updated, hash it
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

      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deletedBy = parseInt(req.body.deletedBy) || 1; // Admin user ID

      // Soft delete: Update user with deleted flag and timestamp
      const user = await storage.updateUser(id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy,
        isActive: false
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json({ success: true, message: "User soft deleted successfully", user: userInfo });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/deactivate", async (req, res) => {
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

  // Change user password
  app.patch("/api/users/:id/change-password", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }

      // Get user to verify current password
      const user = await storage.getUserById ? await storage.getUserById(id) : await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthUtils.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Validate new password strength
      const passwordValidation = AuthUtils.isPasswordStrong(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      // Hash new password
      const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

      // Update password
      await storage.updateUser(id, { password: hashedNewPassword });
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById ? await storage.getUserById(id) : await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Work Assignment routes
  app.get("/api/work-assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllWorkAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work assignments" });
    }
  });

  app.get("/api/work-assignments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const assignments = await storage.getWorkAssignmentsByUser(userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });

  app.post("/api/work-assignments", async (req, res) => {
    try {
      console.log("Work assignment creation request:", req.body);

      // Handle assignedUsers array conversion
      const requestData = { ...req.body };
      console.log("Original request data:", requestData);

      // If we have assignedUserIds (new format), use those for storage
      if (requestData.assignedUserIds && Array.isArray(requestData.assignedUserIds)) {
        requestData.assignedUsers = JSON.stringify(requestData.assignedUserIds);
        delete requestData.assignedUserIds; // Remove from final data
      } else if (requestData.assignedUsers && Array.isArray(requestData.assignedUsers)) {
        // Handle legacy array format
        requestData.assignedUsers = JSON.stringify(requestData.assignedUsers);
      }

      console.log("Processed request data:", requestData);

      const parsed = insertWorkAssignmentSchema.parse(requestData);

      // Convert string date to Date object if provided
      const workAssignmentData = {
        ...parsed,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
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

  app.patch("/api/work-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = { ...req.body };

      // Handle assignedUsers array conversion
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

  app.delete("/api/work-assignments/:id", async (req, res) => {
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

  // Work Assignment routes for multi-select assignments
  app.get("/api/work-assignments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const assignments = await storage.getWorkAssignmentsByMultipleUsers([userId]);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user assignments" });
    }
  });

  app.get("/api/work-assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllWorkAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work assignments" });
    }
  });

  // Work Checkin routes
  app.post("/api/work-checkins", async (req, res) => {
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

  app.get("/api/work-checkins/assignment/:assignmentId", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const checkins = await storage.getWorkCheckinsByAssignment(assignmentId);
      res.json(checkins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignment checkins" });
    }
  });

  app.get("/api/work-checkins/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const checkins = await storage.getWorkCheckinsByUser(userId);
      res.json(checkins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user checkins" });
    }
  });

  app.patch("/api/work-checkins/:id", async (req, res) => {
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

  // WhatsApp Webhook endpoints
  app.get("/api/webhooks/whatsapp", (req, res) => {
    // Webhook verification for WhatsApp Business API
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

  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const body = req.body;

      if (body.object === "whatsapp_business_account") {
        body.entry?.forEach((entry) => {
          entry.changes?.forEach((change) => {
            if (change.field === "messages") {
              const messages = change.value.messages;
              messages?.forEach(async (message) => {
                const from = message.from;
                const messageText = message.text?.body || '';

                // Handle incoming customer messages
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

  // SMS Webhook for delivery status (optional)
  app.post("/api/webhooks/sms", async (req, res) => {
    try {
      const { status, messageId, mobile, message } = req.body;

      console.log(`SMS Status: ${status} for ${mobile}`);

      // You can implement SMS delivery status tracking here
      // This is useful for monitoring SMS delivery rates

      res.status(200).send("OK");
    } catch (error) {
      console.error("SMS webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Add this route for admin data cleanup
  app.delete("/api/admin/cleanup-all-data", async (req, res) => {
    try {
      // Add authentication check here
      const user = await AuthUtils.getUser(req);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Delete all data in correct order
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

  // Backup routes
  app.use('/api/backup', (await import('./backup-routes')).default);

  // WhatsApp routes
  app.use('/api/whatsapp', (await import('./whatsapp-routes')).default);

  // Send receipt via WhatsApp
  app.post("/api/send-receipt-whatsapp", async (req, res) => {
    try {
      const { receiptId, mobile, customerName } = req.body;

      const receipt = await storage.getReceiptById(receiptId);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      // Send detailed receipt via WhatsApp
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const trackingUrl = `${baseUrl}/track/${receipt.receiptNumber}`;

      const whatsappMessage = {
        to: mobile,
        type: 'text',
        text: {
          body: `📋 *New Taj Electronics - Receipt Details* 📋\n\n` +
                `Receipt No: *${receipt.receiptNumber}*\n` +
                `Customer: ${customerName}\n` +
                `Product: ${receipt.product} - ${receipt.model}\n` +
                `Issue: ${receipt.problemDescription || "-"}\n` +
                `Estimated Amount: ₹${receipt.estimatedAmount.toLocaleString()}\n` +
                `Status: ${receipt.status}\n` +
                `Date: ${new Date(receipt.createdAt).toLocaleDateString('en-IN')}\n\n` +
                `🔗 Track your repair: ${trackingUrl}\n\n` +
                `📞 Contact: 07272-356183, 07272-220005\n` +
                `📧 Email: tajdws@gmail.com\n\n` +
                `Thank you for choosing New Taj Electronics!`
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

  // Customer search endpoint
  app.get("/api/customer-search", async (req, res) => {
    try {
      const searchTerm = req.query.q as string;

      if (!searchTerm) {
        return res.json({
          receipts: [],
          services: [],
          totalRecords: 0
        });
      }

      const search = searchTerm.toLowerCase();

      // Search receipts
      const allReceipts = await storage.getAllReceipts();
      const receipts = allReceipts.filter(receipt =>
        receipt.receiptNumber.toLowerCase().includes(search) ||
        receipt.customerName.toLowerCase().includes(search) ||
        receipt.mobile.includes(searchTerm) ||
        (receipt.rgpNumber && receipt.rgpNumber.toLowerCase().includes(search)) ||
        receipt.product.toLowerCase().includes(search) ||
        receipt.model.toLowerCase().includes(search)
      );

      // Search service complaints
      const allServices = await storage.getAllServiceComplaints();
      const services = allServices.filter(service =>
        service.complaintNumber.toLowerCase().includes(search) ||
        service.customerName.toLowerCase().includes(search) ||
        service.mobile.includes(searchTerm) ||
        service.product.toLowerCase().includes(search)
      );

      res.json({
        receipts,
        services,
        totalRecords: receipts.length + services.length
      });
    } catch (error) {
      console.error("Customer search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Customer management endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const { name, mobile, email, address, whoBought } = req.body;

      if (!name || !mobile) {
        return res.status(400).json({ error: "Name and mobile are required" });
      }

      // Check if customer with same mobile already exists
      const existingCustomer = await storage.getCustomerByMobile(mobile);
      if (existingCustomer) {
        return res.status(400).json({ error: "Customer with this mobile number already exists" });
      }

      const customer = await storage.createCustomer({
        name,
        mobile,
        email: email || null,
        address: address || null,
        whoBought: whoBought || null,
      });

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
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

  // Get customer by mobile
  app.get("/api/customers/mobile/:mobile", async (req, res) => {
    try {
      const mobile = req.params.mobile;
      const customer = await storage.getCustomerByMobile(mobile);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Check if mobile number is being updated and if it conflicts
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

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }

  // Delete receipt (admin)
  app.delete("/api/receipts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReceipt(id);
      if (!success) return res.status(404).json({ error: "Receipt not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete receipt:", error);
      res.status(500).json({ error: "Failed to delete receipt" });
    }
  });

  // Delete service complaint (admin)
  app.delete("/api/service-complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServiceComplaint(id);
      if (!success) return res.status(404).json({ error: "Service complaint not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete service complaint:", error);
      res.status(500).json({ error: "Failed to delete service complaint" });
    }
  });

      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  app.get("/api/customers/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const customers = await storage.searchCustomers(query);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to search customers" });
    }
  });

  // Import customers from CSV
  app.post("/api/customers/import", async (req, res) => {
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

          // Check if customer already exists
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
            whoBought: customerData.whoBought || null,
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

  // Export customers to CSV
  app.get("/api/customers/export", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();

      const csvData = customers.map(customer => ({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || '',
        address: customer.address || '',
        whoBought: customer.whoBought || '',
        createdAt: customer.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');

      // Convert to CSV
      const csvHeaders = 'Name,Mobile,Email,Address,Who Bought,Created At\n';
      const csvRows = csvData.map(row =>
        `"${row.name}","${row.mobile}","${row.email}","${row.address}","${row.whoBought}","${row.createdAt}"`
      ).join('\n');

      res.send(csvHeaders + csvRows);
    } catch (error) {
      res.status(500).json({ error: "Failed to export customers" });
    }
  });

  // Send customer statement via WhatsApp
  app.post("/api/customers/:id/statement", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomer(customerId);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Get all receipts and service complaints for this customer
      const allReceipts = await storage.getAllReceipts();
      const allComplaints = await storage.getAllServiceComplaints();

      const customerReceipts = allReceipts.filter(receipt =>
        receipt.mobile === customer.mobile ||
        receipt.customerName === customer.name
      );

      const customerComplaints = allComplaints.filter(complaint =>
        complaint.mobile === customer.mobile ||
        complaint.customerName === customer.name
      );

      // Calculate totals
      const totalReceipts = customerReceipts.length;
      const totalComplaints = customerComplaints.length;
      const totalAmount = customerReceipts.reduce((sum, receipt) => sum + (receipt.estimatedAmount || 0), 0);
      const pendingAmount = customerReceipts
        .filter(receipt => receipt.status !== 'completed')
        .reduce((sum, receipt) => sum + (receipt.estimatedAmount || 0), 0);

      // Create statement message
      const statementMessage = {
        to: customer.mobile,
        type: 'text',
        text: {
          body: `📋 *Customer Statement - ${customer.name}* 📋\n\n` +
                `📱 Mobile: ${customer.mobile}\n` +
                `📧 Email: ${customer.email || 'Not provided'}\n` +
                `📍 Address: ${customer.address || 'Not provided'}\n\n` +
                `📊 *Summary:*\n` +
                `• Total Receipts: ${totalReceipts}\n` +
                `• Total Service Requests: ${totalComplaints}\n` +
                `• Total Amount: ₹${totalAmount.toLocaleString()}\n` +
                `• Pending Amount: ₹${pendingAmount.toLocaleString()}\n\n` +
                `📋 *Recent Receipts:*\n` +
                customerReceipts.slice(0, 5).map(receipt =>
                  `• ${receipt.receiptNumber}: ${receipt.product} - ₹${receipt.estimatedAmount?.toLocaleString()} (${receipt.status})`
                ).join('\n') +
                (customerReceipts.length > 5 ? `\n... and ${customerReceipts.length - 5} more` : '') +
                `\n\n📞 Contact: 07272-356183, 07272-220005\n` +
                `📧 Email: tajdws@gmail.com\n\n` +
                `Thank you for choosing New Taj Electronics!`
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

  const httpServer = createServer(app);

  return httpServer;
}