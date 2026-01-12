/**
 * Unified Exam Scheduler Routes
 *
 * Simplified enrollment-based exam scheduling with:
 * - Automatic subject fetching from enrollments
 * - Merged classroom allocation + seating arrangement
 * - Intelligent invigilator assignment
 */

const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const unifiedScheduler = require('../services/unifiedEnrollmentScheduler');
const enhancedScheduler = require('../services/enhancedUnifiedScheduler');
const advancedScheduler = require('../services/advancedScheduler');
const intelligentParallelScheduler = require('../services/intelligentParallelScheduler');
const optimizedPreview = require('../services/optimizedPreviewService');
const balancedDutyService = require('../services/balancedDutyAssignmentService');
const Exam = require('../models/Exam');

// @route   POST /api/unified-exam-scheduler/preview
// @desc    Preview subjects with enrolled students before scheduling
// @access  Private (Admin)
router.post('/preview', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { semesters, departments, academicYear } = req.body;

    console.log('\n📊 Generating enrollment preview...');
    console.log('   Semesters:', semesters);
    console.log('   Departments:', departments || 'All');

    console.log('   Fetching subjects...');
    const subjects = await optimizedPreview.getSubjectsWithEnrollments({
      semesters,
      departments,
      academicYear: academicYear || optimizedPreview.getCurrentAcademicYear(),
    });

    console.log(`   ✅ Retrieved ${subjects.length} subjects`);

    // Group by semester
    const bySemester = {};
    subjects.forEach(s => {
      // Skip if subject data is missing
      if (!s.subject) {
        console.warn('   ⚠️  Skipping enrollment with missing subject data');
        return;
      }

      const sem = s.semesterId;
      if (!bySemester[sem]) {
        bySemester[sem] = {
          semester: sem,
          subjects: [],
          totalStudents: 0,
          estimatedClassrooms: 0,
        };
      }

      const estimatedClassrooms = Math.ceil(s.totalStudents / 36); // 60% of 60-seat room

      bySemester[sem].subjects.push({
        code: s.subject.code,
        name: s.subject.name,
        type: s.subject.type,
        students: s.totalStudents,
        departments: s.departmentNames,
        estimatedClassrooms,
      });

      bySemester[sem].totalStudents += s.totalStudents;
      bySemester[sem].estimatedClassrooms += estimatedClassrooms;
    });

    console.log('   Processing summary...');

    const summary = {
      totalSubjects: subjects.length,
      totalStudents: subjects.reduce((sum, s) => sum + s.totalStudents, 0),
      estimatedClassrooms: Object.values(bySemester).reduce((sum, s) => sum + s.estimatedClassrooms, 0),
      estimatedInvigilators: Object.values(bySemester).reduce((sum, s) => sum + s.estimatedClassrooms, 0) * 1.2, // 1.2 per classroom
      semesters: Object.values(bySemester),
    };

    console.log('   Preparing response...');

    // Filter out any null subjects
    const validSubjects = subjects.filter(s => s.subject);

    console.log(`✅ Preview generated successfully (${validSubjects.length} valid subjects)\n`);

    const responseData = {
      success: true,
      data: {
        summary,
        subjects: validSubjects.map(s => ({
          _id: s.subject._id,
          code: s.subject.code,
          name: s.subject.name,
          semester: s.semesterId,
          type: s.subject.type,
          students: s.totalStudents,
          departments: s.departmentNames,
          estimatedClassrooms: Math.ceil(s.totalStudents / 36),
        })),
      },
    };

    console.log('   📤 Sending response to client...');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating preview',
      error: error.message,
    });
  }
});

// @route   POST /api/unified-exam-scheduler/schedule
// @desc    Schedule exams with unified classroom allocation + seating
// @access  Private (Admin)
router.post('/schedule', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const {
      examType,           // "Mid-Semester" or "End-Semester"
      semesters,          // [2, 4, 6, 8]
      departments,        // ["CSE_ID", "ECE_ID"] or null for all
      dateRange,          // { start: "2025-05-05", end: "2025-05-15" }
      timeSlots,          // [{ start: "10:00", end: "13:00" }, { start: "14:00", end: "17:00" }]
      seatingStrategy,    // "alternate", "department-wise", "random"
      academicYear,       // "2024-2025"
      useSmartScheduling, // true = use enhanced scheduler with conflict detection
      useAdvancedScheduling, // true = use advanced scheduler (department-aware, electives grouping, consistent classrooms)
      useParallelScheduling, // true = use intelligent parallel scheduler (multiple exams per day, no conflicts)
    } = req.body;

    // Validate inputs
    if (!examType || !semesters || !dateRange || !timeSlots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: examType, semesters, dateRange, timeSlots',
      });
    }

    if (!dateRange.start || !dateRange.end) {
      return res.status(400).json({
        success: false,
        message: 'Date range must have start and end dates',
      });
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one time slot is required',
      });
    }

    // Choose scheduler based on flags (priority: parallel > advanced > enhanced > standard)
    let scheduler, schedulerType;

    if (useParallelScheduling) {
      scheduler = intelligentParallelScheduler;
      schedulerType = 'Intelligent Parallel (Multiple Exams Per Day, No Conflicts)';
    } else if (useAdvancedScheduling) {
      scheduler = advancedScheduler;
      schedulerType = 'Advanced (Department-Aware + Consistent Classrooms)';
    } else if (useSmartScheduling) {
      scheduler = enhancedScheduler;
      schedulerType = 'Enhanced (Smart Conflict Detection)';
    } else {
      scheduler = unifiedScheduler;
      schedulerType = 'Standard';
    }

    console.log(`📊 Using ${schedulerType} scheduler`);

    // Schedule exams using selected scheduler
    const result = await scheduler.scheduleExams({
      examType,
      semesters,
      departments,
      dateRange,
      timeSlots,
      seatingStrategy: seatingStrategy || 'alternate',
      academicYear,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Successfully scheduled ${result.examsScheduled} exams using ${schedulerType} scheduler`,
      data: result,
    });

  } catch (error) {
    console.error('\n❌ Scheduling error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error scheduling exams',
      error: error.message,
    });
  }
});

// @route   GET /api/unified-exam-scheduler/exam/:examId
// @desc    Get detailed exam with classroom seating and invigilators
// @access  Private
router.get('/exam/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate({
        path: 'subject',
        select: 'code name semesterId type credits courseCoordinator',
        populate: {
          path: 'courseCoordinator',
          select: 'name employeeId',
        },
      })
      .populate('departments', 'name code')
      .populate({
        path: 'classrooms.classroom',
        select: 'name building floor capacity layout maintenanceStatus',
      })
      .populate({
        path: 'classrooms.assignedStudents',
        select: 'scholarId fullName email department semester',
        populate: { path: 'department', select: 'name code' },
      })
      .populate({
        path: 'invigilators.teacher',
        select: 'fullName employeeId personalEmail department',
        populate: { path: 'department', select: 'name code' },
      });

    console.log('📋 Exam details fetched:');
    console.log('   Exam ID:', req.params.examId);
    console.log('   Invigilators count:', exam?.invigilators?.length || 0);
    if (exam?.invigilators?.length > 0) {
      console.log('   First invigilator:', {
        teacherId: exam.invigilators[0].teacher?._id || exam.invigilators[0].teacher,
        teacherName: exam.invigilators[0].teacher?.name,
        role: exam.invigilators[0].role,
      });
    }

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    res.json({
      success: true,
      data: exam,
    });

  } catch (error) {
    console.error('❌ Error fetching exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam details',
      error: error.message,
    });
  }
});

// @route   GET /api/unified-exam-scheduler/exams
// @desc    Get all scheduled exams with filters
// @access  Private
router.get('/exams', protect, async (req, res) => {
  try {
    const { semester, department, startDate, endDate, status } = req.query;

    const query = { isActive: true };

    if (semester) {
      query.semester = `Semester ${semester}`;
    }

    if (department) {
      query.departments = department;
    }

    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    if (status) {
      query.status = status;
    }

    const exams = await Exam.find(query)
      .populate({
        path: 'subject',
        select: 'code name semesterId type courseCoordinator',
        populate: {
          path: 'courseCoordinator',
          select: 'name employeeId',
        },
      })
      .populate('departments', 'name code')
      .populate('classrooms.classroom', 'roomNumber building capacity')
      .populate('invigilators.teacher', 'name employeeId')
      .sort({ examDate: 1, startTime: 1 });

    res.json({
      success: true,
      count: exams.length,
      data: exams,
    });

  } catch (error) {
    console.error('❌ Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message,
    });
  }
});

// @route   GET /api/unified-exam-scheduler/student/:studentId/schedule
// @desc    Get exam schedule for a specific student (Hall Ticket)
// @access  Private
router.get('/student/:studentId/schedule', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      'classrooms.assignedStudents': studentId,
      status: { $in: ['scheduled', 'in_progress'] },
    };

    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    const exams = await Exam.find(query)
      .populate({
        path: 'subject',
        select: 'code name courseCoordinator',
        populate: {
          path: 'courseCoordinator',
          select: 'name employeeId',
        },
      })
      .populate({
        path: 'classrooms.classroom',
        select: 'name building floor',
      })
      .sort({ examDate: 1, startTime: 1 });

    // Find student's seat in each exam
    const studentSchedule = exams.map(exam => {
      const classroomData = exam.classrooms.find(c =>
        c.assignedStudents.some(s => s.toString() === studentId.toString()),
      );

      const seat = classroomData?.seatingArrangement?.find(s =>
        s.student?.toString() === studentId.toString(),
      );

      return {
        examId: exam._id,
        subject: exam.subject,
        examDate: exam.examDate,
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
      count: studentSchedule.length,
      data: studentSchedule,
    });

  } catch (error) {
    console.error('❌ Error fetching student schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student schedule',
      error: error.message,
    });
  }
});

// @route   GET /api/unified-exam-scheduler/teacher/:teacherId/duty-roster
// @desc    Get invigilation duty roster for a teacher
// @access  Private
router.get('/teacher/:teacherId/duty-roster', protect, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      'invigilators.teacher': teacherId,
      status: { $in: ['scheduled', 'in_progress'] },
    };

    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    const exams = await Exam.find(query)
      .populate({
        path: 'subject',
        select: 'code name courseCoordinator',
        populate: {
          path: 'courseCoordinator',
          select: 'name employeeId',
        },
      })
      .populate('classrooms.classroom', 'roomNumber building floor capacity')
      .sort({ examDate: 1, startTime: 1 });

    // Extract teacher's duties
    const dutyRoster = exams.map(exam => {
      const invigilatorData = exam.invigilators.find(inv =>
        inv.teacher.toString() === teacherId.toString(),
      );

      const assignedClassrooms = exam.classrooms.filter(c =>
        invigilatorData?.assignedClassrooms?.some(ac =>
          ac.toString() === c.classroom._id.toString(),
        ),
      );

      return {
        examId: exam._id,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        role: invigilatorData?.role || 'invigilator',
        classrooms: assignedClassrooms.map(c => c.classroom),
        totalStudents: assignedClassrooms.reduce((sum, c) => sum + c.assignedStudents.length, 0),
      };
    });

    res.json({
      success: true,
      count: dutyRoster.length,
      data: dutyRoster,
    });

  } catch (error) {
    console.error('❌ Error fetching duty roster:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching duty roster',
      error: error.message,
    });
  }
});

// @route   POST /api/unified-exam-scheduler/exam/:examId/check-conflicts
// @desc    Check for invigilator time conflicts before assignment
// @access  Private (Admin)
router.post('/exam/:examId/check-conflicts', protect, async (req, res) => {
  try {
    const { teacherIds } = req.body;

    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'teacherIds array is required',
      });
    }

    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Check conflicts for each teacher
    const conflictResults = await Promise.all(
      teacherIds.map(teacherId =>
        Exam.checkInvigilatorConflicts(
          teacherId,
          exam.examDate,
          exam.startTime,
          exam.endTime,
          exam._id,
        ),
      ),
    );

    // Build response with teacher details
    const conflicts = [];
    for (let i = 0; i < teacherIds.length; i++) {
      if (conflictResults[i].length > 0) {
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findById(teacherIds[i]).select('fullName employeeId');

        conflicts.push({
          teacherId: teacherIds[i],
          teacherName: teacher?.fullName || 'Unknown',
          employeeId: teacher?.employeeId || 'N/A',
          conflicts: conflictResults[i],
        });
      }
    }

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
    });

  } catch (error) {
    console.error('❌ Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking conflicts',
      error: error.message,
    });
  }
});

// @route   PUT /api/unified-exam-scheduler/exam/:examId/invigilators
// @desc    Update exam invigilators with conflict checking
// @access  Private (Admin)
router.put('/exam/:examId/invigilators', protect, checkPermission('update_exam'), async (req, res) => {
  try {
    const {
      invigilators,
      skipConflictCheck = false,
      filterConflicts = true,  // Auto-remove conflicts (default)
      minInvigilatorsPerExam = 1,
    } = req.body;

    if (!Array.isArray(invigilators)) {
      return res.status(400).json({
        success: false,
        message: 'invigilators array is required',
      });
    }

    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    try {
      // Assign invigilators with flexible options
      await exam.assignInvigilators(invigilators, {
        skipConflictCheck,
        filterConflicts,
        minInvigilatorsPerExam,
      });

      // Get assignment metadata
      const assignmentMeta = exam._assignmentMeta || {
        requested: invigilators.length,
        assigned: exam.invigilators.length,
        skipped: 0,
        conflicts: [],
      };

      // Populate for response
      await exam.populate({
        path: 'invigilators.teacher',
        select: 'fullName employeeId personalEmail department',
        populate: { path: 'department', select: 'name code' },
      });

      // Build response message
      let message = 'Invigilators assigned successfully';
      let warnings = [];

      if (assignmentMeta.skipped > 0) {
        message = `Assigned ${assignmentMeta.assigned}/${assignmentMeta.requested} invigilators (${assignmentMeta.skipped} skipped due to conflicts)`;

        // Enrich skipped conflicts with teacher details
        const Teacher = require('../models/Teacher');
        warnings = await Promise.all(
          assignmentMeta.conflicts.map(async (conflict) => {
            const teacher = await Teacher.findById(conflict.teacherId).select('fullName employeeId');
            return {
              teacherId: conflict.teacherId,
              teacherName: teacher?.fullName || 'Unknown',
              employeeId: teacher?.employeeId || 'N/A',
              role: conflict.role,
              conflictsWith: conflict.conflicts.map(c => ({
                subject: c.subject?.name || 'Unknown',
                date: c.examDate,
                time: `${c.startTime} - ${c.endTime}`,
              })),
            };
          }),
        );
      }

      res.json({
        success: true,
        message,
        warnings: warnings.length > 0 ? warnings : undefined,
        data: exam,
        meta: {
          requested: assignmentMeta.requested,
          assigned: assignmentMeta.assigned,
          skipped: assignmentMeta.skipped,
        },
      });

    } catch (error) {
      // Handle insufficient invigilators error
      if (error.name === 'InsufficientInvigilatorsError') {
        const Teacher = require('../models/Teacher');

        const enrichedConflicts = await Promise.all(
          (error.skippedConflicts || []).map(async (conflict) => {
            const teacher = await Teacher.findById(conflict.teacherId).select('fullName employeeId');
            return {
              teacherId: conflict.teacherId,
              teacherName: teacher?.fullName || 'Unknown',
              employeeId: teacher?.employeeId || 'N/A',
              role: conflict.role,
              conflicts: conflict.conflicts,
            };
          }),
        );

        return res.status(400).json({
          success: false,
          message: error.message,
          error: 'InsufficientInvigilatorsError',
          details: {
            required: error.requiredCount,
            availableWithoutConflicts: error.validCount,
            totalRequested: invigilators.length,
            skippedDueToConflicts: enrichedConflicts,
          },
        });
      }

      // Handle strict conflict errors (when filterConflicts=false)
      if (error.name === 'InvigilatorConflictError') {
        const Teacher = require('../models/Teacher');

        const enrichedConflicts = await Promise.all(
          error.conflicts.map(async (conflict) => {
            const teacher = await Teacher.findById(conflict.teacherId).select('fullName employeeId');
            return {
              ...conflict,
              teacherName: teacher?.fullName || 'Unknown',
              employeeId: teacher?.employeeId || 'N/A',
            };
          }),
        );

        return res.status(409).json({
          success: false,
          message: 'Cannot assign invigilators due to time conflicts',
          error: 'InvigilatorConflictError',
          conflicts: enrichedConflicts,
        });
      }

      throw error; // Re-throw if it's not a handled error
    }

  } catch (error) {
    console.error('❌ Error updating invigilators:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invigilators',
      error: error.message,
    });
  }
});

// @route   GET /api/unified-exam-scheduler/rotation-status
// @desc    Get teacher rotation status and statistics
// @access  Private (Admin)
router.get('/rotation-status', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    const service = balancedDutyService.getInstance();
    const rotationStats = service.getRotationStatistics();

    // Get teacher duty statistics
    const dutyStats = await service.getTeacherDutyStatistics();

    res.json({
      success: true,
      data: {
        rotation: rotationStats,
        duties: dutyStats,
        message: 'Teacher rotation status retrieved successfully',
      },
    });
  } catch (error) {
    console.error('Error getting rotation status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving rotation status',
      error: error.message,
    });
  }
});

// @route   POST /api/unified-exam-scheduler/reset-rotation
// @desc    Reset teacher rotation index
// @access  Private (Admin)
router.post('/reset-rotation', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const service = balancedDutyService.getInstance();
    service.resetGlobalIndex();

    res.json({
      success: true,
      message: 'Teacher rotation index reset successfully',
      data: {
        globalIndex: service.getGlobalIndex(),
        totalAssigned: service.totalTeachersAssigned,
      },
    });
  } catch (error) {
    console.error('Error resetting rotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting rotation index',
      error: error.message,
    });
  }
});

// @route   DELETE /api/unified-exam-scheduler/exam/:examId
// @desc    Delete/cancel an exam
// @access  Private (Admin)
router.delete('/exam/:examId', protect, checkPermission('delete_exam'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    exam.status = 'cancelled';
    exam.isActive = false;
    await exam.save();

    res.json({
      success: true,
      message: 'Exam cancelled successfully',
      data: exam,
    });

  } catch (error) {
    console.error('❌ Error cancelling exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling exam',
      error: error.message,
    });
  }
});

module.exports = router;

