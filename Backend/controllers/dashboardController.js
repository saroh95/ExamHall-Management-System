const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const User = require('../models/User');

/**
 * Get overall dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get counts for all entities
    const [
      totalStudents,
      totalTeachers,
      totalExams,
      totalClassrooms,
      totalSubjects,
      totalDepartments,
      activeStudents,
      activeTeachers,
      upcomingExams,
      completedExams,
      totalUsers,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Exam.countDocuments(),
      Classroom.countDocuments(),
      Subject.countDocuments(),
      Department.countDocuments(),
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Exam.countDocuments({ examDate: { $gte: new Date() } }),
      Exam.countDocuments({ examDate: { $lt: new Date() } }),
      User.countDocuments(),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      recentStudents,
      recentTeachers,
      recentExams,
      recentUsers,
    ] = await Promise.all([
      Student.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Teacher.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Exam.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Calculate utilization rates
    const totalClassroomCapacity = await Classroom.aggregate([
      { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } },
    ]);

    const totalAssignedStudents = await Exam.aggregate([
      { $unwind: '$classrooms' },
      { $unwind: '$classrooms.assignedStudents' },
      { $group: { _id: null, totalAssigned: { $sum: 1 } } },
    ]);

    const classroomUtilization = totalClassroomCapacity.length > 0 && totalAssignedStudents.length > 0
      ? Math.round((totalAssignedStudents[0].totalAssigned / totalClassroomCapacity[0].totalCapacity) * 100)
      : 0;

    const stats = {
      overview: {
        totalStudents,
        totalTeachers,
        totalExams,
        totalClassrooms,
        totalSubjects,
        totalDepartments,
        totalUsers,
      },
      active: {
        activeStudents,
        activeTeachers,
        upcomingExams,
        completedExams,
      },
      recent: {
        recentStudents,
        recentTeachers,
        recentExams,
        recentUsers,
      },
      utilization: {
        classroomUtilization: `${classroomUtilization}%`,
        totalClassroomCapacity: totalClassroomCapacity.length > 0 ? totalClassroomCapacity[0].totalCapacity : 0,
        totalAssignedStudents: totalAssignedStudents.length > 0 ? totalAssignedStudents[0].totalAssigned : 0,
      },
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get department-wise statistics
 */
const getDepartmentStats = async (req, res) => {
  try {
    const departmentStats = await Department.aggregate([
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
        $project: {
          name: 1,
          code: 1,
          studentCount: { $size: '$students' },
          teacherCount: { $size: '$teachers' },
          subjectCount: { $size: '$subjects' },
          activeStudents: {
            $size: {
              $filter: {
                input: '$students',
                cond: { $eq: ['$$this.isActive', true] },
              },
            },
          },
          activeTeachers: {
            $size: {
              $filter: {
                input: '$teachers',
                cond: { $eq: ['$$this.isActive', true] },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({
      success: true,
      message: 'Department statistics retrieved successfully',
      data: departmentStats,
    });

  } catch (error) {
    console.error('Error getting department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving department statistics',
      error: error.message,
    });
  }
};

/**
 * Get exam statistics
 */
const getExamStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Get exam statistics by type
    const examTypeStats = await Exam.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalMarks: { $sum: '$totalMarks' },
          avgDuration: { $avg: '$duration' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get exam statistics by semester
    const examSemesterStats = await Exam.aggregate([
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
          totalMarks: { $sum: '$totalMarks' },
          avgDuration: { $avg: '$duration' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get upcoming exams (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingExams = await Exam.find({
      examDate: { $gte: currentDate, $lte: thirtyDaysFromNow },
    })
      .populate('subject', 'name code')
      .populate('departments', 'name code')
      .sort({ examDate: 1 })
      .limit(10);

    // Get recent exams (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExams = await Exam.find({
      examDate: { $gte: thirtyDaysAgo, $lte: currentDate },
    })
      .populate('subject', 'name code')
      .populate('departments', 'name code')
      .sort({ examDate: -1 })
      .limit(10);

    // Get exam statistics by academic year
    const examYearStats = await Exam.aggregate([
      {
        $group: {
          _id: '$academicYear',
          count: { $sum: 1 },
          totalMarks: { $sum: '$totalMarks' },
          avgDuration: { $avg: '$duration' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const stats = {
      byType: examTypeStats,
      bySemester: examSemesterStats,
      byYear: examYearStats,
      upcoming: upcomingExams,
      recent: recentExams,
      summary: {
        totalExams: await Exam.countDocuments(),
        upcomingCount: await Exam.countDocuments({ examDate: { $gte: currentDate } }),
        completedCount: await Exam.countDocuments({ examDate: { $lt: currentDate } }),
        thisYearCount: await Exam.countDocuments({
          academicYear: `${currentYear}-${currentYear + 1}`,
        }),
      },
    };

    res.status(200).json({
      success: true,
      message: 'Exam statistics retrieved successfully',
      data: stats,
    });

  } catch (error) {
    console.error('Error getting exam stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving exam statistics',
      error: error.message,
    });
  }
};

/**
 * Get student statistics
 */
const getStudentStats = async (req, res) => {
  try {
    // Get student statistics by department
    const studentDeptStats = await Student.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department',
        },
      },
      {
        $unwind: '$department',
      },
      {
        $group: {
          _id: '$department.name',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
          verifiedCount: {
            $sum: { $cond: ['$isEmailVerified', 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get student statistics by semester
    const studentSemesterStats = await Student.aggregate([
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
          verifiedCount: {
            $sum: { $cond: ['$isEmailVerified', 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get student statistics by batch year (normalized to string and sorted numerically desc)
    const studentBatchStats = await Student.aggregate([
      {
        $addFields: {
          batchYearStr: { $toString: '$batchYear' },
        },
      },
      {
        $group: {
          _id: '$batchYearStr',
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
          verifiedCount: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        },
      },
      {
        $addFields: { sortKey: { $toInt: '$_id' } },
      },
      { $sort: { sortKey: -1 } },
      { $project: { sortKey: 0 } },
    ]);

    // Get recent students (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStudents = await Student.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      byDepartment: studentDeptStats,
      bySemester: studentSemesterStats,
      byBatchYear: studentBatchStats,
      recent: recentStudents,
      summary: {
        totalStudents: await Student.countDocuments(),
        activeStudents: await Student.countDocuments({ isActive: true }),
        verifiedStudents: await Student.countDocuments({ isEmailVerified: true }),
        recentCount: await Student.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      },
    };

    res.status(200).json({
      success: true,
      message: 'Student statistics retrieved successfully',
      data: stats,
    });

  } catch (error) {
    console.error('Error getting student stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving student statistics',
      error: error.message,
    });
  }
};

/**
 * Get teacher statistics
 */
const getTeacherStats = async (req, res) => {
  try {
    // Get teacher statistics by department
    const teacherDeptStats = await Teacher.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department',
        },
      },
      {
        $unwind: '$department',
      },
      {
        $group: {
          _id: '$department.name',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
          verifiedCount: {
            $sum: { $cond: ['$isEmailVerified', 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get teacher statistics by designation
    const teacherDesignationStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
          verifiedCount: {
            $sum: { $cond: ['$isEmailVerified', 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get recent teachers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTeachers = await Teacher.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      byDepartment: teacherDeptStats,
      byDesignation: teacherDesignationStats,
      recent: recentTeachers,
      summary: {
        totalTeachers: await Teacher.countDocuments(),
        activeTeachers: await Teacher.countDocuments({ isActive: true }),
        verifiedTeachers: await Teacher.countDocuments({ isEmailVerified: true }),
        recentCount: await Teacher.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      },
    };

    res.status(200).json({
      success: true,
      message: 'Teacher statistics retrieved successfully',
      data: stats,
    });

  } catch (error) {
    console.error('Error getting teacher stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving teacher statistics',
      error: error.message,
    });
  }
};

/**
 * Get classroom utilization statistics
 */
const getClassroomStats = async (req, res) => {
  try {
    // Get classroom statistics by type
    const classroomTypeStats = await Classroom.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          avgCapacity: { $avg: '$capacity' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get classroom statistics by building
    const classroomBuildingStats = await Classroom.aggregate([
      {
        $group: {
          _id: '$building',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          avgCapacity: { $avg: '$capacity' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get classroom utilization
    const classroomUtilization = await Classroom.aggregate([
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: 'classrooms.classroom',
          as: 'exams',
        },
      },
      {
        $project: {
          name: 1,
          capacity: 1,
          type: 1,
          building: 1,
          examCount: { $size: '$exams' },
          utilizationRate: {
            $cond: [
              { $gt: ['$capacity', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $size: '$exams' },
                      '$capacity',
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { utilizationRate: -1 } },
    ]);

    const stats = {
      byType: classroomTypeStats,
      byBuilding: classroomBuildingStats,
      utilization: classroomUtilization,
      summary: {
        totalClassrooms: await Classroom.countDocuments(),
        totalCapacity: await Classroom.aggregate([
          { $group: { _id: null, total: { $sum: '$capacity' } } },
        ]).then(result => result.length > 0 ? result[0].total : 0),
        avgCapacity: await Classroom.aggregate([
          { $group: { _id: null, avg: { $avg: '$capacity' } } },
        ]).then(result => result.length > 0 ? Math.round(result[0].avg) : 0),
      },
    };

    res.status(200).json({
      success: true,
      message: 'Classroom statistics retrieved successfully',
      data: stats,
    });

  } catch (error) {
    console.error('Error getting classroom stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving classroom statistics',
      error: error.message,
    });
  }
};

/**
 * Get recent activity feed
 */
const getRecentActivity = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent students
    const recentStudents = await Student.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent teachers
    const recentTeachers = await Teacher.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent exams
    const recentExams = await Exam.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate('subject', 'name')
      .populate('departments', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming exams
    const upcomingExams = await Exam.find({
      examDate: { $gte: new Date() },
    })
      .populate('subject', 'name')
      .populate('departments', 'name')
      .sort({ examDate: 1 })
      .limit(5);

    const activity = {
      recentStudents: recentStudents.map(student => ({
        type: 'student',
        action: 'registered',
        name: student.fullName,
        department: student.department?.name,
        date: student.createdAt,
      })),
      recentTeachers: recentTeachers.map(teacher => ({
        type: 'teacher',
        action: 'registered',
        name: teacher.fullName,
        department: teacher.department?.name,
        date: teacher.createdAt,
      })),
      recentExams: recentExams.map(exam => ({
        type: 'exam',
        action: 'created',
        name: exam.title,
        subject: exam.subject?.name,
        date: exam.createdAt,
      })),
      upcomingExams: upcomingExams.map(exam => ({
        type: 'exam',
        action: 'scheduled',
        name: exam.title,
        subject: exam.subject?.name,
        date: exam.examDate,
      })),
    };

    // Combine and sort all activities by date
    const allActivities = [
      ...activity.recentStudents,
      ...activity.recentTeachers,
      ...activity.recentExams,
      ...activity.upcomingExams,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: {
        activities: allActivities.slice(0, 20), // Return top 20 activities
        summary: {
          recentStudents: activity.recentStudents.length,
          recentTeachers: activity.recentTeachers.length,
          recentExams: activity.recentExams.length,
          upcomingExams: activity.upcomingExams.length,
        },
      },
    });

  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent activity',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getDepartmentStats,
  getExamStats,
  getStudentStats,
  getTeacherStats,
  getClassroomStats,
  getRecentActivity,
};
