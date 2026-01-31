// Authentication Controller
import User from "../models/User.model.js"
import { generateToken } from "../utils/jwt.js"
import { ADMIN_CONTACT } from "../config/constants.js"

// Login user (admin or shop)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check if shop account is active (only for shop users)
    if (user.role === "shop" && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: `Your account has been deactivated. Please contact the system administrator at ${ADMIN_CONTACT} to reactivate your subscription.`,
        isDeactivated: true,
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user)

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        ownerName: user.ownerName,
        phone: user.phone,
        address: user.address,
        taxRate: user.taxRate,
        currency: user.currency,
        shopLogo: user.shopLogo,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Register admin (initial setup only)
export const registerAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" })

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin account already exists",
      })
    }

    // Create admin user
    const admin = new User({
      email: email.toLowerCase(),
      password,
      role: "admin",
      isActive: true,
    })

    await admin.save()

    const token = generateToken(admin)

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get current user profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}
