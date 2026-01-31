// Product Model
import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
productSchema.index({ shopId: 1, isActive: 1 })
productSchema.index({ categoryId: 1 })
productSchema.index({ name: "text" })

const Product = mongoose.model("Product", productSchema)

export default Product
