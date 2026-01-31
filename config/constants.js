// Application Constants
export const JWT_SECRET = process.env.JWT_SECRET || "pos-system-secret-key-2024"
export const JWT_EXPIRES_IN = "7d"

export const USER_ROLES = {
  ADMIN: "admin",
  SHOP: "shop",
}

export const ORDER_STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
}

export const ONLINE_ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  DELIVERED: "delivered",
}

export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
}

export const ORDER_TYPES = {
  POS: "pos",
  ONLINE: "online",
}

export const ADMIN_CONTACT = "03168662511"
