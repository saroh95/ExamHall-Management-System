const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');

// @desc    Get attendance for a specific exam
// @route   GET /api/attendance/:examId
// @access  Private
const getExamAttendance = async (req, res) => {
  try {
    const { examId } = req.params;
    const { status, department, room, search } = req.query;

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Build roster from the scheduled exam itself (authoritative source)
    const detailedExam = await Exam.findById(examId)
      .populate({ path: 'classrooms.classroom', select: 'roomNumber capacity' })
      .populate({
        path: 'classrooms.assignedStudents',
        select: 'scholarId fullName instituteEmail department',
        populate: { path: 'department', select: 'name code' },
      })
      .lean();

    if (!detailedExam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Map department names for students
    const Department = require('../models/Department');
    const studentToSeatMap = new Map();
    const studentDocsMap = new Map();
    if (Array.isArray(detailedExam.classrooms)) {
      for (const cls of detailedExam.classrooms) {
        const roomName = (cls.classroom && cls.classroom.roomNumber) || 'Room';
        const assigned = Array.isArray(cls.assignedStudents) ? cls.assignedStudents : [];
        const seating = Array.isArray(cls.seatingArrangement) ? cls.seatingArrangement : [];

        // Build seat index by student id string
        const byStudentId = new Map();
        seating.forEach((seat) => {
          const stuId = String(seat.student || '');
          if (stuId) byStudentId.set(stuId, seat);
        });

        assigned.forEach((stu) => {
          const sid = String(stu._id || stu.id || '');
          if (!sid) return;
          const seat = byStudentId.get(sid);
          const seatNumber = seat && (seat.seatNumber || seat.label || seat.code);
          studentToSeatMap.set(sid, { roomName, seatNumber: seatNumber || null });
          studentDocsMap.set(sid, stu);
        });
      }
    }

    // Get existing attendance records
    const attendanceRecords = await Attendance.find({ examId })
      .populate('studentId', 'rollNumber firstName lastName email departmentId')
      .populate('markedBy', 'username firstName lastName')
      .populate('seatId', 'name roomNumber capacity');

    // Create a map of existing attendance
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.studentId._id.toString()] = record;
    });

    // Build attendance list with all enrolled students
    // Build list from assigned students (fallback to enrollments if needed)
    const sourceStudentIds = Array.from(studentDocsMap.keys());
    let attendanceList = sourceStudentIds.map((sid) => {
      const student = studentDocsMap.get(sid);
      const existingRecord = attendanceMap[student._id.toString()];
      const seatInfo = studentToSeatMap.get(String(student._id));

      return {
        studentId: student._id,
        // Map to legacy frontend field names
        rollNumber: student.scholarId,
        firstName: student.fullName,
        lastName: '',
        email: student.instituteEmail,
        department: (student.department && (student.department.name || student.department)) || 'N/A',
        departmentCode: (student.department && student.department.code) || 'N/A',
        status: existingRecord?.status || 'not_taken',
        markedAt: existingRecord?.markedAt || null,
        markedBy: existingRecord?.markedBy || null,
        method: existingRecord?.method || 'manual',
        notes: existingRecord?.notes || '',
        lateReason: existingRecord?.lateReason || '',
        seatId: existingRecord?.seatId || null,
        // Prefer enriched seating info from exam → falls back to whatever exists on record
        seatName: (seatInfo && (seatInfo.seatNumber || seatInfo.roomName)) || existingRecord?.seatId?.name || null,
        roomName: seatInfo && seatInfo.roomName ? seatInfo.roomName : null,
      };
    });

    // Apply filters
    if (status) {
      attendanceList = attendanceList.filter(record => record.status === status);
    }

    if (department) {
      attendanceList = attendanceList.filter(record =>
        record.department.toLowerCase().includes(department.toLowerCase()) ||
        record.departmentCode.toLowerCase().includes(department.toLowerCase()),
      );
    }

    if (room) {
      const roomLower = room.toLowerCase();
      attendanceList = attendanceList.filter(record => {
        const bySeat = record.seatName && String(record.seatName).toLowerCase().includes(roomLower);
        const byRoom = record.roomName && String(record.roomName).toLowerCase().includes(roomLower);
        return bySeat || byRoom;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      attendanceList = attendanceList.filter(record =>
        record.rollNumber.toLowerCase().includes(searchLower) ||
        record.firstName.toLowerCase().includes(searchLower) ||
        record.lastName.toLowerCase().includes(searchLower) ||
        record.email.toLowerCase().includes(searchLower),
      );
    }

    // Calculate summary
    const summary = {
      total: attendanceList.length,
      present: attendanceList.filter(r => r.status === 'present').length,
      absent: attendanceList.filter(r => r.status === 'absent').length,
      late: attendanceList.filter(r => r.status === 'late').length,
    };

    res.json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          name: exam.name,
          date: exam.date,
          startTime: exam.startTime,
          endTime: exam.endTime,
        },
        attendance: attendanceList,
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

// @desc    Mark attendance for students
// @route   POST /api/attendance/:examId/mark
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentIds, status, notes, lateReason, seatId } = req.body;

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Validate status (include unmark)
    if (!['present', 'absent', 'late', 'not_taken'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be present, absent, late, or not_taken',
      });
    }

    const results = [];
    const errors = [];

    // If unmarking, delete attendance records instead of upserting
    if (status === 'not_taken') {
      const delResult = await Attendance.deleteMany({ examId, studentId: { $in: studentIds } });
      const successful = studentIds.map(id => ({ studentId: id, status: 'not_taken', removed: true }));
      return res.json({
        success: true,
        message: `Unmarked attendance for ${delResult.deletedCount} records`,
        data: { successful, errors: [] },
      });
    }

    // Process each student for marking
    for (const studentId of studentIds) {
      try {
        // Check if student is enrolled in this exam
        const enrollment = await Enrollment.findOne({ examId, studentId });
        if (!enrollment) {
          errors.push({
            studentId,
            error: 'Student not enrolled in this exam',
          });
          continue;
        }

        // Upsert attendance record
        const attendance = await Attendance.findOneAndUpdate(
          { examId, studentId },
          {
            status,
            markedAt: new Date(),
            markedBy: req.user.id,
            method: 'manual',
            notes: notes || '',
            lateReason: status === 'late' ? (lateReason || '') : '',
            seatId: seatId || null,
          },
          { upsert: true, new: true },
        );

        results.push({
          studentId,
          status: attendance.status,
          markedAt: attendance.markedAt,
        });
      } catch (error) {
        errors.push({
          studentId,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Attendance marked for ${results.length} students`,
      data: {
        successful: results,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message,
    });
  }
};

// @desc    Reset attendance for an exam
// @route   POST /api/attendance/:examId/reset
// @access  Private (Admin/Exam Controller only)
const resetAttendance = async (req, res) => {
  try {
    const { examId } = req.params;

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Delete all attendance records for this exam
    const result = await Attendance.deleteMany({ examId });

    res.json({
      success: true,
      message: `Reset attendance for exam. Deleted ${result.deletedCount} records.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting attendance',
      error: error.message,
    });
  }
};

// @desc    Get attendance summary for dashboard
// @route   GET /api/attendance/summary
// @access  Private
const getAttendanceSummary = async (req, res) => {
  try {
    const { examId, date } = req.query;

    const matchQuery = {};
    if (examId) {
      matchQuery.examId = examId;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const exams = await Exam.find({
        date: { $gte: startDate, $lt: endDate },
      }).select('_id');

      matchQuery.examId = { $in: exams.map(exam => exam._id) };
    }

    const summary = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    };

    summary.forEach(item => {
      result[item._id] = item.count;
      result.total += item.count;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message,
    });
  }
};

module.exports = {
  getExamAttendance,
  markAttendance,
  resetAttendance,
  getAttendanceSummary,
};
