// Database Connection Configuration
import mongoose from "mongoose"

const MONGODB_URI = "mongodb+srv://alamgirpos:alamgirpos@cluster0.rdb6yxn.mongodb.net/pos_system"

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Mongoose 6+ no longer needs these options
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected")
})

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected")
})

export default connectDB
