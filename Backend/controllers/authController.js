const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { asyncHandler } = require('../middleware/error');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign(
    { id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' },
  );
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, phone, role } = req.body;

  // Check if user already exists
  const userExists = await User.findByEmail(email);
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  const usernameExists = await User.findByUsername(username);
  if (usernameExists) {
    return res.status(400).json({
      success: false,
      message: 'Username already taken',
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    role: role || 'student',
  });

  if (user) {
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Email Verification - Exam Hall Management System',
        html: `
          <h2>Welcome to ${process.env.INSTITUTE_NAME || 'Exam Hall Management System'}!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (error) {
      console.error('Email sending error:', error);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid user data',
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user by email or username; enforce institute email domain for student/teacher roles
  let user = await User.findByEmail(email).select('+password');
  if (!user) {
    user = await User.findOne({ username: email }).select('+password');
  }
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  // Optional institute email domain enforcement for specific roles
  try {
    const allowedDomains = (process.env.ALLOWED_INSTITUTE_DOMAINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (allowedDomains.length > 0 && (user.role === 'student' || user.role === 'teacher')) {
      const userEmail = String(user.email || '').toLowerCase();
      const domain = userEmail.split('@')[1];
      if (!domain || !allowedDomains.includes(domain)) {
        return res.status(401).json({
          success: false,
          message: 'Please use your institute email to login',
        });
      }
    }
  } catch (_) {}

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      permissions: user.permissions,
    },
    accessToken,
  });
});

// @desc    Login student
// @route   POST /api/auth/student-login
// @access  Public
const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for student
  const student = await Student.findByEmail(email).select('+password');
  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if student is active
  if (!student.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.',
    });
  }

  // Check password
  const isMatch = await student.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  student.lastLogin = new Date();
  await student.save();

  // Generate token
  const token = generateToken(student._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: student._id,
      scholarId: student.scholarId,
      fullName: student.fullName,
      email: student.email,
      semester: student.semester,
      section: student.section,
      department: student.department,
      isEmailVerified: student.isEmailVerified,
    },
    token,
  });
});

// @desc    Login teacher
// @route   POST /api/auth/teacher-login
// @access  Public
const teacherLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Normalize email
  const emailLc = String(email || '').toLowerCase().trim();

  // Check for teacher by institute or personal email
  let teacher = await Teacher.findOne({ instituteEmail: emailLc }).select('+password');
  if (!teacher) {
    teacher = await Teacher.findOne({ personalEmail: emailLc }).select('+password');
  }
  if (!teacher) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if teacher is active
  if (!teacher.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.',
    });
  }

  // Check password
  const isMatch = await teacher.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  teacher.lastLogin = new Date();
  await teacher.save();

  // Generate token
  const token = generateToken(teacher._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: teacher._id,
      employeeId: teacher.employeeId,
      fullName: teacher.fullName,
      email: teacher.instituteEmail || teacher.personalEmail,
      department: teacher.department,
      designation: teacher.designation,
      isEmailVerified: teacher.isEmailVerified,
    },
    token,
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // The user is already loaded by the protect middleware
  const user = req.user;

  // Format the response based on user type
  let userData = {
    id: user._id,
    role: user.userType || user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
  };

  // Add type-specific fields
  if (user.userType === 'student' || user.role === 'student') {
    userData = {
      ...userData,
      scholarId: user.scholarId,
      fullName: user.fullName,
      email: user.email,
      semester: user.semester,
      section: user.section,
      department: user.department,
      permissions: user.permissions || [],
    };
  } else if (user.userType === 'teacher' || user.role === 'teacher') {
    userData = {
      ...userData,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.instituteEmail || user.personalEmail,
      department: user.department,
      designation: user.designation,
      permissions: user.permissions || [],
    };
  } else {
    // Regular user/admin
    userData = {
      ...userData,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions: user.permissions || [],
      // Ensure role is properly set for admin users
      role: user.role || 'admin',
    };
  }

  res.json({
    success: true,
    data: userData,
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Send reset email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - Exam Hall Management System',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}">
          Reset Password
        </a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    console.error('Email sending error:', error);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent',
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Password reset successful',
    token,
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified',
    });
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Email Verification - Exam Hall Management System',
      html: `
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Email sending error:', error);

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent',
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not provided',
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    // Get user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Set new refresh token in httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
  register,
  login,
  studentLogin,
  teacherLogin,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  refreshToken,
  logout,
};
