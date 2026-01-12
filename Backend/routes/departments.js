const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateDepartment = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ max: 10 })
    .withMessage('Department code cannot exceed 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Department code must contain only uppercase letters and numbers'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

// Routes
// @route   GET /api/departments
// @desc    Get all departments
// @access  Public (temporarily for testing)
router.get('/', async (req, res) => {
  try {
    const Department = require('../models/Department');
    const departments = await Department.getWithStatistics();

    res.json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message,
    });
  }
});

// @route   GET /api/departments/:id
// @desc    Get single department
// @access  Private
router.get('/:id', protect, checkPermission('read_department'), async (req, res) => {
  try {
    const Department = require('../models/Department');
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message,
    });
  }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private
router.post('/', protect, checkPermission('create_department'), validateDepartment, async (req, res) => {
  try {
    const Department = require('../models/Department');

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      $or: [
        { name: req.body.name },
        { code: req.body.code.toUpperCase() },
      ],
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists',
      });
    }

    const department = await Department.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message,
    });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private
router.put('/:id', protect, checkPermission('update_department'), validateDepartment, async (req, res) => {
  try {
    const Department = require('../models/Department');

    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if name or code is being changed and if it already exists
    if ((req.body.name && req.body.name !== department.name) ||
        (req.body.code && req.body.code.toUpperCase() !== department.code)) {
      const existingDepartment = await Department.findOne({
        $or: [
          { name: req.body.name },
          { code: req.body.code.toUpperCase() },
        ],
        _id: { $ne: req.params.id },
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name or code already exists',
        });
      }
    }

    department = await Department.findByIdAndUpdate(req.params.id, {
      ...req.body,
      code: req.body.code.toUpperCase(),
    }, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message,
    });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private
router.delete('/:id', protect, checkPermission('delete_department'), async (req, res) => {
  try {
    const Department = require('../models/Department');
    const Student = require('../models/Student');
    const Teacher = require('../models/Teacher');

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if department has students or teachers
    const studentCount = await Student.countDocuments({ department: req.params.id });
    const teacherCount = await Teacher.countDocuments({ department: req.params.id });

    if (studentCount > 0 || teacherCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${studentCount} students and ${teacherCount} teachers.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message,
    });
  }
});

// @route   GET /api/departments/code/:code
// @desc    Get department by code
// @access  Private
router.get('/code/:code', protect, checkPermission('read_department'), async (req, res) => {
  try {
    const Department = require('../models/Department');
    const department = await Department.findByCode(req.params.code);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message,
    });
  }
});

module.exports = router;
