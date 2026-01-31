// Product Controller
import Product from "../models/Product.model.js"

// Get all products for shop
export const getProducts = async (req, res, next) => {
  try {
    const shopId = req.user.role === "admin" ? req.query.shopId : req.user.id

    const { categoryId, search } = req.query

    const query = { shopId, isActive: true }

    if (categoryId && categoryId !== "all") {
      query.categoryId = categoryId
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    const products = await Product.find(query).populate("categoryId", "name color").sort({ name: 1 })

    res.json({
      success: true,
      products,
    })
  } catch (error) {
    next(error)
  }
}

// Create product
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, image, stockQuantity, sku } = req.body

    const product = new Product({
      name,
      description,
      price,
      categoryId,
      image,
      stockQuantity: stockQuantity || 0,
      sku: sku || "",
      shopId: req.user.id,
    })

    await product.save()

    const populatedProduct = await Product.findById(product._id).populate("categoryId", "name color")

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    })
  } catch (error) {
    next(error)
  }
}

// Update product
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    const product = await Product.findOneAndUpdate(
      { _id: id, shopId: req.user.id },
      { $set: updates },
      { new: true },
    ).populate("categoryId", "name color")

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    })
  } catch (error) {
    next(error)
  }
}

// Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    await Product.findOneAndDelete({ _id: id, shopId: req.user.id })

    res.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
