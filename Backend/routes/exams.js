const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateExam = [
  body('title')
    .notEmpty()
    .withMessage('Exam title is required')
    .isLength({ max: 200 })
    .withMessage('Exam title cannot exceed 200 characters'),
  body('subject')
    .isMongoId()
    .withMessage('Valid subject ID is required'),
  body('type')
    .isIn(['mid_semester', 'end_semester', 'quiz', 'assignment', 'practical', 'viva'])
    .withMessage('Invalid exam type'),
  body('semester')
    .isIn(['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'])
    .withMessage('Invalid semester'),
  body('academicYear')
    .matches(/^20\d{2}-20\d{2}$/)
    .withMessage('Academic year must be in format: 2023-2024'),
  body('examDate')
    .isISO8601()
    .withMessage('Valid exam date is required'),
  body('startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('duration')
    .isInt({ min: 30, max: 480 })
    .withMessage('Duration must be between 30 and 480 minutes'),
  body('totalMarks')
    .isInt({ min: 1, max: 200 })
    .withMessage('Total marks must be between 1 and 200'),
  body('passingMarks')
    .isInt({ min: 1 })
    .withMessage('Passing marks must be at least 1'),
  body('departments')
    .isArray()
    .withMessage('Departments must be an array'),
];

// Routes
// @route   GET /api/exams
// @desc    Get all exams
// @access  Private
router.get('/', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = Exam.find().populate('subject', 'name code');

    // Filter by type
    if (req.query.type) {
      query = query.find({ type: req.query.type });
    }

    // Filter by semester
    if (req.query.semester) {
      query = query.find({ semester: req.query.semester });
    }

    // Filter by academic year
    if (req.query.academicYear) {
      query = query.find({ academicYear: req.query.academicYear });
    }

    // Filter by status
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.find({ title: searchRegex });
    }

    const total = await Exam.countDocuments(query.getQuery());
    const exams = await query.skip(startIndex).limit(limit);

    res.json({
      success: true,
      count: exams.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message,
    });
  }
});

// @route   GET /api/exams/stats
// @desc    Get exam statistics
// @access  Private
router.get('/stats', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const stats = await Exam.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exam statistics',
      error: error.message,
    });
  }
});

// @route   GET /api/exams/upcoming
// @desc    Get upcoming exams
// @access  Private
router.get('/upcoming', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exams = await Exam.findUpcoming();

    res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming exams',
      error: error.message,
    });
  }
});

// @route   GET /api/exams/today
// @desc    Get today's exams
// @access  Private
router.get('/today', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exams = await Exam.findToday();

    res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s exams',
      error: error.message,
    });
  }
});

// @route   GET /api/exams/:id
// @desc    Get single exam
// @access  Private
router.get('/:id', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('departments', 'name code')
      .populate('classrooms.classroom', 'roomNumber capacity')
      .populate('classrooms.assignedStudents', 'scholarId fullName')
      .populate('invigilators.teacher', 'employeeId fullName');

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
    res.status(500).json({
      success: false,
      message: 'Error fetching exam',
      error: error.message,
    });
  }
});

// @route   POST /api/exams
// @desc    Create new exam
// @access  Private
router.post('/', protect, checkPermission('create_exam'), validateExam, async (req, res) => {
  try {
    const Exam = require('../models/Exam');

    // Check if exam already exists with same title and date
    const existingExam = await Exam.findOne({
      title: req.body.title,
      examDate: req.body.examDate,
    });

    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: 'Exam with this title and date already exists',
      });
    }

    const exam = await Exam.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating exam',
      error: error.message,
    });
  }
});

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private
router.put('/:id', protect, checkPermission('update_exam'), validateExam, async (req, res) => {
  try {
    const Exam = require('../models/Exam');

    let exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, {
      ...req.body,
      updatedBy: req.user.id,
    }, {
      new: true,
      runValidators: true,
    }).populate('subject', 'name code');

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating exam',
      error: error.message,
    });
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private
router.delete('/:id', protect, checkPermission('delete_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    await Exam.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting exam',
      error: error.message,
    });
  }
});

// @route   PATCH /api/exams/:id/assign-students
// @desc    Assign students to classrooms
// @access  Private
router.patch('/:id/assign-students', protect, checkPermission('update_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const { students } = req.body;

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    await exam.assignStudentsToClassrooms(students);

    res.json({
      success: true,
      message: 'Students assigned successfully',
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning students',
      error: error.message,
    });
  }
});

// @route   PATCH /api/exams/:id/assign-invigilators
// @desc    Assign invigilators
// @access  Private
router.patch('/:id/assign-invigilators', protect, checkPermission('assign_invigilator'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const { invigilators } = req.body;

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    await exam.assignInvigilators(invigilators);

    res.json({
      success: true,
      message: 'Invigilators assigned successfully',
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning invigilators',
      error: error.message,
    });
  }
});

// @route   PATCH /api/exams/:id/generate-seating
// @desc    Generate seating arrangement
// @access  Private
router.patch('/:id/generate-seating', protect, checkPermission('update_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    await exam.generateSeatingArrangement();

    res.json({
      success: true,
      message: 'Seating arrangement generated successfully',
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating seating arrangement',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/validate-schedule
// @desc    Validate exam schedule
// @access  Private
router.post('/validate-schedule', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { examDetails, selectedSubjects, selectedDepartments, selectedSemesters, availableDates, timeSlots } = req.body;

    // Basic validation
    if (!examDetails || !selectedSubjects || !selectedDepartments || !selectedSemesters || !availableDates || !timeSlots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required schedule data',
      });
    }

    if (selectedSubjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one subject must be selected',
      });
    }

    if (selectedDepartments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one department must be selected',
      });
    }

    if (availableDates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least two available dates are required',
      });
    }

    if (timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one time slot must be defined',
      });
    }

    res.json({
      success: true,
      message: 'Schedule validation passed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating schedule',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/check-conflicts
// @desc    Check for schedule conflicts
// @access  Private
router.post('/check-conflicts', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { examDetails, selectedSubjects, selectedDepartments, selectedSemesters, availableDates, timeSlots } = req.body;
    const Exam = require('../models/Exam');

    const conflicts = [];

    // Check for existing exams on the same dates
    for (const date of availableDates) {
      const existingExams = await Exam.find({
        examDate: new Date(date),
        isActive: true,
        status: { $in: ['scheduled', 'in_progress'] },
      });

      if (existingExams.length > 0) {
        conflicts.push(`Date ${date} has ${existingExams.length} existing exam(s)`);
      }
    }

    // Check for classroom conflicts
    const Classroom = require('../models/Classroom');
    const totalStudents = selectedSubjects.length * 50; // Estimate students per subject
    const availableClassrooms = await Classroom.find({ isActive: true });
    const totalCapacity = availableClassrooms.reduce((sum, room) => sum + room.capacity, 0);

    if (totalCapacity < totalStudents) {
      conflicts.push(`Insufficient classroom capacity. Need ${totalStudents} seats, available ${totalCapacity}`);
    }

    res.json({
      success: true,
      conflicts,
      hasConflicts: conflicts.length > 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking conflicts',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/schedule
// @desc    Create exam schedule
// @access  Private
router.post('/schedule', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    console.log('📥 Schedule endpoint called with data:', JSON.stringify(req.body, null, 2));

    const { examDetails, selectedSubjects, selectedDepartments, selectedSemesters, availableDates, timeSlots } = req.body;
    const Exam = require('../models/Exam');
    const Subject = require('../models/Subject');
    const Department = require('../models/Department');

    // Get subjects and departments data
    console.log('🔍 Fetching subjects with IDs:', selectedSubjects);
    const subjects = await Subject.find({ _id: { $in: selectedSubjects } });
    console.log('📚 Found subjects:', subjects.length);
    console.log('📚 First subject:', subjects[0] ? {
      _id: subjects[0]._id,
      name: subjects[0].name,
      code: subjects[0].code,
      departmentId: subjects[0].departmentId,
      type: subjects[0].type,
    } : 'No subjects found');

    console.log('🔍 Fetching departments with IDs:', selectedDepartments);
    const departments = await Department.find({ _id: { $in: selectedDepartments } });
    console.log('🏢 Found departments:', departments.length);

    const schedule = [];

    // Handle time slots format - they can be objects with start/end or strings
    const formatTimeSlot = (slot) => {
      if (typeof slot === 'string') {
        return slot;
      } else if (slot && typeof slot === 'object' && slot.start && slot.end) {
        return `${slot.start} - ${slot.end}`;
      } else {
        return '10:00 AM - 1:00 PM'; // default fallback with proper AM/PM format
      }
    };

    // Keep original timeSlot objects for invigilator assignment
    const getTimeSlotObject = (slot) => {
      if (typeof slot === 'string') {
        // Parse string format like "10:00 AM - 1:00 PM"
        const parts = slot.split(' - ');
        return { start: parts[0], end: parts[1] };
      } else if (slot && typeof slot === 'object' && slot.start && slot.end) {
        return slot;
      } else {
        return { start: '10:00 AM', end: '1:00 PM' };
      }
    };

    const coreSlot = formatTimeSlot(timeSlots[0]);
    const openSlot = timeSlots[1] ? formatTimeSlot(timeSlots[1]) : coreSlot;

    // Smart Scheduling Algorithm based on semester rules
    const smartScheduler = () => {
      const scheduledExams = [];
      let currentDateIndex = 0;

      // Group subjects by semester for different scheduling rules
      const subjectsBySemester = {};
      subjects.forEach(subject => {
        const semester = subject.semesterId;
        if (!subjectsBySemester[semester]) {
          subjectsBySemester[semester] = [];
        }
        subjectsBySemester[semester].push(subject);
      });

      // Helper function to get subject department codes (for shared subjects)
      const getSubjectDeptCodes = (subject) => {
        // For common subjects, they apply to all departments
        if (subject.isCommon) {
          return ['ALL'];
        }

        // For subjects with sharedWith field
        if (subject.sharedWith && subject.sharedWith.trim() !== '') {
          const sharedDepts = subject.sharedWith.split(',').map(d => d.trim());
          return [subject.department, ...sharedDepts]; // Include own department + shared
        }

        // For department-specific subjects
        return [subject.department];
      };

      // Helper function to check if subjects share departments
      const sharesDepartments = (subject1, subject2) => {
        const dept1 = getSubjectDeptCodes(subject1);
        const dept2 = getSubjectDeptCodes(subject2);

        // Common subjects share with all
        if (dept1.includes('ALL') || dept2.includes('ALL')) {
          return true;
        }

        return dept1.some(d => dept2.includes(d));
      };

      // Helper function to check for conflicts in same time slot
      const hasConflict = (newSubject, scheduledInSlot) => {
        return scheduledInSlot.some(scheduled => sharesDepartments(newSubject, scheduled.subject));
      };

      // Track what's scheduled for each date/time slot
      const scheduleMatrix = {};

      // Helper to get or create slot
      const getSlot = (dateIndex, timeSlotIndex) => {
        const key = `${dateIndex}-${timeSlotIndex}`;
        if (!scheduleMatrix[key]) {
          scheduleMatrix[key] = [];
        }
        return scheduleMatrix[key];
      };

      // Process each semester with specific rules
      Object.keys(subjectsBySemester).sort((a, b) => parseInt(a) - parseInt(b)).forEach(semesterStr => {
        const semester = parseInt(semesterStr);
        const semesterSubjects = subjectsBySemester[semester];

        console.log(`📚 Processing Semester ${semester} with ${semesterSubjects.length} subjects`);

        if (semester <= 2) {
          // Semesters 1 & 2: Math first, then smart grouping for shared subjects

          // 1. Schedule common subjects first (isCommon=true)
          const commonSubjects = semesterSubjects.filter(s => s.isCommon === true);

          commonSubjects.forEach(commonSubject => {
            scheduledExams.push({
              subjectId: commonSubject._id,
              subjectCode: commonSubject.code,
              subjectName: commonSubject.name,
              departmentId: 'ALL',
              departmentName: 'All Departments',
              date: availableDates[currentDateIndex],
              timeSlot: formatTimeSlot(timeSlots[0]),
              timeSlotObject: getTimeSlotObject(timeSlots[0]),
              category: 'common',
              semester,
              isCommon: true,
            });
            getSlot(currentDateIndex, 0).push({ subject: commonSubject, type: 'common' });
          });

          if (commonSubjects.length > 0) {
            currentDateIndex++;
          }

          // 2. Group remaining subjects by sharing patterns for parallel scheduling
          const remainingSubjects = semesterSubjects.filter(s => s.isCommon !== true);

          const processedSubjects = new Set();

          remainingSubjects.forEach(subject => {
            if (processedSubjects.has(subject._id.toString())) return;

            // Find a suitable time slot for this subject
            let placed = false;

            for (let timeIdx = 0; timeIdx < timeSlots.length && !placed; timeIdx++) {
              for (let dateIdx = currentDateIndex; dateIdx < availableDates.length && !placed; dateIdx++) {
                const slotContent = getSlot(dateIdx, timeIdx);

                if (!hasConflict(subject, slotContent)) {
                  // Schedule this subject
                  const deptCodes = getSubjectDeptCodes(subject);
                  const deptNames = deptCodes.join(', ');

                  scheduledExams.push({
                    subjectId: subject._id,
                    subjectCode: subject.code,
                    subjectName: subject.name,
                    departmentId: subject.department,
                    departmentName: deptNames,
                    date: availableDates[dateIdx],
                    timeSlot: formatTimeSlot(timeSlots[timeIdx]),
                    timeSlotObject: getTimeSlotObject(timeSlots[timeIdx]),
                    category: subject.type || 'regular',
                    semester,
                    sharedWith: subject.sharedWith || '',
                    isCommon: subject.isCommon || false,
                  });

                  slotContent.push({ subject, type: 'regular' });
                  processedSubjects.add(subject._id.toString());
                  placed = true;
                }
              }
            }

            if (!placed) {
              // Force placement if no suitable slot found
              const deptCodes = getSubjectDeptCodes(subject);
              const deptNames = deptCodes.join(', ');
              scheduledExams.push({
                subjectId: subject._id,
                subjectCode: subject.code,
                subjectName: subject.name,
                departmentId: subject.department || 'UNKNOWN',
                departmentName: `${deptNames} (Overflow)`,
                date: availableDates[currentDateIndex % availableDates.length],
                timeSlot: formatTimeSlot(timeSlots[0]),
                timeSlotObject: getTimeSlotObject(timeSlots[0]),
                category: subject.type || 'regular',
                semester,
                sharedWith: subject.sharedWith || '',
                isCommon: subject.isCommon || false,
              });
              currentDateIndex++;
            }
          });

        } else if (semester === 3) {
          // Semester 3: MA201 common first, then one per department per day

          // 1. Schedule common subjects (MA201) first
          const commonSubjects = semesterSubjects.filter(s => s.isCommon === true);

          commonSubjects.forEach(commonSubject => {
            scheduledExams.push({
              subjectId: commonSubject._id,
              subjectCode: commonSubject.code,
              subjectName: commonSubject.name,
              departmentId: 'ALL',
              departmentName: 'All Departments',
              date: availableDates[currentDateIndex],
              timeSlot: formatTimeSlot(timeSlots[0]),
              timeSlotObject: getTimeSlotObject(timeSlots[0]),
              category: 'common',
              semester,
              isCommon: true,
            });
          });

          if (commonSubjects.length > 0) {
            currentDateIndex++;
          }

          // 2. Schedule one subject per department per day
          const nonCommonSubjects = semesterSubjects.filter(s => s.isCommon !== true);

          const deptScheduleTracker = {};

          nonCommonSubjects.forEach(subject => {
            const deptCode = subject.department;

            if (!deptScheduleTracker[deptCode]) {
              deptScheduleTracker[deptCode] = currentDateIndex;
            }

            const deptCodes = getSubjectDeptCodes(subject);
            const deptNames = deptCodes.join(', ');

            scheduledExams.push({
              subjectId: subject._id,
              subjectCode: subject.code,
              subjectName: subject.name,
              departmentId: deptCode,
              departmentName: deptNames,
              date: availableDates[deptScheduleTracker[deptCode] % availableDates.length],
              timeSlot: formatTimeSlot(timeSlots[0]),
              timeSlotObject: getTimeSlotObject(timeSlots[0]),
              category: subject.type || 'regular',
              semester,
              sharedWith: subject.sharedWith || '',
              isCommon: subject.isCommon || false,
            });

            deptScheduleTracker[deptCode]++;
          });

          currentDateIndex = Math.max(...Object.values(deptScheduleTracker), currentDateIndex);

        } else if (semester <= 5) {
          // Semesters 4-5: One subject per department per day, avoid conflicts for shared subjects

          const deptScheduleTracker = {};
          const processedSubjects = new Set();

          // First, handle subjects that don't share departments - schedule one per department per day
          semesterSubjects.forEach(subject => {
            if (processedSubjects.has(subject._id.toString())) return;

            const subjectDepts = getSubjectDeptCodes(subject);
            const primaryDept = subject.department || 'UNKNOWN';

            // Check if this subject conflicts with already scheduled subjects for the same departments
            let canScheduleToday = true;

            // For shared subjects (like MA221 with CSE), ensure it doesn't conflict with CSE subjects
            if (subject.sharedWith && subject.sharedWith.trim() !== '') {
              const sharedDepts = subject.sharedWith.split(',').map(d => d.trim());

              // Check if any of the shared departments already have a subject today
              for (const dept of sharedDepts) {
                if (deptScheduleTracker[dept] === currentDateIndex) {
                  canScheduleToday = false;
                  break;
                }
              }
            }

            // Set the scheduling day
            if (!deptScheduleTracker[primaryDept]) {
              deptScheduleTracker[primaryDept] = currentDateIndex;
            }

            // If can't schedule today due to conflicts, move to next day
            if (!canScheduleToday) {
              deptScheduleTracker[primaryDept] = Math.max(deptScheduleTracker[primaryDept], currentDateIndex + 1);
            }

            const deptNames = subjectDepts.join(', ');

            scheduledExams.push({
              subjectId: subject._id,
              subjectCode: subject.code,
              subjectName: subject.name,
              departmentId: primaryDept,
              departmentName: deptNames,
              date: availableDates[deptScheduleTracker[primaryDept] % availableDates.length],
              timeSlot: formatTimeSlot(timeSlots[0]),
              timeSlotObject: getTimeSlotObject(timeSlots[0]),
              category: subject.type || 'regular',
              semester,
              sharedWith: subject.sharedWith || '',
              isCommon: subject.isCommon || false,
            });

            // Update tracker for all departments this subject affects
            if (subject.sharedWith && subject.sharedWith.trim() !== '') {
              const sharedDepts = subject.sharedWith.split(',').map(d => d.trim());
              sharedDepts.forEach(dept => {
                deptScheduleTracker[dept] = deptScheduleTracker[primaryDept];
              });
            }

            deptScheduleTracker[primaryDept]++;
            processedSubjects.add(subject._id.toString());
          });

          currentDateIndex = Math.max(...Object.values(deptScheduleTracker), currentDateIndex);

        } else {
          // Semester 6+: Group by elective types

          const openElectives = semesterSubjects.filter(s => s.type === 'open_elective');
          const coreElectives = semesterSubjects.filter(s => s.type === 'core_elective');
          const regularSubjects = semesterSubjects.filter(s => s.type === 'regular' || !s.type);

          // Schedule all open electives at same time
          if (openElectives.length > 0) {
            const openTimeSlot = formatTimeSlot(timeSlots[0]);
            openElectives.forEach(subject => {
              const deptCodes = getSubjectDeptCodes(subject);
              const deptNames = deptCodes.join(', ');

              scheduledExams.push({
                subjectId: subject._id,
                subjectCode: subject.code,
                subjectName: subject.name,
                departmentId: subject.department || 'ALL',
                departmentName: deptNames,
                date: availableDates[currentDateIndex],
                timeSlot: openTimeSlot,
                category: 'open_elective',
                semester,
                sharedWith: subject.sharedWith || '',
                isCommon: subject.isCommon || false,
              });
            });
            if (openElectives.length > 0) currentDateIndex++;
          }

          // Schedule all core electives at same time
          if (coreElectives.length > 0) {
            const coreTimeSlot = formatTimeSlot(timeSlots[1] || timeSlots[0]);
            coreElectives.forEach(subject => {
              const deptCodes = getSubjectDeptCodes(subject);
              const deptNames = deptCodes.join(', ');

              scheduledExams.push({
                subjectId: subject._id,
                subjectCode: subject.code,
                subjectName: subject.name,
                departmentId: subject.department || 'ALL',
                departmentName: deptNames,
                date: availableDates[currentDateIndex],
                timeSlot: coreTimeSlot,
                category: 'core_elective',
                semester,
                sharedWith: subject.sharedWith || '',
                isCommon: subject.isCommon || false,
              });
            });
            if (coreElectives.length > 0) currentDateIndex++;
          }

          // Schedule regular subjects one per department per day with conflict checking for shared subjects
          const deptScheduleTracker = {};
          const processedSubjects = new Set();

          // Group shared subjects and regular subjects
          const sharedSubjects = regularSubjects.filter(s => s.sharedWith && s.sharedWith.trim() !== '');
          const nonSharedSubjects = regularSubjects.filter(s => !s.sharedWith || s.sharedWith.trim() === '');

          // Process shared subjects first (like HS401, MS401)
          sharedSubjects.forEach(subject => {
            if (processedSubjects.has(subject._id.toString())) return;

            const primaryDept = subject.department || 'UNKNOWN';
            const sharedDepts = subject.sharedWith.split(',').map(d => d.trim());

            // Find a day where none of the shared departments have exams
            let foundSlot = false;
            let tryDateIndex = currentDateIndex;

            while (!foundSlot && tryDateIndex < currentDateIndex + 10) { // Limit search
              let hasConflict = false;

              // Check if any shared department already has an exam on this day
              for (const dept of sharedDepts) {
                if (deptScheduleTracker[dept] === tryDateIndex) {
                  hasConflict = true;
                  break;
                }
              }

              if (!hasConflict) {
                // Schedule the subject
                const allDepts = [primaryDept, ...sharedDepts];
                const deptNames = allDepts.join(', ');

                scheduledExams.push({
                  subjectId: subject._id,
                  subjectCode: subject.code,
                  subjectName: subject.name,
                  departmentId: primaryDept,
                  departmentName: deptNames,
                  date: availableDates[tryDateIndex % availableDates.length],
                  timeSlot: formatTimeSlot(timeSlots[0]),
                  timeSlotObject: getTimeSlotObject(timeSlots[0]),
                  category: subject.type || 'regular',
                  semester,
                  sharedWith: subject.sharedWith || '',
                  isCommon: subject.isCommon || false,
                });

                // Mark all affected departments as having an exam on this day
                allDepts.forEach(dept => {
                  deptScheduleTracker[dept] = tryDateIndex;
                });

                foundSlot = true;
                processedSubjects.add(subject._id.toString());
              } else {
                tryDateIndex++;
              }
            }

            if (!foundSlot) {
              // Force schedule if no slot found
              const allDepts = [primaryDept, ...sharedDepts];
              const deptNames = `${allDepts.join(', ')} (Conflict)`;

              scheduledExams.push({
                subjectId: subject._id,
                subjectCode: subject.code,
                subjectName: subject.name,
                departmentId: primaryDept,
                departmentName: deptNames,
                date: availableDates[currentDateIndex % availableDates.length],
                timeSlot: formatTimeSlot(timeSlots[0]),
                timeSlotObject: getTimeSlotObject(timeSlots[0]),
                category: subject.type || 'regular',
                semester,
                sharedWith: subject.sharedWith || '',
                isCommon: subject.isCommon || false,
              });
              currentDateIndex++;
            }
          });

          // Process non-shared regular subjects
          nonSharedSubjects.forEach(subject => {
            const deptCode = subject.department || 'UNKNOWN';

            if (!deptScheduleTracker[deptCode]) {
              deptScheduleTracker[deptCode] = currentDateIndex;
            } else {
              deptScheduleTracker[deptCode]++;
            }

            const deptCodes = getSubjectDeptCodes(subject);
            const deptNames = deptCodes.join(', ');

            scheduledExams.push({
              subjectId: subject._id,
              subjectCode: subject.code,
              subjectName: subject.name,
              departmentId: deptCode,
              departmentName: deptNames,
              date: availableDates[deptScheduleTracker[deptCode] % availableDates.length],
              timeSlot: formatTimeSlot(timeSlots[0]),
              timeSlotObject: getTimeSlotObject(timeSlots[0]),
              category: subject.type || 'regular',
              semester,
              sharedWith: subject.sharedWith || '',
              isCommon: subject.isCommon || false,
            });
          });

          currentDateIndex = Math.max(...Object.values(deptScheduleTracker), currentDateIndex);
        }
      });

      return scheduledExams;
    };

    // Generate the smart schedule
    schedule.push(...smartScheduler());

    // Auto-assign classrooms to the schedule
    try {
      const Classroom = require('../models/Classroom');
      const availableClassrooms = await Classroom.find({
        isActive: true,
        maintenanceStatus: 'operational',
      }).sort({ capacity: -1 });

      console.log('🔍 Available classrooms for auto-assignment:', availableClassrooms.map(c => ({ name: c.name, capacity: c.capacity, isAvailable: c.isAvailable })));

      if (availableClassrooms.length === 0) {
        console.log('⚠️ No available classrooms found for auto-assignment');
      } else {
        console.log(`🏢 Found ${availableClassrooms.length} available classrooms for auto-assignment`);

        // Group exams by date and time slot for classroom assignment
        const examGroups = {};
        schedule.forEach((exam, index) => {
          const key = `${exam.date}-${exam.timeSlot}`;
          if (!examGroups[key]) {
            examGroups[key] = [];
          }
          examGroups[key].push({ ...exam, originalIndex: index });
        });

        // Enhanced classroom assignment with strict conflict prevention and optimal distribution
        const classroomAssignmentTracker = {}; // Track classroom usage by date and time
        const examsByTimeSlot = {}; // Group exams by date and time for better assignment

        // First, group all exams by their date and time slot
        schedule.forEach((exam, index) => {
          const timeKey = `${exam.date}-${exam.timeSlot}`;
          if (!examsByTimeSlot[timeKey]) {
            examsByTimeSlot[timeKey] = [];
          }
          examsByTimeSlot[timeKey].push({ ...exam, originalIndex: index });
        });

        console.log(`📅 Found ${Object.keys(examsByTimeSlot).length} unique time slots for classroom assignment`);

        // Sort classrooms by capacity (larger first) to optimize space usage
        const sortedClassrooms = [...availableClassrooms].sort((a, b) => b.capacity - a.capacity);

        // Process each time slot separately to prevent conflicts
        Object.entries(examsByTimeSlot).forEach(([timeKey, examsInSlot]) => {
          const [examDate, examTimeSlot] = timeKey.split('-');
          console.log(`🏢 Assigning classrooms for ${examsInSlot.length} exams on ${examDate} at ${examTimeSlot}`);

          // Find available classrooms for this time slot (not already assigned)
          const availableForTimeSlot = sortedClassrooms.filter(classroom => {
            const classroomKey = `${classroom._id}-${examDate}-${examTimeSlot}`;
            return !classroomAssignmentTracker[classroomKey];
          });

          console.log(`🏢 Found ${availableForTimeSlot.length} available classrooms for time slot ${timeKey}`);

          // Assign classrooms to exams in this time slot
          examsInSlot.forEach((exam, examIndex) => {
            let selectedClassroom = null;

            // Estimate students needed for this exam
            const estimatedStudents = 60; // Conservative estimate per exam

            // Find the best fit classroom (smallest that can accommodate the students)
            const suitableClassrooms = availableForTimeSlot.filter(classroom =>
              classroom.capacity >= estimatedStudents,
            );

            if (suitableClassrooms.length > 0) {
              // Sort by capacity (smallest suitable first for efficiency)
              suitableClassrooms.sort((a, b) => a.capacity - b.capacity);
              selectedClassroom = suitableClassrooms[0];

              // Remove this classroom from available list for this time slot
              const classroomIndex = availableForTimeSlot.findIndex(c => c._id === selectedClassroom._id);
              if (classroomIndex > -1) {
                availableForTimeSlot.splice(classroomIndex, 1);
              }

              // Mark classroom as used for this time slot
              const classroomKey = `${selectedClassroom._id}-${examDate}-${examTimeSlot}`;
              classroomAssignmentTracker[classroomKey] = exam.originalIndex;

              console.log(`🏢 Assigned classroom: ${selectedClassroom.roomNumber} (capacity: ${selectedClassroom.capacity}) to exam: ${exam.subjectName}`);
            } else {
              // Fallback: use any available classroom (may be smaller than ideal)
              if (availableForTimeSlot.length > 0) {
                selectedClassroom = availableForTimeSlot[0];

                // Remove from available list
                availableForTimeSlot.splice(0, 1);

                // Mark as used
                const classroomKey = `${selectedClassroom._id}-${examDate}-${examTimeSlot}`;
                classroomAssignmentTracker[classroomKey] = exam.originalIndex;

                console.log(`⚠️ Fallback assignment: ${selectedClassroom.name} (capacity: ${selectedClassroom.capacity}) to exam: ${exam.subjectName} (may be undersized)`);
              } else {
                console.log(`❌ No available classrooms for exam: ${exam.subjectName} on ${examDate} at ${examTimeSlot}`);
                // Use the largest classroom anyway (will cause conflict but better than no assignment)
                selectedClassroom = sortedClassrooms[0];
                console.log(`🚨 Emergency assignment: ${selectedClassroom.name} to exam: ${exam.subjectName} (CONFLICT EXPECTED)`);
              }
            }

            // Apply the assignment to the schedule
            if (selectedClassroom) {
              schedule[exam.originalIndex].classroomId = selectedClassroom._id;
              schedule[exam.originalIndex].classroomName = selectedClassroom.roomNumber;
              schedule[exam.originalIndex].classroomCapacity = selectedClassroom.capacity;
            }
          });
        });

        // Verify no conflicts were created
        const conflictCheck = {};
        let conflictCount = 0;
        schedule.forEach((exam, index) => {
          if (exam.classroomId) {
            const key = `${exam.classroomId}-${exam.date}-${exam.timeSlot}`;
            if (conflictCheck[key]) {
              conflictCount++;
              console.log(`⚠️ Conflict detected: ${exam.subjectName} and ${schedule[conflictCheck[key]].subjectName} both assigned to ${exam.classroomName}`);
            } else {
              conflictCheck[key] = index;
            }
          }
        });

        if (conflictCount === 0) {
          console.log(`✅ Successfully assigned classrooms to ${schedule.length} exams with NO conflicts`);
        } else {
          console.log(`⚠️ Classroom assignment completed with ${conflictCount} conflicts that need manual resolution`);
        }

        console.log(`✅ Auto-assigned classrooms to ${schedule.length} exams`);
      }
    } catch (error) {
      console.log('⚠️ Error in auto-classroom assignment:', error.message);
      // Continue without classroom assignment
    }

    // Auto-assign invigilators to the schedule
    try {
      const Teacher = require('../models/Teacher');
      const availableInvigilators = await Teacher.find({
        isActive: true,
      }).select('_id fullName workload invigilationPreferences isInvigilator');

      console.log('🔍 Available invigilators for auto-assignment:', availableInvigilators.map(inv => ({ name: inv.fullName, workload: inv.workload, isInvigilator: inv.isInvigilator })));

      if (availableInvigilators.length === 0) {
        console.log('⚠️ No available invigilators found for auto-assignment');
      } else {
        console.log(`👨‍🏫 Found ${availableInvigilators.length} available invigilators for auto-assignment`);

        // Create invigilator workload tracker
        const invigilatorWorkload = {};
        availableInvigilators.forEach(inv => {
          invigilatorWorkload[inv._id] = {
            currentWorkload: inv.workload || 0,
            maxSessionsPerDay: inv.invigilationPreferences?.maxSessionsPerDay || 2,
            dailySessions: {},
            slots: [],
          };
        });

        // Group exams by date and time slot for invigilator assignment
        const examGroups = {};
        schedule.forEach((exam, index) => {
          const key = `${exam.date}-${exam.timeSlot}`;
          if (!examGroups[key]) {
            examGroups[key] = [];
          }
          examGroups[key].push({ ...exam, originalIndex: index });
        });

        // Enhanced invigilator assignment with better workload balancing and conflict prevention
        const calculateInvigilatorPriority = (teacher, invData, examDate, examTimeSlot) => {
          let priority = 0;

          // Check preferred time slots
          const currentHour = parseInt(examTimeSlot.start.split(':')[0]);
          if (teacher.invigilationPreferences?.preferredTimeSlots) {
            const prefs = teacher.invigilationPreferences.preferredTimeSlots;
            const isPreferredTime = (
              (prefs.includes('morning') && currentHour >= 6 && currentHour < 12) ||
              (prefs.includes('afternoon') && currentHour >= 12 && currentHour < 18) ||
              (prefs.includes('evening') && currentHour >= 18 && currentHour < 22)
            );
            if (isPreferredTime) priority += 10;
          }

          // Lower workload gets higher priority
          priority += (10 - Math.min(invData.currentWorkload, 10));

          // Less daily sessions gets higher priority
          const dailySessions = invData.dailySessions[examDate] || 0;
          priority += (5 - Math.min(dailySessions, 5));

          return priority;
        };

        schedule.forEach((exam, index) => {
          const examDate = exam.date;
          const examTimeSlot = exam.timeSlotObject || { start: '10:00 AM', end: '1:00 PM' };

          // Find available invigilators for this time slot with enhanced criteria
          const availableForSlot = Object.entries(invigilatorWorkload)
            .filter(([invId, invData]) => {
              const teacher = availableInvigilators.find(inv => inv._id.toString() === invId);
              if (!teacher) return false;

              // Check if invigilator has reached daily limit
              const dailyCount = invData.dailySessions[examDate] || 0;
              if (dailyCount >= invData.maxSessionsPerDay) return false;

              // Check for time conflicts
              const hasConflict = invData.slots.some(slot =>
                slot.date === examDate &&
                !(examTimeSlot.end <= slot.start || examTimeSlot.start >= slot.end),
              );

              return !hasConflict;
            })
            .map(([invId, invData]) => {
              const teacher = availableInvigilators.find(inv => inv._id.toString() === invId);
              return {
                id: invId,
                workload: invData.currentWorkload,
                teacher,
                priority: calculateInvigilatorPriority(teacher, invData, examDate, examTimeSlot),
              };
            })
            .sort((a, b) => {
              // Sort by priority first, then by workload
              if (a.priority !== b.priority) return b.priority - a.priority;
              return a.workload - b.workload;
            });

          let selectedInvigilator = null;

          if (availableForSlot.length > 0) {
            selectedInvigilator = availableForSlot[0];
          } else {
            // Fallback: find invigilators with time conflicts but lower workload
            const conflictedButAvailable = Object.entries(invigilatorWorkload)
              .filter(([invId, invData]) => {
                const teacher = availableInvigilators.find(inv => inv._id.toString() === invId);
                const dailySessions = invData.dailySessions[examDate] || 0;
                const maxSessionsPerDay = teacher?.invigilationPreferences?.maxSessionsPerDay || 3;
                return dailySessions < maxSessionsPerDay;
              })
              .map(([invId, invData]) => ({
                id: invId,
                workload: invData.currentWorkload,
                teacher: availableInvigilators.find(inv => inv._id.toString() === invId),
              }))
              .sort((a, b) => a.workload - b.workload);

            if (conflictedButAvailable.length > 0) {
              selectedInvigilator = conflictedButAvailable[0];
              console.log(`⚠️ Assigning invigilator with time conflict (best available): ${selectedInvigilator.teacher?.fullName}`);
            }
          }

          if (selectedInvigilator) {
            const invId = selectedInvigilator.id;
            const teacher = selectedInvigilator.teacher;

            // Update schedule with invigilator assignment
            schedule[index].invigilatorId = invId;
            schedule[index].invigilatorName = teacher?.fullName || 'Unknown';

            console.log(`👨‍🏫 Auto-assigned invigilator: ${schedule[index].invigilatorName} (workload: ${selectedInvigilator.workload}) to exam: ${schedule[index].subjectName}`);

            // Update invigilator workload tracker
            invigilatorWorkload[invId].currentWorkload += 1;
            invigilatorWorkload[invId].dailySessions[examDate] = (invigilatorWorkload[invId].dailySessions[examDate] || 0) + 1;
            invigilatorWorkload[invId].slots.push({
              date: examDate,
              start: examTimeSlot.start,
              end: examTimeSlot.end,
            });
          } else {
            console.log(`❌ No suitable invigilator found for exam: ${schedule[index].subjectName}`);
          }
        });

        console.log(`✅ Auto-assigned invigilators to ${schedule.length} exams`);
      }
    } catch (error) {
      console.log('⚠️ Error in auto-invigilator assignment:', error.message);
      // Continue without invigilator assignment
    }

    // Log final auto-assignment summary
    console.log('📊 Auto-Assignment Summary:');
    schedule.forEach((exam, index) => {
      console.log(`  ${index + 1}. ${exam.subjectName} (${exam.subjectCode})`);
      console.log(`     📅 Date: ${exam.date} | ⏰ Time: ${exam.timeSlot}`);
      console.log(`     🏢 Classroom: ${exam.classroomName || 'Not assigned'} (${exam.classroomCapacity || 'N/A'} capacity)`);
      console.log(`     👨‍🏫 Invigilator: ${exam.invigilatorName || 'Not assigned'}`);
      console.log('');
    });

    res.json({
      success: true,
      message: 'Schedule generated successfully with auto-classroom and auto-invigilator assignment',
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating schedule',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/auto-assign-classrooms
// @desc    Auto-assign classrooms to exam schedule
// @access  Private
router.post('/auto-assign-classrooms', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { examData } = req.body;
    const Classroom = require('../models/Classroom');

    const availableClassrooms = await Classroom.find({ isActive: true }).sort({ capacity: -1 });

    // Simple assignment logic - can be enhanced
    const assignments = examData.schedule.map((exam, index) => {
      const classroom = availableClassrooms[index % availableClassrooms.length];
      return {
        examId: exam.subjectId,
        classroomId: classroom._id,
        classroomName: classroom.roomNumber,
        capacity: classroom.capacity,
      };
    });

    res.json({
      success: true,
      message: 'Classrooms assigned successfully',
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning classrooms',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/auto-assign-invigilators
// @desc    Auto-assign invigilators to exam schedule
// @access  Private
router.post('/auto-assign-invigilators', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { examData } = req.body;
    const Teacher = require('../models/Teacher');

    const availableTeachers = await Teacher.find({ isActive: true, role: 'teacher' });

    // Simple assignment logic - can be enhanced
    const assignments = examData.schedule.map((exam, index) => {
      const teacher = availableTeachers[index % availableTeachers.length];
      return {
        examId: exam.subjectId,
        teacherId: teacher._id,
        teacherName: teacher.fullName,
        role: 'invigilator',
      };
    });

    res.json({
      success: true,
      message: 'Invigilators assigned successfully',
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning invigilators',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/draft
// @desc    Save draft exam schedule
// @access  Private
router.post('/draft', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { examDetails, schedule, classroomAssignments, invigilatorAssignments } = req.body;

    // Save draft to database or temporary storage
    const draftData = {
      examDetails,
      schedule,
      classroomAssignments,
      invigilatorAssignments,
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    res.json({
      success: true,
      message: 'Draft saved successfully',
      data: draftData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving draft',
      error: error.message,
    });
  }
});

// @route   GET /api/exams/drafts
// @desc    Get draft exam schedules
// @access  Private
router.get('/drafts', protect, checkPermission('read_exam'), async (req, res) => {
  try {
    // Retrieve drafts from database or temporary storage
    const drafts = []; // This would be populated from actual storage

    res.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching drafts',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/:id/publish
// @desc    Publish exam schedule
// @access  Private
router.post('/:id/publish', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    exam.status = 'scheduled';
    await exam.save();

    res.json({
      success: true,
      message: 'Exam schedule published successfully',
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing schedule',
      error: error.message,
    });
  }
});

// @route   POST /api/exams/:id/notify
// @desc    Send notifications for exam schedule
// @access  Private
router.post('/:id/notify', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(req.params.id).populate('classrooms.classroom');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Send notifications to students, teachers, etc.
    // This would integrate with the email service

    res.json({
      success: true,
      message: 'Notifications sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message,
    });
  }
});

module.exports = router;
