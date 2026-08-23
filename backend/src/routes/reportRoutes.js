const express = require('express');
const router = express.Router();
const { getReportsData } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getReportsData);

module.exports = router;
