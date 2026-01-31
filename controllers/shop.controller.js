// Shop Controller
import User from "../models/User.model.js"
import Order from "../models/Order.model.js"
import Product from "../models/Product.model.js"
import Category from "../models/Category.model.js"

// Get all shops (admin only)
export const getAllShops = async (req, res, next) => {
  try {
    const shops = await User.find({ role: "shop" }).select("-password").sort({ createdAt: -1 })

    // Get statistics for each shop
    const shopsWithStats = await Promise.all(
      shops.map(async (shop) => {
        const totalOrders = await Order.countDocuments({ shopId: shop._id })
        const totalSales = await Order.aggregate([
          { $match: { shopId: shop._id, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ])

        return {
          ...shop.toObject(),
          totalOrders,
          totalSales: totalSales[0]?.total || 0,
        }
      }),
    )

    res.json({
      success: true,
      shops: shopsWithStats,
    })
  } catch (error) {
    next(error)
  }
}

// Get single shop details
export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params
    const shop = await User.findById(id).select("-password")

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      })
    }

    // Get shop statistics
    const totalOrders = await Order.countDocuments({ shopId: id })
    const totalProducts = await Product.countDocuments({ shopId: id })
    const totalCategories = await Category.countDocuments({ shopId: id })

    const salesStats = await Order.aggregate([
      { $match: { shopId: shop._id, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ])

    // Monthly sales
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyStats = await Order.aggregate([
      {
        $match: {
          shopId: shop._id,
          status: "completed",
          createdAt: { $gte: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ])

    res.json({
      success: true,
      shop: {
        ...shop.toObject(),
        stats: {
          totalOrders,
          totalProducts,
          totalCategories,
          totalSales: salesStats[0]?.total || 0,
          monthlySales: monthlyStats[0]?.total || 0,
          monthlyOrders: monthlyStats[0]?.count || 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Create new shop
export const createShop = async (req, res, next) => {
  try {
    const { shopName, ownerName, email, password, phone, address, taxRate } = req.body

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      })
    }

    // Create shop user
    const shop = new User({
      shopName,
      ownerName,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      role: "shop",
      isActive: true,
      taxRate: taxRate || 0,
    })

    await shop.save()

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        email: shop.email,
        phone: shop.phone,
        address: shop.address,
        isActive: shop.isActive,
        createdAt: shop.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Update shop
export const updateShop = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = { ...req.body }

    // Remove password from updates if empty
    if (!updates.password) {
      delete updates.password
    }

    const shop = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select(
      "-password",
    )

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      })
    }

    res.json({
      success: true,
      message: "Shop updated successfully",
      shop,
    })
  } catch (error) {
    next(error)
  }
}

// Delete shop
export const deleteShop = async (req, res, next) => {
  try {
    const { id } = req.params

    // Delete shop and all related data
    await Promise.all([
      User.findByIdAndDelete(id),
      Product.deleteMany({ shopId: id }),
      Category.deleteMany({ shopId: id }),
      Order.deleteMany({ shopId: id }),
    ])

    res.json({
      success: true,
      message: "Shop and all related data deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Toggle shop active status
export const toggleShopStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const shop = await User.findById(id)

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      })
    }

    shop.isActive = !shop.isActive
    await shop.save()

    res.json({
      success: true,
      message: shop.isActive ? "Shop activated successfully" : "Shop deactivated successfully",
      isActive: shop.isActive,
    })
  } catch (error) {
    next(error)
  }
}
