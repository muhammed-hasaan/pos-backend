// Authentication Routes
import express from "express"
import { login, registerAdmin, getProfile } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"
import { validateLogin } from "../middleware/validate.middleware.js"

const router = express.Router()

// POST /api/auth/login
router.post("/login", validateLogin, login)

// POST /api/auth/register-admin
router.post("/register-admin", registerAdmin)

// GET /api/auth/profile
router.get("/profile", authenticate, getProfile)

export default router
