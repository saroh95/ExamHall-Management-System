const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  seatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: false,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'absent',
    required: true,
    index: true,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  method: {
    type: String,
    enum: ['manual', 'qr', 'scan'],
    default: 'manual',
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  lateReason: {
    type: String,
    maxlength: 200,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one attendance record per student per exam
AttendanceSchema.index({ examId: 1, studentId: 1 }, { unique: true });

// Index for efficient queries
AttendanceSchema.index({ examId: 1, status: 1 });
AttendanceSchema.index({ examId: 1, seatId: 1 });

// Virtual for student details
AttendanceSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for exam details
AttendanceSchema.virtual('exam', {
  ref: 'Exam',
  localField: 'examId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for marked by user details
AttendanceSchema.virtual('markedByUser', {
  ref: 'User',
  localField: 'markedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are included when converting to JSON
AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
