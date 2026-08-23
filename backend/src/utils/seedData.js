const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const CustomerPayment = require('../models/CustomerPayment');
const SupplierPayment = require('../models/SupplierPayment');
const InventoryLog = require('../models/InventoryLog');
const Setting = require('../models/Setting');

const syncPaymentsToBills = async () => {
  try {
    // 1. Sync Supplier Payments to Purchase Bills
    const supplierPayments = await SupplierPayment.find().sort({ date: 1, createdAt: 1 });
    for (const p of supplierPayments) {
      if (!p.amountPaid || p.amountPaid <= 0) continue;

      let remaining = p.amountPaid;
      const unpaidPurchases = await Purchase.find({
        purchaseType: p.purchaseType || 'Shop',
        $or: [
          { supplier: p.supplier },
          { supplierName: new RegExp('^' + (p.supplierName || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
        ],
        pendingAmount: { $gt: 0 }
      }).sort({ date: 1, createdAt: 1 });

      for (const purchase of unpaidPurchases) {
        if (remaining <= 0) break;
        const alloc = Math.min(remaining, purchase.pendingAmount);
        purchase.amountPaid += alloc;
        purchase.pendingAmount -= alloc;
        purchase.paymentStatus = purchase.pendingAmount <= 0 ? 'Paid' : 'Partial';
        await purchase.save();
        remaining -= alloc;
      }
    }

    // 2. Sync Customer Payments to Sales Bills
    const customerPayments = await CustomerPayment.find().sort({ date: 1, createdAt: 1 });
    for (const p of customerPayments) {
      if (!p.amountReceived || p.amountReceived <= 0) continue;

      let remaining = p.amountReceived;
      const unpaidSales = await Sale.find({
        $or: [
          { customer: p.customer },
          { customerName: new RegExp('^' + (p.customerName || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
        ],
        pendingAmount: { $gt: 0 }
      }).sort({ date: 1, createdAt: 1 });

      for (const sale of unpaidSales) {
        if (remaining <= 0) break;
        const alloc = Math.min(remaining, sale.pendingAmount);
        sale.amountPaid += alloc;
        sale.pendingAmount -= alloc;
        sale.paymentStatus = sale.pendingAmount <= 0 ? 'Paid' : 'Partial';
        await sale.save();
        remaining -= alloc;
      }
    }
  } catch (err) {
    console.error('Error syncing payments to bills:', err);
  }
};

const seedInitialData = async () => {
  try {
    // 1. Ensure Admin User exists
    const adminExists = await User.findOne({ email: 'admin@poojacoconuts.com' });
    if (!adminExists) {
      await User.create({
        name: 'Shop Owner (Admin)',
        email: 'admin@poojacoconuts.com',
        password: 'admin123',
        role: 'Admin',
        phone: '+91 98765 43210'
      });
      console.log('Admin user created: admin@poojacoconuts.com');
    }

    // 2. Ensure Settings exist
    const settingsExist = await Setting.findOne();
    if (!settingsExist) {
      await Setting.create({
        shopName: 'M/s. POOJA COCONUT & GENERAL MERCHANT',
        kannadaName: 'ಮೇ. ಪೂಜಾ ಕೋಕೋನಟ್',
        tagline: 'COCONUT & GENERAL MERCHANT',
        phone: '9449458675',
        address: 'Basava Gunj, BASAVAKALYAN-585 327. Dst. Bidar. (K.S)',
        gstin: '29AIDPM4039Q1ZN',
        enableWhatsApp: true,
        invoicePrefix: 'PC-'
      });
    }

    // 3. Sync all existing payments to Purchase & Sale bills
    await syncPaymentsToBills();

    console.log('Database initialized clean & synced bill payments.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

const clearAllBusinessData = async () => {
  try {
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Supplier.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await CustomerPayment.deleteMany({});
    await SupplierPayment.deleteMany({});
    await InventoryLog.deleteMany({});
    console.log('All business data (products, customers, suppliers, sales, purchases, logs) cleared cleanly!');
  } catch (err) {
    console.error('Error clearing database:', err);
  }
};

module.exports = { seedInitialData, clearAllBusinessData, syncPaymentsToBills };
