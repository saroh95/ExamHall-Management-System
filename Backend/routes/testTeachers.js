/**
 * Test route to check teacher data
 */

const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// @route   GET /api/test/teachers
// @desc    Test teacher data
// @access  Public (for testing)
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find({ isActive: true }).limit(5);

    console.log('📋 Teachers found:', teachers.length);
    console.log('Sample teacher:', teachers[0]);

    res.json({
      success: true,
      count: teachers.length,
      teachers: teachers.map(t => ({
        _id: t._id,
        fullName: t.fullName,
        employeeId: t.employeeId,
        personalEmail: t.personalEmail,
        department: t.department,
        isActive: t.isActive,
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers',
      error: error.message,
    });
  }
});

// @route   GET /api/test/teachers/assignment-test
// @desc    Test teacher assignment for exams
// @access  Public (for testing)
router.get('/teachers/assignment-test', async (req, res) => {
  try {
    const BalancedDutyAssignmentService = require('../services/balancedDutyAssignmentService');
    const balancedDutyService = BalancedDutyAssignmentService.getInstance();

    // Test with sample parameters
    const testParams = {
      examDate: new Date(),
      timeSlot: { start: '10:00', end: '13:00' },
      classroomCount: 2,
      teachersPerClassroom: 2,
      existingAssignments: new Set(),
    };

    console.log('🧪 Testing teacher assignment...');
    console.log('Current global index:', balancedDutyService.getGlobalIndex());

    const assignments = await balancedDutyService.assignBalancedInvigilators(testParams);

    console.log('After assignment, global index:', balancedDutyService.getGlobalIndex());

    res.json({
      success: true,
      message: 'Teacher assignment test completed',
      assignments,
      assignmentCount: assignments.length,
      globalIndex: balancedDutyService.getGlobalIndex(),
    });
  } catch (error) {
    console.error('❌ Error testing teacher assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing teacher assignment',
      error: error.message,
    });
  }
});

// @route   GET /api/test/teachers/debug-assignment
// @desc    Debug teacher assignment state
// @access  Public (for testing)
router.get('/teachers/debug-assignment', async (req, res) => {
  try {
    const BalancedDutyAssignmentService = require('../services/balancedDutyAssignmentService');
    const balancedDutyService = BalancedDutyAssignmentService.getInstance();

    // Get teacher count
    const Teacher = require('../models/Teacher');
    const teacherCount = await Teacher.countDocuments({ isActive: true });

    res.json({
      success: true,
      message: 'Assignment debug info',
      globalIndex: balancedDutyService.getGlobalIndex(),
      totalTeachers: teacherCount,
      isSingleton: BalancedDutyAssignmentService.instance !== undefined,
    });
  } catch (error) {
    console.error('❌ Error getting debug info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting debug info',
      error: error.message,
    });
  }
});

module.exports = router;
