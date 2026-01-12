const express = require('express');
const router = express.Router();
const {
  getStudents,
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkDeleteStudents,
  bulkUploadStudents,
  getStudentStats,
  getCachedStudentStats,
  getStudentsByDepartmentAndSemester,
  getStudentsByBatchYear,
  updateStudentStatus,
  exportStudents,
  getStudentByScholarId,
  sendCredentials,
  changeStudentPassword,
  uploadStudentPhoto,
  deleteStudentPhoto,
} = require('../controllers/studentController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { uploadBulkFile, uploadProfilePicture, handleUploadError } = require('../middleware/upload');
const { body } = require('express-validator');
const {
  VALIDATION_PATTERNS,
  SEMESTER_OPTIONS,
  SECTION_OPTIONS,
  FIELD_LIMITS,
} = require('../constants/student');

// Validation middleware using shared constants
const validateStudent = [
  body('scholarId')
    .optional()
    .matches(VALIDATION_PATTERNS.SCHOLAR_ID)
    .withMessage(`Scholar ID must be ${FIELD_LIMITS.SCHOLAR_ID.min}-${FIELD_LIMITS.SCHOLAR_ID.max} uppercase alphanumeric characters`),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: FIELD_LIMITS.FULL_NAME.max })
    .withMessage(`Full name cannot exceed ${FIELD_LIMITS.FULL_NAME.max} characters`),
  body('personalEmail')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('contactNumber')
    .matches(VALIDATION_PATTERNS.CONTACT_NUMBER)
    .withMessage(`Contact number must be ${FIELD_LIMITS.CONTACT_NUMBER.min}-${FIELD_LIMITS.CONTACT_NUMBER.max} digits`),
  body('semester')
    .isIn(SEMESTER_OPTIONS)
    .withMessage('Invalid semester'),
  body('section')
    .isIn(SECTION_OPTIONS)
    .withMessage('Invalid section'),
  body('batchYear')
    .matches(VALIDATION_PATTERNS.BATCH_YEAR)
    .withMessage('Batch year must be in format: 20xx'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: FIELD_LIMITS.ADDRESS.max })
    .withMessage(`Address cannot exceed ${FIELD_LIMITS.ADDRESS.max} characters`),
];

const validateStudentUpdate = [
  body('scholarId')
    .optional()
    .matches(VALIDATION_PATTERNS.SCHOLAR_ID)
    .withMessage(`Scholar ID must be ${FIELD_LIMITS.SCHOLAR_ID.min}-${FIELD_LIMITS.SCHOLAR_ID.max} uppercase alphanumeric characters`),
  body('fullName')
    .optional()
    .isLength({ max: FIELD_LIMITS.FULL_NAME.max })
    .withMessage(`Full name cannot exceed ${FIELD_LIMITS.FULL_NAME.max} characters`),
  body('personalEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('contactNumber')
    .optional()
    .matches(VALIDATION_PATTERNS.CONTACT_NUMBER)
    .withMessage(`Contact number must be ${FIELD_LIMITS.CONTACT_NUMBER.min}-${FIELD_LIMITS.CONTACT_NUMBER.max} digits`),
  body('semester')
    .optional()
    .isIn(SEMESTER_OPTIONS)
    .withMessage('Invalid semester'),
  body('section')
    .optional()
    .isIn(SECTION_OPTIONS)
    .withMessage('Invalid section'),
  body('batchYear')
    .optional()
    .matches(VALIDATION_PATTERNS.BATCH_YEAR)
    .withMessage('Batch year must be in format: 20xx'),
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department is required'),
  body('address')
    .optional()
    .isLength({ max: FIELD_LIMITS.ADDRESS.max })
    .withMessage(`Address cannot exceed ${FIELD_LIMITS.ADDRESS.max} characters`),
];

// Routes
// @route   GET /api/students
// @desc    Get all students
// @access  Private
router.get('/', protect, checkPermission('read_student'), getStudents);

// @route   GET /api/students/all
// @desc    Get all students without pagination
// @access  Private
router.get('/all', protect, checkPermission('read_student'), getAllStudents);

// @route   GET /api/students/stats
// @desc    Get student statistics
// @access  Private
router.get('/stats', protect, checkPermission('read_student'), getStudentStats);
router.get('/stats/cached', protect, checkPermission('read_student'), getCachedStudentStats);

// @route   GET /api/students/export
// @desc    Export students to CSV
// @access  Private
router.get('/export', protect, checkPermission('read_student'), exportStudents);

// @route   GET /api/students/scholar/:scholarId
// @desc    Get student by scholar ID
// @access  Private
router.get('/scholar/:scholarId', protect, checkPermission('read_student'), getStudentByScholarId);

// @route   GET /api/students/department/:departmentId/semester/:semester
// @desc    Get students by department and semester
// @access  Private
router.get('/department/:departmentId/semester/:semester', protect, checkPermission('read_student'), getStudentsByDepartmentAndSemester);

// @route   GET /api/students/for-exam-scheduler
// @desc    Get students for exam scheduler (simplified auth)
// @access  Public (for exam scheduling only)
router.get('/for-exam-scheduler', async (req, res) => {
  try {
    console.log('📚 Exam Scheduler API - Fetching students...');

    const Student = require('../models/Student');
    const { semester, department, isActive = true, limit = 1000 } = req.query;

    const query = { isActive: isActive === 'true' };

    if (department) {
      query.department = department;
    }

    if (semester) {
      if (semester.includes(',')) {
        // Handle comma-separated semester values
        const semesters = semester.split(',').map(s => s.trim());
        query.semester = { $in: semesters };
      } else {
        query.semester = semester;
      }
    }

    console.log('🔍 Query for exam scheduler:', query);

    const students = await Student.find(query)
      .populate('department', 'name code')
      .select('scholarId fullName personalEmail instituteEmail semester section batchYear department')
      .limit(parseInt(limit))
      .sort({ scholarId: 1 });

    console.log(`✅ Found ${students.length} students for exam scheduler`);

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('❌ Error in exam scheduler student API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students for exam scheduler',
      error: error.message,
    });
  }
});

// @route   GET /api/students/department/:departmentId
// @desc    Get students by department and semester
// @access  Private
router.get('/department/:departmentId', async (req, res) => {
  try {
    console.log('🎯 Student API called with:', { params: req.params, query: req.query });

    const Student = require('../models/Student');
    const mongoose = require('mongoose');
    const { semester, section, batchYear } = req.query;
    const { departmentId } = req.params;

    const query = {
      isActive: true,
    };

    // Handle department ID - try to convert to ObjectId if it's a valid ObjectId string
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      query.department = new mongoose.Types.ObjectId(departmentId);
    } else if (departmentId) {
      // If not a valid ObjectId, try to find by department code
      const Department = require('../models/Department');
      const dept = await Department.findOne({ code: departmentId });
      if (dept) {
        query.department = dept._id;
      } else {
        query.department = departmentId; // Fallback to string comparison
      }
    }

    if (semester) {
      if (semester.includes(',')) {
        // Handle comma-separated semester values
        const semesters = semester.split(',').map(s => s.trim());
        query.semester = { $in: semesters };
      } else {
        query.semester = semester;
      }
    }

    if (section) {
      query.section = section;
    }

    if (batchYear) {
      query.batchYear = batchYear;
    }

    console.log('🔍 Query:', query);

    const students = await Student.find(query)
      .populate('department', 'name code')
      .select('scholarId fullName personalEmail instituteEmail semester section batchYear')
      .sort({ scholarId: 1 });

    console.log(`✅ Found ${students.length} students`);
    console.log('📋 Sample students:', students.slice(0, 3).map(s => ({
      _id: s._id,
      scholarId: s.scholarId,
      fullName: s.fullName,
      department: s.department,
      semester: s.semester,
    })));

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('❌ Error in student API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students by department',
      error: error.message,
    });
  }
});

// @route   GET /api/students/batch/:batchYear
// @desc    Get students by batch year
// @access  Private
router.get('/batch/:batchYear', protect, checkPermission('read_student'), getStudentsByBatchYear);

// @route   POST /api/students
// @desc    Create new student
// @access  Private
router.post('/', protect, checkPermission('create_student'), validateStudent, createStudent);

// @route   POST /api/students/bulk-upload
// @desc    Bulk upload students
// @access  Private
router.post('/bulk-upload',
  protect,
  checkPermission('bulk_upload'),
  uploadBulkFile,
  handleUploadError,
  bulkUploadStudents,
);


// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get('/:id', protect, checkPermission('read_student'), getStudent);

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private
router.put('/:id', protect, checkPermission('update_student'), validateStudentUpdate, updateStudent);

// @route   PATCH /api/students/:id/status
// @desc    Update student status
// @access  Private
router.patch('/:id/status', protect, checkPermission('update_student'), updateStudentStatus);

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private
// Place bulk-delete BEFORE param routes to avoid matching ":id"
// @route   DELETE /api/students/bulk-delete
// @desc    Bulk delete students
// @access  Private
router.delete('/bulk-delete', protect, checkPermission('delete_student'), bulkDeleteStudents);

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private
router.delete('/:id', protect, checkPermission('delete_student'), deleteStudent);

// @route   POST /api/students/send-credentials
// @desc    Send credentials to students
// @access  Private
router.post('/send-credentials', protect, checkPermission('update_student'), sendCredentials);

// @route   POST /api/students/:id/photo
// @desc    Upload student photo
// @access  Private
router.post('/:id/photo',
  protect,
  checkPermission('update_student'),
  uploadProfilePicture,
  handleUploadError,
  uploadStudentPhoto,
);

// @route   DELETE /api/students/:id/photo
// @desc    Delete student photo
// @access  Private
router.delete('/:id/photo', protect, checkPermission('update_student'), deleteStudentPhoto);

// @route   PUT /api/students/change-password
// @desc    Change student password
// @access  Private (Student only)
router.put('/change-password', protect, changeStudentPassword);

module.exports = router;
