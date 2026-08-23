const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const SupplierPayment = require('../models/SupplierPayment');

// @desc    Get all suppliers
// @route   GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
};

// @desc    Get supplier dues (Shop vs Home filtered)
// @route   GET /api/suppliers/dues
const getSupplierDues = async (req, res, next) => {
  try {
    const type = req.query.type || 'Shop';
    let filter = {};
    if (type === 'Shop') {
      filter = { shopPendingAmount: { $gt: 0 } };
    } else {
      filter = { homePendingAmount: { $gt: 0 } };
    }
    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single supplier details with history
// @route   GET /api/suppliers/:id
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const purchases = await Purchase.find({ supplier: supplier._id }).sort({ date: -1 });
    const payments = await SupplierPayment.find({ supplier: supplier._id }).sort({ date: -1 });

    res.json({
      supplier,
      purchases,
      payments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, gstNumber, address } = req.body;

    const existing = await Supplier.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Supplier with this phone number already exists' });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      phone: phone.trim(),
      gstNumber: gstNumber ? gstNumber.trim() : '',
      address: address ? address.trim() : ''
    });

    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const { name, phone, gstNumber, address } = req.body;
    supplier.name = name ? name.trim() : supplier.name;
    supplier.phone = phone ? phone.trim() : supplier.phone;
    supplier.gstNumber = gstNumber !== undefined ? gstNumber.trim() : supplier.gstNumber;
    supplier.address = address !== undefined ? address.trim() : supplier.address;

    const updated = await supplier.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSuppliers,
  getSupplierDues,
  getSupplierById,
  createSupplier,
  updateSupplier
};
