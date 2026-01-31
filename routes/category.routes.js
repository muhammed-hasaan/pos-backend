// Category Routes
import express from "express"
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/category.controller.js"
import { authenticate, isShop } from "../middleware/auth.middleware.js"
import { validateCategory } from "../middleware/validate.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// GET /api/categories
router.get("/", getCategories)

// POST /api/categories (shop only)
router.post("/", isShop, validateCategory, createCategory)

// PUT /api/categories/:id (shop only)
router.put("/:id", isShop, updateCategory)

// DELETE /api/categories/:id (shop only)
router.delete("/:id", isShop, deleteCategory)

export default router
