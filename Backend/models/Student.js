const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const studentSchema = new mongoose.Schema({
  scholarId: {
    type: String,
    required: [true, 'Scholar ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}1[A-Z]{2}[0-9]{3}$/, 'Scholar ID must follow format: YY1DD### (e.g., 221CS095)'],
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters'],
  },
  personalEmail: {
    type: String,
    required: [true, 'Personal email is required'],
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email'],
  },
  instituteEmail: {
    type: String,
    unique: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[0-9]{10,15}$/, 'Please enter a valid contact number'],
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: [
      'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
      'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
    ],
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
  batchYear: {
    type: String,
    required: [true, 'Batch year is required'],
    match: [/^20\d{2}$/, 'Batch year must be in format 20xx'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    maxlength: [500, 'Address cannot exceed 500 characters'],
  },
  photo: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  lastLogin: {
    type: Date,
    default: null,
  },
  academicStatus: {
    type: String,
    enum: ['active', 'suspended', 'graduated', 'dropped'],
    default: 'active',
  },
  attendance: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  cgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false,
  },
  nationality: {
    type: String,
    default: 'Indian',
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  permissions: {
    type: [String],
    default: ['read_exam', 'read_timetable', 'read_seating'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
studentSchema.virtual('name').get(function () {
  return this.fullName;
});

// Virtual for current semester number
studentSchema.virtual('semesterNumber').get(function () {
  return parseInt(this.semester.split(' ')[1]);
});

// Indexes for better query performance
studentSchema.index({ scholarId: 1 });
studentSchema.index({ personalEmail: 1 });
studentSchema.index({ instituteEmail: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ semester: 1, section: 1 });
studentSchema.index({ batchYear: 1 });
studentSchema.index({ academicStatus: 1 });

// Compound indexes for common filter combinations
studentSchema.index({ department: 1, batchYear: 1 });
studentSchema.index({ department: 1, semester: 1 });
studentSchema.index({ batchYear: 1, semester: 1 });
studentSchema.index({ department: 1, batchYear: 1, semester: 1 });

// Text search index for full-text search
studentSchema.index({
  scholarId: 'text',
  fullName: 'text',
  personalEmail: 'text',
  contactNumber: 'text',
});

// Pre-save middleware to hash password
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is valid
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-validate middleware to generate institute email if not provided
studentSchema.pre('validate', async function (next) {
  if (!this.instituteEmail && this.fullName && this.batchYear) {
    try {
      const { generateStudentEmail, getDepartmentCode } = require('../utils/emailGenerator');
      const Department = require('./Department');
      const [firstName, ...lastNameParts] = String(this.fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');
      let departmentCode = 'GEN';
      try {
        const department = await Department.findById(this.department);
        if (department) {
          departmentCode = department.code || getDepartmentCode(department.name);
        }
      } catch (_) {}

      const base = generateStudentEmail(firstName, lastName, this.batchYear, departmentCode);
      let candidate = base;
      let suffix = 1;
      // Ensure uniqueness across existing docs
      // eslint-disable-next-line no-await-in-loop
      while (await this.constructor.findOne({ instituteEmail: candidate })) {
        const [local, domain] = base.split('@');
        candidate = `${local}${++suffix}@${domain}`;
      }
      this.instituteEmail = candidate;
    } catch (e) {
      // ignore and let validation handle if still missing
    }
  }
  next();
});

// Pre-validate middleware to auto-generate scholarId if not provided
studentSchema.pre('validate', async function (next) {
  if (!this.scholarId) {
    try {
      const Department = require('./Department');
      const { getDepartmentCode, generateNewScholarId } = require('../utils/emailGenerator');
      let deptCode = 'CSE';
      try {
        const department = await Department.findById(this.department);
        if (department) {
          deptCode = department.code || getDepartmentCode(department.name);
        }
      } catch (_) {}

      const passoutYear = parseInt(this.batchYear, 10) || new Date().getFullYear();
      const entryYear = passoutYear - 4;
      const entryYearTwo = String(entryYear).slice(-2);
      const level = '1'; // UG
      const prefix = `${entryYearTwo}${level}${deptCode}`;

      const last = await this.constructor.findOne({ scholarId: new RegExp(`^${prefix}`) })
        .sort({ scholarId: -1 })
        .select('scholarId')
        .lean();
      let seq = 1;
      if (last && last.scholarId) {
        const tail = last.scholarId.substring(prefix.length);
        const lastSeq = parseInt(tail, 10);
        if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
      }
      this.scholarId = generateNewScholarId(deptCode, this.batchYear, seq);
    } catch (e) {
      return next(e);
    }
  }
  next();
});

// Instance method to check password
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
studentSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate email verification token
studentSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Instance method to generate password reset token
studentSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Static method to find student by scholar ID
studentSchema.statics.findByScholarId = function (scholarId) {
  return this.findOne({ scholarId: scholarId.toUpperCase() });
};

// Static method to find student by email (institute email)
studentSchema.statics.findByEmail = function (email) {
  return this.findOne({ instituteEmail: email.toLowerCase() });
};

// Static method to find student by personal email
studentSchema.statics.findByPersonalEmail = function (personalEmail) {
  return this.findOne({ personalEmail: personalEmail.toLowerCase() });
};

// Static method to find student by institute email
studentSchema.statics.findByInstituteEmail = function (email) {
  return this.findOne({ instituteEmail: email.toLowerCase() });
};

// Static method to get students by department and semester
studentSchema.statics.findByDepartmentAndSemester = function (departmentId, semester) {
  const mongoose = require('mongoose');

  // Handle departmentId - convert to ObjectId if it's a valid ObjectId string
  let deptQuery = departmentId;
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    deptQuery = new mongoose.Types.ObjectId(departmentId);
  }

  return this.find({
    department: deptQuery,
    semester,
    isActive: true,
  }).populate('department', 'name');
};

// Static method to get students by batch year
studentSchema.statics.findByBatchYear = function (batchYear) {
  return this.find({
    batchYear,
    isActive: true,
  }).populate('department', 'name');
};

// Static method to bulk create students
studentSchema.statics.bulkCreate = async function (studentsData) {
  const results = { success: [], errors: [] };

  if (!Array.isArray(studentsData) || studentsData.length === 0) return results;

  const Department = require('./Department');
  const bcryptjs = require('bcryptjs');
  const { generateStudentEmail, getDepartmentCode } = require('../utils/emailGenerator');

  // Resolve department strings or ids to ObjectId and map to codes
  const uniqueDeptInputs = new Set();
  for (const s of studentsData) {
    if (s && s.department) uniqueDeptInputs.add(String(s.department).trim());
  }
  const deptCodeToId = new Map();
  const nameToId = new Map();
  const idToCode = new Map();
  // Load all departments once
  const allDepts = await Department.find({}, 'name code');
  for (const d of allDepts) {
    if (d.code) deptCodeToId.set(String(d.code).toUpperCase(), d._id);
    if (d.name) nameToId.set(String(d.name).toLowerCase(), d._id);
    idToCode.set(String(d._id), d.code || (d.name ? d.name.substring(0, 3).toUpperCase() : 'GEN'));
  }

  // Prepare scholarId sequences per (deptCode, batchYear)
  const seqBuckets = new Map(); // key: `${deptCode}${batchYear}` -> next seq
  const bucketKeys = new Set();
  for (const s of studentsData) {
    const deptInput = s.department;
    let deptId = null;
    if (deptInput) {
      const u = String(deptInput).toUpperCase();
      const l = String(deptInput).toLowerCase();
      deptId = deptCodeToId.get(u) || nameToId.get(l) || (allDepts.find((d) => String(d._id) === String(deptInput))?._id);
    }
    const deptCode = deptId ? idToCode.get(String(deptId)) : getDepartmentCode(String(s.department || ''));
    const batchYear = s.batchYear || new Date().getFullYear();
    const passoutYear = parseInt(String(batchYear), 10);
    const entryYear = passoutYear - 4;
    const entryYearTwo = String(entryYear).slice(-2);
    const level = '1'; // UG
    // Convert dept code for scholar ID (EIE->EI, CSE->CS, ECE->EC)
    let finalDeptCode = deptCode;
    if (deptCode === 'EIE') finalDeptCode = 'EI';
    else if (deptCode === 'CSE') finalDeptCode = 'CS';
    else if (deptCode === 'ECE') finalDeptCode = 'EC';

    const key = `${entryYearTwo}${level}${finalDeptCode}`;
    bucketKeys.add(key);
  }
  await Promise.all(Array.from(bucketKeys).map(async (key) => {
    // Find the highest existing scholar ID for this key pattern
    const last = await this.findOne({
      scholarId: new RegExp(`^${key}\\d{3}$`),
    })
      .sort({ scholarId: -1 })
      .select('scholarId')
      .lean();

    let nextSeq = 1;
    if (last && last.scholarId) {
      const tail = last.scholarId.substring(key.length);
      const lastSeq = parseInt(tail, 10);
      if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    seqBuckets.set(key, nextSeq);
  }));

  // Track instituteEmail uniqueness within the batch
  const batchEmails = new Set();
  const docs = [];

  for (const input of studentsData) {
    try {
      const doc = { ...input };

      // Resolve department
      if (doc.department) {
        const u = String(doc.department).toUpperCase();
        const l = String(doc.department).toLowerCase();
        let deptId = deptCodeToId.get(u) || nameToId.get(l) || (allDepts.find((d) => String(d._id) === String(doc.department))?._id);
        if (!deptId && typeof doc.department === 'string' && doc.department.trim()) {
          // Auto-create department if not found (align with teachers)
          const baseCode = getDepartmentCode(doc.department) || doc.department.replace(/[^A-Za-z]/g, '').substring(0,3).toUpperCase() || 'GEN';
          let finalCode = baseCode;
          let attempt = 1;
          while (deptCodeToId.has(finalCode)) finalCode = `${baseCode}${++attempt}`;
          const created = await Department.create({ name: String(doc.department).trim(), code: finalCode });
          deptId = created._id;
          deptCodeToId.set(finalCode, created._id);
          nameToId.set(String(created.name).toLowerCase(), created._id);
          idToCode.set(String(created._id), finalCode);
        }
        doc.department = deptId || doc.department; // leave as-is if already ObjectId-like
      }

      // Normalize contact number
      if (doc.contactNumber) doc.contactNumber = String(doc.contactNumber).replace(/\D/g, '');

      // Scholar ID
      if (!doc.scholarId) {
        const deptCode = idToCode.get(String(doc.department)) || getDepartmentCode(String(input.department || '')) || 'CSE';
        const batchYear = doc.batchYear || new Date().getFullYear();
        const passoutYear = parseInt(String(batchYear), 10);
        const entryYear = passoutYear - 4;
        const entryYearTwo = String(entryYear).slice(-2);
        const level = '1'; // UG
        const key = `${entryYearTwo}${level}${deptCode}`;
        const seq = seqBuckets.get(key) || 1;
        const { generateNewScholarId } = require('../utils/emailGenerator');
        doc.scholarId = generateNewScholarId(deptCode, batchYear, seq);
        seqBuckets.set(key, seq + 1);
      }
      doc.scholarId = String(doc.scholarId).toUpperCase();

      // Institute email
      if (!doc.instituteEmail && doc.fullName && doc.batchYear) {
        const [firstName = '', ...lastParts] = String(doc.fullName).split(' ');
        const lastName = lastParts.join(' ');
        const deptCode = idToCode.get(String(doc.department)) || getDepartmentCode(String(input.department || '')) || 'GEN';
        const base = generateStudentEmail(firstName, lastName, doc.batchYear, deptCode);
        let candidate = base;
        let suffix = 1;
        // eslint-disable-next-line no-await-in-loop
        while (batchEmails.has(candidate) || (await this.exists({ instituteEmail: candidate }))) {
          const [local, domain] = base.split('@');
          candidate = `${local}${++suffix}@${domain}`;
        }
        doc.instituteEmail = candidate.toLowerCase();
      }
      if (doc.personalEmail) doc.personalEmail = String(doc.personalEmail).toLowerCase();

      batchEmails.add(doc.instituteEmail);

      // Password hashing (use lower cost for bulk operations)
      if (!doc.password) {
        doc.password = `${doc.scholarId}@${new Date().getFullYear()}`;
      }
      const salt = await bcryptjs.genSalt(8); // Reduced from 12 to 8 for better performance
      doc.password = await bcryptjs.hash(doc.password, salt);

      docs.push(doc);
    } catch (err) {
      results.errors.push({ data: input, error: err.message });
    }
  }

  try {
    // Use insertMany with ordered: false to continue inserting even if some fail
    const inserted = await this.insertMany(docs, { ordered: false });
    results.success.push(...inserted);
  } catch (e) {
    // Handle bulk insert errors - some documents may have been inserted successfully
    if (e && Array.isArray(e.insertedDocs)) {
      results.success.push(...e.insertedDocs);
    }

    if (e && e.writeErrors && Array.isArray(e.writeErrors)) {
      for (const we of e.writeErrors) {
        const idx = we.index != null ? we.index : undefined;
        const errorMsg = we.errmsg || we.message || 'Unknown error';

        // Handle duplicate key errors more gracefully
        if (errorMsg.includes('duplicate key') || errorMsg.includes('E11000')) {
          if (errorMsg.includes('scholarId')) {
            results.errors.push({
              data: docs[idx],
              error: `Scholar ID already exists: ${docs[idx]?.scholarId}`,
            });
          } else if (errorMsg.includes('instituteEmail')) {
            results.errors.push({
              data: docs[idx],
              error: `Institute email already exists: ${docs[idx]?.instituteEmail}`,
            });
          } else {
            results.errors.push({ data: docs[idx], error: 'Duplicate record' });
          }
        } else {
          results.errors.push({ data: docs[idx], error: errorMsg });
        }
      }
    } else if (e && e.message) {
      results.errors.push({ error: e.message });
    }
  }

  return results;
};

// Static method to get student statistics
studentSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        activeStudents: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        verifiedStudents: {
          $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] },
        },
      },
    },
  ]);

  const departmentStats = await this.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'departmentInfo',
      },
    },
    {
      $unwind: '$departmentInfo',
    },
    {
      $project: {
        departmentName: '$departmentInfo.name',
        count: 1,
      },
    },
  ]);

  const semesterStats = await this.aggregate([
    {
      $group: {
        _id: '$semester',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id': 1 },
    },
  ]);

  return {
    overall: stats[0] || { totalStudents: 0, activeStudents: 0, verifiedStudents: 0 },
    byDepartment: departmentStats,
    bySemester: semesterStats,
  };
};

module.exports = mongoose.model('Student', studentSchema);
