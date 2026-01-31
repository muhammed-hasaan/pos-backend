// Main Express Server Entry Point
import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import connectDB from "./config/db.js"

// Route imports
import authRoutes from "./routes/auth.routes.js"
import shopRoutes from "./routes/shop.routes.js"
import productRoutes from "./routes/product.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import orderRoutes from "./routes/order.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"
import onlineOrderRoutes from "./routes/online-order.routes.js"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()
const PORT = 5002

// Connect to MongoDB
connectDB()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/shops", shopRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/online-orders", onlineOrderRoutes)

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "POS Backend API is running" })
})

// 404 handler
// app.use((req, res) => {
//   res.status(404).json({ success: false, message: "Route not found" })
// })

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 POS Backend Server running on port ${PORT}`)
  console.log(`📍 API available at http://localhost:${PORT}/api`)
})

export default app
