const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const CustomerPayment = require('../models/CustomerPayment');
const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');

// Helper to resolve start & end dates from query presets
const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter) {
    case 'Today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'Yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'Weekly':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'Monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'Yearly':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case 'Custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
  }

  return { start, end };
};

// @desc    Get Comprehensive Reports Data
// @route   GET /api/reports
const getReportsData = async (req, res, next) => {
  try {
    const { reportType, filter, startDate: customStart, endDate: customEnd } = req.query;
    const { start, end } = getDateRange(filter, customStart, customEnd);

    const dateFilter = { date: { $gte: start, $lte: end } };

    let data = {};

    switch (reportType) {
      case 'Sales':
        data = await Sale.find(dateFilter).sort({ date: -1 });
        break;

      case 'ShopPurchase':
        data = await Purchase.find({ ...dateFilter, purchaseType: 'Shop' }).sort({ date: -1 });
        break;

      case 'HomePurchase':
        data = await Purchase.find({ ...dateFilter, purchaseType: 'Home' }).sort({ date: -1 });
        break;

      case 'Customer':
        data = await Customer.find().sort({ name: 1 });
        break;

      case 'Supplier':
        data = await Supplier.find().sort({ name: 1 });
        break;

      case 'OutstandingCustomers':
        data = await Customer.find({ pendingAmount: { $gt: 0 } }).sort({ pendingAmount: -1 });
        break;

      case 'OutstandingSuppliers':
        data = await Supplier.find({
          $or: [{ shopPendingAmount: { $gt: 0 } }, { homePendingAmount: { $gt: 0 } }]
        }).sort({ name: 1 });
        break;

      case 'Collection':
        const salesCollected = await Sale.find(dateFilter).select('billNumber customerName amountPaid date');
        const duePaymentsCollected = await CustomerPayment.find(dateFilter);
        data = { salesCollected, duePaymentsCollected };
        break;

      case 'Profit':
        const salesList = await Sale.find(dateFilter);
        const shopPurchasesList = await Purchase.find({ ...dateFilter, purchaseType: 'Shop' });
        
        const totalSalesRevenue = salesList.reduce((acc, s) => acc + s.grandTotal, 0);
        const totalShopPurchaseCost = shopPurchasesList.reduce((acc, p) => acc + p.totalAmount, 0);
        const netProfit = totalSalesRevenue - totalShopPurchaseCost;

        data = {
          totalSalesRevenue,
          totalShopPurchaseCost,
          netProfit,
          salesCount: salesList.length,
          purchaseCount: shopPurchasesList.length
        };
        break;

      case 'Inventory':
        const products = await Product.find().sort({ name: 1 });
        const logs = await InventoryLog.find(dateFilter).sort({ date: -1 });
        data = { products, logs };
        break;

      case 'TopLeastProducts':
        const aggregated = await Sale.aggregate([
          { $match: dateFilter },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.name',
              totalQuantitySold: { $sum: '$items.quantity' },
              totalRevenue: { $sum: '$items.total' }
            }
          },
          { $sort: { totalQuantitySold: -1 } }
        ]);
        data = {
          topProducts: aggregated.slice(0, 10),
          leastProducts: aggregated.slice(-10).reverse()
        };
        break;

      default:
        data = await Sale.find(dateFilter).sort({ date: -1 });
        break;
    }

    res.json({
      reportType: reportType || 'Sales',
      filter: filter || 'Monthly',
      startDate: start,
      endDate: end,
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReportsData };
