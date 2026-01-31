// JWT Token Utilities
import jwt from "jsonwebtoken"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js"

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      shopName: user.shopName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
