const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const CustomerPayment = require('../models/CustomerPayment');
const SupplierPayment = require('../models/SupplierPayment');

// Helper to allocate payment to unpaid Sale bills FIFO (Oldest first)
const allocateCustomerPaymentToSales = async (customerObj, amount) => {
  let remaining = Number(amount) || 0;
  if (remaining <= 0) return;

  // Find unpaid or partial sales bills for this customer (Oldest first)
  const unpaidSales = await Sale.find({
    $or: [
      { customer: customerObj._id },
      { customerName: new RegExp('^' + customerObj.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
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
};

// Helper to allocate payment to unpaid Purchase bills FIFO (Oldest first)
const allocateSupplierPaymentToPurchases = async (supplierObj, pType, amount) => {
  let remaining = Number(amount) || 0;
  if (remaining <= 0) return;

  // Find unpaid or partial purchase bills for this supplier (Oldest first)
  const unpaidPurchases = await Purchase.find({
    purchaseType: pType,
    $or: [
      { supplier: supplierObj._id },
      { supplierName: new RegExp('^' + supplierObj.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
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
};

// @desc    Collect Customer Payment
// @route   POST /api/payments/customer
const collectCustomerPayment = async (req, res, next) => {
  try {
    const { customerId, amountReceived, date, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.pendingAmount || customer.pendingAmount <= 0) {
      return res.status(400).json({ message: `Cannot collect payment. ${customer.name} has ₹0 outstanding balance.` });
    }

    const recVal = Number(amountReceived);
    if (recVal <= 0) {
      return res.status(400).json({ message: 'Amount received must be greater than zero' });
    }

    customer.pendingAmount = Math.max(0, customer.pendingAmount - recVal);
    customer.totalPaid += recVal;
    await customer.save();

    // Allocate payment to unpaid sales bills
    await allocateCustomerPaymentToSales(customer, recVal);

    const paymentLog = await CustomerPayment.create({
      customer: customer._id,
      customerName: customer.name,
      amountReceived: recVal,
      paymentMethod: 'Cash',
      date: date ? new Date(date) : new Date(),
      notes: notes || ''
    });

    res.status(201).json({
      message: 'Payment collected successfully',
      payment: paymentLog,
      customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Pay Supplier (Shop vs Home)
// @route   POST /api/payments/supplier
const paySupplier = async (req, res, next) => {
  try {
    const { supplierId, purchaseType, amountPaid, date, notes } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const payVal = Number(amountPaid);
    if (payVal <= 0) {
      return res.status(400).json({ message: 'Amount paid must be greater than zero' });
    }

    const pType = purchaseType === 'Home' ? 'Home' : 'Shop';

    if (pType === 'Shop') {
      supplier.shopPendingAmount = Math.max(0, supplier.shopPendingAmount - payVal);
      supplier.shopTotalPaid += payVal;
    } else {
      supplier.homePendingAmount = Math.max(0, supplier.homePendingAmount - payVal);
      supplier.homeTotalPaid += payVal;
    }
    await supplier.save();

    // Allocate payment to unpaid purchase bills (Updates purchase bill paid amount & pending due)
    await allocateSupplierPaymentToPurchases(supplier, pType, payVal);

    const paymentLog = await SupplierPayment.create({
      supplier: supplier._id,
      supplierName: supplier.name,
      purchaseType: pType,
      amountPaid: payVal,
      paymentMethod: 'Cash',
      date: date ? new Date(date) : new Date(),
      notes: notes || ''
    });

    res.status(201).json({
      message: 'Supplier payment recorded successfully',
      payment: paymentLog,
      supplier
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Customer Payment History
// @route   GET /api/payments/customer
const getCustomerPayments = async (req, res, next) => {
  try {
    const payments = await CustomerPayment.find().sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// @desc    Get Supplier Payment History
// @route   GET /api/payments/supplier
const getSupplierPayments = async (req, res, next) => {
  try {
    const payments = await SupplierPayment.find().sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  collectCustomerPayment,
  paySupplier,
  getCustomerPayments,
  getSupplierPayments,
  allocateCustomerPaymentToSales,
  allocateSupplierPaymentToPurchases
};
