// Order Model
import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false, // Optional for online orders from website
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    total: Number,
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional - can be "website" string for online orders
      default: null,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "pending"],
      default: "cash",
    },
    amountReceived: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    customerName: {
      type: String,
      default: "",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    customerEmail: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "cancelled", "refunded"],
      default: "completed",
    },
    orderType: {
      type: String,
      enum: ["pos", "online"],
      default: "pos",
    },
    onlineStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered"],
      default: "pending",
    },
    deliveryAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
orderSchema.index({ shopId: 1, createdAt: -1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ orderType: 1 })

const Order = mongoose.model("Order", orderSchema)

export default Order
