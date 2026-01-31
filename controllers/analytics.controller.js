// Analytics Controller
import Order from "../models/Order.model.js"
import { getDateRanges } from "../utils/helpers.js"
import mongoose from "mongoose"

// Get analytics data
export const getAnalytics = async (req, res, next) => {
  try {
    const shopId = new mongoose.Types.ObjectId(req.user.id)
    const { startDate, endDate } = req.query

    const { todayStart, monthStart, yearStart, now } = getDateRanges()

    // Today's sales
    const todaySales = await Order.aggregate([
      {
        $match: {
          shopId: shopId,
          status: "completed",
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ])

    // Monthly sales
    const monthlySales = await Order.aggregate([
      {
        $match: {
          shopId: shopId,
          status: "completed",
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ])

    // Yearly sales
    const yearlySales = await Order.aggregate([
      {
        $match: {
          shopId: shopId,
          status: "completed",
          createdAt: { $gte: yearStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ])

    // Total all time
    const totalSales = await Order.aggregate([
      {
        $match: {
          shopId: shopId,
          status: "completed",
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ])

    // Daily sales for chart
    let chartStartDate = new Date(now)
    chartStartDate.setDate(chartStartDate.getDate() - 30)
    let chartEndDate = now

    if (startDate && endDate) {
      chartStartDate = new Date(startDate)
      chartEndDate = new Date(endDate + "T23:59:59.999Z")
    }

    const dailySales = await Order.aggregate([
      {
        $match: {
          shopId: shopId,
          status: "completed",
          createdAt: { $gte: chartStartDate, $lte: chartEndDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { shopId: shopId, status: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ])

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: { shopId: shopId, status: "completed" } },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ])

    res.json({
      success: true,
      analytics: {
        today: {
          sales: todaySales[0]?.total || 0,
          orders: todaySales[0]?.count || 0,
        },
        monthly: {
          sales: monthlySales[0]?.total || 0,
          orders: monthlySales[0]?.count || 0,
        },
        yearly: {
          sales: yearlySales[0]?.total || 0,
          orders: yearlySales[0]?.count || 0,
        },
        total: {
          sales: totalSales[0]?.total || 0,
          orders: totalSales[0]?.count || 0,
        },
        dailySales,
        topProducts,
        paymentBreakdown,
      },
    })
  } catch (error) {
    next(error)
  }
}
