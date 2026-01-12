const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters'],
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Department code cannot exceed 10 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  establishedDate: {
    type: Date,
    default: Date.now,
  },
  contactInfo: {
    phone: String,
    email: String,
    office: String,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  totalTeachers: {
    type: Number,
    default: 0,
  },
  totalSubjects: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

// Virtual for department statistics
departmentSchema.virtual('statistics').get(function () {
  return {
    totalStudents: this.totalStudents,
    totalTeachers: this.totalTeachers,
    totalSubjects: this.totalSubjects,
  };
});

// Static method to get department with statistics
departmentSchema.statics.getWithStatistics = async function () {
  const departments = await this.aggregate([
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'department',
        as: 'students',
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: 'department',
        as: 'teachers',
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: 'departmentId',
        as: 'subjects',
      },
    },
    {
      $addFields: {
        totalStudents: { $size: '$students' },
        totalTeachers: { $size: '$teachers' },
        totalSubjects: { $size: '$subjects' },
      },
    },
    {
      $project: {
        students: 0,
        teachers: 0,
        subjects: 0,
      },
    },
  ]);

  return departments;
};

// Static method to find department by code
departmentSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

module.exports = mongoose.model('Department', departmentSchema);
