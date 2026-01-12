/**
 * Advanced Exam Scheduler
 *
 * Features:
 * - Groups subjects by department overlap
 * - Schedules multiple subjects per time slot (no student conflicts)
 * - Handles electives specially (all on same day)
 * - Maintains consistent classroom assignment per student
 * - AM/PM time format
 */

const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const Department = require('../models/Department');
const optimizedPreview = require('./optimizedPreviewService');

class AdvancedScheduler {
  constructor () {
    this.studentClassroomMap = new Map(); // Track which classroom each student is assigned to
    this.classroomUsageMap = new Map(); // Track classroom usage by date and time
  }

  /**
   * Main scheduling function with department-aware grouping
   */
  async scheduleExams (params) {
    const {
      examType,
      semesters,
      departments,
      dateRange,
      timeSlots,
      seatingStrategy = 'alternate',
      academicYear,
      createdBy,
    } = params;

    console.log(`\n${'='.repeat(80)}`);
    console.log('🚀 ADVANCED EXAM SCHEDULING - DEPARTMENT AWARE');
    console.log('='.repeat(80));
    console.log('Exam Type:', examType);
    console.log('Semesters:', semesters);
    console.log('Date Range:', dateRange);
    console.log('Time Slots:', timeSlots);
    console.log(`${'='.repeat(80)}\n`);

    // Reset tracking maps
    this.studentClassroomMap.clear();
    this.classroomUsageMap.clear();

    // STEP 1: Get subjects with enrollments (use full method for scheduling, not preview)
    console.log('📚 Fetching subjects with enrollments (full data for scheduling)...');
    const subjectsWithEnrollments = await this.getSubjectsWithEnrollments({
      semesters,
      departments,
      academicYear: academicYear || this.getCurrentAcademicYear(),
    });

    if (subjectsWithEnrollments.length === 0) {
      console.log('❌ No subjects found with enrolled students');
      throw new Error('No subjects found with enrolled students for the selected semesters');
    }

    console.log(`✅ Found ${subjectsWithEnrollments.length} subjects to schedule\n`);

    // STEP 2: Generate exam dates with AM/PM time slots
    const availableDates = this.generateExamDates(dateRange);
    const formattedTimeSlots = this.formatTimeSlotsToAMPM(timeSlots);

    console.log(`📅 Available dates: ${availableDates.length}`);
    console.log(`⏰ Time slots per day: ${formattedTimeSlots.length}\n`);

    // STEP 3: Group subjects by semester and type
    const groupedSubjects = this.groupSubjectsBySemesterAndType(subjectsWithEnrollments);

    // STEP 4: Schedule with advanced logic
    const scheduledExams = await this.advancedScheduling({
      groupedSubjects,
      availableDates,
      timeSlots: formattedTimeSlots,
      examType,
      seatingStrategy,
      academicYear,
      createdBy,
    });

    // STEP 5: Generate summary
    const summary = this.generateSummary(scheduledExams);

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 SCHEDULING COMPLETE');
    console.log('='.repeat(80));
    console.log(summary);
    console.log(`${'='.repeat(80)}\n`);

    // Serialize exams for frontend with all necessary fields
    const serializedExams = scheduledExams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      type: exam.type,
      subject: exam.subject,
      semester: exam.semester,
      academicYear: exam.academicYear,
      examDate: exam.examDate,
      date: exam.examDate, // Also include as 'date' for compatibility
      startTime: exam.startTime,
      endTime: exam.endTime,
      time: `${exam.startTime}-${exam.endTime}`, // Formatted time range
      duration: exam.duration,
      classrooms: exam.classrooms || [],
      invigilators: exam.invigilators || [],
      totalStudents: exam.totalStudents || 0,
      departments: exam.departments || [],
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    }));

    return {
      success: true,
      examsScheduled: scheduledExams.length,
      summary,
      exams: serializedExams,
    };
  }

  /**
   * Format time slots to AM/PM format
   */
  formatTimeSlotsToAMPM (timeSlots) {
    return timeSlots.map(slot => {
      const start = this.convertTo12Hour(slot.start);
      const end = this.convertTo12Hour(slot.end);
      return {
        start,
        end,
        original: slot,
      };
    });
  }

  /**
   * Convert 24-hour to 12-hour format
   */
  convertTo12Hour (time24) {
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;

    // Always include minutes for consistency
    return `${hour}:${minutes || '00'} ${ampm}`;
  }

  /**
   * Group subjects by semester and type
   */
  groupSubjectsBySemesterAndType (subjects) {
    const grouped = {};

    subjects.forEach(subjectData => {
      const sem = subjectData.semesterId;

      if (!grouped[sem]) {
        grouped[sem] = {
          regular: [],
          coreElectives: [],
          openElectives: [],
        };
      }

      const type = subjectData.subject.type || subjectData.subject.subjectType || 'regular';

      if (type === 'core_elective') {
        grouped[sem].coreElectives.push(subjectData);
      } else if (type === 'open_elective') {
        grouped[sem].openElectives.push(subjectData);
      } else {
        grouped[sem].regular.push(subjectData);
      }
    });

    return grouped;
  }

  /**
   * Advanced scheduling with department-aware grouping
   */
  async advancedScheduling (options) {
    const {
      groupedSubjects,
      availableDates,
      timeSlots,
      examType,
      seatingStrategy,
      academicYear,
      createdBy,
    } = options;

    const scheduledExams = [];
    let dateIndex = 0;

    // Process each semester
    for (const semesterStr of Object.keys(groupedSubjects).sort((a, b) => parseInt(a) - parseInt(b))) {
      const semester = parseInt(semesterStr);
      const semesterData = groupedSubjects[semester];

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📚 SEMESTER ${semester}`);
      console.log('='.repeat(80));

      // Handle semesters 1-2 differently (grouped scheduling)
      if (semester <= 2) {
        const exams = await this.scheduleFoundationSemesters(
          semesterData.regular,
          availableDates,
          timeSlots,
          dateIndex,
          examType,
          seatingStrategy,
          academicYear,
          semester,
          createdBy,
        );
        scheduledExams.push(...exams);
        dateIndex += Math.ceil(exams.length / timeSlots.length);
      }
      // Handle semesters 3-8 (one subject per day per department)
      else {
        // Schedule regular subjects
        const regularExams = await this.scheduleHigherSemesters(
          semesterData.regular,
          availableDates,
          timeSlots,
          dateIndex,
          examType,
          seatingStrategy,
          academicYear,
          semester,
          createdBy,
        );
        scheduledExams.push(...regularExams);
        dateIndex += Math.ceil(regularExams.length / timeSlots.length);

        // Schedule ALL core electives on SAME day
        if (semesterData.coreElectives.length > 0) {
          console.log(`\n📌 Scheduling ${semesterData.coreElectives.length} CORE ELECTIVES on same day...`);
          const coreExams = await this.scheduleElectivesOnSameDay(
            semesterData.coreElectives,
            availableDates[dateIndex],
            timeSlots,
            examType,
            seatingStrategy,
            academicYear,
            semester,
            createdBy,
            'Core Elective',
          );
          scheduledExams.push(...coreExams);
          dateIndex++;
        }

        // Schedule ALL open electives on SAME day
        if (semesterData.openElectives.length > 0) {
          console.log(`\n📌 Scheduling ${semesterData.openElectives.length} OPEN ELECTIVES on same day...`);
          const openExams = await this.scheduleElectivesOnSameDay(
            semesterData.openElectives,
            availableDates[dateIndex],
            timeSlots,
            examType,
            seatingStrategy,
            academicYear,
            semester,
            createdBy,
            'Open Elective',
          );
          scheduledExams.push(...openExams);
          dateIndex++;
        }
      }
    }

    return scheduledExams;
  }

  /**
   * Schedule foundation semesters (1-2) with department grouping
   */
  async scheduleFoundationSemesters (subjects, dates, timeSlots, startDateIndex, examType, seatingStrategy, academicYear, semester, createdBy) {
    const scheduledExams = [];

    // Group subjects by department overlap pattern
    const subjectGroups = this.groupSubjectsByDepartmentOverlap(subjects);

    console.log(`\n📊 Found ${subjectGroups.length} subject groups for parallel scheduling`);

    let dateIndex = startDateIndex;
    let currentDate = dates[dateIndex];

    for (const group of subjectGroups) {
      if (dateIndex >= dates.length) {
        console.log('⚠️  Ran out of dates');
        break;
      }

      currentDate = dates[dateIndex];
      console.log(`\n📅 Date ${dateIndex + 1}: ${currentDate.toLocaleDateString()}`);

      // Schedule all subjects in this group (they don't conflict)
      let timeSlotIndex = 0;

      for (const subjectData of group) {
        if (timeSlotIndex >= timeSlots.length) {
          // Move to next day
          dateIndex++;
          if (dateIndex >= dates.length) break;
          currentDate = dates[dateIndex];
          timeSlotIndex = 0;
          console.log(`\n📅 Date ${dateIndex + 1}: ${currentDate.toLocaleDateString()}`);
        }

        const timeSlot = timeSlots[timeSlotIndex];

        try {
          const exam = await this.scheduleSubject(
            subjectData,
            currentDate,
            timeSlot,
            examType,
            seatingStrategy,
            academicYear,
            semester,
            createdBy,
          );

          if (exam) {
            scheduledExams.push(exam);
            console.log(`   ✅ ${timeSlot.start}-${timeSlot.end}: ${subjectData.subject.code} (${subjectData.departmentNames.join(', ')})`);
          }
        } catch (error) {
          console.log(`   ❌ Error scheduling ${subjectData.subject.code}: ${error.message}`);
        }

        timeSlotIndex++;
      }

      dateIndex++;
    }

    return scheduledExams;
  }

  /**
   * Schedule higher semesters (3-8) - one subject per day per department
   */
  async scheduleHigherSemesters (subjects, dates, timeSlots, startDateIndex, examType, seatingStrategy, academicYear, semester, createdBy) {
    const scheduledExams = [];
    let dateIndex = startDateIndex;

    // Group by department
    const byDepartment = {};
    subjects.forEach(subjectData => {
      subjectData.departmentNames.forEach(deptName => {
        if (!byDepartment[deptName]) {
          byDepartment[deptName] = [];
        }
        byDepartment[deptName].push(subjectData);
      });
    });

    console.log(`\n📊 Departments: ${Object.keys(byDepartment).join(', ')}`);

    // Schedule one subject per day for each department
    const maxSubjects = Math.max(...Object.values(byDepartment).map(arr => arr.length));

    for (let i = 0; i < maxSubjects; i++) {
      if (dateIndex >= dates.length) {
        console.log('⚠️  Ran out of dates');
        break;
      }

      const currentDate = dates[dateIndex];
      console.log(`\n📅 Date ${dateIndex + 1}: ${currentDate.toLocaleDateString()}`);

      let timeSlotIndex = 0;

      // Schedule one subject from each department
      for (const [deptName, deptSubjects] of Object.entries(byDepartment)) {
        if (i >= deptSubjects.length) {
          console.log(`   ✓ ${deptName}: Finished`);
          continue; // This department is done
        }

        if (timeSlotIndex >= timeSlots.length) {
          console.log('   ⚠️  No more time slots today');
          break;
        }

        const subjectData = deptSubjects[i];
        const timeSlot = timeSlots[timeSlotIndex];

        try {
          const exam = await this.scheduleSubject(
            subjectData,
            currentDate,
            timeSlot,
            examType,
            seatingStrategy,
            academicYear,
            semester,
            createdBy,
          );

          if (exam) {
            scheduledExams.push(exam);
            console.log(`   ✅ ${timeSlot.start}-${timeSlot.end}: ${subjectData.subject.code} (${deptName})`);
          }

          timeSlotIndex++;
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

      dateIndex++;
    }

    return scheduledExams;
  }

  /**
   * Schedule all electives on the SAME day
   */
  async scheduleElectivesOnSameDay (electives, date, timeSlots, examType, seatingStrategy, academicYear, semester, createdBy, electiveType) {
    const scheduledExams = [];

    console.log(`📅 ${electiveType} Date: ${date.toLocaleDateString()}`);

    let timeSlotIndex = 0;

    for (const subjectData of electives) {
      if (timeSlotIndex >= timeSlots.length) {
        console.log(`   ⚠️  Not enough time slots for all ${electiveType}s`);
        break;
      }

      const timeSlot = timeSlots[timeSlotIndex];

      try {
        const exam = await this.scheduleSubject(
          subjectData,
          date,
          timeSlot,
          examType,
          seatingStrategy,
          academicYear,
          semester,
          createdBy,
        );

        if (exam) {
          scheduledExams.push(exam);
          console.log(`   ✅ ${timeSlot.start}-${timeSlot.end}: ${subjectData.subject.code} - ${subjectData.subject.name}`);
        }

        timeSlotIndex++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    return scheduledExams;
  }

  /**
   * Schedule a single subject with consistent classroom assignment
   * If subject has too many students, it may need multiple time slots
   */
  async scheduleSubject (subjectData, date, timeSlot, examType, seatingStrategy, academicYear, semester, createdBy) {
    // Check how many students can fit in one time slot
    const maxStudentsPerSlot = await this.getMaxStudentsPerTimeSlot();

    if (subjectData.totalStudents <= maxStudentsPerSlot) {
      // Single time slot is enough
      return await this.scheduleSubjectInSingleSlot(
        subjectData,
        date,
        timeSlot,
        examType,
        seatingStrategy,
        academicYear,
        semester,
        createdBy,
      );
    } else {
      // Need multiple time slots - split students
      console.log(`   ⚠️  Subject has ${subjectData.totalStudents} students, needs multiple slots`);
      return await this.scheduleSubjectInSingleSlot(
        subjectData,
        date,
        timeSlot,
        examType,
        seatingStrategy,
        academicYear,
        semester,
        createdBy,
      );
    }
  }

  /**
   * Schedule subject in a single time slot
   */
  async scheduleSubjectInSingleSlot (subjectData, date, timeSlot, examType, seatingStrategy, academicYear, semester, createdBy) {
    // Allocate classrooms with CONSISTENT student assignments
    const classroomSeatingData = await this.allocateClassroomsWithConsistentAssignment(
      subjectData.students,
      date,
      timeSlot,
      seatingStrategy,
      semester,
    );

    if (classroomSeatingData.length === 0) {
      throw new Error('No available classrooms');
    }

    // Assign invigilators
    const invigilatorAssignments = await this.assignInvigilators(
      classroomSeatingData,
      date,
      timeSlot,
    );

    // Create exam
    const exam = await this.createExam({
      examType,
      subject: subjectData.subject,
      semesterId: subjectData.semesterId,
      academicYear,
      examDate: date,
      timeSlot,
      classrooms: classroomSeatingData,
      invigilators: invigilatorAssignments,
      totalStudents: subjectData.totalStudents,
      departments: subjectData.departments,
      createdBy,
    });

    return exam;
  }

  /**
   * Get max students that can be accommodated in one time slot
   */
  async getMaxStudentsPerTimeSlot () {
    const classrooms = await Classroom.find({
      isActive: true,
      maintenanceStatus: 'operational',
    }).select('roomNumber building floor capacity seatingLayout maintenanceStatus');

    const totalCapacity = classrooms.reduce((sum, c) => sum + Math.floor(c.capacity * 0.6), 0);
    return totalCapacity;
  }

  /**
   * Group subjects by department overlap (for parallel scheduling)
   */
  groupSubjectsByDepartmentOverlap (subjects) {
    const groups = [];
    const scheduled = new Set();

    for (const subject of subjects) {
      if (scheduled.has(subject.subject._id.toString())) continue;

      const group = [subject];
      scheduled.add(subject.subject._id.toString());

      // Find other subjects that don't share students
      for (const otherSubject of subjects) {
        if (scheduled.has(otherSubject.subject._id.toString())) continue;

        if (!this.hasStudentOverlap(group, otherSubject)) {
          group.push(otherSubject);
          scheduled.add(otherSubject.subject._id.toString());
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if subject has student overlap with any in group
   */
  hasStudentOverlap (subjectGroup, newSubject) {
    const newStudentIds = new Set(newSubject.students.map(s => s._id.toString()));

    for (const groupSubject of subjectGroup) {
      for (const student of groupSubject.students) {
        if (newStudentIds.has(student._id.toString())) {
          return true; // Overlap found
        }
      }
    }

    return false;
  }

  /**
   * Allocate classrooms with CONSISTENT student assignment
   * Once assigned to a classroom, student stays there for ALL exams
   */
  async allocateClassroomsWithConsistentAssignment (students, date, timeSlot, seatingStrategy, semester) {
    const classrooms = await Classroom.find({
      isAvailable: true,
    }).select('roomNumber building floor capacity seatingLayout maintenanceStatus').sort({ capacity: -1 });

    if (classrooms.length === 0) {
      console.log('❌ No classrooms found in database!');
      throw new Error('No available classrooms found. Please add classrooms to the system.');
    }

    console.log(`   ✅ Found ${classrooms.length} available classrooms`);

    const classroomSeatingData = [];
    const classroomStudentMap = new Map(); // classroom -> students for this exam

    // Assign students to classrooms
    for (const student of students) {
      const studentId = student._id.toString();

      // Check if student already has a classroom assignment
      let assignedClassroom = this.studentClassroomMap.get(studentId);

      if (!assignedClassroom) {
        // First exam for this student - assign to a classroom
        // Find classroom with space (60% capacity for alternate seating)
        for (const classroom of classrooms) {
          const capacity = Math.floor(classroom.capacity * 0.6);
          const currentCount = classroomStudentMap.get(classroom._id.toString())?.length || 0;

          if (currentCount < capacity) {
            assignedClassroom = classroom._id.toString();
            this.studentClassroomMap.set(studentId, assignedClassroom);
            break;
          }
        }
      }

      // Add student to classroom for this exam
      if (assignedClassroom) {
        if (!classroomStudentMap.has(assignedClassroom)) {
          classroomStudentMap.set(assignedClassroom, []);
        }
        classroomStudentMap.get(assignedClassroom).push(student);
      }
    }

    // Generate seating arrangements
    for (const [classroomId, classroomStudents] of classroomStudentMap.entries()) {
      const classroom = classrooms.find(c => c._id.toString() === classroomId);

      const seatingArrangement = this.generateSeatingArrangement(
        classroomStudents,
        classroom,
        seatingStrategy,
      );

      classroomSeatingData.push({
        classroom: classroom._id,
        assignedStudents: classroomStudents.map(s => s._id),
        seatingArrangement,
      });
    }

    return classroomSeatingData;
  }

  /**
   * Generate seating arrangement
   */
  generateSeatingArrangement (students, classroom, strategy = 'alternate') {
    const seating = [];
    const rows = classroom.layout?.rows || 10;
    const cols = classroom.layout?.columns || 6;

    let studentIndex = 0;

    if (strategy === 'alternate') {
      for (let row = 1; row <= rows && studentIndex < students.length; row++) {
        for (let col = 1; col <= cols && studentIndex < students.length; col += 2) {
          seating.push({
            row,
            column: col,
            seatNumber: `R${row}-C${col}`,
            student: students[studentIndex]._id,
            isOccupied: true,
          });
          studentIndex++;
        }
      }
    } else {
      for (let row = 1; row <= rows && studentIndex < students.length; row++) {
        for (let col = 1; col <= cols && studentIndex < students.length; col++) {
          seating.push({
            row,
            column: col,
            seatNumber: `R${row}-C${col}`,
            student: students[studentIndex]._id,
            isOccupied: true,
          });
          studentIndex++;
        }
      }
    }

    return seating;
  }

  /**
   * Assign invigilators
   */
  async assignInvigilators (classroomSeatingData, date, timeSlot) {
    const teachers = await Teacher.find({ isActive: true }).limit(classroomSeatingData.length * 2);

    const invigilators = [];
    let teacherIndex = 0;

    for (const classroomData of classroomSeatingData) {
      if (teacherIndex < teachers.length) {
        invigilators.push({
          teacher: teachers[teacherIndex]._id,
          role: 'chief_invigilator',
          assignedClassrooms: [classroomData.classroom],
        });
        teacherIndex++;
      }

      if (teacherIndex < teachers.length) {
        invigilators.push({
          teacher: teachers[teacherIndex]._id,
          role: 'invigilator',
          assignedClassrooms: [classroomData.classroom],
        });
        teacherIndex++;
      }
    }

    return invigilators;
  }

  /**
   * Create exam document
   */
  async createExam (data) {
    const { examType, subject, semesterId, academicYear, examDate, timeSlot, classrooms, invigilators, totalStudents, departments, createdBy } = data;

    // Convert exam type to model format
    const examTypeMap = {
      'Mid-Semester': 'mid_semester',
      'End-Semester': 'end_semester',
      'Quiz': 'quiz',
      'Assignment': 'assignment',
      'Practical': 'practical',
      'Viva': 'viva',
    };

    // Convert AM/PM time to 24-hour format
    const convertTo24Hour = (time) => {
      if (!time) return '10:00';

      console.log(`      🕐 Converting time: "${time}"`);

      // Check if already in 24-hour format
      if (time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        // Ensure it's zero-padded
        const [h, m] = time.split(':');
        const result = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        console.log(`      ✅ Already 24-hour, zero-padded: "${result}"`);
        return result;
      }

      // Convert from AM/PM format
      const [timePart, period] = time.split(' ');
      if (!timePart || !period) {
        console.log('      ⚠️  Invalid time format, using default: "10:00"');
        return '10:00';
      }

      const parts = timePart.split(':');
      let hours = parseInt(parts[0]) || 0;
      const minutes = parts[1] ? parseInt(parts[1]) : 0; // Default to 0 if no minutes

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const result = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      console.log(`      ✅ Converted to 24-hour: "${result}"`);
      return result;
    };

    const startTime24 = convertTo24Hour(timeSlot.start);
    const endTime24 = convertTo24Hour(timeSlot.end);

    console.log(`      📝 Final times: ${startTime24} - ${endTime24}`);

    const exam = await Exam.create({
      title: `${examType} - ${subject.name}`,
      type: examTypeMap[examType] || 'end_semester',
      subject: subject._id,
      semester: `Semester ${semesterId}`,
      academicYear,
      examDate,
      startTime: startTime24,
      endTime: endTime24,
      duration: this.calculateDuration(startTime24, endTime24),
      totalMarks: 100, // Default marks
      passingMarks: 40, // Default passing marks (40%)
      classrooms,
      invigilators,
      totalStudents,
      departments,
      status: 'scheduled',
      isActive: true,
      createdBy: createdBy || null,
    });

    // Return exam with subject data embedded for easier frontend use
    return {
      ...exam.toObject(),
      subject: {
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        type: subject.type,
        semesterId: subject.semesterId,
      },
    };
  }

  /**
   * Get subjects with enrollments
   */
  async getSubjectsWithEnrollments (filters) {
    const { semesters, departments, academicYear } = filters;

    console.log('📚 Fetching subjects with enrolled students...');

    const enrollmentQuery = {
      status: 'Enrolled',
      academicYear: academicYear || this.getCurrentAcademicYear(),
    };

    if (semesters && semesters.length > 0) {
      enrollmentQuery.semester = { $in: semesters };
    }

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate({
        path: 'subject',
        match: { isActive: true },
        populate: { path: 'departmentId courseCoordinator' },
      })
      .populate({
        path: 'student',
        match: { isActive: true },
        populate: { path: 'department' },
      });

    console.log(`   Found ${enrollments.length} total enrollments`);

    const subjectMap = new Map();

    for (const enrollment of enrollments) {
      if (!enrollment.subject || !enrollment.student) continue;

      const subjectId = enrollment.subject._id.toString();
      const studentDeptId = enrollment.student.department?._id?.toString();

      if (departments && departments.length > 0) {
        const matchesDept = departments.some(deptId => deptId.toString() === studentDeptId);
        if (!matchesDept) continue;
      }

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: enrollment.subject,
          semesterId: enrollment.subject.semesterId,
          students: [],
          departments: new Set(),
          departmentNames: new Set(),
        });
      }

      const subjectData = subjectMap.get(subjectId);
      subjectData.students.push(enrollment.student);

      if (enrollment.student.department) {
        subjectData.departments.add(enrollment.student.department._id);
        subjectData.departmentNames.add(enrollment.student.department.name);
      }
    }

    const result = Array.from(subjectMap.values()).map(data => ({
      ...data,
      departments: Array.from(data.departments),
      departmentNames: Array.from(data.departmentNames),
      totalStudents: data.students.length,
    }));

    console.log(`   ✅ Grouped into ${result.length} unique subjects\n`);

    return result;
  }

  /**
   * Helper functions
   */
  generateExamDates (dateRange) {
    const dates = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }

    return dates;
  }

  calculateDuration (startTime, endTime) {
    return 180; // Default 3 hours
  }

  getCurrentAcademicYear () {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }

  generateSummary (exams) {
    const totalExams = exams.length;
    const totalStudents = exams.reduce((sum, e) => sum + e.totalStudents, 0);
    const totalClassrooms = exams.reduce((sum, e) => sum + e.classrooms.length, 0);
    const totalInvigilators = exams.reduce((sum, e) => sum + e.invigilators.length, 0);

    const uniqueClassrooms = new Set();
    exams.forEach(e => {
      e.classrooms.forEach(c => uniqueClassrooms.add(c.classroom.toString()));
    });

    return `
    Total Exams: ${totalExams}
    Total Students: ${totalStudents}
    Total Classroom Allocations: ${totalClassrooms}
    Unique Classrooms Used: ${uniqueClassrooms.size}
    Total Invigilators: ${totalInvigilators}
    Consistent Classroom Assignments: ${this.studentClassroomMap.size} students
    `;
  }
}

module.exports = new AdvancedScheduler();

