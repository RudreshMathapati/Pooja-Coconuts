const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const CustomerPayment = require('../models/CustomerPayment');

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
      }).limit(10),

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
      }).sort({ date: -1 }).limit(20),

      Purchase.find({
        $or: [
          { billNumber: regex },
          { supplierName: regex },
          { supplierPhone: regex },
          { 'items.name': regex }
        ]
      }).limit(10),

      Product.find({
        $or: [{ name: regex }, { category: regex }, { description: regex }]
      }).limit(5)
    ]);

    // For each matched customer, fetch ALL their bills and payment history
    const customersWithFullData = await Promise.all(
      customers.map(async (customer) => {
        const [allBills, allPayments, directBills] = await Promise.all([
          Sale.find({ customer: customer._id }).sort({ date: -1 }),
          CustomerPayment.find({ customer: customer._id }).sort({ date: -1 }),
          // Also find sales by name/phone in case customer ref is missing
          Sale.find({
            customer: { $exists: false },
            $or: [
              { customerName: new RegExp(`^${customer.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
              { customerPhone: customer.phone }
            ]
          }).sort({ date: -1 })
        ]);

        // Merge bills avoiding duplicates
        const billMap = new Map();
        [...allBills, ...directBills].forEach(b => billMap.set(b._id.toString(), b));
        const mergedBills = Array.from(billMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
          ...customer.toObject(),
          bills: mergedBills,
          payments: allPayments
        };
      })
    );

    // Also pull in any sale results that are for customers we matched
    // but that might not have been captured by customer search
    // (e.g., searching by exact phone number should show all their bills)
    const matchedCustomerIds = new Set(customers.map(c => c._id.toString()));
    const matchedCustomerNames = new Set(customers.map(c => c.name.toLowerCase()));
    const matchedCustomerPhones = new Set(customers.map(c => c.phone));

    // Filter sales: keep ones not already in a customer's bills
    const standalonesSales = sales.filter(s => {
      const custId = s.customer?.toString();
      const custName = (s.customerName || '').toLowerCase();
      const custPhone = s.customerPhone || '';
      // If this sale is already covered by a matched customer, skip
      if (custId && matchedCustomerIds.has(custId)) return false;
      if (matchedCustomerNames.has(custName)) return false;
      if (custPhone && matchedCustomerPhones.has(custPhone)) return false;
      return true;
    });

    res.json({
      customers: customersWithFullData,
      suppliers,
      sales: standalonesSales,
      purchases,
      products
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { globalSearch };
