const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const teacherSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{2,4}[0-9]{2,6}[0-9]{1,3}$/, 'Employee ID must be in format: DEPT1234001'],
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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  instituteEmail: {
    type: String,
    unique: true,
    lowercase: true,
    match: [/^\w+([.\-+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number'],
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
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Teaching Assistant'],
    default: 'Assistant Professor',
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    maxlength: [100, 'Qualification cannot exceed 100 characters'],
  },
  specialization: {
    type: String,
    maxlength: [200, 'Specialization cannot exceed 200 characters'],
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required'],
  },
  experience: {
    type: Number,
    default: 0,
    min: 0,
  },
  salary: {
    type: Number,
    default: null,
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
  workload: {
    type: Number,
    default: 0,
    min: 0,
    max: 40,
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  isInvigilator: {
    type: Boolean,
    default: false,
  },
  invigilationPreferences: {
    maxSessionsPerDay: {
      type: Number,
      default: 2,
      min: 1,
      max: 4,
    },
    preferredTimeSlots: [{
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
    }],
    preferredDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
  },
  permissions: {
    type: [String],
    default: [
      // Default teacher permissions - can be overridden by admin
      'read_dashboard', 'read_timetable', 'read_seating',
      // Default module access permissions
      'access_students', 'access_subjects', 'access_classrooms', 'access_exams', 'access_enrollments', 'access_notifications',
      // Default CRUD permissions for these modules
      'create_student', 'read_student', 'update_student', 'delete_student',
      'create_subject', 'read_subject', 'update_subject', 'delete_subject',
      'create_classroom', 'read_classroom', 'update_classroom', 'delete_classroom',
      'create_exam', 'read_exam', 'update_exam', 'delete_exam',
      'create_enrollment', 'read_enrollment', 'update_enrollment', 'delete_enrollment',
      // Special permissions
      'bulk_upload', 'export_data', 'send_notifications',
    ],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
teacherSchema.virtual('name').get(function () {
  return this.fullName;
});

// Virtual for years of experience
teacherSchema.virtual('yearsOfExperience').get(function () {
  if (!this.joiningDate) return 0;
  const today = new Date();
  const joining = new Date(this.joiningDate);
  return Math.floor((today - joining) / (1000 * 60 * 60 * 24 * 365));
});

// Indexes for better query performance
teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ personalEmail: 1 });
teacherSchema.index({ instituteEmail: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ designation: 1 });
teacherSchema.index({ isActive: 1 });
teacherSchema.index({ isInvigilator: 1 });

// Pre-save middleware to hash password
teacherSchema.pre('save', async function (next) {
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
teacherSchema.pre('validate', async function (next) {
  if (!this.instituteEmail) {
    try {
      const { generateTeacherEmail, getDepartmentCode } = require('../utils/emailGenerator');
      const Department = mongoose.model('Department');
      const [firstName, ...lastNameParts] = (this.fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');
      let departmentCode = 'GEN';
      try {
        const department = await Department.findById(this.department);
        if (department) {
          departmentCode = department.code || getDepartmentCode(department.name);
        }
      } catch (_) {}

      const baseEmail = generateTeacherEmail(firstName, lastName, departmentCode);
      let uniqueEmail = baseEmail;
      let suffix = 1;
      // Ensure uniqueness by appending a numeric suffix if needed
      // eslint-disable-next-line no-await-in-loop
      while (await this.constructor.findOne({ instituteEmail: uniqueEmail })) {
        const [local, domain] = baseEmail.split('@');
        uniqueEmail = `${local}${++suffix}@${domain}`;
      }
      this.instituteEmail = uniqueEmail;
    } catch (error) {
      // Fallback: still set something to satisfy validation
      const { generateTeacherEmail } = require('../utils/emailGenerator');
      const [firstName, ...lastNameParts] = (this.fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');
      this.instituteEmail = generateTeacherEmail(firstName, lastName, 'GEN');
    }
  }
  next();
});

// Pre-validate middleware to auto-generate employee ID if not provided
teacherSchema.pre('validate', async function (next) {
  if (!this.employeeId) {
    try {
      const department = await mongoose.model('Department').findById(this.department);
      if (!department) {
        return next(new Error('Department not found'));
      }

      const deptCode = department.code || department.name.substring(0, 3).toUpperCase();
      const year = new Date().getFullYear().toString().substring(2);

      // Find the last employee ID for this department and year
      const lastTeacher = await this.constructor.findOne({
        employeeId: new RegExp(`^${deptCode}${year}`),
      }).sort({ employeeId: -1 });

      let sequence = 1;
      if (lastTeacher) {
        const lastSequence = parseInt(lastTeacher.employeeId.substring(deptCode.length + 2));
        sequence = lastSequence + 1;
      }

      this.employeeId = `${deptCode}${year}${sequence.toString().padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to check password
teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
teacherSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate email verification token
teacherSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Instance method to generate password reset token
teacherSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Static method to find teacher by employee ID
teacherSchema.statics.findByEmployeeId = function (employeeId) {
  return this.findOne({ employeeId: employeeId.toUpperCase() });
};

// Static method to find teacher by email (institute email)
teacherSchema.statics.findByEmail = function (email) {
  return this.findOne({ instituteEmail: email.toLowerCase() });
};

// Static method to find teacher by personal email
teacherSchema.statics.findByPersonalEmail = function (personalEmail) {
  return this.findOne({ personalEmail: personalEmail.toLowerCase() });
};

// Static method to find teacher by institute email
teacherSchema.statics.findByInstituteEmail = function (email) {
  return this.findOne({ instituteEmail: email.toLowerCase() });
};

// Static method to get teachers by department
teacherSchema.statics.findByDepartment = function (departmentId) {
  return this.find({
    department: departmentId,
    isActive: true,
  }).populate('department', 'name');
};

// Static method to get available invigilators
teacherSchema.statics.findAvailableInvigilators = function () {
  return this.find({
    isInvigilator: true,
    isActive: true,
  }).populate('department', 'name');
};

// Static method to bulk create teachers
teacherSchema.statics.bulkCreate = async function (teachersData) {
  const results = { success: [], errors: [] };

  // Guard: nothing to do
  if (!Array.isArray(teachersData) || teachersData.length === 0) {
    return results;
  }

  // Preload Departments for provided ObjectIds to get codes
  const Department = require('./Department');
  const mongoose = require('mongoose');
  
  // First, resolve any string departments (names or codes) to ObjectIds
  const departmentStrings = new Set();
  const validObjectIds = [];
  
  for (const teacher of teachersData) {
    if (teacher && teacher.department) {
      const deptValue = String(teacher.department);
      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(deptValue) && deptValue.length === 24) {
        validObjectIds.push(deptValue);
      } else {
        // It's a string (name or code), need to resolve it
        departmentStrings.add(deptValue.trim());
      }
    }
  }
  
  // Resolve string departments to ObjectIds
  const deptStringToId = new Map();
  if (departmentStrings.size > 0) {
    const deptStringsArray = Array.from(departmentStrings);
    // Try to find by code (uppercase) or name (case-insensitive)
    const codeQuery = { code: { $in: deptStringsArray.map(s => s.toUpperCase()) } };
    const nameQueries = deptStringsArray.map(s => ({ name: new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }));
    const foundDepts = await Department.find({
      $or: [codeQuery, ...nameQueries],
    });
    
    for (const dept of foundDepts) {
      // Map both code and name to the ObjectId
      deptStringToId.set(dept.code.toUpperCase(), dept._id);
      deptStringToId.set(dept.name.toLowerCase(), dept._id);
      // Also add original strings if they match
      for (const str of deptStringsArray) {
        if (str.toUpperCase() === dept.code.toUpperCase() || 
            str.toLowerCase() === dept.name.toLowerCase()) {
          deptStringToId.set(str, dept._id);
        }
      }
    }
    
    // For any unresolved strings, try to create them (similar to controller logic)
    for (const deptStr of deptStringsArray) {
      if (!deptStringToId.has(deptStr)) {
        try {
          const { getDepartmentCode } = require('../utils/emailGenerator');
          let baseCode = getDepartmentCode(deptStr) || deptStr.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
          let uniqueCode = baseCode.toUpperCase();
          let suffix = 0;
          while (await Department.findOne({ code: uniqueCode })) {
            suffix += 1;
            uniqueCode = `${baseCode}${suffix}`.toUpperCase();
            if (suffix > 50) break;
          }
          const created = await Department.create({ name: deptStr, code: uniqueCode });
          deptStringToId.set(deptStr, created._id);
          deptStringToId.set(uniqueCode, created._id);
          deptStringToId.set(deptStr.toLowerCase(), created._id);
          console.log(`✅ Auto-created department '${deptStr}' with code '${uniqueCode}' in bulkCreate`);
        } catch (createErr) {
          console.error(`⚠️ Failed to auto-create department '${deptStr}':`, createErr.message);
        }
      }
    }
  }
  
  // Now update teachersData with resolved ObjectIds
  for (const teacher of teachersData) {
    if (teacher && teacher.department) {
      const deptValue = String(teacher.department);
      if (!mongoose.Types.ObjectId.isValid(deptValue) || deptValue.length !== 24) {
        // It's a string, resolve it
        const resolvedId = deptStringToId.get(deptValue) || 
                          deptStringToId.get(deptValue.toUpperCase()) || 
                          deptStringToId.get(deptValue.toLowerCase());
        if (resolvedId) {
          teacher.department = resolvedId;
          validObjectIds.push(String(resolvedId));
        } else {
          // Department couldn't be resolved, mark for error
          teacher.__deptError = `Department '${deptValue}' could not be resolved`;
        }
      } else {
        validObjectIds.push(deptValue);
      }
    }
  }
  
  // Now fetch departments by ObjectIds
  const uniqueDeptIds = Array.from(new Set(validObjectIds));
  const deptDocs = await Department.find({ _id: { $in: uniqueDeptIds } }, 'code name');
  const deptIdToCode = new Map();
  for (const d of deptDocs) {
    const code = d.code || (d.name ? d.name.substring(0, 3).toUpperCase() : 'GEN');
    deptIdToCode.set(String(d._id), code);
  }

  // Prepare employeeId sequences per (deptCode, year)
  const buckets = new Map(); // key: `${deptCode}${yy}` -> nextSequence (number)
  const bucketKeys = new Set();
  for (const d of teachersData) {
    const deptCode = deptIdToCode.get(String(d.department)) || 'GEN';
    const yearFull = d.joiningDate ? new Date(d.joiningDate).getFullYear() : new Date().getFullYear();
    const yy = String(yearFull).slice(-2);
    bucketKeys.add(`${deptCode}${yy}`);
  }
  // Fetch last sequences for each bucket in parallel
  await Promise.all(
    Array.from(bucketKeys).map(async (key) => {
      const deptCode = key.slice(0, key.length - 2);
      const yy = key.slice(-2);
      const last = await this.findOne({ employeeId: new RegExp(`^${deptCode}${yy}`) })
        .sort({ employeeId: -1 })
        .select('employeeId')
        .lean();
      let nextSeq = 1;
      if (last && last.employeeId) {
        const lastSeq = parseInt(last.employeeId.substring(deptCode.length + 2), 10);
        if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      buckets.set(key, nextSeq);
    }),
  );

  // Track generated instituteEmails within this batch to avoid duplicates
  const batchInstituteEmails = new Set();
  const { generateTeacherEmail } = require('../utils/emailGenerator');
  const bcryptjs = require('bcryptjs');

  // Prepare docs with all required fields computed
  const docs = [];
  for (const input of teachersData) {
    try {
      // Skip if department couldn't be resolved
      if (input.__deptError) {
        results.errors.push({ data: input, error: input.__deptError });
        continue;
      }
      
      const doc = { ...input };
      // Remove internal flags
      delete doc.__deptError;

      // Normalize/ensure required primitives
      if (!doc.password) {
        doc.password = `${Date.now()}@${new Date().getFullYear()}`;
      }
      // Hash password (bulk operations do not run pre-save hooks)
      const salt = await bcryptjs.genSalt(12);
      doc.password = await bcryptjs.hash(doc.password, salt);

      if (doc.personalEmail) doc.personalEmail = String(doc.personalEmail).toLowerCase();
      if (doc.instituteEmail) doc.instituteEmail = String(doc.instituteEmail).toLowerCase();

      // Compute instituteEmail if missing, ensure uniqueness (DB + batch)
      if (!doc.instituteEmail) {
        const fullName = String(doc.fullName || '').trim();
        const [firstName = '', ...lastParts] = fullName.split(' ');
        const lastName = lastParts.join(' ');
        const deptCode = deptIdToCode.get(String(doc.department)) || 'GEN';
        const base = generateTeacherEmail(firstName, lastName, deptCode);
        let candidate = base;
        let suffix = 1;
        // eslint-disable-next-line no-await-in-loop
        while (batchInstituteEmails.has(candidate) || (await this.exists({ instituteEmail: candidate }))) {
          const [local, domain] = base.split('@');
          candidate = `${local}${++suffix}@${domain}`;
        }
        doc.instituteEmail = candidate.toLowerCase();
      }
      batchInstituteEmails.add(doc.instituteEmail);

      // Compute employeeId if missing
      if (!doc.employeeId) {
        const deptCode = deptIdToCode.get(String(doc.department)) || 'GEN';
        const yearFull = doc.joiningDate ? new Date(doc.joiningDate).getFullYear() : new Date().getFullYear();
        const yy = String(yearFull).slice(-2);
        const key = `${deptCode}${yy}`;
        const seq = buckets.get(key) || 1;
        doc.employeeId = `${deptCode}${yy}${String(seq).padStart(3, '0')}`;
        buckets.set(key, seq + 1);
      }

      // Ensure phone is digits-only string
      if (doc.phone) doc.phone = String(doc.phone).replace(/\D/g, '');

      docs.push(doc);
    } catch (err) {
      results.errors.push({ data: input, error: err.message });
    }
  }

  // Perform unordered bulk insert; we already satisfied required fields
  try {
    const inserted = await this.insertMany(docs, { ordered: false });
    results.success.push(...inserted);
  } catch (e) {
    // insertMany can throw with partial success; capture both
    if (e && Array.isArray(e.insertedDocs)) {
      results.success.push(...e.insertedDocs);
    }
    if (e && e.writeErrors && Array.isArray(e.writeErrors)) {
      for (const we of e.writeErrors) {
        const idx = we.index != null ? we.index : undefined;
        results.errors.push({ data: docs[idx], error: we.errmsg || we.message });
      }
    } else if (Array.isArray(e.errors)) {
      for (const err of e.errors) {
        results.errors.push({ error: err.message });
      }
    } else if (e && e.message) {
      results.errors.push({ error: e.message });
    }
  }

  return results;
};

// Static method to get teacher statistics
teacherSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTeachers: { $sum: 1 },
        activeTeachers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        verifiedTeachers: {
          $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] },
        },
        invigilators: {
          $sum: { $cond: [{ $eq: ['$isInvigilator', true] }, 1, 0] },
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

  const designationStats = await this.aggregate([
    {
      $group: {
        _id: '$designation',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id': 1 },
    },
  ]);

  return {
    overall: stats[0] || { totalTeachers: 0, activeTeachers: 0, verifiedTeachers: 0, invigilators: 0 },
    byDepartment: departmentStats,
    byDesignation: designationStats,
  };
};

module.exports = mongoose.model('Teacher', teacherSchema);
