const Settings = require('../models/Settings');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });

    // If no settings exist, create default settings for the user
    if (!settings) {
      settings = new Settings({ userId: req.user.id });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message,
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { systemSettings, emailSettings, notificationSettings, securitySettings, backupSettings } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      // Create new settings if they don't exist
      settings = new Settings({ userId: req.user.id });
    }

    // Update only provided settings
    if (systemSettings) settings.systemSettings = { ...settings.systemSettings, ...systemSettings };
    if (emailSettings) settings.emailSettings = { ...settings.emailSettings, ...emailSettings };
    if (notificationSettings) settings.notificationSettings = { ...settings.notificationSettings, ...notificationSettings };
    if (securitySettings) settings.securitySettings = { ...settings.securitySettings, ...securitySettings };
    if (backupSettings) settings.backupSettings = { ...settings.backupSettings, ...backupSettings };

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message,
    });
  }
};

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private
const resetSettings = async (req, res) => {
  try {
    await Settings.findOneAndDelete({ userId: req.user.id });

    // Create new default settings
    const settings = new Settings({ userId: req.user.id });
    await settings.save();

    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting settings',
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};
