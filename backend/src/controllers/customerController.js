const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const CustomerPayment = require('../models/CustomerPayment');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

// @desc    Get customer outstanding dues list
// @route   GET /api/customers/dues
const getCustomerDues = async (req, res, next) => {
  try {
    const dues = await Customer.find({ pendingAmount: { $gt: 0 } }).sort({ pendingAmount: -1 });
    res.json(dues);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single customer profile with bill and payment history
// @route   GET /api/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const bills = await Sale.find({ customer: customer._id }).sort({ date: -1 });
    const payments = await CustomerPayment.find({ customer: customer._id }).sort({ date: -1 });

    res.json({
      customer,
      bills,
      payments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, gstNumber, address } = req.body;

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      gstNumber: gstNumber ? gstNumber.trim() : '',
      address: address ? address.trim() : ''
    });

    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { name, phone, gstNumber, address } = req.body;
    customer.name = name ? name.trim() : customer.name;
    customer.phone = phone ? phone.trim() : customer.phone;
    customer.gstNumber = gstNumber !== undefined ? gstNumber.trim() : customer.gstNumber;
    customer.address = address !== undefined ? address.trim() : customer.address;

    const updated = await customer.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getCustomerDues,
  getCustomerById,
  createCustomer,
  updateCustomer
};
