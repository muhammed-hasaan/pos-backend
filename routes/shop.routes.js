// Shop Routes
import express from "express"
import {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  toggleShopStatus,
} from "../controllers/shop.controller.js"
import { authenticate, isAdmin } from "../middleware/auth.middleware.js"
import { validateShop } from "../middleware/validate.middleware.js"

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate, isAdmin)

// GET /api/shops
router.get("/", getAllShops)

// GET /api/shops/:id
router.get("/:id", getShopById)

// POST /api/shops
router.post("/", validateShop, createShop)

// PUT /api/shops/:id
router.put("/:id", updateShop)

// DELETE /api/shops/:id
router.delete("/:id", deleteShop)

// PUT /api/shops/:id/toggle-status
router.put("/:id/toggle-status", toggleShopStatus)

export default router
