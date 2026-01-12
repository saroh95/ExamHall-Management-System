const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  },
});

// Middleware for handling upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the limit (5MB)',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one file can be uploaded at a time',
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts',
      });
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({
        success: false,
        message: 'Too many fields',
      });
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({
        success: false,
        message: 'Field value too long',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field',
      });
    }
    if (err.code === 'MISSING_FIELD_NAME') {
      return res.status(400).json({
        success: false,
        message: 'Field name missing',
      });
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many fields',
      });
    }
  }
  next(err);
};

// Validation middleware
const validateSubject = [
  body('code')
    .notEmpty()
    .withMessage('Subject code is required')
    .isLength({ max: 20 })
    .withMessage('Subject code cannot exceed 20 characters'),
  body('name')
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ max: 200 })
    .withMessage('Subject name cannot exceed 200 characters'),
  body('departmentId')
    .optional()
    .isArray()
    .withMessage('Department IDs must be an array')
    .custom((value) => {
      if (value && (!Array.isArray(value) || value.length === 0)) {
        throw new Error('Department IDs must be a non-empty array');
      }
      return true;
    }),
  body('department')
    .optional()
    .isString()
    .withMessage('Department must be a string'),
  body('semesterId')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester ID must be between 1 and 8'),
  body('type')
    .isIn(['regular', 'core_elective', 'open_elective'])
    .withMessage('Invalid subject type'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),
];

// Routes
// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000; // Increased default limit to show all subjects
    const startIndex = (page - 1) * limit;

    let query = Subject.find().populate('departmentId', 'name code');

    // Filter by department
    if (req.query.department) {
      query = query.find({ departmentId: req.query.department });
    }

    // Filter by semester
    if (req.query.semester) {
      query = query.find({ semesterId: req.query.semester });
    }

    // Filter by type
    if (req.query.type) {
      query = query.find({ type: req.query.type });
    }

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.find({
        $or: [
          { code: searchRegex },
          { name: searchRegex },
        ],
      });
    }

    const total = await Subject.countDocuments(query.getQuery());
    const subjects = await query.skip(startIndex).limit(limit);

    console.log('📥 Fetched subjects:', subjects.length);
    console.log('🔍 First subject department data:', subjects[0]?.departmentId);
    console.log('🔍 Sample subject:', subjects[0]);

    res.json({
      success: true,
      count: subjects.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/stats
// @desc    Get subject statistics
// @access  Private
router.get('/stats', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const stats = await Subject.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subject statistics',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/available
// @desc    Get available subjects for exam scheduling
// @access  Public (temporarily for testing)
router.get('/available', async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const { department, semester, type } = req.query;

    const query = { isActive: true };

    if (department) {
      // Handle both department ID and department code
      if (mongoose.Types.ObjectId.isValid(department)) {
        query.departmentId = { $in: [department] };
      } else {
        // If it's a department code, we need to find the department first
        const Department = require('../models/Department');
        const dept = await Department.findOne({ code: department });
        if (dept) {
          query.departmentId = { $in: [dept._id] };
        }
      }
    }

    if (semester) {
      query.semesterId = parseInt(semester);
    }

    if (type) {
      query.type = type;
    }

    const subjects = await Subject.find(query)
      .populate('departmentId', 'name code')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available subjects',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/:id
// @desc    Get single subject
// @access  Private
router.get('/:id', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const subject = await Subject.findById(req.params.id).populate('departmentId', 'name code');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subject',
      error: error.message,
    });
  }
});

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private
router.post('/', protect, checkPermission('create_subject'), validateSubject, async (req, res) => {
  try {
    const Subject = require('../models/Subject');

    console.log('📝 Creating subject with data:', req.body);
    console.log('👤 User ID:', req.user.id);
    console.log('🔍 Department field:', req.body.department);
    console.log('🔍 Department type:', typeof req.body.department);
    console.log('🔍 All request body keys:', Object.keys(req.body));

    // Check if subject already exists
    const existingSubject = await Subject.findByCode(req.body.code);
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists',
      });
    }

    // Handle department field - convert department name to departmentId
    const subjectData = {
      ...req.body,
      createdBy: req.user.id,
    };

    // If department is provided as string, convert to departmentId
    if (req.body.department && !req.body.departmentId) {
      console.log('🔍 Converting department:', req.body.department);
      const Department = require('../models/Department');
      const department = await Department.findOne({ code: req.body.department });
      console.log('🔍 Found department:', department);
      if (department) {
        subjectData.departmentId = [department._id];
        delete subjectData.department; // Remove the string field
        console.log('✅ Department converted to departmentId:', subjectData.departmentId);
      } else {
        console.log('❌ Department not found for code:', req.body.department);
      }
    }

    console.log('📤 Final subject data:', subjectData);

    const subject = await Subject.create(subjectData);

    console.log('✅ Subject created successfully:', subject._id);

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error) {
    console.error('❌ Error creating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subject',
      error: error.message,
    });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private
router.put('/:id', protect, checkPermission('update_subject'), validateSubject, async (req, res) => {
  try {
    const Subject = require('../models/Subject');

    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Check if code is being changed and if it already exists
    if (req.body.code && req.body.code !== subject.code) {
      const existingSubject = await Subject.findByCode(req.body.code);
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this code already exists',
        });
      }
    }

    // Handle department field - convert department name to departmentId
    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
    };

    // If department is provided as string, convert to departmentId
    if (req.body.department && !req.body.departmentId) {
      const Department = require('../models/Department');
      const department = await Department.findOne({ code: req.body.department });
      if (department) {
        updateData.departmentId = [department._id];
        delete updateData.department; // Remove the string field
      }
    }

    subject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('departmentId', 'name code');

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subject',
      error: error.message,
    });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private
router.delete('/:id', protect, checkPermission('delete_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting subject',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/department/:departmentId/semester/:semesterId
// @desc    Get subjects by department and semester
// @access  Private
router.get('/department/:departmentId/semester/:semesterId', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const { departmentId, semesterId } = req.params;

    const subjects = await Subject.findByDepartmentAndSemester(departmentId, semesterId);

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/type/:type
// @desc    Get subjects by type
// @access  Private
router.get('/type/:type', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const subjects = await Subject.findByType(req.params.type);

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/semester/:semesterId
// @desc    Get subjects by semester
// @access  Private
router.get('/semester/:semesterId', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const subjects = await Subject.findBySemester(req.params.semesterId);

    res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
});

// @route   GET /api/subjects/code/:code
// @desc    Get subject by code
// @access  Private
router.get('/code/:code', protect, checkPermission('read_subject'), async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const subject = await Subject.findByCode(req.params.code);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subject',
      error: error.message,
    });
  }
});

// @route   POST /api/subjects/bulk-upload
// @desc    Bulk upload subjects
// @access  Private
router.post('/bulk-upload',
  protect,
  checkPermission('bulk_upload'),
  upload.single('file'),
  handleUploadError,
  async (req, res) => {
    const onDuplicate = String(req.query.onDuplicate || 'skip').toLowerCase(); // 'skip' | 'update' | 'error'
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file',
      });
    }

    const results = [];
    const errors = [];
    const skipped = [];
    const updated = [];

    // Read CSV file with header normalization
    const { normalizeSubjectHeader, trimRowValues, normalizeSubjectType } = require('../utils/csvNormalize');
    fs.createReadStream(req.file.path)
      .pipe(csv({ mapHeaders: ({ header }) => normalizeSubjectHeader(header) }))
      .on('data', (data) => {
        const cleaned = trimRowValues(data);

        // Normalize values
        if (cleaned.semesterId) cleaned.semesterId = parseInt(cleaned.semesterId, 10);
        if (cleaned.credits) cleaned.credits = parseInt(cleaned.credits, 10);
        if (cleaned.theoryHours) cleaned.theoryHours = parseInt(cleaned.theoryHours, 10);
        if (cleaned.practicalHours) cleaned.practicalHours = parseInt(cleaned.practicalHours, 10);
        if (cleaned.tutorialHours) cleaned.tutorialHours = parseInt(cleaned.tutorialHours, 10);
        if (cleaned.totalHours) cleaned.totalHours = parseInt(cleaned.totalHours, 10);
        if (cleaned.type) cleaned.type = normalizeSubjectType(cleaned.type);

        // Parse boolean fields
        if (cleaned.isCommonToAll) {
          const val = String(cleaned.isCommonToAll).toUpperCase();
          cleaned.isCommonToAll = (val === 'TRUE' || val === '1' || val === 'YES');
        } else {
          cleaned.isCommonToAll = false;
        }

        if (cleaned.isShared) {
          const val = String(cleaned.isShared).toUpperCase();
          cleaned.isShared = (val === 'TRUE' || val === '1' || val === 'YES');
        } else {
          cleaned.isShared = false;
        }

        // Keep sharedWith as string (e.g., "CSE,EE,ECE")
        if (cleaned.sharedWith) {
          cleaned.sharedWith = String(cleaned.sharedWith).trim();
        } else {
          cleaned.sharedWith = '';
        }

        // Validate required fields
        const requiredFields = ['code', 'name', 'semesterId', 'department', 'type', 'credits'];
        const missingFields = requiredFields.filter(field => !cleaned[field]);

        if (missingFields.length > 0) {
          errors.push({
            row: cleaned,
            error: `Missing required fields: ${missingFields.join(', ')}`,
          });
          return;
        }

        // Validate subject code format
        if (!/^[A-Z0-9]{2,10}$/.test(String(cleaned.code).toUpperCase())) {
          errors.push({
            row: cleaned,
            error: 'Subject code must be 2-10 uppercase alphanumeric characters',
          });
          return;
        }

        // Validate semester
        if (Number.isNaN(cleaned.semesterId) || cleaned.semesterId < 1 || cleaned.semesterId > 8) {
          errors.push({
            row: cleaned,
            error: 'Semester must be between 1 and 8',
          });
          return;
        }

        // Validate credits
        if (Number.isNaN(cleaned.credits) || cleaned.credits < 1 || cleaned.credits > 6) {
          errors.push({
            row: cleaned,
            error: 'Credits must be between 1 and 6',
          });
          return;
        }

        // Validate type
        const validTypes = ['regular', 'core_elective', 'open_elective'];
        if (!validTypes.includes(cleaned.type)) {
          errors.push({
            row: cleaned,
            error: 'Type must be one of: regular, core_elective, open_elective',
          });
          return;
        }

        results.push({
          code: String(cleaned.code).toUpperCase(),
          name: cleaned.name,
          semesterId: cleaned.semesterId,
          department: cleaned.department,
          type: cleaned.type,  // Keep for processing
          subjectType: cleaned.type,  // Map to database field
          credits: cleaned.credits,
          theoryHours: cleaned.theoryHours || 3,
          practicalHours: cleaned.practicalHours || 0,
          tutorialHours: cleaned.tutorialHours || 0,
          totalHours: cleaned.totalHours || 3,
          description: cleaned.description || '',
          isCommonToAll: cleaned.isCommonToAll,
          isShared: cleaned.isShared,
          sharedWith: cleaned.sharedWith,
          createdBy: req.user.id,
        });
      })
      .on('end', async () => {
        try {
          const Subject = require('../models/Subject');
          const Department = require('../models/Department');

          // Process subjects with department resolution
          const processedSubjects = [];
          for (const subject of results) {
            try {
              // Find department by code or name
              const department = await Department.findOne({
                $or: [
                  { code: subject.department },
                  { name: subject.department },
                ],
              });

              if (!department) {
                errors.push({
                  row: subject,
                  error: `Department not found: ${subject.department}`,
                });
                continue;
              }

              // Check if subject code already exists
              const existingSubject = await Subject.findByCode(subject.code);
              if (existingSubject) {
                if (onDuplicate === 'skip') {
                  skipped.push({ code: subject.code, reason: 'already exists' });
                  continue;
                }
                if (onDuplicate === 'update') {
                  const updateData = {
                    name: subject.name,
                    semesterId: subject.semesterId,
                    type: subject.type,
                    subjectType: subject.type,  // Map to database field
                    credits: subject.credits,
                    theoryHours: subject.theoryHours,
                    practicalHours: subject.practicalHours,
                    tutorialHours: subject.tutorialHours,
                    totalHours: subject.totalHours,
                    description: subject.description,
                    departmentId: [department._id],
                    isCommonToAll: subject.isCommonToAll,
                    isShared: subject.isShared,
                    sharedWith: subject.sharedWith,
                    updatedBy: req.user.id,
                  };
                  const updatedDoc = await Subject.findByIdAndUpdate(existingSubject._id, updateData, { new: true, runValidators: true });
                  updated.push(updatedDoc);
                  continue;
                }
                // default: error
                errors.push({ row: subject, error: `Subject with code ${subject.code} already exists` });
                continue;
              }

              const subjectData = {
                ...subject,
                departmentId: [department._id],
              };

              const newSubject = await Subject.create(subjectData);
              processedSubjects.push(newSubject);
            } catch (error) {
              errors.push({
                row: subject,
                error: error.message,
              });
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          // Auto-fix subjects with proper isCommon and sharedWith values for smart scheduling
          try {
            const { safeAutoFixSubjects } = require('../utils/subjectAutoFix');
            const fixResult = await safeAutoFixSubjects();

            if (fixResult.success) {
              console.log(`✅ Auto-fixed ${fixResult.fixedCount} subjects for conflict detection`);
            } else {
              console.log('⚠️ Auto-fix failed, but upload continues:', fixResult.error);
            }
          } catch (error) {
            console.log('⚠️ Auto-fix error (upload still successful):', error.message);
            // Continue anyway - don't break the upload
          }

          res.json({
            success: true,
            message: 'Bulk upload completed and subjects auto-fixed for scheduling',
            data: {
              totalProcessed: results.length,
              successful: processedSubjects.length,
              updated: updated.length,
              skipped: skipped.length,
              failed: errors.length,
              errors,
              details: { skipped, updated },
            },
          });
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          res.status(500).json({
            success: false,
            message: 'Error processing bulk upload',
            error: error.message,
          });
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
          success: false,
          message: 'Error reading CSV file',
          error: error.message,
        });
      });
  },
);

// @route   POST /api/subjects/fix-scheduling
// @desc    Fix subjects for proper conflict detection in scheduling
// @access  Private (admin only)
router.post('/fix-scheduling', protect, checkPermission('create_subject'), async (req, res) => {
  try {
    const { safeAutoFixSubjects } = require('../utils/subjectAutoFix');
    const fixResult = await safeAutoFixSubjects();

    if (fixResult.success) {
      res.json({
        success: true,
        message: `Successfully fixed ${fixResult.fixedCount} subjects for conflict detection`,
        data: { fixedCount: fixResult.fixedCount },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Auto-fix failed',
        error: fixResult.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error running auto-fix',
      error: error.message,
    });
  }
});

module.exports = router;
