// Online Order Routes
import express from "express"
import { getOnlineOrders } from "../controllers/online-order.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"

const router = express.Router()

// GET /api/online-orders (shop only)
router.get("/", authenticate, isShop, getOnlineOrders)

export default router
