// Category Model
import mongoose from "mongoose"

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
    icon: {
      type: String,
      default: "Package",
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

// Index for faster queries
categorySchema.index({ shopId: 1, isActive: 1 })

const Category = mongoose.model("Category", categorySchema)

export default Category
