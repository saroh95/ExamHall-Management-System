const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const { asyncHandler } = require('../middleware/error');
const csv = require('csv-parser');
const fs = require('fs');
const emailService = require('../services/emailService');
const {
  normalizeTeacherHeader,
  trimRowValues,
  parseFlexibleDate,
} = require('../utils/csvNormalize');
const { normalizeDesignation } = require('../utils/csvNormalize');
const {
  generateTeacherEmail,
  generatePassword,
  generateEmployeeId,
  getDepartmentCode,
} = require('../utils/emailGenerator');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
const getTeachers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Teacher.countDocuments();

  // Build query
  let query = Teacher.find().populate('department', 'name code');

  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.find({
      $or: [
        { employeeId: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { personalEmail: searchRegex },
        { phone: searchRegex },
      ],
    });
  }

  // Filter by department
  if (req.query.department) {
    query = query.find({ department: req.query.department });
  }

  // Filter by designation
  if (req.query.designation) {
    query = query.find({ designation: req.query.designation });
  }

  // Filter by invigilator status
  if (req.query.isInvigilator !== undefined) {
    query = query.find({ isInvigilator: req.query.isInvigilator === 'true' });
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

  const teachers = await query;

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

  res.json({
    success: true,
    count: teachers.length,
    pagination,
    data: teachers,
  });
});

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('department', 'name code')
    .populate('subjects', 'name code')
    .populate('emergencyContact');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  res.json({
    success: true,
    data: teacher,
  });
});

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private
const createTeacher = asyncHandler(async (req, res) => {
  const {
    fullName,
    personalEmail,
    phone,
    department,
    address,
    designation,
    qualification,
    specialization,
    joiningDate,
  } = req.body;

  const existingPersonalEmail = await Teacher.findOne({ personalEmail });
  if (existingPersonalEmail) {
    return res.status(400).json({
      success: false,
      message: 'Teacher with this personal email already exists',
    });
  }

  // Check if department exists (accept ObjectId, code, or name)
  let departmentExists = null;
  if (typeof department === 'string') {
    if (/^[a-fA-F0-9]{24}$/.test(department)) {
      departmentExists = await Department.findById(department);
    }
    if (!departmentExists) {
      departmentExists = await Department.findOne({ code: department.toUpperCase() })
        || await Department.findOne({ name: new RegExp(`^${department}$`, 'i') });
    }
  } else {
    departmentExists = await Department.findById(department);
  }
  if (!departmentExists) {
    return res.status(400).json({
      success: false,
      message: 'Department not found',
    });
  }

  // Generate institute email, employee ID, and password
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');
  const departmentCode = getDepartmentCode(departmentExists.name);
  const joiningYear = new Date(joiningDate).getFullYear();

  const instituteEmail = generateTeacherEmail(firstName, lastName, departmentCode);
  const employeeId = generateEmployeeId(departmentCode, joiningYear);
  const password = generatePassword();

  // Check if institute email already exists
  const existingInstituteEmail = await Teacher.findOne({ instituteEmail });
  if (existingInstituteEmail) {
    return res.status(400).json({
      success: false,
      message: 'Institute email already exists. Please try again.',
    });
  }

  // Check if employee ID already exists
  const existingEmployeeId = await Teacher.findOne({ employeeId });
  if (existingEmployeeId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID already exists. Please try again.',
    });
  }

  // Create teacher
  const teacher = await Teacher.create({
    fullName,
    personalEmail,
    instituteEmail,
    employeeId,
    phone,
    department,
    address,
    designation,
    qualification,
    specialization: specialization || '',
    joiningDate,
    password,
  });

  // Populate department before sending email
  await teacher.populate('department', 'name code');

  console.log('📧 Sending email with department:', teacher.department);
  console.log('📧 Institute email being sent:', instituteEmail);
  console.log('📧 Teacher institute email:', teacher.instituteEmail);

  // Send credentials email (non-blocking but logged)
  try {
    // Create a plain object with properly formatted department
    const teacherForEmail = {
      fullName: teacher.fullName,
      employeeId: teacher.employeeId,
      designation: teacher.designation,
      personalEmail: teacher.personalEmail,
      department: {
        name: teacher.department?.name,
        code: teacher.department?.code,
      },
    };

    await emailService.sendTeacherCredentials(teacherForEmail, teacher.instituteEmail, password);
  } catch (error) {
    console.error('Failed to send credentials email:', error?.message || error);
  }

  res.status(201).json({
    success: true,
    message: 'Teacher created successfully. Institute credentials sent to personal email.',
    data: {
      ...teacher.toObject(),
      password: undefined, // Don't send password in response
    },
  });
});

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private
const updateTeacher = asyncHandler(async (req, res) => {
  let teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  // Check if institute email is being changed and if it already exists
  if (req.body.instituteEmail && req.body.instituteEmail !== teacher.instituteEmail) {
    const existingEmail = await Teacher.findByEmail(req.body.instituteEmail);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this institute email already exists',
      });
    }
  }

  // Check if personal email is being changed and if it already exists
  if (req.body.personalEmail && req.body.personalEmail !== teacher.personalEmail) {
    const existingPersonalEmail = await Teacher.findByPersonalEmail(req.body.personalEmail);
    if (existingPersonalEmail) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this personal email already exists',
      });
    }
  }

  // Update teacher
  teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('department', 'name code');

  res.json({
    success: true,
    message: 'Teacher updated successfully',
    data: teacher,
  });
});

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  await Teacher.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Teacher deleted successfully',
  });
});

// @desc    Bulk upload teachers
// @route   POST /api/teachers/bulk-upload
// @access  Private
const bulkUploadTeachers = asyncHandler(async (req, res) => {
  const isLenient = String(req.query.lenient).toLowerCase() === 'true';
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a CSV file',
    });
  }

  const results = [];
  const errors = [];

  // Get all departments for name-to-ID mapping
  const Department = require('../models/Department');
  const departments = await Department.find();
  const departmentMap = {};
  departments.forEach(dept => {
    departmentMap[dept.name.toUpperCase()] = dept._id;
    departmentMap[dept.code.toUpperCase()] = dept._id;
  });

  console.log('📊 Available departments:', Object.keys(departmentMap));

  // Read CSV file
  // Normalize headers so exported CSVs and varied casing work
  fs.createReadStream(req.file.path)
    .pipe(csv({ mapHeaders: ({ header }) => normalizeTeacherHeader(header) }))
    .on('data', (data) => {
      console.log('📄 Processing CSV row:', data);
      const cleaned = trimRowValues(data);

      // Coerce/normalize fields
      if (cleaned.joiningDate) cleaned.joiningDate = parseFlexibleDate(cleaned.joiningDate);
      if (cleaned.phone) cleaned.phone = String(cleaned.phone).replace(/\D/g, '');
      if (cleaned.designation) cleaned.designation = normalizeDesignation(cleaned.designation);

      // Convert department name/code to ObjectId if possible. If department not found we'll create it later.
      if (cleaned.department) {
        // Preserve original department string for later creation if needed
        const originalDept = String(cleaned.department).trim();
        const deptKey = originalDept.toUpperCase();
        console.log(`🔍 Looking for department: "${deptKey}" in map:`, Object.keys(departmentMap));
        if (departmentMap[deptKey]) {
          cleaned.department = departmentMap[deptKey];
          console.log(`✅ Found department mapping: ${deptKey} -> ${cleaned.department}`);
        } else {
          // Keep department as a string (original name) and mark key for resolution after CSV parsing
          cleaned._departmentRaw = originalDept;
          cleaned._departmentKey = deptKey;
          cleaned.department = originalDept; // temporary placeholder (truthy) so required-field checks pass
          console.log(`⚠️ Department will be created later: ${deptKey}`);
        }
      }

      // Generate password if not provided
      if (!cleaned.password) {
        const bcrypt = require('bcryptjs');
        const defaultPassword = 'password123'; // Default password for all teachers
        cleaned.password = defaultPassword; // Will be hashed in pre-save middleware
      }

      // If CSV has 'email' but not 'personalEmail', use it
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!cleaned.personalEmail && cleaned.email && emailRegex.test(cleaned.email)) {
        cleaned.personalEmail = cleaned.email;
      }

      // Lenient defaults for missing fields
      if (isLenient) {
        // Generate basic parts from name
        const [firstName = '', ...lastParts] = String(cleaned.fullName || '').split(' ');
        const lastName = lastParts.join(' ');
        if (!cleaned.personalEmail && cleaned.fullName) {
          const base = `${firstName}.${lastName}`.replace(/\.+$/,'').replace(/\s+/g,'').toLowerCase();
          cleaned.personalEmail = `${base || 'user'}@example.com`;
        }
        if (!cleaned.phone || !/^[0-9]{10,15}$/.test(cleaned.phone)) {
          cleaned.phone = `${Math.floor(6000000000 + Math.random() * 3999999999)}`; // 10-digit fallback
        }
        if (!cleaned.address) cleaned.address = 'N/A';
        if (!cleaned.designation) cleaned.designation = 'Assistant Professor';
        if (!cleaned.qualification) cleaned.qualification = 'N/A';
        if (!cleaned.joiningDate) cleaned.joiningDate = new Date('2000-01-01').toISOString();
        if (!cleaned.department && departments.length > 0) {
          // Use first available department as default
          cleaned.department = departments[0]._id;
        }
      }

      // Validate required fields (lenient mode reduces required set)
      const requiredFields = isLenient
        ? ['fullName', 'department']
        : ['fullName', 'personalEmail', 'phone', 'department', 'address', 'designation', 'qualification', 'joiningDate'];
      const missingFields = requiredFields.filter(field => !cleaned[field]);

      if (missingFields.length > 0) {
        errors.push({
          row: cleaned,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      // Validate phone number
      if (!/^[0-9]{10,15}$/.test(cleaned.phone)) {
        errors.push({
          row: cleaned,
          error: 'Phone number must be 10-15 digits',
        });
        return;
      }

      // Validate email format
      if (!emailRegex.test(cleaned.personalEmail)) {
        errors.push({
          row: cleaned,
          error: 'Invalid personal email format',
        });
        return;
      }

      results.push({
        fullName: cleaned.fullName,
        email: cleaned.email || `${cleaned.fullName.toLowerCase().replace(/\s+/g, '.')}@${process.env.INSTITUTE_DOMAIN}`,
        personalEmail: cleaned.personalEmail,
        phone: cleaned.phone,
        department: cleaned.department,
        address: cleaned.address,
        designation: cleaned.designation,
        qualification: cleaned.qualification,
        specialization: cleaned.specialization || '',
        joiningDate: cleaned.joiningDate,
        password: cleaned.password || `${Date.now()}@${new Date().getFullYear()}`,
      });
    })
    .on('end', async () => {
      try {
        // Resolve any department strings left in results by creating missing Department documents
        // Build a map of deptKey -> originalName for departments that need creation
        const deptKeysToCreate = new Map();
        for (const r of results) {
          if (r && r._departmentKey && typeof r.department === 'string') {
            if (!deptKeysToCreate.has(r._departmentKey)) {
              deptKeysToCreate.set(r._departmentKey, r._departmentRaw || r.department);
            }
          }
        }

        if (deptKeysToCreate.size > 0) {
          console.log('📌 Need to create departments for keys:', Array.from(deptKeysToCreate.keys()));
        }

        // For each key, either find existing department again (race-safe) or create a new one
        for (const [deptKey, originalName] of deptKeysToCreate.entries()) {
          let deptDoc = await Department.findOne({ $or: [{ code: deptKey }, { name: new RegExp(`^${originalName}$`, 'i') }] });
          if (!deptDoc) {
            // Generate a unique code based on name
            const { getDepartmentCode } = require('../utils/emailGenerator');
            let baseCode = getDepartmentCode(originalName);
            let uniqueCode = String(baseCode).toUpperCase();
            // Ensure uniqueness of code by appending numeric suffix when collisions occur
            let suffix = 0;
            // eslint-disable-next-line no-await-in-loop
            while (await Department.findOne({ code: uniqueCode })) {
              suffix += 1;
              uniqueCode = `${baseCode}${suffix}`.toUpperCase();
              if (suffix > 50) break; // safety
            }

            try {
              deptDoc = await Department.create({ name: originalName, code: uniqueCode });
              console.log(`✅ Created department '${originalName}' with code '${uniqueCode}' -> ${deptDoc._id}`);
            } catch (createErr) {
              console.error(`⚠️ Failed to create department '${originalName}':`, createErr.message || createErr);
              // Try to recover by finding existing document again
              deptDoc = await Department.findOne({ $or: [{ code: uniqueCode }, { name: new RegExp(`^${originalName}$`, 'i') }] });
              if (!deptDoc) {
                // If still not found, record errors for rows using this department
                for (const r of results.filter(x => x._departmentKey === deptKey)) {
                  errors.push({ row: r, error: `Failed to create department '${originalName}': ${createErr.message}` });
                }
                // Skip mapping for this key
                continue;
              }
            }
          } else {
            console.log(`ℹ️ Found existing department for '${originalName}' -> ${deptDoc._id}`);
          }

          // Map the deptKey to the ObjectId for assignment
          if (deptDoc) departmentMap[deptKey] = deptDoc._id;
        }

        // Replace any string department values with resolved ObjectIds
        for (const r of results) {
          if (r && r._departmentKey && typeof r.department === 'string') {
            const key = r._departmentKey;
            if (departmentMap[key]) {
              r.department = departmentMap[key];
            } else {
              // If department still unresolved, add to errors and skip this row by setting a flag
              errors.push({ row: r, error: `Department '${r._departmentRaw || r.department}' could not be resolved or created` });
              r.__skip = true;
            }
          }
        }

        // Filter out rows flagged to skip
        const filteredResults = results.filter(r => !r.__skip);

        console.log(`📊 Processing ${filteredResults.length} rows for bulk create`);

        console.log(`📊 About to bulk create ${filteredResults.length} teachers`);
        const bulkResults = await Teacher.bulkCreate(filteredResults);
        console.log('📊 Bulk create results:', bulkResults);

        // Log any validation errors
        if (bulkResults.errors && bulkResults.errors.length > 0) {
          console.log('❌ Bulk create errors:', bulkResults.errors.slice(0, 3));
        }

        // Invalidate teacher cache after bulk upload
        if (bulkResults.success.length > 0) {
          const CacheService = require('../services/cacheService');
          CacheService.invalidateTeacherCache();
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        console.log(`📊 Final results: ${bulkResults.success.length} successful, ${bulkResults.errors.length} failed`);

        res.json({
          success: true,
          message: 'Bulk upload completed',
          data: {
            totalProcessed: results.length,
            successful: bulkResults.success.length,
            failed: bulkResults.errors.length + errors.length,
            errors: [...errors, ...bulkResults.errors],
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
});

// @desc    Get teacher statistics
// @route   GET /api/teachers/stats
// @access  Private
const getTeacherStats = asyncHandler(async (req, res) => {
  const stats = await Teacher.getStatistics();

  res.json({
    success: true,
    data: stats,
  });
});

// @desc    Get cached teacher statistics
// @route   GET /api/teachers/stats/cached
// @access  Private
const getCachedTeacherStats = asyncHandler(async (req, res) => {
  try {
    const CacheService = require('../services/cacheService');
    const stats = await CacheService.getTeacherStats();

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
    console.error('Error getting cached teacher stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
    });
  }
});

// @desc    Get teachers by department
// @route   GET /api/teachers/department/:departmentId
// @access  Private
const getTeachersByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  const teachers = await Teacher.findByDepartment(departmentId);

  res.json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Get available invigilators
// @route   GET /api/teachers/invigilators
// @access  Private
const getAvailableInvigilators = asyncHandler(async (req, res) => {
  const invigilators = await Teacher.findAvailableInvigilators();

  res.json({
    success: true,
    count: invigilators.length,
    data: invigilators,
  });
});

// @desc    Get all teachers for manual invigilator assignment
// @route   GET /api/teachers/all-for-invigilation
// @access  Private
const getAllTeachersForInvigilation = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({
    isActive: true,
  }).populate('department', 'name').select('_id fullName employeeId workload invigilationPreferences isInvigilator');

  res.json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Update teacher status
// @route   PATCH /api/teachers/:id/status
// @access  Private
const updateTeacherStatus = asyncHandler(async (req, res) => {
  const { isActive, isInvigilator } = req.body;

  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  if (isActive !== undefined) {
    teacher.isActive = isActive;
  }

  if (isInvigilator !== undefined) {
    teacher.isInvigilator = isInvigilator;
  }

  await teacher.save();

  res.json({
    success: true,
    message: 'Teacher status updated successfully',
    data: teacher,
  });
});

// @desc    Update invigilation preferences
// @route   PATCH /api/teachers/:id/invigilation-preferences
// @access  Private
const updateInvigilationPreferences = asyncHandler(async (req, res) => {
  const { maxSessionsPerDay, preferredTimeSlots, preferredDays } = req.body;

  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  if (maxSessionsPerDay !== undefined) {
    teacher.invigilationPreferences.maxSessionsPerDay = maxSessionsPerDay;
  }

  if (preferredTimeSlots) {
    teacher.invigilationPreferences.preferredTimeSlots = preferredTimeSlots;
  }

  if (preferredDays) {
    teacher.invigilationPreferences.preferredDays = preferredDays;
  }

  await teacher.save();

  res.json({
    success: true,
    message: 'Invigilation preferences updated successfully',
    data: teacher.invigilationPreferences,
  });
});

// @desc    Export teachers to CSV
// @route   GET /api/teachers/export
// @access  Private
const exportTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find()
    .populate('department', 'name code')
    .select('-password -emailVerificationToken -passwordResetToken');

  // Convert to CSV format
  const csvData = teachers.map(teacher => ({
    EmployeeID: teacher.employeeId,
    FullName: teacher.fullName,
    Email: teacher.email,
    PersonalEmail: teacher.personalEmail,
    Phone: teacher.phone,
    Department: teacher.department?.name || '',
    Address: teacher.address,
    Designation: teacher.designation,
    Qualification: teacher.qualification,
    Specialization: teacher.specialization,
    JoiningDate: teacher.joiningDate,
    Experience: teacher.experience,
    IsInvigilator: teacher.isInvigilator,
    IsActive: teacher.isActive,
    RegistrationDate: teacher.createdAt,
  }));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=teachers.csv');

  // Convert to CSV string
  const csvString = [
    Object.keys(csvData[0]).join(','),
    ...csvData.map(row => Object.values(row).join(',')),
  ].join('\n');

  res.send(csvString);
});

// @desc    Get teacher by employee ID
// @route   GET /api/teachers/employee/:employeeId
// @access  Private
const getTeacherByEmployeeId = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByEmployeeId(req.params.employeeId)
    .populate('department', 'name code');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  res.json({
    success: true,
    data: teacher,
  });
});

// @desc    Assign subjects to teacher
// @route   PATCH /api/teachers/:id/assign-subjects
// @access  Private
const assignSubjects = asyncHandler(async (req, res) => {
  const { subjects } = req.body;

  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  teacher.subjects = subjects;
  await teacher.save();

  res.json({
    success: true,
    message: 'Subjects assigned successfully',
    data: teacher,
  });
});

// @desc    Send credentials to teachers
// @route   POST /api/teachers/send-credentials
// @access  Private
const sendCredentials = asyncHandler(async (req, res) => {
  const { credentials } = req.body;

  if (!credentials || !Array.isArray(credentials)) {
    return res.status(400).json({
      success: false,
      message: 'Credentials array is required',
    });
  }

  // Allow only admin or users with update_teacher permission
  const user = req.user;
  const isAdmin = user && user.role === 'admin';
  const hasPermission = isAdmin || (user && user.permissions && user.permissions.includes('update_teacher'));
  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to send credentials.',
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
      // Find teacher by personalEmail only (case-insensitive)
      const emailLc = (email || '').toLowerCase();
      const teacher = await Teacher.findOne({ personalEmail: emailLc }).populate('department', 'name code');
      if (!teacher) {
        errors.push({ email, error: 'Teacher not found' });
        continue;
      }
      // Save password FIRST (so teacher can login immediately)
      teacher.password = password;
      teacher.credentialsSent = true;
      teacher.credentialsSentAt = new Date();
      await teacher.save();

      // Fire-and-forget email sending (don't wait for it)
      const teacherForEmail = {
        fullName: teacher.fullName,
        employeeId: teacher.employeeId,
        designation: teacher.designation,
        personalEmail: teacher.personalEmail,
        department: {
          name: teacher.department?.name,
          code: teacher.department?.code,
        },
      };
      emailService.sendTeacherCredentials(teacherForEmail, teacher.instituteEmail, password)
        .then(() => console.log(`✅ Email sent to ${teacher.personalEmail}`))
        .catch(mailErr => console.error(`⚠️ Email send failed for ${teacher.personalEmail}:`, mailErr?.message || mailErr));

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

// @desc    Bulk delete teachers
// @route   DELETE /api/teachers/bulk-delete
// @access  Private
const bulkDeleteTeachers = asyncHandler(async (req, res) => {
  const { teacherIds } = req.body || {};

  if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'teacherIds array is required',
    });
  }

  const results = { deleted: 0, notFound: [], errors: [] };

  for (const id of teacherIds) {
    try {
      const deleted = await Teacher.findByIdAndDelete(id);
      if (deleted) {
        results.deleted += 1;
      } else {
        results.notFound.push(id);
      }
    } catch (error) {
      results.errors.push({ id, error: error.message });
    }
  }

  res.json({
    success: true,
    message: 'Bulk delete completed',
    data: results,
  });
});

// @desc    Change teacher password
// @route   PUT /api/teachers/change-password
// @access  Private (Teacher only)
const changeTeacherPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  // Get teacher with password field
  const teacher = await Teacher.findById(req.user.id).select('+password');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  // Check current password
  const isMatch = await teacher.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password (will be hashed by pre-save hook)
  teacher.password = newPassword;
  await teacher.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
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
  bulkDeleteTeachers,
};
