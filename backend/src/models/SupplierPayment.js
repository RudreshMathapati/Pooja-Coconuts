const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String, required: true },
  purchaseType: { type: String, enum: ['Shop', 'Home'], default: 'Shop' },
  amountPaid: { type: Number, required: true, min: 1 },
  paymentMethod: { type: String, enum: ['Cash'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
