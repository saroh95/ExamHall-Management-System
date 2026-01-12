const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  bulkDeleteTeachers,
  bulkUploadTeachers,
  getTeacherStats,
  getCachedTeacherStats,
  getTeachersByDepartment,
  getAvailableInvigilators,
  getAllTeachersForInvigilation,
  updateTeacherStatus,
  updateInvigilationPreferences,
  exportTeachers,
  getTeacherByEmployeeId,
  assignSubjects,
  sendCredentials,
  changeTeacherPassword,
} = require('../controllers/teacherController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { uploadBulkFile, handleUploadError } = require('../middleware/upload');
const { body } = require('express-validator');

// Validation middleware
const validateTeacher = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('personalEmail')
    .isEmail()
    .withMessage('Please provide a valid personal email'),
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('department')
    .isMongoId()
    .withMessage('Valid department ID is required'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('designation')
    .isIn(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Teaching Assistant'])
    .withMessage('Invalid designation'),
  body('qualification')
    .notEmpty()
    .withMessage('Qualification is required')
    .isLength({ max: 100 })
    .withMessage('Qualification cannot exceed 100 characters'),
  body('joiningDate')
    .isISO8601()
    .withMessage('Valid joining date is required'),
];

const validateTeacherUpdate = [
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('personalEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid personal email'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Valid department ID is required'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('designation')
    .optional()
    .isIn(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Teaching Assistant'])
    .withMessage('Invalid designation'),
  body('qualification')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Qualification cannot exceed 100 characters'),
  body('joiningDate')
    .optional()
    .isISO8601()
    .withMessage('Valid joining date is required'),
];

// Routes
// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', protect, checkPermission('read_teacher'), getTeachers);

// @route   GET /api/teachers/stats
// @desc    Get teacher statistics
// @access  Private
router.get('/stats', protect, checkPermission('read_teacher'), getTeacherStats);
router.get('/stats/cached', protect, checkPermission('read_teacher'), getCachedTeacherStats);

// @route   GET /api/teachers/export
// @desc    Export teachers to CSV
// @access  Private
router.get('/export', protect, checkPermission('read_teacher'), exportTeachers);

// @route   GET /api/teachers/invigilators
// @desc    Get available invigilators
// @access  Private
router.get('/invigilators', getAvailableInvigilators);
router.get('/all-for-invigilation', getAllTeachersForInvigilation);

// @route   GET /api/teachers/available
// @desc    Get available teachers for invigilation
// @access  Private
router.get('/available', protect, checkPermission('read_teacher'), async (req, res) => {
  try {
    const Teacher = require('../models/Teacher');
    const { department, role, isAvailable } = req.query;

    const query = { isActive: true };

    if (department) {
      query.department = department;
    }

    if (role) {
      query.role = role;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    const teachers = await Teacher.find(query)
      .populate('department', 'name code')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available teachers',
      error: error.message,
    });
  }
});

// @route   GET /api/teachers/employee/:employeeId
// @desc    Get teacher by employee ID
// @access  Private
router.get('/employee/:employeeId', protect, checkPermission('read_teacher'), getTeacherByEmployeeId);

// @route   GET /api/teachers/department/:departmentId
// @desc    Get teachers by department
// @access  Private
router.get('/department/:departmentId', protect, checkPermission('read_teacher'), getTeachersByDepartment);

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private
router.post('/', protect, checkPermission('create_teacher'), validateTeacher, createTeacher);

// @route   POST /api/teachers/bulk-upload
// @desc    Bulk upload teachers
// @access  Private
router.post('/bulk-upload',
  protect,
  checkPermission('bulk_upload'),
  uploadBulkFile,
  handleUploadError,
  bulkUploadTeachers,
);

// @route   GET /api/teachers/:id
// @desc    Get single teacher
// @access  Private
router.get('/:id', protect, checkPermission('read_teacher'), getTeacher);

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private
router.put('/:id', protect, checkPermission('update_teacher'), validateTeacherUpdate, updateTeacher);

// @route   PATCH /api/teachers/:id/status
// @desc    Update teacher status
// @access  Private
router.patch('/:id/status', protect, checkPermission('update_teacher'), updateTeacherStatus);

// @route   PATCH /api/teachers/:id/invigilation-preferences
// @desc    Update invigilation preferences
// @access  Private
router.patch('/:id/invigilation-preferences', protect, checkPermission('update_teacher'), updateInvigilationPreferences);

// @route   PATCH /api/teachers/:id/assign-subjects
// @desc    Assign subjects to teacher
// @access  Private
router.patch('/:id/assign-subjects', protect, checkPermission('update_teacher'), assignSubjects);

// Place bulk-delete BEFORE param routes to avoid matching ":id"
// @route   DELETE /api/teachers/bulk-delete
// @desc    Bulk delete teachers
// @access  Private
router.delete('/bulk-delete', protect, checkPermission('delete_teacher'), bulkDeleteTeachers);

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private
router.delete('/:id', protect, checkPermission('delete_teacher'), deleteTeacher);

// @route   POST /api/teachers/send-credentials
// @desc    Send credentials to teachers
// @access  Private
router.post('/send-credentials', protect, checkPermission('update_teacher'), sendCredentials);

// @route   PUT /api/teachers/change-password
// @desc    Change teacher password
// @access  Private (Teacher only)
router.put('/change-password', protect, changeTeacherPassword);

module.exports = router;
