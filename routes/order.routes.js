// Order Routes
import express from "express"
import { getOrders, getOrderById, createOrder, updateOrder, processPendingOrder } from "../controllers/order.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"
import { validateOrder } from "../middleware/validate.middleware.js"

const router = express.Router()

// GET /api/orders (requires authentication)
router.get("/", authenticate, getOrders)

// GET /api/orders/:id (requires authentication)
router.get("/:id", authenticate, getOrderById)

// POST /api/orders (requires authentication + shop role)
router.post("/", authenticate, isShop, validateOrder, createOrder)

// PUT /api/orders/:id (requires authentication + shop role)
router.put("/:id", authenticate, isShop, updateOrder)

// POST /api/orders/:id/process-pending (PUBLIC - for kitchen workflow, no authentication needed)
// This is called from POS terminal with api2 (localhost)
router.post("/:id/process-pending", processPendingOrder)

export default router
