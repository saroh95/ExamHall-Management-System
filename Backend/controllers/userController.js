const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const emailService = require('../services/emailService');

// Send credentials to users
const sendCredentials = asyncHandler(async (req, res) => {
  const { credentials } = req.body;
  if (!credentials || !Array.isArray(credentials)) {
    return res.status(400).json({
      success: false,
      message: 'Credentials array is required',
    });
  }
  const results = [];
  const errors = [];
  for (const credential of credentials) {
    try {
      const { email, password, name } = credential;
      if (!email || !password) {
        errors.push({ email, error: 'Email and password are required' });
        continue;
      }
      const emailLc = (email || '').toLowerCase();
      const user = await User.findOne({ email: emailLc });
      if (!user) {
        errors.push({ email, error: 'User not found' });
        continue;
      }
      // Set password (will be hashed by pre-save hook)
      user.password = password;
      user.credentialsSent = true;
      user.credentialsSentAt = new Date();
      await user.save();
      try {
        await emailService.sendUserCredentials(user, user.email, password);
      } catch (mailErr) {
        const detail = mailErr?.message || String(mailErr);
        console.error('Email send failed:', detail);
        errors.push({ email, error: `Email sending failed: ${detail}` });
        continue;
      }
      results.push({ email, name, success: true });
    } catch (error) {
      errors.push({ email: credential.email, error: error.message });
    }
  }
  res.json({
    success: true,
    message: `Credentials processed. ${results.length} successful, ${errors.length} failed.`,
    data: {
      successful: results,
      failed: errors,
    },
  });
});

module.exports = { sendCredentials };
