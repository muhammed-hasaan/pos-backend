// Request Validation Middleware
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    })
  }

  next()
}

export const validateShop = (req, res, next) => {
  const { shopName, ownerName, email, password, phone, address } = req.body

  const errors = []

  if (!shopName?.trim()) errors.push("Shop name is required")
  if (!ownerName?.trim()) errors.push("Owner name is required")
  if (!email?.trim()) errors.push("Email is required")
  if (!phone?.trim()) errors.push("Phone is required")
  if (!address?.trim()) errors.push("Address is required")

  // Only require password for new shops
  if (!req.params.id && !password) {
    errors.push("Password is required")
  }

  if (email && !isValidEmail(email)) {
    errors.push("Please enter a valid email address")
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(", "),
    })
  }

  next()
}

export const validateProduct = (req, res, next) => {
  const { name, price, categoryId } = req.body

  const errors = []

  if (!name?.trim()) errors.push("Product name is required")
  if (price === undefined || price < 0) errors.push("Valid price is required")
  if (!categoryId) errors.push("Category is required")

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(", "),
    })
  }

  next()
}

export const validateCategory = (req, res, next) => {
  const { name } = req.body

  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    })
  }

  next()
}

export const validateOrder = (req, res, next) => {
  const { items, total } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Order must contain at least one item",
    })
  }

  if (!total || total <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order total",
    })
  }

  next()
}

// Helper function
function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email)
}
