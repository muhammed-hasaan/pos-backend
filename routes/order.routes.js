// Order Routes
import express from "express"
import { getOrders, getOrderById, createOrder, updateOrder, processPendingOrder } from "../controllers/order.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"
import { validateOrder } from "../middleware/validate.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// GET /api/orders
router.get("/", getOrders)

// GET /api/orders/:id
router.get("/:id", getOrderById)

// POST /api/orders (shop only)
router.post("/", isShop, validateOrder, createOrder)

// PUT /api/orders/:id (shop only)
router.put("/:id", isShop, updateOrder)

// POST /api/orders/:id/process-pending (public - for kitchen workflow)
// Similar to /api/print/pos-receipt - accepts order data and initiates preparation
router.post("/:id/process-pending", processPendingOrder)

export default router
