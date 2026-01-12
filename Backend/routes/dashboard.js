const express = require('express');
const router = express.Router();

// Import dashboard controller
const {
  getDashboardStats,
  getDepartmentStats,
  getExamStats,
  getStudentStats,
  getTeacherStats,
  getClassroomStats,
  getRecentActivity,
} = require('../controllers/dashboardController');

// Import middleware
const { protect: authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get overall dashboard statistics
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/stats',
  authenticate,
  authorize(['admin', 'teacher', 'student']),
  getDashboardStats,
);

/**
 * @route   GET /api/dashboard/departments
 * @desc    Get department-wise statistics
 * @access  Private (Admin, Teacher)
 */
router.get('/departments',
  authenticate,
  authorize(['admin', 'teacher']),
  getDepartmentStats,
);

/**
 * @route   GET /api/dashboard/exams
 * @desc    Get exam statistics
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/exams',
  authenticate,
  authorize(['admin', 'teacher', 'student']),
  getExamStats,
);

/**
 * @route   GET /api/dashboard/students
 * @desc    Get student statistics
 * @access  Private (Admin, Teacher)
 */
router.get('/students',
  authenticate,
  authorize(['admin', 'teacher']),
  getStudentStats,
);

/**
 * @route   GET /api/dashboard/teachers
 * @desc    Get teacher statistics
 * @access  Private (Admin)
 */
router.get('/teachers',
  authenticate,
  authorize(['admin']),
  getTeacherStats,
);

/**
 * @route   GET /api/dashboard/classrooms
 * @desc    Get classroom utilization statistics
 * @access  Private (Admin, Teacher)
 */
router.get('/classrooms',
  authenticate,
  authorize(['admin', 'teacher']),
  getClassroomStats,
);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity feed
 * @access  Private (Admin, Teacher, Student)
 */
router.get('/activity',
  authenticate,
  authorize(['admin', 'teacher', 'student']),
  getRecentActivity,
);

module.exports = router;
