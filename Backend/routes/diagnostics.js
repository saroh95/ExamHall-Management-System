/**
 * Diagnostic Routes for Troubleshooting
 * Check enrollment and subject data
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Enrollment = require('../models/Enrollment');
const Subject = require('../models/Subject');
const Student = require('../models/Student');

// @route   GET /api/diagnostics/enrollments
// @desc    Check enrollment data
// @access  Private
router.get('/enrollments', protect, async (req, res) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments();
    const activeEnrollments = await Enrollment.countDocuments({ status: 'Enrolled' });

    // Group by semester
    const bySemester = await Enrollment.aggregate([
      { $match: { status: 'Enrolled' } },
      { $group: {
        _id: '$semester',
        count: { $sum: 1 },
        academicYears: { $addToSet: '$academicYear' },
      },
      },
      { $sort: { _id: 1 } },
    ]);

    // Group by academic year
    const byAcademicYear = await Enrollment.aggregate([
      { $match: { status: 'Enrolled' } },
      { $group: {
        _id: '$academicYear',
        count: { $sum: 1 },
      },
      },
      { $sort: { _id: -1 } },
    ]);

    // Sample enrollments
    const sampleEnrollments = await Enrollment.find({ status: 'Enrolled' })
      .populate('subject', 'code name semesterId')
      .populate('student', 'scholarId fullName semester')
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalEnrollments,
          active: activeEnrollments,
          inactive: totalEnrollments - activeEnrollments,
        },
        bySemester,
        byAcademicYear,
        samples: sampleEnrollments.map(e => ({
          student: e.student?.scholarId,
          subject: e.subject?.code,
          semester: e.semester,
          academicYear: e.academicYear,
          status: e.status,
        })),
      },
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/diagnostics/subjects
// @desc    Check subject data
// @access  Private
router.get('/subjects', protect, async (req, res) => {
  try {
    const totalSubjects = await Subject.countDocuments();
    const activeSubjects = await Subject.countDocuments({ isActive: true });

    // Group by semester
    const bySemester = await Subject.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: '$semesterId',
        count: { $sum: 1 },
      },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalSubjects,
          active: activeSubjects,
        },
        bySemester,
      },
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/diagnostics/students
// @desc    Check student data
// @access  Private
router.get('/students', protect, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });

    // Group by semester
    const bySemester = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          semester: {
            $cond: {
              if: { $regexMatch: { input: { $toString: '$semester' }, regex: /Semester/ } },
              then: { $toInt: { $arrayElemAt: [{ $split: ['$semester', ' '] }, 1] } },
              else: { $toInt: '$semester' },
            },
          },
        },
      },
      { $group: {
        _id: '$semester',
        count: { $sum: 1 },
      },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalStudents,
          active: activeStudents,
        },
        bySemester,
      },
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/diagnostics/check-scheduler
// @desc    Debug unified scheduler query
// @access  Private
router.get('/check-scheduler', protect, async (req, res) => {
  try {
    const { semesters, academicYear } = req.query;

    const semesterArray = semesters ? semesters.split(',').map(Number) : [2];
    const year = academicYear || getCurrentAcademicYear();

    console.log('🔍 Checking scheduler query...');
    console.log('   Semesters:', semesterArray);
    console.log('   Academic Year:', year);

    // Check enrollments
    const enrollmentQuery = {
      status: 'Enrolled',
      academicYear: year,
    };

    if (semesterArray.length > 0) {
      enrollmentQuery.semester = { $in: semesterArray };
    }

    console.log('   Query:', JSON.stringify(enrollmentQuery, null, 2));

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('subject', 'code name semesterId isActive')
      .populate('student', 'scholarId fullName semester isActive');

    console.log(`   Found ${enrollments.length} enrollments`);

    // Group by subject
    const subjectMap = new Map();
    let filtered = 0;

    for (const enrollment of enrollments) {
      if (!enrollment.subject || !enrollment.student) {
        filtered++;
        continue;
      }

      if (!enrollment.subject.isActive || !enrollment.student.isActive) {
        filtered++;
        continue;
      }

      const subjectId = enrollment.subject._id.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: enrollment.subject,
          students: [],
        });
      }
      subjectMap.get(subjectId).students.push(enrollment.student);
    }

    console.log(`   Filtered out: ${filtered}`);
    console.log(`   Unique subjects: ${subjectMap.size}`);

    const subjects = Array.from(subjectMap.values()).map(data => ({
      code: data.subject.code,
      name: data.subject.name,
      semester: data.subject.semesterId,
      students: data.students.length,
    }));

    res.json({
      success: true,
      data: {
        query: enrollmentQuery,
        totalEnrollmentsFound: enrollments.length,
        filteredOut: filtered,
        uniqueSubjects: subjectMap.size,
        subjects,
      },
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

function getCurrentAcademicYear () {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

module.exports = router;

// --- Auth diagnostics & fixes ---

// Check teacher auth state by institute email
router.get('/auth/teacher', protect, authorize(['admin']), async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });
    const teacher = await Teacher.findOne({ instituteEmail: String(email).toLowerCase() }).select('+password').populate('department', 'name code');
    if (!teacher) return res.json({ success: true, data: { exists: false } });
    res.json({ success: true, data: { exists: true, id: teacher._id, employeeId: teacher.employeeId, instituteEmail: teacher.instituteEmail, isActive: teacher.isActive, hasPassword: !!teacher.password, department: teacher.department } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to check teacher', error: e.message });
  }
});

// Reset teacher password by institute email
router.post('/auth/teacher/reset', protect, authorize(['admin']), async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'email and password are required' });
    const teacher = await Teacher.findOne({ instituteEmail: String(email).toLowerCase() }).select('+password');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    teacher.password = await bcrypt.hash(password, 12);
    await teacher.save();
    res.json({ success: true, message: 'Password updated for teacher', data: { employeeId: teacher.employeeId } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to reset teacher password', error: e.message });
  }
});

// Lookup teacher by employeeId
router.get('/auth/teacher/by-employee', protect, authorize(['admin']), async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });
    const teacher = await Teacher.findOne({ employeeId: String(employeeId).toUpperCase() }).select('+password').populate('department', 'name code');
    if (!teacher) return res.json({ success: true, data: { exists: false } });
    res.json({ success: true, data: { exists: true, id: teacher._id, employeeId: teacher.employeeId, instituteEmail: teacher.instituteEmail, personalEmail: teacher.personalEmail, isActive: teacher.isActive, hasPassword: !!teacher.password, department: teacher.department } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to lookup teacher', error: e.message });
  }
});

// Verify teacher password against stored hash
router.post('/auth/teacher/verify', protect, authorize(['admin']), async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'email and password are required' });
    const emailLc = String(email).toLowerCase().trim();
    let teacher = await Teacher.findOne({ instituteEmail: emailLc }).select('+password');
    if (!teacher) teacher = await Teacher.findOne({ personalEmail: emailLc }).select('+password');
    if (!teacher) return res.json({ success: true, data: { found: false } });
    const isMatch = await require('bcryptjs').compare(password, teacher.password || '');
    res.json({ success: true, data: { found: true, isActive: teacher.isActive, isMatch, employeeId: teacher.employeeId } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to verify teacher password', error: e.message });
  }
});

// Set/Update teacher institute email (and optionally password) by employeeId
router.post('/auth/teacher/set-institute-email', protect, authorize(['admin']), async (req, res) => {
  try {
    const { employeeId, instituteEmail, password } = req.body || {};
    if (!employeeId || !instituteEmail) return res.status(400).json({ success: false, message: 'employeeId and instituteEmail are required' });
    const teacher = await Teacher.findOne({ employeeId: String(employeeId).toUpperCase() }).select('+password');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    teacher.instituteEmail = String(instituteEmail).toLowerCase();
    if (password) {
      // Don't hash here - let the model's pre-save middleware handle it
      teacher.password = password;
    }
    await teacher.save();
    res.json({ success: true, message: 'Institute email (and password if provided) updated', data: { employeeId: teacher.employeeId, instituteEmail: teacher.instituteEmail } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update teacher institute email', error: e.message });
  }
});

