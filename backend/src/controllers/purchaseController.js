const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const InventoryLog = require('../models/InventoryLog');
const mongoose = require('mongoose');

// @desc    Get Purchases (Shop or Home filter)
// @route   GET /api/purchases
const getPurchases = async (req, res, next) => {
  try {
    const { type, startDate, endDate, supplierId } = req.query;
    let query = {};

    if (type) {
      query.purchaseType = type; // 'Shop' or 'Home'
    }
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (supplierId) {
      query.supplier = supplierId;
    }

    const purchases = await Purchase.find(query).sort({ date: -1, createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
};

// @desc    Create Purchase Entry (Shop vs Home)
// @route   POST /api/purchases
const createPurchase = async (req, res, next) => {
  try {
    const {
      purchaseType, // 'Shop' or 'Home'
      billNumber,
      supplierName,
      supplierPhone,
      items,
      totalAmount,
      amountPaid,
      paymentStatus,
      remarks,
      date
    } = req.body;

    const pType = purchaseType === 'Home' ? 'Home' : 'Shop';

    if (!supplierName || !items || items.length === 0) {
      return res.status(400).json({ message: 'Supplier name and at least one item are required' });
    }

    const paidVal = paymentStatus === 'Paid' ? Number(totalAmount) : (Number(amountPaid) || 0);
    const pendingVal = Math.max(0, Number(totalAmount) - paidVal);
    const finalStatus = pendingVal === 0 ? 'Paid' : (paidVal === 0 ? 'Pending' : 'Partial');

    // Clean & resolve items (handle missing or empty string ObjectId)
    const cleanItems = [];
    for (const item of items) {
      if (!item.name || !item.name.trim()) continue;

      let prodObj = null;

      // 1. Try finding product by ID if valid ObjectId string
      if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
        prodObj = await Product.findById(item.product);
      }

      // 2. Fallback: Try finding product by Name
      if (!prodObj) {
        const cleanName = item.name.trim();
        prodObj = await Product.findOne({ name: new RegExp('^' + cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
      }

      // 3. For Shop Purchases: Auto-create product in inventory if it doesn't exist
      if (!prodObj && pType === 'Shop') {
        prodObj = await Product.create({
          name: item.name.trim(),
          category: 'General Merchant',
          unit: item.unit || 'Pcs',
          rate: Number(item.rate) || 0,
          purchaseRate: Number(item.rate) || 0,
          stock: 0,
          minStockAlert: 10
        });
      }

      cleanItems.push({
        product: prodObj ? prodObj._id : null,
        name: item.name.trim(),
        unit: item.unit || 'Pcs',
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        total: Number(item.total) || 0
      });
    }

    if (cleanItems.length === 0) {
      return res.status(400).json({ message: 'At least one valid item is required for purchase' });
    }

    // Supplier Lookup or auto creation
    let supplierObj = null;
    if (supplierPhone && supplierPhone.trim()) {
      supplierObj = await Supplier.findOne({ phone: supplierPhone.trim() });
      if (!supplierObj) {
        supplierObj = await Supplier.create({
          name: supplierName.trim(),
          phone: supplierPhone.trim()
        });
      }
    } else {
      supplierObj = await Supplier.findOne({ name: supplierName.trim() });
    }

    // Update Supplier stats according to Shop vs Home
    if (supplierObj) {
      if (pType === 'Shop') {
        supplierObj.shopTotalPurchased += Number(totalAmount);
        supplierObj.shopTotalPaid += paidVal;
        supplierObj.shopPendingAmount += pendingVal;
      } else {
        supplierObj.homeTotalPurchased += Number(totalAmount);
        supplierObj.homeTotalPaid += paidVal;
        supplierObj.homePendingAmount += pendingVal;
      }
      await supplierObj.save();
    }

    // Save Purchase Document with sanitized items
    const purchase = await Purchase.create({
      purchaseType: pType,
      billNumber: billNumber || `PUR-${Date.now().toString().slice(-6)}`,
      supplier: supplierObj ? supplierObj._id : null,
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone ? supplierPhone.trim() : '',
      items: cleanItems,
      totalAmount: Number(totalAmount),
      amountPaid: paidVal,
      pendingAmount: pendingVal,
      paymentStatus: finalStatus,
      paymentMethod: 'Cash',
      remarks: remarks || '',
      date: date ? new Date(date) : new Date()
    });

    // ONLY FOR SHOP PURCHASES: Increase Product inventory stock
    if (pType === 'Shop') {
      for (const item of cleanItems) {
        if (item.product) {
          const prod = await Product.findById(item.product);
          if (prod) {
            const prevStock = prod.stock;
            prod.stock += Number(item.quantity);
            if (item.rate && item.rate > 0) {
              prod.purchaseRate = Number(item.rate);
            }
            await prod.save();

            await InventoryLog.create({
              product: prod._id,
              productName: prod.name,
              changeType: 'STOCK_ADD_PURCHASE',
              quantity: Number(item.quantity),
              previousStock: prevStock,
              newStock: prod.stock,
              referenceId: purchase.billNumber,
              date: purchase.date,
              remarks: `Shop Purchase from ${supplierName}`
            });
          }
        }
      }
    }

    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPurchases,
  createPurchase
};
