const express = require('express');
const router = express.Router();
const {
  fetchNextBillNumber,
  getSales,
  getSaleById,
  createSale
} = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/next-bill-number', protect, fetchNextBillNumber);
router.get('/', protect, getSales);
router.get('/:id', protect, getSaleById);
router.post('/', protect, createSale);

module.exports = router;
