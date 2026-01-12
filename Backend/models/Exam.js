const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Exam title cannot exceed 200 characters'],
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
  },
  type: {
    type: String,
    enum: ['mid_semester', 'end_semester', 'quiz', 'assignment', 'practical', 'viva'],
    default: 'end_semester',
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: [
      'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
      'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
    ],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^20\d{2}-20\d{2}$/, 'Academic year must be in format: 2023-2024'],
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [30, 'Duration must be at least 30 minutes'],
    max: [480, 'Duration cannot exceed 8 hours'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1'],
    max: [200, 'Total marks cannot exceed 200'],
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [1, 'Passing marks must be at least 1'],
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  }],
  classrooms: [{
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    assignedStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
    invigilators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    }],
    seatingArrangement: [{
      row: Number,
      column: Number,
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
      seatNumber: String,
    }],
  }],
  invigilators: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    role: {
      type: String,
      enum: ['chief_invigilator', 'invigilator', 'assistant'],
      default: 'invigilator',
    },
    assignedClassrooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    }],
  }],
  instructions: [{
    type: String,
    maxlength: [500, 'Instruction cannot exceed 500 characters'],
  }],
  allowedMaterials: [{
    type: String,
    enum: ['calculator', 'formula_sheet', 'dictionary', 'notes', 'none'],
    default: ['none'],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  totalClassrooms: {
    type: Number,
    default: 0,
  },
  totalInvigilators: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional for automated scheduling
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for exam date and time
examSchema.virtual('examDateTime').get(function () {
  return {
    date: this.examDate,
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.duration,
  };
});

// Virtual for exam status
examSchema.virtual('examStatus').get(function () {
  const now = new Date();
  const examDateTime = new Date(this.examDate);
  examDateTime.setHours(parseInt(this.startTime.split(':')[0]), parseInt(this.startTime.split(':')[1]));

  if (this.status === 'cancelled' || this.status === 'postponed') {
    return this.status;
  }

  if (now < examDateTime) {
    return 'upcoming';
  } else if (now >= examDateTime && now <= new Date(examDateTime.getTime() + this.duration * 60000)) {
    return 'ongoing';
  } else {
    return 'completed';
  }
});

// Indexes for better query performance
examSchema.index({ subject: 1 });
examSchema.index({ examDate: 1 });
examSchema.index({ semester: 1 });
examSchema.index({ academicYear: 1 });
examSchema.index({ type: 1 });
examSchema.index({ status: 1 });
examSchema.index({ isActive: 1 });
examSchema.index({ departments: 1 });

// Static method to find exam by title
examSchema.statics.findByTitle = function (title) {
  return this.findOne({ title });
};

// Static method to find exams by date range
examSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    examDate: { $gte: startDate, $lte: endDate },
    isActive: true,
  }).populate('subject', 'name code');
};

// Static method to find exams by department
examSchema.statics.findByDepartment = function (departmentId) {
  return this.find({
    departments: departmentId,
    isActive: true,
  }).populate('subject', 'name code');
};

// Static method to find exams by semester
examSchema.statics.findBySemester = function (semester) {
  return this.find({
    semester,
    isActive: true,
  }).populate('subject', 'name code');
};

// Static method to find exams by academic year
examSchema.statics.findByAcademicYear = function (academicYear) {
  return this.find({
    academicYear,
    isActive: true,
  }).populate('subject', 'name code');
};

// Static method to find upcoming exams
examSchema.statics.findUpcoming = function () {
  const now = new Date();
  return this.find({
    examDate: { $gte: now },
    status: 'scheduled',
    isActive: true,
  }).populate('subject', 'name code');
};

// Static method to find today's exams
examSchema.statics.findToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    examDate: { $gte: today, $lt: tomorrow },
    isActive: true,
  }).populate('subject', 'name code');
};

// Static method to get exam statistics
examSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        activeExams: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        scheduledExams: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] },
        },
        completedExams: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalStudents: { $sum: '$totalStudents' },
        totalClassrooms: { $sum: '$totalClassrooms' },
        totalInvigilators: { $sum: '$totalInvigilators' },
      },
    },
  ]);

  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id': 1 },
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

  const statusStats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id': 1 },
    },
  ]);

  return {
    overall: stats[0] || {
      totalExams: 0,
      activeExams: 0,
      scheduledExams: 0,
      completedExams: 0,
      totalStudents: 0,
      totalClassrooms: 0,
      totalInvigilators: 0,
    },
    byType: typeStats,
    bySemester: semesterStats,
    byStatus: statusStats,
  };
};

// Instance method to assign students to classrooms
examSchema.methods.assignStudentsToClassrooms = async function (students) {
  const classrooms = await mongoose.model('Classroom').find({
    _id: { $in: this.classrooms.map(c => c.classroom) },
  });

  let studentIndex = 0;
  for (const classroom of classrooms) {
    const classroomAssignment = this.classrooms.find(c => c.classroom.toString() === classroom._id.toString());
    if (classroomAssignment) {
      const studentsForThisClassroom = students.slice(studentIndex, studentIndex + classroom.capacity);
      classroomAssignment.assignedStudents = studentsForThisClassroom;
      studentIndex += classroom.capacity;
    }
  }

  this.totalStudents = students.length;
  return this.save();
};

// Static method to check for invigilator time conflicts
examSchema.statics.checkInvigilatorConflicts = async function (teacherId, examDate, startTime, endTime, excludeExamId = null) {
  // Find exams where this teacher is assigned on the same date
  const query = {
    'invigilators.teacher': teacherId,
    examDate,
    status: { $in: ['scheduled', 'in_progress'] },
    isActive: true,
  };

  if (excludeExamId) {
    query._id = { $ne: excludeExamId };
  }

  const conflictingExams = await this.find(query)
    .populate('subject', 'name code')
    .select('subject examDate startTime endTime invigilators');

  // Check for time overlaps
  const conflicts = [];
  for (const exam of conflictingExams) {
    const hasOverlap = checkTimeOverlap(
      { start: startTime, end: endTime },
      { start: exam.startTime, end: exam.endTime },
    );

    if (hasOverlap) {
      const invigilatorData = exam.invigilators.find(inv =>
        inv.teacher.toString() === teacherId.toString(),
      );

      conflicts.push({
        examId: exam._id,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        role: invigilatorData?.role || 'invigilator',
      });
    }
  }

  return conflicts;
};

// Helper function to check time overlap
function checkTimeOverlap (slot1, slot2) {
  const start1 = timeToMinutes(slot1.start);
  const end1 = timeToMinutes(slot1.end);
  const start2 = timeToMinutes(slot2.start);
  const end2 = timeToMinutes(slot2.end);

  return start1 < end2 && start2 < end1;
}

// Helper function to convert time string to minutes
function timeToMinutes (timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Instance method to assign invigilators
examSchema.methods.assignInvigilators = async function (invigilators, options = {}) {
  const {
    skipConflictCheck = false,
    filterConflicts = true,  // NEW: Auto-remove conflicts instead of throwing error
    minInvigilatorsPerExam = 1,
  } = options;

  let validInvigilators = invigilators;
  const skippedConflicts = [];

  // Check for conflicts unless explicitly skipped
  if (!skipConflictCheck && filterConflicts) {
    const conflictPromises = invigilators.map(inv =>
      mongoose.model('Exam').checkInvigilatorConflicts(
        inv.teacher,
        this.examDate,
        this.startTime,
        this.endTime,
        this._id,
      ),
    );

    const conflictResults = await Promise.all(conflictPromises);

    // Filter out conflicting invigilators
    validInvigilators = [];
    invigilators.forEach((inv, index) => {
      if (conflictResults[index].length > 0) {
        skippedConflicts.push({
          teacherId: inv.teacher,
          role: inv.role,
          conflicts: conflictResults[index],
        });
      } else {
        validInvigilators.push(inv);
      }
    });

    // Ensure minimum invigilators requirement
    if (validInvigilators.length < minInvigilatorsPerExam) {
      const error = new Error(
        `Cannot assign invigilators: Need at least ${minInvigilatorsPerExam} invigilator(s), but only ${validInvigilators.length} available without conflicts`,
      );
      error.name = 'InsufficientInvigilatorsError';
      error.skippedConflicts = skippedConflicts;
      error.validCount = validInvigilators.length;
      error.requiredCount = minInvigilatorsPerExam;
      throw error;
    }
  } else if (!skipConflictCheck && !filterConflicts) {
    // Old strict behavior: throw error on any conflict
    const conflictPromises = invigilators.map(inv =>
      mongoose.model('Exam').checkInvigilatorConflicts(
        inv.teacher,
        this.examDate,
        this.startTime,
        this.endTime,
        this._id,
      ),
    );

    const conflictResults = await Promise.all(conflictPromises);

    const allConflicts = [];
    invigilators.forEach((inv, index) => {
      if (conflictResults[index].length > 0) {
        allConflicts.push({
          teacherId: inv.teacher,
          conflicts: conflictResults[index],
        });
      }
    });

    if (allConflicts.length > 0) {
      const error = new Error('Invigilator assignment has time conflicts');
      error.name = 'InvigilatorConflictError';
      error.conflicts = allConflicts;
      throw error;
    }
  }

  this.invigilators = validInvigilators.map(inv => ({
    teacher: inv.teacher,
    role: inv.role || 'invigilator',
    assignedClassrooms: inv.assignedClassrooms || [],
  }));

  this.totalInvigilators = validInvigilators.length;

  // Return metadata about the assignment
  this._assignmentMeta = {
    requested: invigilators.length,
    assigned: validInvigilators.length,
    skipped: skippedConflicts.length,
    conflicts: skippedConflicts,
  };

  return this.save();
};

// Instance method to generate seating arrangement
examSchema.methods.generateSeatingArrangement = async function () {
  for (const classroomAssignment of this.classrooms) {
    const classroom = await mongoose.model('Classroom').findById(classroomAssignment.classroom);
    if (!classroom) continue;

    const students = classroomAssignment.assignedStudents;
    const rows = Math.ceil(classroom.capacity / 10); // Assuming 10 students per row
    const cols = 10;

    let studentIndex = 0;
    for (let row = 1; row <= rows && studentIndex < students.length; row++) {
      for (let col = 1; col <= cols && studentIndex < students.length; col++) {
        classroomAssignment.seatingArrangement.push({
          row,
          column: col,
          student: students[studentIndex],
          seatNumber: `${row}-${col}`,
        });
        studentIndex++;
      }
    }
  }

  return this.save();
};

module.exports = mongoose.model('Exam', examSchema);
