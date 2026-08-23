const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

// @desc    Global Instant Search Across All Modules
// @route   GET /api/search
const globalSearch = async (req, res, next) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      return res.json({
        customers: [],
        suppliers: [],
        sales: [],
        purchases: [],
        products: []
      });
    }

    const regex = new RegExp(q, 'i');

    const [customers, suppliers, sales, purchases, products] = await Promise.all([
      Customer.find({
        $or: [{ name: regex }, { phone: regex }, { gstNumber: regex }]
      }).limit(5),

      Supplier.find({
        $or: [{ name: regex }, { phone: regex }, { gstNumber: regex }]
      }).limit(5),

      Sale.find({
        $or: [
          { billNumber: regex },
          { customerName: regex },
          { customerPhone: regex },
          { 'items.name': regex }
        ]
      }).limit(5),

      Purchase.find({
        $or: [
          { billNumber: regex },
          { supplierName: regex },
          { supplierPhone: regex },
          { 'items.name': regex }
        ]
      }).limit(5),

      Product.find({
        $or: [{ name: regex }, { category: regex }, { description: regex }]
      }).limit(5)
    ]);

    res.json({
      customers,
      suppliers,
      sales,
      purchases,
      products
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { globalSearch };
