const express = require('express');
const router = express.Router();
const {
  getExamAttendance,
  markAttendance,
  resetAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/attendance/:examId
// @desc    Get attendance for a specific exam
// @access  Private
router.get('/:examId', protect, getExamAttendance);

// @route   POST /api/attendance/:examId/mark
// @desc    Mark attendance for students
// @access  Private (Invigilator, Exam Controller, Admin)
router.post('/:examId/mark', protect, markAttendance);

// @route   POST /api/attendance/:examId/reset
// @desc    Reset attendance for an exam
// @access  Private (Admin, Exam Controller only)
router.post('/:examId/reset', protect, authorize('admin', 'exam_controller'), resetAttendance);

// @route   GET /api/attendance/summary
// @desc    Get attendance summary
// @access  Private
router.get('/summary', protect, getAttendanceSummary);

module.exports = router;
