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

// Create online order (from website)
export const createOnlineOrder = async (req, res, next) => {
  try {
    const { items, subtotal, tax, total, customerName, customerPhone, customerEmail, deliveryAddress, paymentMethod, status } = req.body

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      })
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      })
    }

    // Generate unique order number
    const orderNumber = `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create order
    const order = new Order({
      orderNumber,
      shopId: null, // No shop for website orders
      items: items.map((item) => ({
        productId: item.productId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax),
      total: parseFloat(total),
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
      deliveryAddress: deliveryAddress || "",
      paymentMethod: paymentMethod || "cash", // Default to "cash" not "pending"
      status: status || "pending",
      orderType: "online",
      onlineStatus: "pending",
    })

    await order.save()

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    next(error)
  }
}

// Get all online orders (no auth required for now - can add auth later)
export const getAllOnlineOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ orderType: "online" }).sort({ createdAt: -1 })

    res.json({
      success: true,
      orders,
      count: orders.length,
    })
  } catch (error) {
    next(error)
  }
}

// Update online order status
export const updateOnlineOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate status
    const validStatuses = ["pending", "preparing", "ready", "delivered"]
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: pending, preparing, ready, delivered",
      })
    }

    // Find and update the order
    const order = await Order.findByIdAndUpdate(
      id,
      { onlineStatus: status, status: status },
      { new: true }
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    })
  } catch (error) {
    next(error)
  }
}

