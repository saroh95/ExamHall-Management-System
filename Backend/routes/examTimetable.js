/**
 * Exam Timetable Routes
 * Generate printable/exportable exam timetables
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Exam = require('../models/Exam');

// @route   GET /api/exam-timetable/generate
// @desc    Generate exam timetable for given criteria
// @access  Private
router.get('/generate', protect, async (req, res) => {
  try {
    const { semesters, startDate, endDate, academicYear } = req.query;

    const query = {
      isActive: true,
      status: { $in: ['scheduled', 'in_progress'] },
    };

    if (semesters) {
      const semesterArray = semesters.split(',').map(s => `Semester ${s.trim()}`);
      query.semester = { $in: semesterArray };
    }

    if (startDate && endDate) {
      query.examDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    const exams = await Exam.find(query)
      .populate({
        path: 'subject',
        select: 'code name type credits courseCoordinator',
        populate: {
          path: 'courseCoordinator',
          select: 'name employeeId',
        },
      })
      .populate('departments', 'name code')
      .populate('classrooms.classroom', 'roomNumber building floor capacity')
      .populate('invigilators.teacher', 'name employeeId')
      .sort({ examDate: 1, startTime: 1 });

    // Group by date
    const timetableByDate = {};

    exams.forEach(exam => {
      const dateKey = exam.examDate.toISOString().split('T')[0];

      if (!timetableByDate[dateKey]) {
        timetableByDate[dateKey] = {
          date: exam.examDate,
          exams: [],
        };
      }

      timetableByDate[dateKey].exams.push({
        _id: exam._id,
        subject: exam.subject,
        courseCoordinator: exam.subject?.courseCoordinator || null,
        semester: exam.semester,
        time: `${exam.startTime} - ${exam.endTime}`,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalStudents: exam.totalStudents,
        classrooms: exam.classrooms.map(c => ({
          classroom: c.classroom,
          studentsCount: c.assignedStudents.length,
        })),
        invigilators: exam.invigilators.map(inv => ({
          teacher: inv.teacher,
          role: inv.role,
        })),
        departments: exam.departments,
      });
    });

    // Convert to array and sort
    const timetable = Object.entries(timetableByDate)
      .map(([date, data]) => ({
        date,
        dateFormatted: new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        exams: data.exams.sort((a, b) => {
          if (a.startTime < b.startTime) return -1;
          if (a.startTime > b.startTime) return 1;
          return 0;
        }),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate statistics
    const stats = {
      totalExams: exams.length,
      totalDays: timetable.length,
      totalStudents: exams.reduce((sum, e) => sum + e.totalStudents, 0),
      totalClassrooms: exams.reduce((sum, e) => sum + e.classrooms.length, 0),
      bySemester: {},
    };

    exams.forEach(exam => {
      if (!stats.bySemester[exam.semester]) {
        stats.bySemester[exam.semester] = {
          exams: 0,
          students: 0,
        };
      }
      stats.bySemester[exam.semester].exams++;
      stats.bySemester[exam.semester].students += exam.totalStudents;
    });

    res.json({
      success: true,
      data: {
        timetable,
        stats,
      },
    });

  } catch (error) {
    console.error('Error generating timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating timetable',
      error: error.message,
    });
  }
});

// @route   GET /api/exam-timetable/student/:studentId
// @desc    Get student-specific timetable (Hall Ticket)
// @access  Private
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;

    const exams = await Exam.find({
      'classrooms.assignedStudents': studentId,
      status: { $in: ['scheduled', 'in_progress'] },
    })
      .populate('subject', 'code name')
      .populate('classrooms.classroom', 'roomNumber building floor')
      .sort({ examDate: 1, startTime: 1 });

    const timetable = exams.map(exam => {
      // Find student's classroom and seat
      const classroomData = exam.classrooms.find(c =>
        c.assignedStudents.some(s => s.toString() === studentId.toString()),
      );

      const seat = classroomData?.seatingArrangement?.find(s =>
        s.student?.toString() === studentId.toString(),
      );

      return {
        examId: exam._id,
        subject: exam.subject,
        date: exam.examDate,
        dateFormatted: exam.examDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: `${exam.startTime} - ${exam.endTime}`,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        classroom: classroomData?.classroom,
        seat: seat?.seatNumber,
        row: seat?.row,
        column: seat?.column,
      };
    });

    res.json({
      success: true,
      data: {
        studentId,
        timetable,
        totalExams: timetable.length,
      },
    });

  } catch (error) {
    console.error('Error generating student timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating student timetable',
      error: error.message,
    });
  }
});

// @route   GET /api/exam-timetable/seating/:examId
// @desc    Get seating arrangement for an exam
// @access  Private
router.get('/seating/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('subject', 'code name')
      .populate('classrooms.classroom', 'roomNumber building floor capacity layout')
      .populate({
        path: 'classrooms.assignedStudents',
        select: 'scholarId fullName department semester',
        populate: { path: 'department', select: 'name code' },
      })
      .populate('invigilators.teacher', 'name employeeId');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const seatingData = exam.classrooms.map(classroomData => ({
      classroom: classroomData.classroom,
      totalSeats: classroomData.classroom.capacity,
      occupiedSeats: classroomData.seatingArrangement.filter(s => s.isOccupied).length,
      seatingArrangement: classroomData.seatingArrangement,
      assignedStudents: classroomData.assignedStudents,
      invigilators: exam.invigilators.filter(inv =>
        inv.assignedClassrooms.some(ac =>
          ac.toString() === classroomData.classroom._id.toString(),
        ),
      ),
    }));

    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          subject: exam.subject,
          date: exam.examDate,
          time: `${exam.startTime} - ${exam.endTime}`,
          semester: exam.semester,
        },
        seating: seatingData,
      },
    });

  } catch (error) {
    console.error('Error fetching seating:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seating arrangement',
      error: error.message,
    });
  }
});

module.exports = router;

