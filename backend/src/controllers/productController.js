const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStockAlert'] }
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new product
// @route   POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, category, unit, rate, purchaseRate, stock, minStockAlert, description } = req.body;

    const existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category || 'General',
      unit: unit || 'Pcs',
      rate: Number(rate),
      purchaseRate: Number(purchaseRate) || 0,
      stock: Number(stock) || 0,
      minStockAlert: Number(minStockAlert) || 100,
      description: description || ''
    });

    if (Number(stock) > 0) {
      await InventoryLog.create({
        product: product._id,
        productName: product.name,
        changeType: 'MANUAL_ADJUSTMENT',
        quantity: Number(stock),
        previousStock: 0,
        newStock: Number(stock),
        remarks: 'Initial stock creation'
      });
    }

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, category, unit, rate, purchaseRate, minStockAlert, description } = req.body;
    
    product.name = name ? name.trim() : product.name;
    product.category = category || product.category;
    product.unit = unit || product.unit;
    product.rate = rate !== undefined ? Number(rate) : product.rate;
    product.purchaseRate = purchaseRate !== undefined ? Number(purchaseRate) : product.purchaseRate;
    product.minStockAlert = minStockAlert !== undefined ? Number(minStockAlert) : product.minStockAlert;
    product.description = description !== undefined ? description : product.description;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    next(err);
  }
};

// @desc    Manually adjust product stock
// @route   POST /api/products/:id/adjust-stock
const adjustStock = async (req, res, next) => {
  try {
    const { newStock, remarks } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock;
    const qtyChange = Number(newStock) - previousStock;
    product.stock = Number(newStock);
    await product.save();

    await InventoryLog.create({
      product: product._id,
      productName: product.name,
      changeType: 'MANUAL_ADJUSTMENT',
      quantity: qtyChange,
      previousStock,
      newStock: product.stock,
      remarks: remarks || 'Manual stock adjustment'
    });

    res.json({ message: 'Stock adjusted successfully', product });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get inventory movement history logs
// @route   GET /api/products/logs
const getInventoryLogs = async (req, res, next) => {
  try {
    const { productId, limit = 50 } = req.query;
    let query = {};
    if (productId) {
      query.product = productId;
    }
    const logs = await InventoryLog.find(query)
      .sort({ date: -1, _id: -1 })
      .limit(Number(limit));
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getLowStockProducts,
  getInventoryLogs,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
};
