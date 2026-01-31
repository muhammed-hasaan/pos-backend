// Online Order Controller
import Order from "../models/Order.model.js"
import { generateMockOnlineOrders } from "../utils/helpers.js"

// Get online orders
export const getOnlineOrders = async (req, res, next) => {
  try {
    // Get real online orders from database
    const realOrders = await Order.find({
      shopId: req.user.id,
      orderType: "online",
    }).sort({ createdAt: -1 })

    // If no real orders, return mock data
    if (realOrders.length === 0) {
      const mockOrders = generateMockOnlineOrders(req.user.id)
      return res.json({
        success: true,
        orders: mockOrders,
        isMock: true,
      })
    }

    res.json({
      success: true,
      orders: realOrders,
      isMock: false,
    })
  } catch (error) {
    next(error)
  }
}
