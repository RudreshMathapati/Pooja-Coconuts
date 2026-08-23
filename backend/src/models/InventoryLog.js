const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  changeType: { 
    type: String, 
    enum: ['STOCK_ADD_PURCHASE', 'STOCK_SOLD_SALE', 'MANUAL_ADJUSTMENT'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceId: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  remarks: { type: String, default: '' }
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
