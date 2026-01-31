// Seed Admin Account Script
import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../models/User.model.js"

dotenv.config()

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://alamgirpos:alamgirpos@cluster0.rdb6yxn.mongodb.net/pos_system"

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" })

    if (existingAdmin) {
      console.log("Admin account already exists:")
      console.log(`Email: ${existingAdmin.email}`)
      process.exit(0)
    }

    // Create admin
    const admin = new User({
      email: "admin@pos.com",
      password: "admin123",
      role: "admin",
      isActive: true,
    })

    await admin.save()

    console.log("✅ Admin account created successfully!")
    console.log("Email: admin@pos.com")
    console.log("Password: admin123")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding admin:", error)
    process.exit(1)
  }
}

seedAdmin()
