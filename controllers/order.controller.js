// Order Controller
import Order from "../models/Order.model.js"
import Product from "../models/Product.model.js"
import { generateOrderNumber } from "../utils/helpers.js"

// Get orders
export const getOrders = async (req, res, next) => {
  try {
    const shopId = req.user.id
    const { startDate, endDate, status, orderType, search } = req.query

    const query = { shopId }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      }
    }

    if (status && status !== "all") {
      query.status = status
    }

    if (orderType && orderType !== "all") {
      query.orderType = orderType
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ]
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500)

    res.json({
      success: true,
      orders,
    })
  } catch (error) {
    next(error)
  }
}

// Get single order
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await Order.findOne({ _id: id, shopId: req.user.id })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      order,
    })
  } catch (error) {
    next(error)
  }
}

// Create order
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      amountReceived,
      customerName,
      customerPhone,
      orderType,
    } = req.body
console.log(req.body,"req.body")
    // Generate unique order number
    let orderNumber = generateOrderNumber()
    let attempts = 0

    while (attempts < 5) {
      const existing = await Order.findOne({ orderNumber })
      if (!existing) break
      orderNumber = generateOrderNumber()
      attempts++
    }

    const order = new Order({
      orderNumber,
      shopId: req.user.id,
      items,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      paymentMethod: paymentMethod || "cash",
      amountReceived: amountReceived || total,
      change: (amountReceived || total) - total,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      orderType: orderType || "pos",
      status: "completed",
    })

    await order.save()

    // Update stock quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity },
      })
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    })
  } catch (error) {
    next(error)
  }
}

// Update order (mainly for online order status)
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const { onlineStatus, status } = req.body

    const updates = {}
    if (onlineStatus) updates.onlineStatus = onlineStatus
    if (status) updates.status = status

    const order = await Order.findOneAndUpdate({ _id: id, shopId: req.user.id }, { $set: updates }, { new: true })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order,
    })
  } catch (error) {
    next(error)
  }
}
