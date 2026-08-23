const Setting = require('../models/Setting');
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
    if (defaultGstPercent !== undefined) settings.defaultGstPercent = Number(defaultGstPercent);

    settings.updatedAt = Date.now();
    await settings.save();

    res.json({ message: 'Settings updated successfully', settings });
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

module.exports = { getSettings, updateSettings, resetDatabase };
