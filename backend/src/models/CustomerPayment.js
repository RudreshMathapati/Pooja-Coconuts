const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  amountReceived: { type: Number, required: true, min: 1 },
  paymentMethod: { type: String, enum: ['Cash'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomerPayment', customerPaymentSchema);
