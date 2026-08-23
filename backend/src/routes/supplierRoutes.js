const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierDues,
  getSupplierById,
  createSupplier,
  updateSupplier
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSuppliers);
router.get('/dues', protect, getSupplierDues);
router.get('/:id', protect, getSupplierById);
router.post('/', protect, createSupplier);
router.put('/:id', protect, updateSupplier);

module.exports = router;
