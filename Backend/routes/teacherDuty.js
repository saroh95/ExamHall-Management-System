/**
 * Teacher Duty Management Routes
 *
 * Endpoints for viewing and managing teacher duty assignments
 */

const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const balancedDutyService = require('../services/balancedDutyAssignmentService');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');

/**
 * @route   GET /api/teacher-duty/statistics
 * @desc    Get teacher duty statistics and balance
 * @access  Private (Admin)
 */
router.get('/statistics', protect, checkPermission('view_reports'), async (req, res) => {
  try {
    const statistics = await balancedDutyService.getTeacherDutyStatistics();

    res.json({
      success: true,
      message: 'Teacher duty statistics retrieved successfully',
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching duty statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching duty statistics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/teacher-duty/balance-report
 * @desc    Get detailed balance report for all teachers
 * @access  Private (Admin)
 */
router.get('/balance-report', protect, checkPermission('view_reports'), async (req, res) => {
  try {
    const statistics = await balancedDutyService.getTeacherDutyStatistics();

    // Format for easy viewing
    const report = {
      summary: {
        totalTeachers: statistics.totalTeachers,
        teachersWithDuties: statistics.teachersWithDuties,
        teachersWithoutDuties: statistics.teachersWithoutDuties,
        averageDuties: statistics.avgDuties,
        balanceScore: statistics.balanceScore,
        balanceQuality: statistics.balanceScore <= 5 ? 'Excellent' :
          statistics.balanceScore <= 10 ? 'Good' :
            statistics.balanceScore <= 20 ? 'Fair' : 'Poor',
      },
      teachersNeedingDuties: statistics.teachersNeedingDuties,
      distribution: statistics.distribution.map(t => ({
        name: t.teacherName,
        employeeId: t.employeeId,
        duties: t.duties,
        status: t.duties === 0 ? 'No duties' :
          t.duties < parseFloat(statistics.avgDuties) ? 'Below average' :
            t.duties > parseFloat(statistics.avgDuties) ? 'Above average' :
              'Average',
      })),
      recommendations: [],
    };

    // Add recommendations
    if (statistics.teachersWithoutDuties > 0) {
      report.recommendations.push({
        type: 'warning',
        message: `${statistics.teachersWithoutDuties} teacher(s) have no duties assigned. Consider rebalancing.`,
      });
    }

    if (statistics.balanceScore > 10) {
      report.recommendations.push({
        type: 'warning',
        message: `Duty distribution is unbalanced (score: ${statistics.balanceScore}). Run rebalance to improve fairness.`,
      });
    }

    if (statistics.balanceScore <= 5) {
      report.recommendations.push({
        type: 'success',
        message: 'Duty distribution is well balanced!',
      });
    }

    res.json({
      success: true,
      message: 'Balance report generated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error generating balance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating balance report',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/teacher-duty/teacher/:teacherId
 * @desc    Get duty details for a specific teacher
 * @access  Private
 */
router.get('/teacher/:teacherId', protect, async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Get all duties for this teacher
    const exams = await Exam.find({
      'invigilators.teacher': teacherId,
      isActive: true,
    })
      .populate('subject', 'code name')
      .populate('classrooms.classroom', 'roomNumber building')
      .sort({ examDate: 1, startTime: 1 })
      .lean();

    const duties = exams.map(exam => {
      const invigilatorData = exam.invigilators.find(inv =>
        inv.teacher.toString() === teacherId,
      );

      return {
        examId: exam._id,
        examTitle: exam.title,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        role: invigilatorData?.role || 'invigilator',
        classrooms: invigilatorData?.assignedClassrooms || [],
        status: exam.status,
      };
    });

    // Separate past and upcoming duties
    const now = new Date();
    const upcomingDuties = duties.filter(d => new Date(d.examDate) >= now);
    const pastDuties = duties.filter(d => new Date(d.examDate) < now);

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          employeeId: teacher.employeeId,
          department: teacher.department,
        },
        summary: {
          totalDuties: duties.length,
          upcomingDuties: upcomingDuties.length,
          pastDuties: pastDuties.length,
          chiefDuties: duties.filter(d => d.role === 'chief_invigilator').length,
          regularDuties: duties.filter(d => d.role === 'invigilator').length,
        },
        upcomingDuties,
        pastDuties,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher duties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher duties',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/teacher-duty/rebalance
 * @desc    Rebalance all future exam duties
 * @access  Private (Admin)
 */
router.post('/rebalance', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    console.log('\n🔄 Starting duty rebalance requested by:', req.user.name);

    const result = await balancedDutyService.rebalanceAllFutureDuties();

    res.json({
      success: result.success,
      message: `Rebalanced ${result.rebalancedCount} out of ${result.totalExams} exams`,
      data: {
        rebalancedCount: result.rebalancedCount,
        totalExams: result.totalExams,
        statistics: result.statistics,
      },
    });
  } catch (error) {
    console.error('Error rebalancing duties:', error);
    res.status(500).json({
      success: false,
      message: 'Error rebalancing duties',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/teacher-duty/conflicts
 * @desc    Check for duty conflicts (teacher at 2 places at same time)
 * @access  Private (Admin)
 */
router.get('/conflicts', protect, checkPermission('view_reports'), async (req, res) => {
  try {
    const exams = await Exam.find({
      status: { $in: ['scheduled', 'in_progress'] },
      isActive: true,
    })
      .select('invigilators examDate startTime endTime title')
      .lean();

    // Build slot -> teachers map
    const slotTeachers = new Map();
    const conflicts = [];

    exams.forEach(exam => {
      const slotKey = `${new Date(exam.examDate).toDateString()}-${exam.startTime}-${exam.endTime}`;

      if (!slotTeachers.has(slotKey)) {
        slotTeachers.set(slotKey, new Map());
      }

      const slotMap = slotTeachers.get(slotKey);

      exam.invigilators.forEach(inv => {
        const teacherId = inv.teacher.toString();

        if (slotMap.has(teacherId)) {
          // Conflict found!
          conflicts.push({
            teacherId,
            date: exam.examDate,
            timeSlot: `${exam.startTime}-${exam.endTime}`,
            exams: [
              slotMap.get(teacherId),
              { examId: exam._id, title: exam.title },
            ],
          });
        } else {
          slotMap.set(teacherId, { examId: exam._id, title: exam.title });
        }
      });
    });

    res.json({
      success: true,
      message: conflicts.length === 0 ? 'No conflicts found' : `Found ${conflicts.length} conflict(s)`,
      data: {
        conflictCount: conflicts.length,
        conflicts,
      },
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking conflicts',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/teacher-duty/workload-chart
 * @desc    Get data for workload distribution chart
 * @access  Private (Admin)
 */
router.get('/workload-chart', protect, checkPermission('view_reports'), async (req, res) => {
  try {
    const statistics = await balancedDutyService.getTeacherDutyStatistics();

    // Group teachers by duty count for chart
    const dutyBuckets = {};

    statistics.distribution.forEach(teacher => {
      const bucket = Math.floor(teacher.duties / 5) * 5; // Group by 5s (0-4, 5-9, 10-14, etc.)
      const label = `${bucket}-${bucket + 4}`;

      if (!dutyBuckets[label]) {
        dutyBuckets[label] = 0;
      }
      dutyBuckets[label]++;
    });

    const chartData = Object.entries(dutyBuckets)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([range, count]) => ({ range, count }));

    res.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalTeachers: statistics.totalTeachers,
          avgDuties: statistics.avgDuties,
          balanceScore: statistics.balanceScore,
        },
      },
    });
  } catch (error) {
    console.error('Error generating chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating chart data',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/teacher-duty/upcoming-week
 * @desc    Get duty roster for upcoming week
 * @access  Private
 */
router.get('/upcoming-week', protect, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const exams = await Exam.find({
      examDate: { $gte: now, $lte: nextWeek },
      status: { $in: ['scheduled', 'in_progress'] },
      isActive: true,
    })
      .populate('subject', 'code name')
      .populate('invigilators.teacher', 'name employeeId')
      .populate('classrooms.classroom', 'roomNumber')
      .sort({ examDate: 1, startTime: 1 })
      .lean();

    // Group by date
    const dutyRoster = {};

    exams.forEach(exam => {
      const dateKey = new Date(exam.examDate).toLocaleDateString();

      if (!dutyRoster[dateKey]) {
        dutyRoster[dateKey] = [];
      }

      dutyRoster[dateKey].push({
        examId: exam._id,
        title: exam.title,
        subject: exam.subject,
        startTime: exam.startTime,
        endTime: exam.endTime,
        invigilators: exam.invigilators.map(inv => ({
          teacher: inv.teacher,
          role: inv.role,
          classrooms: inv.assignedClassrooms,
        })),
        totalInvigilators: exam.invigilators.length,
      });
    });

    res.json({
      success: true,
      data: {
        dateRange: {
          from: now,
          to: nextWeek,
        },
        roster: dutyRoster,
        totalExams: exams.length,
      },
    });
  } catch (error) {
    console.error('Error fetching upcoming duties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming duties',
      error: error.message,
    });
  }
});

module.exports = router;

