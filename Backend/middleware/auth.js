const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Protect routes - require authentication (unified for all user types)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user in User model first
      let user = await User.findById(decoded.id).select('-password');
      let userType = null;

      if (user) {
        // For User model, use the actual role (admin, user, etc.)
        userType = user.role;
      }

      // If not found in User model, try Student model
      if (!user) {
        user = await Student.findById(decoded.id).select('-password');
        userType = 'student';
      }

      // If not found in Student model, try Teacher model
      if (!user) {
        user = await Teacher.findById(decoded.id).select('-password');
        userType = 'teacher';
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
        });
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password! Please log in again',
        });
      }

      // Add userType to the user object for role-based access
      user.userType = userType;
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token provided',
    });
  }
};

// Protect routes for students
const protectStudent = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const student = await Student.findById(decoded.id).select('-password');

      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Student not found',
        });
      }

      if (!student.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Student account is deactivated',
        });
      }

      if (student.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Student recently changed password! Please log in again',
        });
      }

      req.student = student;
      next();
    } catch (error) {
      console.error('Student token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token provided',
    });
  }
};

// Protect routes for teachers
const protectTeacher = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const teacher = await Teacher.findById(decoded.id).select('-password');

      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: 'Teacher not found',
        });
      }

      if (!teacher.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Teacher account is deactivated',
        });
      }

      if (teacher.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Teacher recently changed password! Please log in again',
        });
      }

      req.teacher = teacher;
      next();
    } catch (error) {
      console.error('Teacher token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token provided',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get the user's role (prioritize userType over role for consistency)
    const userRole = req.user.userType || req.user.role;

    console.log('🔍 Authorization Debug:', {
      userRole,
      userRoleType: typeof userRole,
      allowedRoles: roles,
      userObject: {
        id: req.user._id,
        email: req.user.email || req.user.instituteEmail || req.user.personalEmail,
        role: userRole,
        isActive: req.user.isActive,
      },
    });

    // Handle both array and individual role arguments
    const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route`,
      });
    }

    console.log('✅ Authorization successful for role:', userRole);
    next();
  };
};

// Check specific permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get the user's role (prioritize userType over role for consistency)
    const userRole = req.user.userType || req.user.role;

    console.log('🔍 Permission Check Debug:', {
      userRole,
      userType: req.user.userType,
      role: req.user.role,
      permissions: req.user.permissions,
      requiredPermission: permission,
      hasPermission: req.user.permissions?.includes(permission),
    });

    // Admin has all permissions
    if (userRole === 'admin') {
      console.log('✅ Admin access granted');
      return next();
    }

    // Check if user has the specific permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      console.log('❌ Permission denied:', permission);
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' is required to access this route`,
      });
    }

    console.log('✅ Permission granted:', permission);
    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Optional auth - invalid token:', error.message);
    }
  }

  next();
};

module.exports = {
  protect,
  protectStudent,
  protectTeacher,
  authorize,
  checkPermission,
  optionalAuth,
};
