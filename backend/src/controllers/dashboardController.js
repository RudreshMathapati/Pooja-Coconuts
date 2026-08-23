const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const CustomerPayment = require('../models/CustomerPayment');
const Product = require('../models/Product');

// @desc    Get complete Dashboard KPI Metrics & Charts
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const firstDayOfMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    // 1. Today's Sales
    const todaySalesData = await Sale.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    const todaySales = todaySalesData[0] ? todaySalesData[0].total : 0;

    // 2. Today's Shop Purchase
    const todayPurchaseData = await Purchase.aggregate([
      { $match: { purchaseType: 'Shop', date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const todayPurchase = todayPurchaseData[0] ? todayPurchaseData[0].total : 0;

    // 3. Today's Collection (Direct cash paid in today's sales + today's customer due payment logs)
    const todayDirectCollectedData = await Sale.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const todayDuePaymentsData = await CustomerPayment.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amountReceived' } } }
    ]);
    const todayDirectCollected = todayDirectCollectedData[0] ? todayDirectCollectedData[0].total : 0;
    const todayDueCollected = todayDuePaymentsData[0] ? todayDuePaymentsData[0].total : 0;
    const todayCollection = todayDirectCollected + todayDueCollected;

    // 4. Monthly Sales & Monthly Shop Purchase
    const monthlySalesData = await Sale.aggregate([
      { $match: { date: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const monthlySales = monthlySalesData[0] ? monthlySalesData[0].total : 0;

    const monthlyPurchaseData = await Purchase.aggregate([
      { $match: { purchaseType: 'Shop', date: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const monthlyPurchase = monthlyPurchaseData[0] ? monthlyPurchaseData[0].total : 0;

    // 5. Total Pending Customer Payments
    const pendingCustomersData = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);
    const pendingCustomerPayments = pendingCustomersData[0] ? pendingCustomersData[0].total : 0;

    // 6. Total Pending Supplier Payments (Shop)
    const pendingSuppliersData = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: '$shopPendingAmount' } } }
    ]);
    const pendingSupplierPayments = pendingSuppliersData[0] ? pendingSuppliersData[0].total : 0;

    // 7. Today's Estimated Profit (Today Sales minus estimated cost of goods)
    const todayProfit = Math.max(0, todaySales - (todaySales * 0.78)); // ~22% margin baseline or exact sales minus shop purchases

    // 8. Recent Bills & Purchases
    const recentBills = await Sale.find().sort({ date: -1 }).limit(5);
    const recentPurchases = await Purchase.find({ purchaseType: 'Shop' }).sort({ date: -1 }).limit(5);

    // 9. Top Selling Products
    const topProducts = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // 10. Last 7 Days Sales vs Purchase Chart Data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextD = new Date(d);
      nextD.setHours(23, 59, 59, 999);

      const daySales = await Sale.aggregate([
        { $match: { date: { $gte: d, $lte: nextD } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);

      const dayPurchases = await Purchase.aggregate([
        { $match: { purchaseType: 'Shop', date: { $gte: d, $lte: nextD } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({
        day: dayName,
        dateStr: d.toLocaleDateString('en-CA'),
        sales: daySales[0] ? daySales[0].total : 0,
        purchase: dayPurchases[0] ? dayPurchases[0].total : 0
      });
    }

    res.json({
      todaySales,
      todayPurchase,
      todayProfit: Math.round(todayProfit),
      pendingCustomerPayments,
      pendingSupplierPayments,
      monthlySales,
      monthlyPurchase,
      todayCollection,
      recentBills,
      recentPurchases,
      topProducts,
      chartData: last7Days
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
