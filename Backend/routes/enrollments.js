const express = require('express');
const router = express.Router();
const {
  autoEnrollStudent,
  autoEnrollAllStudents,
  autoEnrollElectives,
  getStudentEnrollments,
  getSubjectEnrollments,
  dropEnrollment,
  getEnrollmentStats,
} = require('../controllers/enrollmentController');
const { protect, checkPermission } = require('../middleware/auth');

// Auto-enrollment routes
router.post('/auto-enroll/:studentId', protect, checkPermission('create_student'), autoEnrollStudent);
router.post('/auto-enroll-all', protect, checkPermission('create_student'), autoEnrollAllStudents);
router.post('/auto-enroll-electives', protect, checkPermission('create_student'), autoEnrollElectives);

// Query routes
router.get('/student/:studentId', protect, getStudentEnrollments);
router.get('/subject/:subjectId', protect, getSubjectEnrollments);
router.get('/stats/:subjectId', protect, getEnrollmentStats);

// Unenroll routes (must be before generic /:id route)
router.delete('/clear-all', protect, checkPermission('create_student'), async (req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const result = await Enrollment.deleteMany({});

    res.json({
      success: true,
      message: `Cleared all enrollments (${result.deletedCount} total)`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear enrollments',
      error: error.message,
    });
  }
});

router.delete('/subject/:subjectId/clear', protect, checkPermission('create_student'), async (req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const result = await Enrollment.deleteMany({ subject: req.params.subjectId });

    res.json({
      success: true,
      message: `Unenrolled ${result.deletedCount} students from this subject`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unenroll students',
      error: error.message,
    });
  }
});

// Modify enrollment (generic route - must be last)
router.delete('/:id', protect, dropEnrollment);

module.exports = router;

