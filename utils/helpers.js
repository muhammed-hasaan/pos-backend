// Utility Helper Functions

// Generate unique order number
export const generateOrderNumber = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD-${year}${month}${day}-${random}`
}

// Format currency
export const formatCurrency = (amount, currency = "PKR") => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Get date range helpers
export const getDateRanges = () => {
  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  return { todayStart, monthStart, yearStart, now }
}

// Parse date filters from query
export const parseDateFilters = (query) => {
  const { startDate, endDate } = query

  if (startDate && endDate) {
    return {
      $gte: new Date(startDate),
      $lte: new Date(endDate + "T23:59:59.999Z"),
    }
  }

  return null
}

// Generate mock online orders for demo
export const generateMockOnlineOrders = (shopId) => {
  const customerNames = [
    "Ahmed Khan",
    "Sara Ali",
    "Muhammad Hassan",
    "Ayesha Malik",
    "Usman Raza",
    "Fatima Zahra",
    "Bilal Ahmed",
    "Zainab Shah",
    "Ali Hussain",
    "Maryam Akhtar",
    "Imran Farooq",
    "Hina Tariq",
  ]

  const productItems = [
    { name: "Chicken Biryani", price: 350 },
    { name: "Beef Karahi", price: 850 },
    { name: "Mutton Pulao", price: 550 },
    { name: "Chicken Tikka", price: 450 },
    { name: "Fish Fry", price: 600 },
    { name: "Seekh Kabab", price: 400 },
    { name: "Naan", price: 30 },
    { name: "Raita", price: 50 },
    { name: "Cold Drink", price: 100 },
    { name: "Kheer", price: 150 },
  ]

  const statuses = ["pending", "preparing", "ready", "delivered"]
  const mockOrders = []

  for (let i = 0; i < 15; i++) {
    const numItems = Math.floor(Math.random() * 4) + 1
    const items = []
    let subtotal = 0

    for (let j = 0; j < numItems; j++) {
      const product = productItems[Math.floor(Math.random() * productItems.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const total = product.price * quantity
      subtotal += total

      items.push({
        productId: `mock-${j}`,
        name: product.name,
        price: product.price,
        quantity,
        total,
      })
    }

    const tax = subtotal * 0.05
    const total = subtotal + tax

    const date = new Date()
    date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 180))

    mockOrders.push({
      _id: `online-${Date.now()}-${i}`,
      orderNumber: `ONL-${Date.now().toString().slice(-6)}-${i.toString().padStart(2, "0")}`,
      shopId,
      items,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod: Math.random() > 0.5 ? "cash" : "card",
      customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
      customerPhone: `03${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "completed",
      orderType: "online",
      onlineStatus: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: date,
      deliveryAddress: `House ${Math.floor(Math.random() * 500)}, Street ${Math.floor(Math.random() * 50)}, Lahore`,
    })
  }

  return mockOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
