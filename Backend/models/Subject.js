const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Subject code cannot exceed 20 characters'],
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [200, 'Subject name cannot exceed 200 characters'],
  },
  departmentId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Department',
    required: false, // Temporarily make optional for testing
  },
  department: {
    type: String,
    required: false, // For temporary display
  },
  semesterId: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8,
  },
  type: {
    type: String,
    enum: ['regular', 'core_elective', 'open_elective'],
    default: 'regular',
  },
  // Enhanced fields for auto-enrollment
  subjectType: {
    type: String,
    enum: ['regular', 'core_elective', 'open_elective'],
    default: 'regular',
  },
  offeredTo: [{
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    isCore: {
      type: Boolean,
      default: true,
    },
    academicYear: String,
  }],
  isShared: {
    type: Boolean,
    default: false,
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  }],
  primaryDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  isCommonToAll: {
    type: Boolean,
    default: false,
  },
  commonSemester: {
    type: Number,
    min: 1,
    max: 8,
  },
  minEnrollment: {
    type: Number,
    default: 1,
  },
  maxEnrollment: {
    type: Number,
    default: 100,
  },
  courseCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 6,
  },
  theoryHours: {
    type: Number,
    default: 3,
    min: 0,
    max: 6,
  },
  practicalHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 6,
  },
  tutorialHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 2,
  },
  totalHours: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  objectives: [{
    type: String,
    maxlength: [200, 'Objective cannot exceed 200 characters'],
  }],
  outcomes: [{
    type: String,
    maxlength: [200, 'Outcome cannot exceed 200 characters'],
  }],
  syllabus: [{
    unit: {
      type: String,
      required: true,
      maxlength: [100, 'Unit name cannot exceed 100 characters'],
    },
    topics: [{
      type: String,
      maxlength: [200, 'Topic cannot exceed 200 characters'],
    }],
    hours: {
      type: Number,
      default: 10,
      min: 1,
      max: 20,
    },
  }],
  textbooks: [{
    title: String,
    author: String,
    publisher: String,
    year: Number,
  }],
  references: [{
    title: String,
    author: String,
    publisher: String,
    year: Number,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isCommon: {
    type: Boolean,
    default: false,
    required: false,
  },
  sharedWith: {
    type: String,
    default: '',
    required: false,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Temporarily make optional for debugging
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for semester name
subjectSchema.virtual('semesterName').get(function () {
  return `Semester ${this.semesterId}`;
});

// Virtual for total contact hours
subjectSchema.virtual('totalContactHours').get(function () {
  return this.theoryHours + this.practicalHours + this.tutorialHours;
});

// Indexes for better query performance
subjectSchema.index({ code: 1 });
subjectSchema.index({ departmentId: 1 });
subjectSchema.index({ semesterId: 1 });
subjectSchema.index({ type: 1 });
subjectSchema.index({ isActive: 1 });

// Static method to find subjects by department and semester
subjectSchema.statics.findByDepartmentAndSemester = function (departmentId, semesterId) {
  return this.find({
    departmentId: { $in: [departmentId] },
    semesterId,
    isActive: true,
  }).populate('departmentId', 'name code');
};

// Static method to find subjects by type
subjectSchema.statics.findByType = function (type) {
  return this.find({
    type,
    isActive: true,
  }).populate('departmentId', 'name code');
};

// Static method to find subjects by semester
subjectSchema.statics.findBySemester = function (semesterId) {
  return this.find({
    semesterId,
    isActive: true,
  }).populate('departmentId', 'name code');
};

// Static method to get core electives by department and semester
subjectSchema.statics.getCoreElectivesByDepartment = function (departmentId, semesterId) {
  return this.find({
    type: 'core_elective',
    departmentId: { $in: [departmentId] },
    semesterId,
    isActive: true,
  }).populate('departmentId', 'name code');
};

// Static method to get open electives by semester
subjectSchema.statics.getOpenElectivesBySemester = function (semesterId) {
  return this.find({
    type: 'open_elective',
    semesterId,
    isActive: true,
  }).populate('departmentId', 'name code');
};

// Static method to get regular subjects by department and semester
subjectSchema.statics.getRegularSubjects = function (departmentId, semesterId) {
  return this.find({
    type: 'regular',
    $or: [
      { departmentId: { $in: [departmentId] } },
      { departmentId: { $in: [null] } }, // For common/foundation subjects
    ],
    semesterId,
    isActive: true,
  }).populate('departmentId', 'name code');
};

// Static method to find subject by code
subjectSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to get subject statistics
subjectSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalSubjects: { $sum: 1 },
        activeSubjects: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        regularSubjects: {
          $sum: { $cond: [{ $eq: ['$type', 'regular'] }, 1, 0] },
        },
        coreElectives: {
          $sum: { $cond: [{ $eq: ['$type', 'core_elective'] }, 1, 0] },
        },
        openElectives: {
          $sum: { $cond: [{ $eq: ['$type', 'open_elective'] }, 1, 0] },
        },
      },
    },
  ]);

  const departmentStats = await this.aggregate([
    {
      $unwind: '$departmentId',
    },
    {
      $group: {
        _id: '$departmentId',
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
        _id: '$semesterId',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id': 1 },
    },
  ]);

  return {
    overall: stats[0] || {
      totalSubjects: 0,
      activeSubjects: 0,
      regularSubjects: 0,
      coreElectives: 0,
      openElectives: 0,
    },
    byDepartment: departmentStats,
    bySemester: semesterStats,
  };
};

module.exports = mongoose.model('Subject', subjectSchema);
