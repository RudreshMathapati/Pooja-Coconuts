const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  unit: { type: String, default: 'Pcs' },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
});

const purchaseSchema = new mongoose.Schema({
  purchaseType: { type: String, enum: ['Shop', 'Home'], required: true, default: 'Shop' },
  billNumber: { type: String, default: '' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String, required: true },
  supplierPhone: { type: String, default: '' },
  items: [purchaseItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Paid' },
  paymentMethod: { type: String, enum: ['Cash'], default: 'Cash' },
  remarks: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
