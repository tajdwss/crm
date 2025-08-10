import 'dotenv/config';
import { db } from "./db";
import { users, receipts, serviceComplaints } from "../shared/schema";
import { eq, count } from "drizzle-orm";
import { AuthUtils } from "./utils/auth";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Seed default users
    const defaultUsers = [
      {
        username: "javed",
        password: "admin123",
        role: "admin" as const,
        name: "Javed Khan",
        mobile: "07272-356183",
        email: "javed@newrajelectronics.com",
        address: "New Taj Electronics, Main Market",
        isActive: true
      },
      {
        username: "raaj",
        password: "password",
        role: "service_engineer" as const,
        name: "Raaj Kumar",
        mobile: "07272-220005",
        email: "raaj@newrajelectronics.com",
        address: "New Taj Electronics, Service Department",
        isActive: true
      },
      {
        username: "technician",
        password: "password",
        role: "technician" as const,
        name: "Amit Technician",
        mobile: "07272-356184",
        email: "technician@newrajelectronics.com",
        address: "New Taj Electronics, Repair Department",
        isActive: true
      },
      {
        username: "tech1",
        password: "tech123",
        role: "technician" as const,
        name: "Rohit Sharma",
        mobile: "07272-356185",
        email: "rohit@newrajelectronics.com",
        address: "New Taj Electronics, Workshop",
        isActive: true
      },
      {
        username: "service1",
        password: "service123",
        role: "service_engineer" as const,
        name: "Vikram Singh",
        mobile: "07272-356186",
        email: "vikram@newrajelectronics.com",
        address: "New Taj Electronics, Field Service",
        isActive: true
      }
    ];

    // Check if users already exist
    const existingUsers = await db.select().from(users);

    if (existingUsers.length === 0) {
      console.log("👥 Seeding default users...");

      // Hash passwords before inserting
      const usersWithHashedPasswords = await Promise.all(
        defaultUsers.map(async (user) => ({
          ...user,
          password: await AuthUtils.hashPassword(user.password)
        }))
      );

      await db.insert(users).values(usersWithHashedPasswords);
      console.log("✅ Default users created successfully with encrypted passwords!");
    } else {
      console.log("👥 Users already exist, skipping user seeding");
    }

    // Seed sample receipts for testing
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
        estimatedAmount: 5000,
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
        deliveredAt: new Date("2025-01-15T10:30:00Z"),
        technicianNotes: "Camera module replaced, customer satisfied"
      }
    ];

    // Check if receipts already exist
    const existingReceipts = await db.select().from(receipts);

    if (existingReceipts.length === 0) {
      console.log("📱 Seeding sample receipts...");
      await db.insert(receipts).values(sampleReceipts);
      console.log("✅ Sample receipts created successfully!");
    } else {
      console.log("📱 Receipts already exist, skipping receipt seeding");
    }

    // Seed sample service complaints
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
        assignedEngineerId: 2, // Raaj
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
        assignedEngineerId: 5, // Vikram
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
        assignedEngineerId: 2, // Raaj
        completedAt: new Date("2025-01-14T16:00:00Z"),
        latitude: "28.7041",
        longitude: "77.1025"
      }
    ];

    // Check if service complaints already exist
    const existingComplaints = await db.select().from(serviceComplaints);

    if (existingComplaints.length === 0) {
      console.log("🔧 Seeding sample service complaints...");
      await db.insert(serviceComplaints).values(sampleComplaints);
      console.log("✅ Sample service complaints created successfully!");
    } else {
      console.log("🔧 Service complaints already exist, skipping complaint seeding");
    }

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error("❌ Database connection refused. Check if DATABASE_URL is correct and database is accessible.");
      } else if (error.message.includes('timeout')) {
        console.error("❌ Database connection timeout. Database might be slow or unavailable.");
      } else {
        console.error("❌ Database error:", error.message);
      }
    }

    // Continue server startup even if seeding fails
    console.log("⚠️ Continuing server startup without seeding...");
    return;
  }
}

seedDatabase();