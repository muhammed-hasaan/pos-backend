// Authentication Middleware
import jwt from "jsonwebtoken"
import User from "../models/User.model.js"
import { JWT_SECRET, ADMIN_CONTACT } from "../config/constants.js"

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    // Attach user info to request
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      })
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    })
  }
}

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    })
  }
  next()
}

// Check if user is shop owner
export const isShop = (req, res, next) => {
  if (req.user.role !== "shop") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Shop owner privileges required.",
    })
  }
  next()
}

// Check if shop account is active
export const isActiveShop = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return next()
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: `Your account has been deactivated. Please contact the system administrator at ${ADMIN_CONTACT} to reactivate your subscription.`,
        isDeactivated: true,
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}
