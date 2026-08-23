const express = require('express');
const router = express.Router();
const {
  getProducts,
  getLowStockProducts,
  getInventoryLogs,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getProducts);
router.get('/low-stock', protect, getLowStockProducts);
router.get('/logs', protect, getInventoryLogs);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.post('/:id/adjust-stock', protect, adjustStock);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
