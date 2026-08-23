const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetDatabase } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.post('/reset-database', protect, resetDatabase);

module.exports = router;
