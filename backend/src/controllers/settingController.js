const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const CustomerPayment = require('../models/CustomerPayment');
const SupplierPayment = require('../models/SupplierPayment');
const { clearAllBusinessData } = require('../utils/seedData');

// @desc    Get Shop Settings
// @route   GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        shopName: 'Pooja Coconuts',
        tagline: 'Wholesale & Retail Coconut Merchants',
        phone: '+91 98765 43210'
      });
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

// @desc    Update Shop Settings
// @route   PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const {
      shopName,
      tagline,
      ownerName,
      phone,
      address,
      gstin,
      enableWhatsApp,
      whatsappApiKey,
      whatsappApiUrl,
      invoicePrefix,
      invoiceBaseUrl,
      defaultGstPercent
    } = req.body;

    if (shopName !== undefined) settings.shopName = shopName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (ownerName !== undefined) settings.ownerName = ownerName;
    if (phone !== undefined) settings.phone = phone;
    if (address !== undefined) settings.address = address;
    if (gstin !== undefined) settings.gstin = gstin;
    if (enableWhatsApp !== undefined) settings.enableWhatsApp = Boolean(enableWhatsApp);
    if (whatsappApiKey !== undefined) settings.whatsappApiKey = whatsappApiKey;
    if (whatsappApiUrl !== undefined) settings.whatsappApiUrl = whatsappApiUrl;
    if (invoicePrefix !== undefined) settings.invoicePrefix = invoicePrefix;
    if (invoiceBaseUrl !== undefined) settings.invoiceBaseUrl = invoiceBaseUrl.trim();
    if (defaultGstPercent !== undefined) settings.defaultGstPercent = Number(defaultGstPercent);

    settings.updatedAt = Date.now();
    await settings.save();

    res.json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Export all business database records for backup before wipe/reset
// @route   GET /api/settings/backup-all
const getBackupData = async (req, res, next) => {
  try {
    const products = await Product.find().lean();
    const customers = await Customer.find().lean();
    const suppliers = await Supplier.find().lean();
    const sales = await Sale.find().lean();
    const purchases = await Purchase.find().lean();
    const customerPayments = await CustomerPayment.find().lean();
    const supplierPayments = await SupplierPayment.find().lean();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        products: products.length,
        customers: customers.length,
        suppliers: suppliers.length,
        sales: sales.length,
        purchases: purchases.length,
        customerPayments: customerPayments.length,
        supplierPayments: supplierPayments.length
      },
      data: {
        products,
        customers,
        suppliers,
        sales,
        purchases,
        customerPayments,
        supplierPayments
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Database (Delete all demo products, customers, sales, purchases, dues)
// @route   POST /api/settings/reset-database
const resetDatabase = async (req, res, next) => {
  try {
    await clearAllBusinessData();
    res.json({ message: 'Database reset completed. All products, sales, purchases, and dues have been deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, getBackupData, resetDatabase };

