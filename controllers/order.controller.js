// Order Controller
import Order from "../models/Order.model.js"
import Product from "../models/Product.model.js"
import { generateOrderNumber } from "../utils/helpers.js"
import { spawn } from "child_process"

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

// Process Pending Order (Kitchen/Preparation Workflow) with Receipt Printing
// Similar to /api/print/pos-receipt - accepts order data and initiates preparation with automatic printing
export const processPendingOrder = async (req, res, next) => {
  try {
    const { orderId, orderData, preparationNotes, printerName } = req.body

    // Validation
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        error: "Order ID is required" 
      })
    }

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: "Order not found" 
      })
    }

    // Check if order is pending
    if (order.status !== "pending" && order.onlineStatus !== "pending") {
      return res.status(400).json({ 
        success: false, 
        error: "Order is not in pending status" 
      })
    }

    // Log the preparation request
    console.log(`🔔 Processing Pending Order: ${order.orderNumber}`)
    console.log(`   Customer: ${order.customerName}`)
    console.log(`   Items: ${order.items?.length || 0}`)
    if (preparationNotes) {
      console.log(`   Notes: ${preparationNotes}`)
    }

    // ============================
    // 🖨️ PRINT KITCHEN RECEIPT (Wait for print to complete)
    // 🖨️ PRINT KITCHEN RECEIPT (Wait for print to complete)
    // ============================
    let printCompleted = true
    if (printerName && printerName.trim() !== '') {
      try {
        const line = "=".repeat(48)
        const dash = "-".repeat(48)

        let receipt = ''

        // Store Header
        receipt += `        KITCHEN ORDER\n`
        receipt += `${line}\n`

        // Order Info
        receipt += `Order #: ${order.orderNumber}\n`
        receipt += `Date: ${(() => {
          const now = new Date()
          const day = now.getDate()
          const month = now.getMonth() + 1
          const year = now.getFullYear()
          let hours = now.getHours()
          const minutes = now.getMinutes().toString().padStart(2, '0')
          const seconds = now.getSeconds().toString().padStart(2, '0')
          const ampm = hours >= 12 ? 'PM' : 'AM'
          hours = hours % 12
          hours = hours ? hours : 12
          return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}\n`
        })()}`
        
        receipt += `Customer: ${order.customerName}\n`
        receipt += `Phone: ${order.customerPhone}\n`
        receipt += `${line}\n`

        // Items Header
        receipt += `Item                 Qty    Price\n`
        receipt += `${dash}\n`

        // Items
        const itemNameWidth = 20
        const qtyWidth = 5
        const priceWidth = 10

        order.items.forEach(item => {
          let name = item.name
          if (name.length > itemNameWidth) {
            name = name.slice(0, itemNameWidth - 1)
          }
          const qty = item.quantity.toString().padStart(qtyWidth, ' ')
          const price = (item.price * item.quantity).toFixed(2).padStart(priceWidth, ' ')
          receipt += `${name.padEnd(itemNameWidth, ' ')}${qty}${price}\n`
        })

        receipt += `${dash}\n`

        // Totals
        receipt += `TOTAL:${' '.repeat(22)} Rs.${order.total.toFixed(2)}\n`
        receipt += `${line}\n`

        // Delivery Address if available
        if (order.deliveryAddress) {
          receipt += `Delivery Address:\n`
          receipt += `${order.deliveryAddress}\n`
          receipt += `${line}\n`
        }

        // Preparation Notes if available
        if (preparationNotes) {
          receipt += `Special Instructions:\n`
          receipt += `${preparationNotes}\n`
          receipt += `${line}\n`
        }

        // Footer
        receipt += `       START PREPARATION\n`
        receipt += `${line}\n\n`
        receipt += `Powered By : https://hashapples.com/`

        // Windows line breaks
        receipt = receipt.replace(/\n/g, '\r\n')

        // PowerShell command to print
        const psCommand = `$text = @"\n${receipt}\n"@; $text | Out-Printer -Name "${printerName}"`

        // Wait for print process to complete before responding
        await new Promise((resolve, reject) => {
          const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand])

          ps.on('close', (code) => {
            if (code === 0) {
              console.log(`✅ Kitchen receipt printed for order ${order.orderNumber}`)
              resolve()
            } else {
              console.log(`⚠️ Printing issue for order ${order.orderNumber}, but processing continues`)
              resolve() // Still resolve even on error - don't block order processing
            }
          })

          ps.on('error', (err) => {
            console.error(`Print process error for order ${order.orderNumber}:`, err.message)
            resolve() // Still resolve even on error
          })

          // Timeout after 5 seconds to prevent hanging
          setTimeout(() => {
            console.log(`⏱️ Print timeout for order ${order.orderNumber}, continuing...`)
            resolve()
          }, 5000)
        })
      } catch (printError) {
        console.error('Print error (non-blocking):', printError.message)
        // Don't block order processing if printing fails
      }
    }

    // Return success response AFTER print completes
    res.status(200).json({
      success: true,
      message: "Order sent to preparation workflow",
      orderNumber: order.orderNumber,
      status: order.status || order.onlineStatus,
      processedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Error processing pending order:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process pending order"
    })
  }
}
