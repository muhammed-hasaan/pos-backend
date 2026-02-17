// Online Order Routes
import express from "express"
import { getOnlineOrders, createOnlineOrder, getAllOnlineOrders } from "../controllers/online-order.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"

const router = express.Router()

// GET /api/online-orders (shop only)
router.get("/", authenticate, isShop, getOnlineOrders)

// GET /api/online-orders/all (get all online orders from website)
router.get("/all", getAllOnlineOrders)

// POST /api/online-orders (create online order from website)
router.post("/", createOnlineOrder)

export default router
