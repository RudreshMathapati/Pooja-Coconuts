const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  gstNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  shopTotalPurchased: { type: Number, default: 0 },
  shopTotalPaid: { type: Number, default: 0 },
  shopPendingAmount: { type: Number, default: 0 },
  homeTotalPurchased: { type: Number, default: 0 },
  homeTotalPaid: { type: Number, default: 0 },
  homePendingAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supplier', supplierSchema);
