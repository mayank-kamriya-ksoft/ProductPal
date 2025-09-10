import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed.");
      return;
    }

    // Create default admin user
    const adminPassword = "admin123";
    const hashedPassword = await hashPassword(adminPassword);

    const admin = await storage.createUser({
      username: "admin",
      email: "admin@greengoldseeds.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Database seeded successfully!");
    console.log("📧 Admin credentials:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   Email: admin@greengoldseeds.com");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();