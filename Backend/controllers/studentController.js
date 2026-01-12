const mongoose = require('mongoose');
const Student = require('../models/Student');
const Department = require('../models/Department');
const { asyncHandler } = require('../middleware/error');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const emailService = require('../services/emailService');
const { uploadProfilePicture, getFileUrl, deleteFile } = require('../middleware/upload');
const CacheService = require('../services/cacheService');
const {
  generateStudentEmail,
  generatePassword,
  generateScholarId,
  getDepartmentCode,
} = require('../utils/emailGenerator');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 10;

  // Set maximum limit to prevent performance issues
  const MAX_LIMIT = 50000; // Increased to handle larger datasets
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  // If limit is 0, get all students (no pagination)
  if (limit === 0) {
    limit = MAX_LIMIT;
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Student.countDocuments();

  // Build query
  let query = Student.find().populate('department', 'name code');

  // Search functionality - use text search for better performance
  if (req.query.search) {
    const searchTerm = req.query.search.trim();
    if (searchTerm.length > 0) {
      // Use text search if available, fallback to regex
      try {
        query = query.find({ $text: { $search: searchTerm } });
      } catch (error) {
        // Fallback to regex search if text index not available
        const searchRegex = new RegExp(searchTerm, 'i');
        query = query.find({
          $or: [
            { scholarId: searchRegex },
            { fullName: searchRegex },
            { personalEmail: searchRegex },
            { contactNumber: searchRegex },
          ],
        });
      }
    }
  }

  // Filter by department - support ObjectId, code, or name
  if (req.query.department) {
    const deptFilter = req.query.department;

    // Check if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(deptFilter) && /^[a-fA-F0-9]{24}$/.test(deptFilter)) {
      query = query.find({ department: deptFilter });
    } else {
      // Search by department code or name
      const dept = await Department.findOne({
        $or: [
          { code: deptFilter.toUpperCase() },
          { name: { $regex: new RegExp(`^${deptFilter}$`, 'i') } },
        ],
      });

      if (dept) {
        query = query.find({ department: dept._id });
      } else {
        // No matching department found, return empty result
        query = query.find({ department: null });
      }
    }
  }

  // Filter by semester - handle comma-separated values
  if (req.query.semester) {
    const semesterFilter = req.query.semester;
    if (semesterFilter.includes(',')) {
      // Handle comma-separated semester values
      const semesters = semesterFilter.split(',').map(s => s.trim());
      query = query.find({ semester: { $in: semesters } });
    } else {
      query = query.find({ semester: semesterFilter });
    }
  }

  // Filter by batch year
  if (req.query.batchYear) {
    query = query.find({ batchYear: req.query.batchYear });
  }

  // Filter by academic status
  if (req.query.academicStatus) {
    query = query.find({ academicStatus: req.query.academicStatus });
  }

  // Filter by active status
  if (req.query.isActive !== undefined) {
    query = query.find({ isActive: req.query.isActive === 'true' });
  }

  // Sort
  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  query = query.sort({ [sortField]: sortOrder });

  // Pagination
  query = query.skip(startIndex).limit(limit);

  const students = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // Add debugging information
  console.log('📊 Student Query Debug:', {
    requestedLimit: req.query.limit,
    actualLimit: limit,
    page,
    startIndex,
    endIndex,
    totalStudents: total,
    returnedStudents: students.length,
    hasMore: endIndex < total,
  });

  res.json({
    success: true,
    count: students.length,
    pagination,
    data: students,
    debug: {
      total,
      requestedLimit: req.query.limit,
      actualLimit: limit,
      page,
    },
  });
});

// @desc    Get all students without pagination
// @route   GET /api/students/all
// @access  Private
const getAllStudents = asyncHandler(async (req, res) => {
  try {
    // Build query
    let query = Student.find().populate('department', 'name code');

    // Search functionality - use text search for better performance
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      if (searchTerm.length > 0) {
      // Use text search if available, fallback to regex
        try {
          query = query.find({ $text: { $search: searchTerm } });
        } catch (error) {
        // Fallback to regex search if text index not available
          const searchRegex = new RegExp(searchTerm, 'i');
          query = query.find({
            $or: [
              { scholarId: searchRegex },
              { fullName: searchRegex },
              { personalEmail: searchRegex },
              { contactNumber: searchRegex },
            ],
          });
        }
      }
    }

    // Filter by department - support ObjectId, code, or name
    if (req.query.department) {
      const deptFilter = req.query.department;

      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(deptFilter) && /^[a-fA-F0-9]{24}$/.test(deptFilter)) {
        query = query.find({ department: deptFilter });
      } else {
        // Search by department code or name
        const dept = await Department.findOne({
          $or: [
            { code: deptFilter.toUpperCase() },
            { name: { $regex: new RegExp(`^${deptFilter}$`, 'i') } },
          ],
        });

        if (dept) {
          query = query.find({ department: dept._id });
        } else {
          // No matching department found, return empty result
          query = query.find({ department: null });
        }
      }
    }

    // Filter by semester - handle comma-separated values
    if (req.query.semester) {
      const semesterFilter = req.query.semester;
      if (semesterFilter.includes(',')) {
        // Handle comma-separated semester values
        const semesters = semesterFilter.split(',').map(s => s.trim());
        query = query.find({ semester: { $in: semesters } });
      } else {
        query = query.find({ semester: semesterFilter });
      }
    }

    // Filter by batch year
    if (req.query.batchYear) {
      query = query.find({ batchYear: req.query.batchYear });
    }

    // Filter by academic status
    if (req.query.academicStatus) {
      query = query.find({ academicStatus: req.query.academicStatus });
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query = query.find({ isActive: req.query.isActive === 'true' });
    }

    // Sort
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    query = query.sort({ [sortField]: sortOrder });

    const students = await query;
    const total = await Student.countDocuments();

    console.log(`📊 getAllStudents: Returning ${students.length} students out of ${total} total`);

    res.json({
      success: true,
      count: students.length,
      total,
      data: students,
    });
  } catch (error) {
    console.error('❌ Error in getAllStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all students',
      error: error.message,
    });
  }
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('department', 'name code')
    .populate('emergencyContact');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  res.json({
    success: true,
    data: student,
  });
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private
const createStudent = asyncHandler(async (req, res) => {
  const {
    scholarId: providedScholarId,
    fullName,
    personalEmail,
    contactNumber,
    semester,
    section,
    batchYear,
    department,
    address,
  } = req.body;

  // If scholarId provided, ensure uniqueness; else it will be auto-generated
  if (providedScholarId) {
    const existingStudent = await Student.findByScholarId(providedScholarId);
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this Scholar ID already exists',
      });
    }
  }

  const existingEmail = await Student.findOne({ personalEmail });
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: 'Student with this personal email already exists',
    });
  }

  // Check if department exists (support both ObjectId and department code/name)
  let departmentExists;
  if (mongoose.Types.ObjectId.isValid(department)) {
    departmentExists = await Department.findById(department);
  } else if (typeof department === 'string') {
    // Accept codes like CSE, EE, CE, EI, etc., and full names
    departmentExists = await Department.findOne({ code: department.toUpperCase() })
      || await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
  }

  if (!departmentExists) {
    return res.status(400).json({
      success: false,
      message: `Department '${department}' not found. Please use a valid department code (CSE, EE, ME, etc.) or name.`,
    });
  }

  // Use the department's ObjectId for saving
  const departmentId = departmentExists._id;

  // Generate scholarId (if missing), institute email and password
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');
  const departmentCode = getDepartmentCode(departmentExists.name);
  let scholarId = providedScholarId;
  if (!scholarId) {
    // New format: YY + 1 + DEPT + NNN (e.g., 221CS095)
    const passoutYear = parseInt(batchYear, 10) || new Date().getFullYear();
    const entryYear = passoutYear - 4;
    const entryYearTwo = String(entryYear).slice(-2);
    const level = '1'; // UG
    const prefix = `${entryYearTwo}${level}${departmentCode}`;
    const last = await Student.findOne({ scholarId: new RegExp(`^${prefix}`) })
      .sort({ scholarId: -1 })
      .select('scholarId')
      .lean();
    let seq = 1;
    if (last && last.scholarId) {
      const tail = last.scholarId.substring(prefix.length);
      const lastSeq = parseInt(tail, 10);
      if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const { generateNewScholarId } = require('../utils/emailGenerator');
    scholarId = generateNewScholarId(departmentCode, batchYear, seq);
  }

  const instituteEmail = generateStudentEmail(firstName, lastName, batchYear, departmentCode);
  const password = generatePassword();

  // Check if institute email already exists
  const existingInstituteEmail = await Student.findOne({ instituteEmail });
  if (existingInstituteEmail) {
    return res.status(400).json({
      success: false,
      message: 'Institute email already exists. Please try again.',
    });
  }

  // Create student
  const student = await Student.create({
    scholarId,
    fullName,
    personalEmail,
    instituteEmail,
    contactNumber,
    semester,
    section,
    batchYear,
    department: departmentId, // Use the resolved department ObjectId
    address,
    password,
  });

  // Populate department before sending email
  await student.populate('department', 'name code');

  console.log('📧 Sending email with department:', student.department);
  console.log('📧 Institute email being sent:', instituteEmail);
  console.log('📧 Student institute email:', student.instituteEmail);

  // Send credentials email (non-blocking but logged)
  try {
    // Create a plain object with properly formatted department
    const studentForEmail = {
      fullName: student.fullName,
      scholarId: student.scholarId,
      semester: student.semester,
      section: student.section,
      batchYear: student.batchYear,
      personalEmail: student.personalEmail,
      department: {
        name: student.department?.name,
        code: student.department?.code,
      },
    };

    await emailService.sendStudentCredentials(studentForEmail, student.instituteEmail, password);
  } catch (error) {
    console.error('Failed to send credentials email:', error?.message || error);
  }

  // Invalidate student cache after creation
  CacheService.invalidateStudentCache();

  res.status(201).json({
    success: true,
    message: 'Student created successfully. Institute credentials sent to personal email.',
    data: {
      ...student.toObject(),
      password: undefined, // Don't send password in response
    },
  });
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  let student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Check if scholar ID is being changed and if it already exists
  if (req.body.scholarId && req.body.scholarId !== student.scholarId) {
    const existingStudent = await Student.findByScholarId(req.body.scholarId);
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this Scholar ID already exists',
      });
    }
  }

  // Check if institute email is being changed and if it already exists
  if (req.body.instituteEmail && req.body.instituteEmail !== student.instituteEmail) {
    const existingEmail = await Student.findByEmail(req.body.instituteEmail);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student with this institute email already exists',
      });
    }
  }

  // Update student
  student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('department', 'name code');

  // Invalidate student cache after update
  CacheService.invalidateStudentCache();

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: student,
  });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  await Student.findByIdAndDelete(req.params.id);

  // Invalidate student cache after deletion
  CacheService.invalidateStudentCache();

  res.json({
    success: true,
    message: 'Student deleted successfully',
  });
});

// @desc    Bulk delete students
// @route   DELETE /api/students/bulk-delete
// @access  Private
const bulkDeleteStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body || {};

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'studentIds array is required',
    });
  }

  const results = { deleted: 0, notFound: [], errors: [] };

  for (const id of studentIds) {
    try {
      const deleted = await Student.findByIdAndDelete(id);
      if (deleted) {
        results.deleted += 1;
      } else {
        results.notFound.push(id);
      }
    } catch (error) {
      results.errors.push({ id, error: error.message });
    }
  }

  // Invalidate student cache after bulk deletion
  if (results.deleted > 0) {
    CacheService.invalidateStudentCache();
  }

  res.json({
    success: true,
    message: 'Bulk delete completed',
    data: results,
  });
});

// @desc    Bulk upload students
// @route   POST /api/students/bulk-upload
// @access  Private
const bulkUploadStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a CSV file',
    });
  }

  const results = [];
  const errors = [];

  const { normalizeStudentHeader, normalizeSemester, normalizeSection, trimRowValues } = require('../utils/csvNormalize');

  // Read CSV file with header normalization
  // Stream parse CSV to handle very large files efficiently
  fs.createReadStream(req.file.path)
    .pipe(csv({ mapHeaders: ({ header }) => normalizeStudentHeader(header) }))
    .on('data', (data) => {
      const cleaned = trimRowValues(data);
      if (cleaned.contactNumber) cleaned.contactNumber = String(cleaned.contactNumber).replace(/\D/g, '');
      if (cleaned.batchYear) cleaned.batchYear = String(cleaned.batchYear).trim();
      if (cleaned.department) cleaned.department = String(cleaned.department).trim();
      if (cleaned.semester) cleaned.semester = normalizeSemester(cleaned.semester);
      if (cleaned.section) cleaned.section = normalizeSection(cleaned.section);

      // Skip validation for existing scholar IDs to allow re-uploads
      let skipExisting = false;
      if (cleaned.scholarId) {
        // We'll check for duplicates later in bulk insert with ordered: false
        skipExisting = false;
      }

      // Default section to 'A' if not provided
      if (!cleaned.section) {
        cleaned.section = 'A';
      }

      // Validate required fields
      const requiredFields = ['fullName', 'contactNumber', 'semester', 'batchYear', 'department'];
      const missingFields = requiredFields.filter(field => !cleaned[field]);

      if (missingFields.length > 0) {
        errors.push({
          row: cleaned,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      // Validate scholar ID format (new format: YY1DD### e.g., 221CS095)
      if (cleaned.scholarId && !/^[0-9]{2}1[A-Z]{2}[0-9]{3}$/.test(String(cleaned.scholarId).toUpperCase())) {
        errors.push({ row: cleaned, error: 'Scholar ID must follow format YY1DD### (e.g., 221CS095)' });
        return;
      }

      // Validate contact number
      if (!/^[0-9]{10,15}$/.test(cleaned.contactNumber)) {
        errors.push({
          row: cleaned,
          error: 'Contact number must be 10-15 digits',
        });
        return;
      }

      // Validate batch year
      if (!/^20\d{2}$/.test(cleaned.batchYear)) {
        errors.push({
          row: cleaned,
          error: 'Batch year must be in format: 20xx',
        });
        return;
      }

      // Validate department
      const { getDepartmentCode } = require('../utils/emailGenerator');
      const validDepartments = ['CSE', 'ECE', 'CE', 'EE', 'EI', 'EIE', 'ME', 'Computer Science and Engineering', 'Electronics and Communication Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics and Instrumentation Engineering', 'Mechanical Engineering'];
      const deptCode = getDepartmentCode(cleaned.department);
      if (!validDepartments.includes(cleaned.department.toUpperCase()) && !['CSE', 'ECE', 'CE', 'EE', 'EI', 'EIE', 'ME'].includes(deptCode)) {
        errors.push({
          row: cleaned,
          error: `Invalid department: ${cleaned.department}. Valid departments: CSE, ECE, CE, EE, EI, EIE, ME`,
        });
        return;
      }

      results.push({
        scholarId: cleaned.scholarId ? String(cleaned.scholarId).toUpperCase() : undefined,
        fullName: cleaned.fullName,
        personalEmail: cleaned.personalEmail || cleaned.email,
        contactNumber: cleaned.contactNumber,
        semester: cleaned.semester,
        section: cleaned.section,
        batchYear: cleaned.batchYear,
        department: cleaned.department,
        address: cleaned.address || 'N/A',
        password: cleaned.password, // hashed later in model bulkCreate
      });
    })
    .on('end', async () => {
      try {
        console.log(`📊 Processing ${results.length} students...`);

        // Optional: Clear existing students if requested (for fresh uploads)
        if (req.body.clearExisting === 'true') {
          console.log('🧹 Clearing existing students...');
          const deleteResult = await Student.deleteMany({});
          console.log(`✅ Cleared ${deleteResult.deletedCount} existing students`);
        }

        // Chunk into batches to avoid memory spikes and lock contention
        const BATCH_SIZE = 500; // Increased batch size for better performance
        let aggregateSuccess = [];
        let aggregateErrors = [];

        for (let i = 0; i < results.length; i += BATCH_SIZE) {
          const slice = results.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(results.length / BATCH_SIZE);

          console.log(`📦 Processing batch ${batchNumber}/${totalBatches}: ${slice.length} students`);

          try {
            // eslint-disable-next-line no-await-in-loop
            const partial = await Student.bulkCreate(slice);

            console.log(`✅ Batch ${batchNumber} completed:`, {
              successful: partial.success?.length || 0,
              errors: partial.errors?.length || 0,
            });

            aggregateSuccess = aggregateSuccess.concat(partial.success || []);
            aggregateErrors = aggregateErrors.concat(partial.errors || []);

            // Log some errors for debugging
            if (partial.errors && partial.errors.length > 0) {
              console.log(`❌ Batch ${batchNumber} errors (first 3):`, partial.errors.slice(0, 3));
            }
          } catch (batchError) {
            console.error(`❌ Batch ${batchNumber} failed:`, batchError.message);
            aggregateErrors.push({
              batch: batchNumber,
              error: batchError.message,
              data: slice.slice(0, 1), // Include first record for debugging
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        console.log(`📊 Final results: ${aggregateSuccess.length} successful, ${aggregateErrors.length} failed`);
        console.log(`📊 Validation rejected: ${errors.length} students`);
        console.log(`📊 Total CSV rows processed: ${results.length + errors.length}`);

        // Invalidate student cache after bulk upload
        if (aggregateSuccess.length > 0) {
          CacheService.invalidateStudentCache();
        }

        res.json({
          success: true,
          message: 'Bulk upload completed',
          data: {
            totalCsvRows: results.length + errors.length,
            totalProcessed: results.length,
            validationRejected: errors.length,
            successful: aggregateSuccess.length,
            failed: aggregateErrors.length,
            validationErrors: errors.slice(0, 10), // Show validation errors
            insertionErrors: aggregateErrors.slice(0, 10), // Show insertion errors
          },
        });
      } catch (error) {
        console.error('❌ Bulk upload error:', error);

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
});

// @desc    Get student statistics
// @route   GET /api/students/stats
// @access  Private
const getStudentStats = asyncHandler(async (req, res) => {
  const stats = await Student.getStatistics();

  res.json({
    success: true,
    data: stats,
  });
});

// @desc    Get students by department and semester
// @route   GET /api/students/department/:departmentId/semester/:semester
// @access  Private
const getStudentsByDepartmentAndSemester = asyncHandler(async (req, res) => {
  const { departmentId, semester } = req.params;

  const students = await Student.findByDepartmentAndSemester(departmentId, semester);

  res.json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    Get students by batch year
// @route   GET /api/students/batch/:batchYear
// @access  Private
const getStudentsByBatchYear = asyncHandler(async (req, res) => {
  const { batchYear } = req.params;

  const students = await Student.findByBatchYear(batchYear);

  res.json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    Update student status
// @route   PATCH /api/students/:id/status
// @access  Private
const updateStudentStatus = asyncHandler(async (req, res) => {
  const { isActive, academicStatus } = req.body;

  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  if (isActive !== undefined) {
    student.isActive = isActive;
  }

  if (academicStatus) {
    student.academicStatus = academicStatus;
  }

  await student.save();

  res.json({
    success: true,
    message: 'Student status updated successfully',
    data: student,
  });
});

// @desc    Export students to CSV
// @route   GET /api/students/export
// @access  Private
const exportStudents = asyncHandler(async (req, res) => {
  const students = await Student.find()
    .populate('department', 'name code')
    .select('-password -emailVerificationToken -passwordResetToken');

  // Convert to CSV format
  const csvData = students.map(student => ({
    ScholarID: student.scholarId,
    FullName: student.fullName,
    Email: student.email,
    ContactNumber: student.contactNumber,
    Semester: student.semester,
    Section: student.section,
    BatchYear: student.batchYear,
    Department: student.department?.name || '',
    Address: student.address,
    AcademicStatus: student.academicStatus,
    IsActive: student.isActive,
    RegistrationDate: student.registrationDate,
  }));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=students.csv');

  // Convert to CSV string
  const csvString = [
    Object.keys(csvData[0]).join(','),
    ...csvData.map(row => Object.values(row).join(',')),
  ].join('\n');

  res.send(csvString);
});

// @desc    Get student by scholar ID
// @route   GET /api/students/scholar/:scholarId
// @access  Private
const getStudentByScholarId = asyncHandler(async (req, res) => {
  const student = await Student.findByScholarId(req.params.scholarId)
    .populate('department', 'name code');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  res.json({
    success: true,
    data: student,
  });
});

// @desc    Send credentials to students
// @route   POST /api/students/send-credentials
// @access  Private
const sendCredentials = asyncHandler(async (req, res) => {
  const { credentials } = req.body;

  if (!credentials || !Array.isArray(credentials)) {
    return res.status(400).json({
      success: false,
      message: 'Credentials array is required',
    });
  }

  const results = [];
  const errors = [];

  for (const credential of credentials) {
    try {
      const { email, password, name } = credential;
      if (!email || !password) {
        errors.push({ email, error: 'Email and password are required' });
        continue;
      }
      // Find student by personalEmail only (case-insensitive) and populate department
      const emailLc = (email || '').toLowerCase();
      const student = await Student.findOne({ personalEmail: emailLc }).populate('department', 'name code');
      if (!student) {
        errors.push({ email, error: 'Student not found' });
        continue;
      }
      // Save password FIRST (so student can login immediately)
      student.password = password;
      student.credentialsSent = true;
      student.credentialsSentAt = new Date();
      await student.save();

      // Fire-and-forget email sending (don't wait for it)
      const studentForEmail = {
        fullName: student.fullName,
        scholarId: student.scholarId,
        semester: student.semester,
        section: student.section,
        batchYear: student.batchYear,
        personalEmail: student.personalEmail,
        department: {
          name: student.department?.name,
          code: student.department?.code,
        },
      };
      emailService.sendStudentCredentials(studentForEmail, student.instituteEmail, password)
        .then(() => console.log(`✅ Email sent to ${student.personalEmail}`))
        .catch(mailErr => console.error(`⚠️ Email send failed for ${student.personalEmail}:`, mailErr?.message || mailErr));

      results.push({ email, name, success: true });
    } catch (error) {
      errors.push({ email: credential.email, error: error.message });
    }
  }

  res.json({
    success: true,
    message: `Credentials processed. ${results.length} successful, ${errors.length} failed.`,
    data: {
      successful: results,
      failed: errors,
    },
  });
});

// @desc    Change student password
// @route   PUT /api/students/change-password
// @access  Private (Student only)
const changeStudentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  // Get student with password field
  const student = await Student.findById(req.user.id).select('+password');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Check current password
  const isMatch = await student.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password (will be hashed by pre-save hook)
  student.password = newPassword;
  await student.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Upload student photo
// @route   POST /api/students/:id/photo
// @access  Private
const uploadStudentPhoto = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a photo file',
    });
  }

  // Delete old photo if exists
  if (student.photo) {
    deleteFile(student.photo);
  }

  // Update student with new photo path
  const photoUrl = getFileUrl(req.file.filename, 'profiles');
  student.photo = photoUrl;
  await student.save();

  res.json({
    success: true,
    message: 'Photo uploaded successfully',
    data: {
      photoUrl,
    },
  });
});

// @desc    Delete student photo
// @route   DELETE /api/students/:id/photo
// @access  Private
const deleteStudentPhoto = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  if (student.photo) {
    deleteFile(student.photo);
    student.photo = null;
    await student.save();
  }

  res.json({
    success: true,
    message: 'Photo deleted successfully',
  });
});

// @desc    Get cached student statistics
// @route   GET /api/students/stats/cached
// @access  Private
const getCachedStudentStats = asyncHandler(async (req, res) => {
  try {
    const stats = await CacheService.getStudentStats();

    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate statistics',
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting cached stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
    });
  }
});

module.exports = {
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
};
