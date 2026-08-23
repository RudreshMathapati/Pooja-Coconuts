const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  shopName: { type: String, default: 'M/s. POOJA COCONUT & GENERAL MERCHANT' },
  kannadaName: { type: String, default: 'ಮೇ. ಪೂಜಾ ಕೋಕೋನಟ್' },
  invocation: { type: String, default: '|| Shri Sangameshwar Prasanna ||' },
  tagline: { type: String, default: 'COCONUT & GENERAL MERCHANT' },
  ownerName: { type: String, default: 'Pooja Coconuts' },
  phone: { type: String, default: '9449458675' },
  address: { type: String, default: 'Basava Gunj, BASAVAKALYAN-585 327. Dst. Bidar. (K.S)' },
  gstin: { type: String, default: '29AIDPM4039Q1ZN' },
  disclaimerText: { type: String, default: 'ಸೂಚನೆ : ಮಾರಾಟದ ತೆಂಗು ಮತ್ತು ಎಳನೀರು ವಾಪಾಸ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ (Sold coconuts & tender coconuts will not be taken back)' },
  enableWhatsApp: { type: Boolean, default: true },
  whatsappApiKey: { type: String, default: '' },
  whatsappApiUrl: { type: String, default: '' },
  invoicePrefix: { type: String, default: 'PC-' },
  invoiceBaseUrl: { type: String, default: 'http://poojacoconuts.com' },
  defaultGstPercent: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);
