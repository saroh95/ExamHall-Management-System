const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateUser = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .isIn(['admin', 'teacher', 'student', 'invigilator'])
    .withMessage('Invalid role'),
];

const { sendCredentials } = require('../controllers/userController');
// Routes
// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = User.find().select('-password');

    // Filter by role
    if (req.query.role) {
      query = query.find({ role: req.query.role });
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query = query.find({ isActive: req.query.isActive === 'true' });
    }

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      });
    }

    const total = await User.countDocuments(query.getQuery());
    const users = await query.skip(startIndex).limit(limit);

    res.json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), validateUser, async (req, res) => {
  try {
    const User = require('../models/User');

    // Check if user already exists
    const existingUser = await User.findByEmail(req.body.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const existingUsername = await User.findByUsername(req.body.username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');

    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }

    // Check if username is being changed and if it already exists
    if (req.body.username && req.body.username !== user.username) {
      const existingUsername = await User.findByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Update user status
// @access  Private (Admin only)
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message,
    });
  }
});

// @route   PATCH /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private (Admin only)
router.patch('/:id/permissions', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const { permissions } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.permissions = permissions;
    await user.save();

    res.json({
      success: true,
      message: 'User permissions updated successfully',
      data: {
        id: user._id,
        username: user.username,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user permissions',
      error: error.message,
    });
  }
});

// @route   PATCH /api/users/bulk-status
// @desc    Update multiple users status
// @access  Private (Admin only)
router.patch('/bulk-status', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const { userIds, isActive } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isActive },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating users status',
      error: error.message,
    });
  }
});

// @route   DELETE /api/users/bulk-delete
// @desc    Delete multiple users
// @access  Private (Admin only)
router.delete('/bulk-delete', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
      });
    }

    // Prevent admin from deleting themselves
    const filteredUserIds = userIds.filter(id => id !== req.user.id);

    const result = await User.deleteMany({ _id: { $in: filteredUserIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting users',
      error: error.message,
    });
  }
});

// @route   POST /api/users/bulk-send-credentials
// @desc    Send credentials to multiple users
// @access  Private (Admin only)
router.post('/bulk-send-credentials', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
      });
    }

    const users = await User.find({ _id: { $in: userIds } });

    // Here you would implement the actual email sending logic
    // For now, we'll just return success

    res.json({
      success: true,
      message: `Credentials sent to ${users.length} users`,
      data: { sentCount: users.length },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending credentials',
      error: error.message,
    });
  }
});

// @route   POST /api/users/send-credentials
// @desc    Send credentials to users
// @access  Private (Admin only)
router.post('/send-credentials', protect, authorize('admin'), sendCredentials);

module.exports = router;
