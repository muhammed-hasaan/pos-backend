// Product Routes
import express from "express"
import { getProducts, createProduct, updateProduct, deleteProduct } from "../controllers/product.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"
import { validateProduct } from "../middleware/validate.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// GET /api/products
router.get("/", getProducts)

// POST /api/products (shop only)
router.post("/", isShop, validateProduct, createProduct)

// PUT /api/products/:id (shop only)
router.put("/:id", isShop, updateProduct)

// DELETE /api/products/:id (shop only)
router.delete("/:id", isShop, deleteProduct)

export default router
