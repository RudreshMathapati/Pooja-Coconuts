const express = require('express');
const router = express.Router();
const {
  collectCustomerPayment,
  paySupplier,
  getCustomerPayments,
  getSupplierPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/customer', protect, collectCustomerPayment);
router.post('/supplier', protect, paySupplier);
router.get('/customer', protect, getCustomerPayments);
router.get('/supplier', protect, getSupplierPayments);

module.exports = router;
