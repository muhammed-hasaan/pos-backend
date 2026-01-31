// Category Controller
import Category from "../models/Category.model.js"
import Product from "../models/Product.model.js"

// Get all categories for shop
export const getCategories = async (req, res, next) => {
  try {
    const shopId = req.user.role === "admin" ? req.query.shopId : req.user.id

    const categories = await Category.find({ shopId, isActive: true }).sort({ name: 1 })

    res.json({
      success: true,
      categories,
    })
  } catch (error) {
    next(error)
  }
}

// Create category
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body

    const category = new Category({
      name,
      description,
      color: color || "#3b82f6",
      icon: icon || "Package",
      shopId: req.user.id,
    })

    await category.save()

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    })
  } catch (error) {
    next(error)
  }
}

// Update category
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    const category = await Category.findOneAndUpdate({ _id: id, shopId: req.user.id }, { $set: updates }, { new: true })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    })
  } catch (error) {
    next(error)
  }
}

// Delete category
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: id })

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Please delete or reassign products first.`,
      })
    }

    await Category.findOneAndDelete({ _id: id, shopId: req.user.id })

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
