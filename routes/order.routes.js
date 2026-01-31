// Order Routes
import express from "express"
import { getOrders, getOrderById, createOrder, updateOrder } from "../controllers/order.controller.js"
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

export default router
