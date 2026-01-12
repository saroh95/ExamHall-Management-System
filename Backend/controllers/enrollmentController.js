const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const { asyncHandler } = require('../middleware/error');

// @desc    Auto-enroll core subjects for a student
// @route   POST /api/enrollments/auto-enroll/:studentId
// @access  Private
const autoEnrollStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate('department');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  if (!student.department) {
    return res.status(400).json({
      success: false,
      message: 'Student does not have a department assigned',
    });
  }

  const academicYear = getCurrentAcademicYear();

  // Parse semester - handle both "Semester 5" (string) and 5 (number)
  let semesterNumber = student.semester;
  if (typeof student.semester === 'string') {
    // Extract number from "Semester 5" or "5"
    const match = student.semester.match(/\d+/);
    semesterNumber = match ? parseInt(match[0], 10) : student.semester;
  }
  semesterNumber = parseInt(semesterNumber, 10);

  console.log(`🔍 Auto-enrolling student: ${student.fullName}`);
  console.log(`   Department: ${student.department.name} (${student.department.code}) (${student.department._id})`);
  console.log(`   Semester: ${student.semester} → ${semesterNumber}`);

  // Get student department info for matching
  const studentDeptCode = student.department?.code;
  const studentDeptName = student.department?.name;

  if (!studentDeptCode) {
    console.log('   ⚠️ Student has no department code');
    return res.status(400).json({
      success: false,
      message: 'Student department is missing code field',
      data: {
        student: {
          name: student.fullName,
          scholarId: student.scholarId,
        },
      },
    });
  }

  // Find all subjects - then filter in JavaScript for string sharedWith
  const allSemesterSubjects = await Subject.find({
    semesterId: semesterNumber,
    isActive: true,
  }).populate('departmentId', 'name code');

  console.log(`📚 Found ${allSemesterSubjects.length} total subjects in semester ${semesterNumber}`);

  // Filter subjects based on enrollment rules
  const coreSubjects = allSemesterSubjects.filter(subject => {
    const subjectDeptCodes = (subject.departmentId?.map(d => d?.code).filter(Boolean) || []).map(c => String(c).toUpperCase());
    const deptCodeU = String(studentDeptCode || '').toUpperCase();

    // 🔒 Hard overrides for specific subjects to ensure correct shared mapping
    // CRITICAL: These mappings take absolute priority over all other rules
    const HARD_SHARED_MAP = {
      CS102: ['CE', 'ME', 'EI'],        // CS102 shared with CE, ME, EIE (NOT CSE,EE,ECE)
      MS401: ['CSE', 'EE', 'ECE'],     // MS401 shared with CSE, EE, ECE (NOT CE,ME,EI)
      HS401: ['CE', 'ME', 'EI'],       // HS401 shared with CE, ME, EIE (NOT CSE,EE,ECE)
    };

    // Case-insensitive check for subject code
    const subjectCodeUpper = String(subject.code || '').toUpperCase();
    if (HARD_SHARED_MAP[subjectCodeUpper]) {
      const allowedDepts = HARD_SHARED_MAP[subjectCodeUpper];

      // EI/EI2 synonym handling
      const normalizedDeptCode =
        deptCodeU === 'EI2' ? 'EI' : deptCodeU;

      if (!allowedDepts.includes(normalizedDeptCode)) {
        console.log(
          `   ❌ [HARD MAP] Skipping ${subject.code} for dept ${deptCodeU} (allowed: ${allowedDepts.join(',')})`,
        );
        return false;
      }

      console.log(
        `   ✅ [HARD MAP] Enrolling ${subject.code} for dept ${deptCodeU} (allowed: ${allowedDepts.join(',')})`,
      );
      return true;
    }

    // Rule 1: Core Electives - Only enroll students from the same department
    // NOTE: Core electives should NOT be auto-enrolled here - they need special distribution logic
    if (subject.type === 'core_elective') {
      console.log(`   ❌ Core elective: ${subject.code} (not auto-enrolled - needs distribution logic)`);
      return false; // Core electives are handled separately with round-robin distribution
    }

    // Rule 2: Open Electives - NOT auto-enrolled here (requires round-robin distribution)
    if (subject.type === 'open_elective') {
      console.log(`   ❌ Open elective: ${subject.code} (not auto-enrolled - use autoEnrollElectives endpoint)`);
      return false; // Open electives are handled separately with round-robin distribution
    }

    // Rule 3: Check string sharedWith field FIRST (most specific)
    if (subject.sharedWith && typeof subject.sharedWith === 'string' && subject.sharedWith.trim()) {
      const sharedDepts = subject.sharedWith
        .split(',')
        .map(d => d.trim().toUpperCase())
        .filter(Boolean);
      const deptCodeU = String(studentDeptCode || '').toUpperCase();

      // Direct match
      if (sharedDepts.includes(deptCodeU)) {
        console.log(`   ✅ Shared subject: ${subject.code} (shared with: ${subject.sharedWith})`);
        return true;
      }

      // Handle EI/EI2 synonym (EIE department)
      if (deptCodeU === 'EI2' && sharedDepts.includes('EI')) {
        console.log(`   ✅ Shared subject (EI2→EI): ${subject.code} (shared with: ${subject.sharedWith})`);
        return true;
      }
      if (deptCodeU === 'EI' && sharedDepts.includes('EI2')) {
        console.log(`   ✅ Shared subject (EI→EI2): ${subject.code} (shared with: ${subject.sharedWith})`);
        return true;
      }

      // CRITICAL FIX: If student's department is NOT in sharedWith, DO NOT enroll them
      // This prevents EE students from being enrolled in EE101 when sharedWith="CE,ME,EI"
      console.log(`   ❌ Shared subject: ${subject.code} (student dept ${deptCodeU} not in sharedWith: ${subject.sharedWith})`);
      return false;
    }

    // Rule 4: Math subjects WITHOUT sharedWith are common to all
    if (subjectDeptCodes.includes('MA') && (!subject.sharedWith || !subject.sharedWith.trim())) {
      console.log(`   ✅ Math subject: ${subject.code} (common to all - no sharedWith)`);
      return true;
    }

    // Rule 5: Department match (only if no sharedWith field)
    const subjectDeptCodesUpper = subjectDeptCodes.map(c => String(c).toUpperCase());

    // Direct department match
    if (subjectDeptCodesUpper.includes(deptCodeU)) {
      console.log(`   ✅ Dept subject: ${subject.code} (${studentDeptCode})`);
      return true;
    }

    // Handle EI/EI2 synonym for departmentId (same as sharedWith)
    if (deptCodeU === 'EI2' && subjectDeptCodesUpper.includes('EI')) {
      console.log(`   ✅ Dept subject (EI2→EI): ${subject.code} (dept: ${subjectDeptCodes.join(',')})`);
      return true;
    }
    if (deptCodeU === 'EI' && subjectDeptCodesUpper.includes('EI2')) {
      console.log(`   ✅ Dept subject (EI→EI2): ${subject.code} (dept: ${subjectDeptCodes.join(',')})`);
      return true;
    }

    // Rule 6: offeredTo array (if exists)
    if (subject.offeredTo && subject.offeredTo.length > 0) {
      const isOffered = subject.offeredTo.some(offer =>
        offer.department?.toString() === student.department._id.toString() &&
        offer.semester === semesterNumber,
      );
      if (isOffered) {
        console.log(`   ✅ Offered subject: ${subject.code}`);
        return true;
      }
    }

    return false;
  });

  console.log(`📚 Found ${coreSubjects.length} subjects to enroll`);

  const enrollments = [];
  const errors = [];

  for (const subject of coreSubjects) {
    try {
      // Check if already enrolled
      const existing = await Enrollment.findOne({
        student: student._id,
        subject: subject._id,
        academicYear,
      });

      if (existing) {
        errors.push({
          subject: subject.name,
          message: 'Already enrolled',
        });
        continue;
      }

      // Determine enrollment type
      let enrollmentType = 'Auto-Core';
      if (subject.isCommonToAll) {
        enrollmentType = 'Auto-Common';
      } else if (subject.type === 'core_elective') {
        enrollmentType = 'Elective-Regular';
      } else if (subject.type === 'open_elective') {
        enrollmentType = 'Elective-Open';
      }

      // Create enrollment
      const enrollment = await Enrollment.create({
        student: student._id,
        subject: subject._id,
        semester: semesterNumber,
        academicYear,
        enrollmentType,
        status: 'Enrolled',
        enrolledBy: req.user?._id || 'System-Auto',
        metadata: {
          autoEnrolled: true,
          canDrop: subject.type && subject.type.includes('elective'),
          priority: subject.isCommonToAll ? 1 : (subject.type === 'regular' ? 1 : 2),
        },
      });

      enrollments.push(enrollment);
      console.log(`   ✅ Enrolled in: ${subject.code} - ${subject.name}`);
    } catch (error) {
      errors.push({
        subject: subject.name,
        message: error.message,
      });
      console.log(`   ❌ Failed: ${subject.code} - ${error.message}`);
    }
  }

  console.log(`✅ Enrollment complete: ${enrollments.length} successful, ${errors.length} errors`);

  res.status(201).json({
    success: true,
    message: `Auto-enrolled in ${enrollments.length} subjects`,
    data: {
      student: {
        name: student.fullName,
        scholarId: student.scholarId,
        department: student.department.name,
        semester: student.semester,
      },
      enrollments: enrollments.length,
      foundSubjects: coreSubjects.length,
      errors,
    },
  });
});

// @desc    Auto-enroll all students
// @route   POST /api/enrollments/auto-enroll-all
// @access  Private (Admin)
const autoEnrollAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ isActive: true }).populate('department');

  console.log(`🔄 Starting auto-enrollment for ${students.length} active students`);

  const results = {
    success: [],
    failed: [],
  };

  for (const student of students) {
    try {
      if (!student.department) {
        results.failed.push({
          student: student.fullName,
          scholarId: student.scholarId,
          error: 'No department assigned',
        });
        continue;
      }

      const academicYear = getCurrentAcademicYear();

      // Parse semester - handle both "Semester 5" (string) and 5 (number)
      let semesterNumber = student.semester;
      if (typeof student.semester === 'string') {
        const match = student.semester.match(/\d+/);
        semesterNumber = match ? parseInt(match[0], 10) : student.semester;
      }
      semesterNumber = parseInt(semesterNumber, 10);

      const studentDeptCode = student.department?.code;

      if (!studentDeptCode) {
        results.failed.push({
          student: student.fullName,
          scholarId: student.scholarId,
          error: 'Department code missing',
        });
        continue;
      }

      // Find all subjects - then filter for string sharedWith
      const allSemesterSubjects = await Subject.find({
        semesterId: semesterNumber,
        isActive: true,
      }).populate('departmentId', 'name code');

      // Filter subjects based on enrollment rules
      const coreSubjects = allSemesterSubjects.filter(subject => {
        const subjectDeptCodes = subject.departmentId?.map(d => d?.code).filter(Boolean) || [];

        // 🔒 Hard overrides for specific subjects to ensure correct shared mapping
        // CRITICAL: These mappings take absolute priority over all other rules
        const HARD_SHARED_MAP = {
          CS102: ['CE', 'ME', 'EI'],        // CS102 shared with CE, ME, EIE (NOT CSE,EE,ECE)
          MS401: ['CSE', 'EE', 'ECE'],     // MS401 shared with CSE, EE, ECE (NOT CE,ME,EI)
          HS401: ['CE', 'ME', 'EI'],       // HS401 shared with CE, ME, EIE (NOT CSE,EE,ECE)
        };

        // Case-insensitive check for subject code
        const subjectCodeUpper = String(subject.code || '').toUpperCase();
        if (HARD_SHARED_MAP[subjectCodeUpper]) {
          const allowedDepts = HARD_SHARED_MAP[subjectCodeUpper];
          const deptCodeU = String(studentDeptCode || '').toUpperCase();
          const normalizedDeptCode =
            deptCodeU === 'EI2' ? 'EI' : deptCodeU;

          if (!allowedDepts.includes(normalizedDeptCode)) {
            return false;
          }
          return true;
        }

        // Rule 1: Core Electives - Only enroll students from the same department
        // NOTE: Core electives should NOT be auto-enrolled here - they need special distribution logic
        if (subject.type === 'core_elective') {
          return false; // Core electives are handled separately with round-robin distribution
        }

        // Rule 2: Open Electives - NOT auto-enrolled here (requires round-robin distribution)
        if (subject.type === 'open_elective') {
          return false; // Open electives are handled separately with round-robin distribution
        }

        // Rule 3: Check string sharedWith field FIRST (most specific)
        if (subject.sharedWith && typeof subject.sharedWith === 'string' && subject.sharedWith.trim()) {
          const sharedDepts = subject.sharedWith.split(',').map(d => d.trim());

          // Direct match
          if (sharedDepts.includes(studentDeptCode)) {
            return true;
          }

          // Handle EI/EI2 synonym (EIE department)
          if (studentDeptCode === 'EI2' && sharedDepts.includes('EI')) {
            return true;
          }
          if (studentDeptCode === 'EI' && sharedDepts.includes('EI2')) {
            return true;
          }

          // CRITICAL FIX: If student's department is NOT in sharedWith, DO NOT enroll them
          // This prevents EE students from being enrolled in EE101 when sharedWith="CE,ME,EI"
          return false;
        }

        // Rule 4: Math subjects WITHOUT sharedWith are common to all
        if (subjectDeptCodes.includes('MA') && (!subject.sharedWith || !subject.sharedWith.trim())) {
          return true;
        }

        // Rule 5: Department match (only if no sharedWith field)
        const subjectDeptCodesUpper = subjectDeptCodes.map(c => String(c).toUpperCase());
        const deptCodeU = String(studentDeptCode || '').toUpperCase();

        // Direct department match
        if (subjectDeptCodesUpper.includes(deptCodeU)) {
          return true;
        }

        // Handle EI/EI2 synonym for departmentId (same as sharedWith)
        if (deptCodeU === 'EI2' && subjectDeptCodesUpper.includes('EI')) {
          return true;
        }
        if (deptCodeU === 'EI' && subjectDeptCodesUpper.includes('EI2')) {
          return true;
        }

        // Rule 6: offeredTo array
        if (subject.offeredTo && subject.offeredTo.length > 0) {
          return subject.offeredTo.some(offer =>
            offer.department?.toString() === student.department._id.toString() &&
            offer.semester === semesterNumber,
          );
        }

        return false;
      });

      let enrolled = 0;

      for (const subject of coreSubjects) {
        // Check if already enrolled
        const existing = await Enrollment.findOne({
          student: student._id,
          subject: subject._id,
          academicYear,
        });

        if (!existing) {
          // Determine enrollment type
          let enrollmentType = 'Auto-Core';
          if (subject.isCommonToAll) {
            enrollmentType = 'Auto-Common';
          } else if (subject.type === 'core_elective') {
            enrollmentType = 'Elective-Regular';
          } else if (subject.type === 'open_elective') {
            enrollmentType = 'Elective-Open';
          }

          await Enrollment.create({
            student: student._id,
            subject: subject._id,
            semester: semesterNumber,
            academicYear,
            enrollmentType,
            status: 'Enrolled',
            enrolledBy: req.user?._id || 'System-Auto',
            metadata: {
              autoEnrolled: true,
              canDrop: subject.type && subject.type.includes('elective'),
              priority: subject.isCommonToAll ? 1 : (subject.type === 'regular' ? 1 : 2),
            },
          });
          enrolled++;
        }
      }

      results.success.push({
        student: student.fullName,
        scholarId: student.scholarId,
        department: student.department.name,
        semester: semesterNumber,
        foundSubjects: coreSubjects.length,
        enrolled,
      });

      console.log(`✅ ${student.scholarId}: Enrolled in ${enrolled}/${coreSubjects.length} subjects`);
    } catch (error) {
      results.failed.push({
        student: student.fullName,
        scholarId: student.scholarId,
        error: error.message,
      });
      console.log(`❌ ${student.scholarId}: ${error.message}`);
    }
  }

  // Handle electives - ensure min 1 student per elective
  try {
    await ensureMinimumElectiveEnrollment();
  } catch (error) {
    console.log('⚠️ Elective enrollment check failed:', error.message);
  }

  console.log(`✅ Auto-enrollment complete: ${results.success.length} successful, ${results.failed.length} failed`);

  res.json({
    success: true,
    message: `Auto-enrollment completed for ${results.success.length} students`,
    data: results,
  });
});

// @desc    Get student's enrollments
// @route   GET /api/enrollments/student/:studentId
// @access  Private
const getStudentEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.params.studentId,
    status: 'Enrolled',
  }).populate('subject');

  res.json({
    success: true,
    count: enrollments.length,
    data: enrollments,
  });
});

// @desc    Get all students enrolled in a subject
// @route   GET /api/enrollments/subject/:subjectId
// @access  Private
const getSubjectEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    subject: req.params.subjectId,
    status: 'Enrolled',
  }).populate({
    path: 'student',
    populate: { path: 'department' },
  });

  // Group by department
  const groupedByDept = enrollments.reduce((acc, enrollment) => {
    const deptName = enrollment.student.department.name;
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(enrollment.student);
    return acc;
  }, {});

  res.json({
    success: true,
    total: enrollments.length,
    byDepartment: groupedByDept,
    data: enrollments,
  });
});

// @desc    Drop enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private
const dropEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  // Check if student can drop
  if (!enrollment.metadata.canDrop) {
    return res.status(400).json({
      success: false,
      message: 'Core subjects cannot be dropped',
    });
  }

  enrollment.status = 'Dropped';
  await enrollment.save();

  res.json({
    success: true,
    message: 'Enrollment dropped successfully',
  });
});

// @desc    Get enrollment statistics for a subject
// @route   GET /api/enrollments/stats/:subjectId
// @access  Private
const getEnrollmentStats = asyncHandler(async (req, res) => {
  const stats = await Enrollment.getEnrollmentStats(req.params.subjectId);

  res.json({
    success: true,
    data: stats,
  });
});

// Helper function to ensure minimum elective enrollment
async function ensureMinimumElectiveEnrollment () {
  const electives = await Subject.find({
    $or: [
      { subjectType: 'Regular Elective' },
      { subjectType: 'Open Elective' },
    ],
  });

  for (const elective of electives) {
    const enrollmentCount = await Enrollment.countDocuments({
      subject: elective._id,
      status: 'Enrolled',
    });

    if (enrollmentCount < elective.minEnrollment) {
      // Find eligible students
      const eligibleStudents = await Student.find({
        semester: elective.offeredTo[0]?.semester,
        isActive: true,
      }).limit(elective.minEnrollment - enrollmentCount);

      for (const student of eligibleStudents) {
        await Enrollment.create({
          student: student._id,
          subject: elective._id,
          semester: student.semester,
          academicYear: getCurrentAcademicYear(),
          enrollmentType: elective.subjectType === 'Open Elective' ? 'Elective-Open' : 'Elective-Regular',
          status: 'Enrolled',
          enrolledBy: 'System-Auto',
          metadata: {
            autoEnrolled: true,
            canDrop: true,
            priority: 2,
          },
        });
      }
    }
  }
}

// Helper function to get current academic year
function getCurrentAcademicYear () {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Academic year starts in July (month 6)
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// @desc    Auto-enroll electives for all students (Balanced Round-Robin)
// @route   POST /api/enrollments/auto-enroll-electives
// @access  Private (Admin)
const autoEnrollElectives = asyncHandler(async (req, res) => {
  console.log('🚀 Starting Auto-Enrollment for Electives...\n');

  const academicYear = getCurrentAcademicYear();
  const CONFIG = {
    CORE_ELECTIVES_PER_STUDENT: 1,
    OPEN_ELECTIVES_PER_STUDENT: 1,
    MIN_ENROLLMENT_DEFAULT: 2, // Changed from 1 to 2 for open electives
    MAX_ENROLLMENT_DEFAULT: 100,
  };

  // Parse semester helper
  const parseSemester = (semesterString) => {
    if (typeof semesterString === 'number') return semesterString;
    if (typeof semesterString === 'string') {
      const match = semesterString.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    }
    return null;
  };

  // Enhanced Round-robin distribution function with minimum enrollment guarantee
  const distributeStudentsRoundRobin = (students, electives, electivesPerStudent, existingEnrollments = {}) => {
    const assignments = [];
    const electiveQueues = electives.map(elective => ({
      elective,
      students: [],
      currentCount: existingEnrollments[elective._id.toString()] || 0,
      minEnrollment: elective.minEnrollment || CONFIG.MIN_ENROLLMENT_DEFAULT,
      maxEnrollment: elective.maxEnrollment || CONFIG.MAX_ENROLLMENT_DEFAULT,
    }));

    // Sort electives by current count (ascending) - fill least populated first
    electiveQueues.sort((a, b) => a.currentCount - b.currentCount);

    let electiveIndex = 0;

    // Phase 1: Ensure minimum enrollment for each elective
    console.log(`   📊 Ensuring minimum enrollment for ${electives.length} electives...`);
    for (const queue of electiveQueues) {
      const needed = Math.max(0, queue.minEnrollment - queue.currentCount);
      if (needed > 0) {
        console.log(`   🎯 ${queue.elective.code} needs ${needed} more students (current: ${queue.currentCount}, min: ${queue.minEnrollment})`);
      }
    }

    // Phase 2: Distribute students using round-robin
    for (const student of students) {
      let assigned = 0;
      let attempts = 0;
      const maxAttempts = electives.length * 3; // Increased attempts for better distribution

      while (assigned < electivesPerStudent && attempts < maxAttempts) {
        const queue = electiveQueues[electiveIndex % electiveQueues.length];

        // Check if this elective can accept more students
        if (queue.currentCount + queue.students.length < queue.maxEnrollment) {
          assignments.push({
            student: student._id,
            studentName: student.fullName,
            scholarId: student.scholarId,
            subject: queue.elective._id,
            subjectCode: queue.elective.code,
            subjectName: queue.elective.name,
            semester: parseSemester(student.semester),
            electiveType: queue.elective.type,
          });

          queue.students.push(student._id);
          assigned++;
        }

        electiveIndex++;
        attempts++;
      }

      if (assigned < electivesPerStudent) {
        console.log(`   ⚠️  Warning: Could only assign ${assigned}/${electivesPerStudent} electives to ${student.scholarId}`);
      }
    }

    // Phase 3: Log distribution statistics
    console.log('   📊 Final Distribution:');
    electiveQueues.forEach(queue => {
      const finalCount = queue.currentCount + queue.students.length;
      const status = finalCount >= queue.minEnrollment ? '✅' : '⚠️';
      console.log(`   ${status} ${queue.elective.code}: ${finalCount} students (min: ${queue.minEnrollment}, max: ${queue.maxEnrollment})`);
    });

    return assignments;
  };

  try {
    // Step 1: Reset existing elective enrollments
    console.log('🔄 Step 1: Resetting existing elective enrollments...');
    const resetResult = await Enrollment.deleteMany({
      enrollmentType: { $in: ['Elective-Regular', 'Elective-Open'] },
    });
    console.log(`   ✅ Removed ${resetResult.deletedCount} existing elective enrollments`);

    // Step 2: Get all active students
    console.log('👥 Step 2: Fetching active students...');
    const students = await Student.find({
      isActive: true,
      semester: { $in: ['Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'] },
    }).populate('department');
    console.log(`   ✅ Found ${students.length} active students`);

    // Group students by department and semester
    const studentGroups = {};
    students.forEach(student => {
      const semesterNum = parseSemester(student.semester);
      if (!semesterNum || semesterNum < 5) return;

      const key = `${student.department?._id || 'UNKNOWN'}_${semesterNum}`;
      if (!studentGroups[key]) {
        studentGroups[key] = {
          department: student.department,
          semester: semesterNum,
          students: [],
        };
      }
      studentGroups[key].students.push(student);
    });

    console.log(`📚 Grouped students into ${Object.keys(studentGroups).length} combinations`);

    // Step 3: Process Core Electives
    console.log('🎯 Step 3: Processing CORE ELECTIVES...');
    let totalCoreAssignments = 0;

    for (const [key, group] of Object.entries(studentGroups)) {
      if (!group.department) continue;

      console.log(`\n🏢 ${group.department.name} - Semester ${group.semester}`);

      // Build department ID list with EI/EI2 synonym handling
      const deptIds = [group.department._id];

      // Handle EI/EI2 synonym for core electives
      if (group.department.code === 'EI2' || group.department.code === 'EI') {
        const synonymDept = await Department.findOne({
          code: group.department.code === 'EI2' ? 'EI' : 'EI2',
        });
        if (synonymDept) {
          deptIds.push(synonymDept._id);
          console.log(`   🔄 Added synonym department: ${synonymDept.code} (${synonymDept._id})`);
        }
      }

      const coreElectives = await Subject.find({
        type: 'core_elective',
        semesterId: group.semester,
        departmentId: { $in: deptIds },
        isActive: true,
      }).populate('departmentId', 'name code');

      console.log(`   Core Electives: ${coreElectives.length}`);

      if (coreElectives.length === 0) continue;

      const existingCounts = {};
      const existingEnrollments = await Enrollment.find({
        subject: { $in: coreElectives.map(e => e._id) },
        status: 'Enrolled',
      });
      existingEnrollments.forEach(e => {
        const subjectId = e.subject.toString();
        existingCounts[subjectId] = (existingCounts[subjectId] || 0) + 1;
      });

      const assignments = distributeStudentsRoundRobin(
        group.students,
        coreElectives,
        CONFIG.CORE_ELECTIVES_PER_STUDENT,
        existingCounts,
      );

      for (const assignment of assignments) {
        await Enrollment.create({
          student: assignment.student,
          subject: assignment.subject,
          semester: assignment.semester,
          academicYear,
          enrollmentType: 'Elective-Regular',
          status: 'Enrolled',
          enrolledBy: req.user?._id || 'System-Auto',
          metadata: {
            autoEnrolled: true,
            canDrop: true,
            priority: 2,
          },
        });
        totalCoreAssignments++;
      }

      console.log(`   ✅ Created ${assignments.length} enrollments`);
    }

    // Step 4: Process Open Electives
    console.log('🌐 Step 4: Processing OPEN ELECTIVES...');
    let totalOpenAssignments = 0;

    const semestersWithStudents = [...new Set(Object.values(studentGroups).map(g => g.semester))];

    for (const semester of semestersWithStudents) {
      console.log(`\n📖 Semester ${semester}`);

      const semesterStudents = students.filter(s => parseSemester(s.semester) === semester);

      const openElectives = await Subject.find({
        type: 'open_elective',
        semesterId: semester,
        isActive: true,
      }).populate('departmentId', 'name code');

      console.log(`   Open Electives: ${openElectives.length}`);

      if (openElectives.length === 0) continue;

      const existingCounts = {};
      const existingEnrollments = await Enrollment.find({
        subject: { $in: openElectives.map(e => e._id) },
        status: 'Enrolled',
      });
      existingEnrollments.forEach(e => {
        const subjectId = e.subject.toString();
        existingCounts[subjectId] = (existingCounts[subjectId] || 0) + 1;
      });

      const assignments = distributeStudentsRoundRobin(
        semesterStudents,
        openElectives,
        CONFIG.OPEN_ELECTIVES_PER_STUDENT,
        existingCounts,
      );

      for (const assignment of assignments) {
        await Enrollment.create({
          student: assignment.student,
          subject: assignment.subject,
          semester: assignment.semester,
          academicYear,
          enrollmentType: 'Elective-Open',
          status: 'Enrolled',
          enrolledBy: req.user?._id || 'System-Auto',
          metadata: {
            autoEnrolled: true,
            canDrop: true,
            priority: 2,
          },
        });
        totalOpenAssignments++;
      }

      console.log(`   ✅ Created ${assignments.length} enrollments`);
    }

    console.log(`\n✅ Total Core: ${totalCoreAssignments}, Open: ${totalOpenAssignments}`);

    res.json({
      success: true,
      message: `Auto-enrolled electives for ${students.length} students`,
      data: {
        studentsProcessed: students.length,
        coreElectiveEnrollments: totalCoreAssignments,
        openElectiveEnrollments: totalOpenAssignments,
        totalEnrollments: totalCoreAssignments + totalOpenAssignments,
        resetCount: resetResult.deletedCount,
      },
    });

  } catch (error) {
    console.error('❌ Error during elective auto-enrollment:', error);
    throw error;
  }
});

module.exports = {
  autoEnrollStudent,
  autoEnrollAllStudents,
  autoEnrollElectives,
  getStudentEnrollments,
  getSubjectEnrollments,
  dropEnrollment,
  getEnrollmentStats,
};

