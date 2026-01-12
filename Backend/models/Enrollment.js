const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  academicYear: {
    type: String,
    required: true,
    default () {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    },
  },
  enrollmentType: {
    type: String,
    enum: ['Auto-Core', 'Auto-Common', 'Elective-Regular', 'Elective-Open', 'Manual'],
    default: 'Auto-Core',
  },
  status: {
    type: String,
    enum: ['Enrolled', 'Dropped', 'Completed', 'Failed'],
    default: 'Enrolled',
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'I', 'W', null],
    default: null,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  enrolledBy: {
    type: String,
    default: 'System-Auto',
  },
  metadata: {
    autoEnrolled: {
      type: Boolean,
      default: false,
    },
    canDrop: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 1,
    },
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
enrollmentSchema.index({ student: 1, subject: 1, academicYear: 1 }, { unique: true });
enrollmentSchema.index({ subject: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ semester: 1, academicYear: 1 });

// Static method to get enrollment statistics
enrollmentSchema.statics.getEnrollmentStats = async function (subjectId) {
  const stats = await this.aggregate([
    { $match: { subject: new mongoose.Types.ObjectId(subjectId), status: 'Enrolled' } },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo',
      },
    },
    { $unwind: '$studentInfo' },
    {
      $lookup: {
        from: 'departments',
        localField: 'studentInfo.department',
        foreignField: '_id',
        as: 'deptInfo',
      },
    },
    { $unwind: '$deptInfo' },
    {
      $group: {
        _id: '$deptInfo.name',
        count: { $sum: 1 },
        students: { $push: '$studentInfo' },
      },
    },
  ]);

  return stats;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);

