const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  gstNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  totalPurchased: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  lastPurchaseDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
