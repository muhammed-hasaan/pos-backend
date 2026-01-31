// Analytics Routes
import express from "express"
import { getAnalytics } from "../controllers/analytics.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"

const router = express.Router()

// GET /api/analytics (shop only)
router.get("/", authenticate, isShop, getAnalytics)

export default router
