const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerDues,
  getCustomerById,
  createCustomer,
  updateCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCustomers);
router.get('/dues', protect, getCustomerDues);
router.get('/:id', protect, getCustomerById);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);

module.exports = router;
