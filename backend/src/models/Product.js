const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, default: 'Coconut' },
  unit: { type: String, enum: ['Pcs', 'Bags', 'KG', 'Quintal', 'Litre'], default: 'Pcs' },
  rate: { type: Number, required: true, min: 0 },
  purchaseRate: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  minStockAlert: { type: Number, default: 100 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
