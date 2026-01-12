const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, resetSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', protect, getSettings);

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put('/', protect, updateSettings);

// @route   POST /api/settings/reset
// @desc    Reset settings to default
// @access  Private
router.post('/reset', protect, resetSettings);

module.exports = router;
