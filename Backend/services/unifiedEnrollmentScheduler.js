/**
 * Unified Enrollment-Based Exam Scheduler
 *
 * Single-step scheduler that:
 * 1. Fetches subjects with enrolled students
 * 2. Allocates classrooms + generates seating in ONE operation
 * 3. Assigns invigilators to classrooms
 */

const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const Department = require('../models/Department');
const optimizedPreview = require('./optimizedPreviewService');

class UnifiedEnrollmentScheduler {
  /**
   * Main scheduling function - does everything in one go
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

    console.log(`\n${'='.repeat(70)}`);
    console.log('🚀 UNIFIED ENROLLMENT-BASED EXAM SCHEDULING');
    console.log('='.repeat(70));
    console.log('Exam Type:', examType);
    console.log('Semesters:', semesters);
    console.log('Departments:', departments || 'All');
    console.log('Date Range:', dateRange);
    console.log('Seating Strategy:', seatingStrategy);
    console.log(`${'='.repeat(70)}\n`);

    // STEP 1: Get subjects with enrolled students (use full method for scheduling)
    const subjectsWithEnrollments = await this.getSubjectsWithEnrollments({
      semesters,
      departments,
      academicYear: academicYear || this.getCurrentAcademicYear(),
    });

    if (subjectsWithEnrollments.length === 0) {
      throw new Error('No subjects found with enrolled students');
    }

    console.log(`✅ Found ${subjectsWithEnrollments.length} subjects to schedule\n`);

    // STEP 2: Generate exam dates
    const availableDates = this.generateExamDates(dateRange);
    console.log(`📅 Available exam dates: ${availableDates.length}\n`);

    // STEP 3: Build conflict-free schedule with consistent seating
    const scheduledExams = [];
    const studentExamMap = new Map(); // Track which students have exams on which dates
    const semesterSeatingMap = new Map(); // Track consistent seating per semester
    const roomUsageBySlot = new Map(); // Track classroom usage by slot
    const teacherUsageBySlot = new Map(); // Track teacher usage by slot

    // PRE-LOAD existing exams to avoid conflicts across scheduling sessions
    console.log('\n🔍 Pre-loading existing exams to prevent classroom/teacher conflicts...');
    await this.preloadExistingAllocations(availableDates, roomUsageBySlot, teacherUsageBySlot);

    let dateIndex = 0;
    let timeSlotIndex = 0;

    for (const subjectData of subjectsWithEnrollments) {
      if (dateIndex >= availableDates.length) {
        console.log('⚠️  Warning: Ran out of available dates');
        break;
      }

      let examDate = availableDates[dateIndex];
      let timeSlot = timeSlots[timeSlotIndex];

      // Check for student conflicts (no student should have 2 exams same day)
      const hasConflict = this.checkStudentConflicts(
        subjectData.students,
        examDate,
        studentExamMap,
      );

      if (hasConflict) {
        console.log('\n⚠️  Student conflict detected, moving to next day...');
        timeSlotIndex = 0;
        dateIndex++;
        if (dateIndex >= availableDates.length) {
          console.log('⚠️  Ran out of dates!');
          break;
        }
        examDate = availableDates[dateIndex];
        timeSlot = timeSlots[timeSlotIndex];
      }

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📝 SCHEDULING: ${subjectData.subject.code} - ${subjectData.subject.name}`);
      console.log(`${'─'.repeat(60)}`);
      console.log(`   Date: ${examDate.toLocaleDateString()}`);
      console.log(`   Time: ${timeSlot.start} - ${timeSlot.end}`);
      console.log(`   Total Students: ${subjectData.totalStudents}`);
      console.log(`   Departments: ${subjectData.departmentNames.join(', ')}`);

      try {
        // UNIFIED STEP: Allocate classrooms AND generate seating
        const slotDateKey = `${examDate.toDateString()}-${timeSlot.start}-${timeSlot.end}`;
        const classroomSeatingData = await this.allocateClassroomsWithConsistentSeating(
          subjectData.students,
          examDate,
          timeSlot,
          seatingStrategy,
          subjectData.semesterId,
          semesterSeatingMap,
          roomUsageBySlot,
          slotDateKey,
          subjectData,
        );

        if (classroomSeatingData.length === 0) {
          console.log('   ❌ No available classrooms - skipping\n');
          continue;
        }

        console.log(`   ✅ Allocated ${classroomSeatingData.length} classroom(s) with consistent seating`);

        // Assign invigilators
        const invigilatorAssignments = await this.assignInvigilatorsToClassrooms(
          examDate,
          timeSlot,
          classroomSeatingData,
          teacherUsageBySlot,
          slotDateKey,
        );

        console.log(`   ✅ Assigned ${invigilatorAssignments.length} invigilator(s)`);

        // Create exam document
        const exam = await this.createExam({
          examType,
          subject: subjectData.subject,
          semesterId: subjectData.semesterId,
          academicYear: academicYear || this.getCurrentAcademicYear(),
          examDate,
          timeSlot,
          classrooms: classroomSeatingData,
          invigilators: invigilatorAssignments,
          totalStudents: subjectData.totalStudents,
          departments: subjectData.departments,
          createdBy,
        });

        scheduledExams.push(exam);

        // Mark classroom usage for this slot
        if (!roomUsageBySlot.has(slotDateKey)) {
          roomUsageBySlot.set(slotDateKey, new Set());
        }
        const usedRooms = roomUsageBySlot.get(slotDateKey);
        for (const c of classroomSeatingData) {
          usedRooms.add(c.classroom.toString());
        }

        // Mark teacher usage for this slot
        if (!teacherUsageBySlot.has(slotDateKey)) {
          teacherUsageBySlot.set(slotDateKey, new Set());
        }
        const usedTeachers = teacherUsageBySlot.get(slotDateKey);
        for (const inv of invigilatorAssignments) {
          usedTeachers.add(inv.teacher.toString());
        }

        // Mark students as having exam on this date
        subjectData.students.forEach(student => {
          const dateKey = examDate.toISOString().split('T')[0];
          if (!studentExamMap.has(student._id.toString())) {
            studentExamMap.set(student._id.toString(), new Set());
          }
          studentExamMap.get(student._id.toString()).add(dateKey);
        });

        console.log(`   ✅ Exam created successfully (ID: ${exam._id})`);

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }

      // Move to next time slot/date
      timeSlotIndex++;
      if (timeSlotIndex >= timeSlots.length) {
        timeSlotIndex = 0;
        dateIndex++;
      }
    }

    // STEP 4: Generate summary
    const summary = this.generateSummary(scheduledExams);

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 SCHEDULING COMPLETE');
    console.log('='.repeat(70));
    console.log(summary);
    console.log(`${'='.repeat(70)}\n`);

    return {
      success: true,
      examsScheduled: scheduledExams.length,
      summary,
      exams: scheduledExams,
    };
  }

  /**
   * STEP 1: Get subjects with enrolled students
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

    // Get all active enrollments with populated data
    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate({
        path: 'subject',
        match: { isActive: true },
        populate: { path: 'departmentId' },
      })
      .populate({
        path: 'student',
        match: { isActive: true },
        populate: { path: 'department' },
      });

    console.log(`   Found ${enrollments.length} total enrollments`);

    // Group by subject
    const subjectMap = new Map();

    for (const enrollment of enrollments) {
      if (!enrollment.subject || !enrollment.student) continue;

      const subjectId = enrollment.subject._id.toString();
      const studentDeptId = enrollment.student.department?._id?.toString();

      // Filter by department if specified
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
        subjectData.departments.add(studentDeptId);
        subjectData.departmentNames.add(enrollment.student.department.name);
      }
    }

    // Convert to array
    const result = Array.from(subjectMap.values()).map(data => ({
      subject: data.subject,
      semesterId: data.semesterId,
      totalStudents: data.students.length,
      students: data.students,
      departments: Array.from(data.departments),
      departmentNames: Array.from(data.departmentNames),
    }));

    // Sort by semester and total students
    result.sort((a, b) => {
      if (a.semesterId !== b.semesterId) {
        return a.semesterId - b.semesterId;
      }
      return b.totalStudents - a.totalStudents;
    });

    console.log(`   ✅ ${result.length} subjects with enrollments found`);
    result.forEach(s => {
      console.log(`      • ${s.subject.code} (Sem ${s.semesterId}): ${s.totalStudents} students`);
    });

    return result;
  }

  /**
   * Check if any student has exam conflict on this date
   */
  checkStudentConflicts (students, examDate, studentExamMap) {
    const dateKey = examDate.toISOString().split('T')[0];

    for (const student of students) {
      const studentId = student._id.toString();
      if (studentExamMap.has(studentId)) {
        const examDates = studentExamMap.get(studentId);
        if (examDates.has(dateKey)) {
          return true; // Conflict found
        }
      }
    }

    return false; // No conflict
  }

  /**
   * UNIFIED: Allocate classrooms AND generate CONSISTENT seating
   */
  async allocateClassroomsWithConsistentSeating (
    students,
    examDate,
    timeSlot,
    seatingStrategy,
    semesterId,
    semesterSeatingMap,
    roomUsageBySlot,
    slotDateKey,
    subjectData,
  ) {
    console.log('\n   🏢 Allocating classrooms with consistent seating...');

    const totalStudents = students.length;
    const SEATING_FACTOR = 0.6; // 60% capacity for alternate seating

    // Get available classrooms
    const allClassrooms = await this.getAvailableClassrooms(examDate, timeSlot);

    // Filter out classrooms already used in this slot (from pre-loaded data or current session)
    const usedRooms = roomUsageBySlot?.get(slotDateKey) || new Set();
    const availableClassrooms = allClassrooms.filter(c => !usedRooms.has(c._id.toString()));

    console.log(`      Found ${allClassrooms.length} total classrooms, ${availableClassrooms.length} available for this slot`);

    if (availableClassrooms.length === 0) {
      throw new Error('No available classrooms');
    }

    console.log(`      Found ${availableClassrooms.length} available classroom(s)`);

    // Check if we have consistent seating for this semester
    const semesterKey = `sem-${semesterId}`;
    let studentSeatingMap = semesterSeatingMap.get(semesterKey);

    if (!studentSeatingMap) {
      // First exam of semester - create seating map
      console.log(`      Creating consistent seating map for Semester ${semesterId}`);
      studentSeatingMap = new Map();
      semesterSeatingMap.set(semesterKey, studentSeatingMap);
    }

    // Shuffle students to mix departments (only if new semester)
    const shuffledStudents = studentSeatingMap.size === 0
      ? this.shuffleWithDepartmentMix(students)
      : students;

    // Allocate students to classrooms with consistent seating
    const classroomSeatingData = [];
    let studentIndex = 0;

    for (const classroom of availableClassrooms) {
      if (studentIndex >= totalStudents) break;

      const effectiveCapacity = Math.floor(classroom.capacity * SEATING_FACTOR);
      const studentsForThisRoom = Math.min(
        totalStudents - studentIndex,
        effectiveCapacity,
      );

      // Get students for this classroom
      const classroomStudents = shuffledStudents.slice(
        studentIndex,
        studentIndex + studentsForThisRoom,
      );

      // Generate CONSISTENT seating arrangement
      const seatingArrangement = this.generateConsistentSeatingArrangement(
        classroomStudents,
        classroom,
        seatingStrategy,
        studentSeatingMap,
      );

      classroomSeatingData.push({
        classroom: classroom._id,
        classroomName: classroom.roomNumber,
        capacity: classroom.capacity,
        effectiveCapacity,
        assignedStudents: classroomStudents.map(s => s._id),
        seatingArrangement,
        totalAssigned: classroomStudents.length,
        departments: [...new Set(classroomStudents.map(s => s.department?.name))].filter(Boolean),
      });

      console.log(`      • ${classroom.roomNumber}: ${classroomStudents.length}/${effectiveCapacity} students`);

      studentIndex += studentsForThisRoom;
    }

    if (studentIndex < totalStudents) {
      console.log(`      ⚠️  Warning: Only allocated ${studentIndex}/${totalStudents} students`);
    }

    return classroomSeatingData;
  }

  /**
   * OLD METHOD: Keep for backward compatibility
   */
  async allocateClassroomsWithSeating (students, examDate, timeSlot, seatingStrategy) {
    console.log('\n   🏢 Allocating classrooms with seating...');

    const totalStudents = students.length;
    const SEATING_FACTOR = 0.6; // 60% capacity for alternate seating

    // Get all available classrooms
    const availableClassrooms = await this.getAvailableClassrooms(examDate, timeSlot);

    if (availableClassrooms.length === 0) {
      throw new Error('No available classrooms');
    }

    console.log(`      Found ${availableClassrooms.length} available classroom(s)`);

    // Shuffle students to mix departments
    const shuffledStudents = this.shuffleWithDepartmentMix(students);

    // Allocate students to classrooms with seating
    const classroomSeatingData = [];
    let studentIndex = 0;

    for (const classroom of availableClassrooms) {
      if (studentIndex >= totalStudents) break;

      const effectiveCapacity = Math.floor(classroom.capacity * SEATING_FACTOR);
      const studentsForThisRoom = Math.min(
        totalStudents - studentIndex,
        effectiveCapacity,
      );

      // Get students for this classroom
      const classroomStudents = shuffledStudents.slice(
        studentIndex,
        studentIndex + studentsForThisRoom,
      );

      // Generate seating arrangement
      const seatingArrangement = this.generateSeatingArrangement(
        classroomStudents,
        classroom,
        seatingStrategy,
      );

      classroomSeatingData.push({
        classroom: classroom._id,
        classroomName: classroom.roomNumber,
        capacity: classroom.capacity,
        effectiveCapacity,
        assignedStudents: classroomStudents.map(s => s._id),
        seatingArrangement,
        totalAssigned: classroomStudents.length,
        departments: [...new Set(classroomStudents.map(s => s.department?.name))].filter(Boolean),
      });

      console.log(`      • ${classroom.roomNumber}: ${classroomStudents.length}/${effectiveCapacity} students`);

      studentIndex += studentsForThisRoom;
    }

    if (studentIndex < totalStudents) {
      console.log(`      ⚠️  Warning: Only allocated ${studentIndex}/${totalStudents} students`);
    }

    return classroomSeatingData;
  }

  /**
   * Get available classrooms for date and time
   */
  async getAvailableClassrooms (examDate, timeSlot) {
    const allClassrooms = await Classroom.find({
      isActive: true,
      maintenanceStatus: 'operational',
    }).select('roomNumber building floor capacity seatingLayout maintenanceStatus').sort({ capacity: -1 });

    const available = [];

    for (const classroom of allClassrooms) {
      const isAvailable = await this.isClassroomAvailable(
        classroom._id,
        examDate,
        timeSlot,
      );
      if (isAvailable) {
        available.push(classroom);
      }
    }

    return available;
  }

  /**
   * Check classroom availability
   */
  async isClassroomAvailable (classroomId, examDate, timeSlot) {
    const conflictingExam = await Exam.findOne({
      'classrooms.classroom': classroomId,
      examDate: {
        $gte: new Date(examDate.setHours(0, 0, 0, 0)),
        $lt: new Date(examDate.setHours(23, 59, 59, 999)),
      },
      status: { $in: ['scheduled', 'in_progress'] },
      $or: [
        {
          startTime: { $lte: timeSlot.end },
          endTime: { $gte: timeSlot.start },
        },
      ],
    });

    return !conflictingExam;
  }

  /**
   * Shuffle students while ensuring department mixing
   */
  shuffleWithDepartmentMix (students) {
    // Group by department
    const byDept = new Map();
    students.forEach(student => {
      const deptId = student.department?._id?.toString() || 'unknown';
      if (!byDept.has(deptId)) {
        byDept.set(deptId, []);
      }
      byDept.get(deptId).push(student);
    });

    // Round-robin distribution
    const result = [];
    const deptArrays = Array.from(byDept.values());
    let hasMore = true;

    while (hasMore) {
      hasMore = false;
      for (const deptStudents of deptArrays) {
        if (deptStudents.length > 0) {
          result.push(deptStudents.shift());
          hasMore = true;
        }
      }
    }

    return result;
  }

  /**
   * Generate CONSISTENT seating arrangement (same seat for student across exams)
   */
  generateConsistentSeatingArrangement (students, classroom, strategy, studentSeatingMap) {
    const layout = classroom.layout || {
      rows: Math.ceil(classroom.capacity / 10),
      columns: 10,
    };

    const seating = [];
    let studentIndex = 0;

    // Alternate seating pattern
    for (let row = 1; row <= layout.rows; row++) {
      for (let col = 1; col <= layout.columns; col++) {
        const seatKey = `R${row}-C${col}`;

        // Checkerboard pattern for alternate seating
        if ((row + col) % 2 === 0 && studentIndex < students.length) {
          const student = students[studentIndex];
          const studentId = student._id.toString();

          // Check if student already has assigned seat
          let assignedSeat = studentSeatingMap.get(studentId);

          if (!assignedSeat) {
            // Assign new seat
            assignedSeat = {
              classroom: classroom._id.toString(),
              seatNumber: seatKey,
              row,
              column: col,
            };
            studentSeatingMap.set(studentId, assignedSeat);
          }

          seating.push({
            row,
            column: col,
            student: student._id,
            studentScholarId: student.scholarId,
            studentName: student.fullName,
            department: student.department?.name,
            seatNumber: seatKey,
            isOccupied: true,
          });

          studentIndex++;
        } else {
          seating.push({
            row,
            column: col,
            student: null,
            seatNumber: seatKey,
            isOccupied: false,
          });
        }
      }
    }

    return seating;
  }

  /**
   * Generate seating arrangement (non-consistent)
   */
  generateSeatingArrangement (students, classroom, strategy) {
    const layout = classroom.layout || {
      rows: Math.ceil(classroom.capacity / 10),
      columns: 10,
    };

    if (strategy === 'alternate') {
      return this.generateAlternateSeating(students, layout);
    } else if (strategy === 'department-wise') {
      return this.generateDepartmentWiseSeating(students, layout);
    } else if (strategy === 'random') {
      return this.generateRandomSeating(students, layout);
    }

    return this.generateAlternateSeating(students, layout);
  }

  /**
   * Alternate seating (skip seats between students)
   */
  generateAlternateSeating (students, layout) {
    const seating = [];
    let studentIndex = 0;

    for (let row = 1; row <= layout.rows; row++) {
      for (let col = 1; col <= layout.columns; col++) {
        // Checkerboard pattern
        if ((row + col) % 2 === 0 && studentIndex < students.length) {
          seating.push({
            row,
            column: col,
            student: students[studentIndex]._id,
            studentScholarId: students[studentIndex].scholarId,
            studentName: students[studentIndex].fullName,
            department: students[studentIndex].department?.name,
            seatNumber: `R${row}-C${col}`,
            isOccupied: true,
          });
          studentIndex++;
        } else {
          seating.push({
            row,
            column: col,
            student: null,
            seatNumber: `R${row}-C${col}`,
            isOccupied: false,
          });
        }
      }
    }

    return seating;
  }

  /**
   * Department-wise seating
   */
  generateDepartmentWiseSeating (students, layout) {
    const seating = [];
    let row = 1;
    let col = 1;

    for (const student of students) {
      if (row > layout.rows) break;

      seating.push({
        row,
        column: col,
        student: student._id,
        studentScholarId: student.scholarId,
        studentName: student.fullName,
        department: student.department?.name,
        seatNumber: `R${row}-C${col}`,
        isOccupied: true,
      });

      col++;
      if (col > layout.columns) {
        col = 1;
        row++;
      }
    }

    return seating;
  }

  /**
   * Random seating
   */
  generateRandomSeating (students, layout) {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    return this.generateDepartmentWiseSeating(shuffled, layout);
  }

  /**
   * Assign invigilators to classrooms using BALANCED DUTY SYSTEM
   */
  async assignInvigilatorsToClassrooms (examDate, timeSlot, classroomSeatingData, teacherUsageBySlot, slotDateKey) {
    console.log('\n   👨‍🏫 Assigning invigilators with BALANCED DUTY SYSTEM...');

    const classroomCount = classroomSeatingData.length;

    // Get teachers already assigned in this slot
    const existingAssignments = teacherUsageBySlot?.get(slotDateKey) || new Set();

    // Use balanced duty assignment service
    const BalancedDutyAssignmentService = require('./balancedDutyAssignmentService');
    const balancedDutyService = BalancedDutyAssignmentService.getInstance();

    const rawAssignments = await balancedDutyService.assignBalancedInvigilators({
      examDate,
      timeSlot,
      classroomCount,
      teachersPerClassroom: 2, // Chief + Regular per classroom
      existingAssignments,
    });

    if (rawAssignments.length === 0) {
      console.log('      ⚠️  No teachers could be assigned');
      return [];
    }

    // Convert to exam format with classroom assignments
    const assignments = [];
    const teachersPerClassroom = 2;

    for (let i = 0; i < classroomCount; i++) {
      const classroom = classroomSeatingData[i];
      const startIdx = i * teachersPerClassroom;
      const classroomTeachers = rawAssignments.slice(startIdx, startIdx + teachersPerClassroom);

      classroomTeachers.forEach(assignment => {
        assignments.push({
          teacher: assignment.teacher,
          teacherName: assignment.teacherName,
          employeeId: assignment.employeeId,
          role: assignment.role,
          assignedClassrooms: [classroom.classroom],
          currentWorkload: assignment.currentWorkload,
        });

        console.log(`      • ${assignment.teacherName} → ${classroom.classroomName} (${assignment.role === 'chief_invigilator' ? 'Chief' : 'Regular'}) [Duties: ${assignment.currentWorkload}]`);
      });
    }

    return assignments;
  }

  /**
   * Get available teachers
   */
  async getAvailableTeachers (examDate) {
    return await Teacher.find({ isActive: true });
  }

  /**
   * Get teacher workload on a date
   */
  async getTeacherWorkload (teacherId, date) {
    const exams = await Exam.find({
      'invigilators.teacher': teacherId,
      examDate: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
      status: { $in: ['scheduled', 'in_progress'] },
    });

    return exams.length;
  }

  /**
   * Create exam document
   */
  async createExam (data) {
    const {
      examType,
      subject,
      semesterId,
      academicYear,
      examDate,
      timeSlot,
      classrooms,
      invigilators,
      totalStudents,
      departments,
      createdBy,
      useConflictFiltering = false, // Enable conflict filtering if needed
    } = data;

    // Create exam without invigilators first
    const exam = await Exam.create({
      title: `${examType} - ${subject.name}`,
      subject: subject._id,
      type: examType === 'Mid-Semester' ? 'mid_semester' : 'end_semester',
      semester: `Semester ${semesterId}`,
      academicYear,
      examDate,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      duration: this.calculateDuration(timeSlot.start, timeSlot.end),
      totalMarks: examType === 'Mid-Semester' ? 40 : 80,
      passingMarks: examType === 'Mid-Semester' ? 16 : 32,
      departments,
      classrooms: classrooms.map(c => ({
        classroom: c.classroom,
        assignedStudents: c.assignedStudents,
        seatingArrangement: c.seatingArrangement,
      })),
      invigilators: [],  // Start empty
      totalStudents,
      totalClassrooms: classrooms.length,
      totalInvigilators: 0,
      status: 'scheduled',
      isActive: true,
      createdBy,
      notes: `Auto-scheduled based on ${totalStudents} enrolled students`,
    });

    // Assign invigilators with conflict filtering if enabled
    if (invigilators && invigilators.length > 0) {
      try {
        await exam.assignInvigilators(invigilators, {
          skipConflictCheck: !useConflictFiltering,  // Skip during bulk scheduling for performance
          filterConflicts: useConflictFiltering,
          minInvigilatorsPerExam: 1,
        });

        // Log any skipped conflicts
        if (exam._assignmentMeta && exam._assignmentMeta.skipped > 0) {
          console.log(`      ⚠️  ${exam._assignmentMeta.skipped} teacher(s) skipped due to conflicts`);
        }
      } catch (error) {
        console.log(`      ⚠️  Invigilator assignment issue: ${error.message}`);
        // Continue with exam creation even if invigilator assignment fails
      }
    }

    return exam;
  }

  /**
   * Generate exam dates from date range
   */
  generateExamDates (dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const dates = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip Sundays
      if (date.getDay() !== 0) {
        dates.push(new Date(date));
      }
    }

    return dates;
  }

  /**
   * Calculate duration in minutes
   */
  calculateDuration (startTime, endTime) {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    return end - start;
  }

  /**
   * Parse time string to minutes
   */
  parseTime (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Get current academic year
   */
  getCurrentAcademicYear () {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (month >= 6) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Generate summary
   */
  generateSummary (exams) {
    const totalStudents = exams.reduce((sum, e) => sum + e.totalStudents, 0);
    const totalClassrooms = exams.reduce((sum, e) => sum + e.totalClassrooms, 0);
    const totalInvigilators = exams.reduce((sum, e) => sum + e.totalInvigilators, 0);

    return `
Total Exams Scheduled: ${exams.length}
Total Students: ${totalStudents}
Total Classrooms Used: ${totalClassrooms}
Total Invigilators Assigned: ${totalInvigilators}

Breakdown by Semester:
${this.getSemesterBreakdown(exams)}
    `.trim();
  }

  /**
   * Get semester breakdown
   */
  getSemesterBreakdown (exams) {
    const bySem = {};

    exams.forEach(exam => {
      const sem = exam.semester;
      if (!bySem[sem]) {
        bySem[sem] = { exams: 0, students: 0 };
      }
      bySem[sem].exams++;
      bySem[sem].students += exam.totalStudents;
    });

    return Object.entries(bySem)
      .map(([sem, data]) => `  ${sem}: ${data.exams} exams, ${data.students} students`)
      .join('\n');
  }

  /**
   * Pre-load existing exam allocations from database to prevent conflicts
   * across separate scheduling sessions (e.g., 1st sem scheduled, then 5th sem)
   */
  async preloadExistingAllocations (availableDates, roomUsageBySlot, teacherUsageBySlot) {
    try {
      // Build date range for query
      const minDate = availableDates[0];
      const maxDate = availableDates[availableDates.length - 1];

      console.log(`   📅 Checking existing exams from ${minDate.toDateString()} to ${maxDate.toDateString()}`);

      // Query all scheduled exams in this date range
      const existingExams = await Exam.find({
        examDate: { $gte: minDate, $lte: maxDate },
        status: { $in: ['scheduled', 'in_progress', 'completed'] },
        isActive: true,
      }).select('examDate startTime endTime classrooms invigilators');

      console.log(`   ✅ Found ${existingExams.length} existing exams in date range`);

      let totalRoomsBlocked = 0;
      let totalTeachersBlocked = 0;

      // Mark classrooms and teachers as used
      for (const exam of existingExams) {
        const examDateStr = new Date(exam.examDate).toDateString();
        const slotKey = `${examDateStr}-${exam.startTime}-${exam.endTime}`;

        // Block classrooms
        if (!roomUsageBySlot.has(slotKey)) {
          roomUsageBySlot.set(slotKey, new Set());
        }
        const usedRooms = roomUsageBySlot.get(slotKey);

        if (exam.classrooms && exam.classrooms.length > 0) {
          exam.classrooms.forEach(c => {
            const roomId = c.classroom?.toString() || c.toString();
            usedRooms.add(roomId);
            totalRoomsBlocked++;
          });
        }

        // Block teachers
        if (!teacherUsageBySlot.has(slotKey)) {
          teacherUsageBySlot.set(slotKey, new Set());
        }
        const usedTeachers = teacherUsageBySlot.get(slotKey);

        if (exam.invigilators && exam.invigilators.length > 0) {
          exam.invigilators.forEach(inv => {
            const teacherId = inv.teacher?.toString() || inv.toString();
            usedTeachers.add(teacherId);
            totalTeachersBlocked++;
          });
        }
      }

      console.log(`   🚫 Blocked ${totalRoomsBlocked} classroom slots and ${totalTeachersBlocked} teacher slots from existing exams\n`);

    } catch (error) {
      console.error('   ⚠️  Error pre-loading existing allocations:', error.message);
      // Continue without pre-loading (graceful degradation)
    }
  }
}

module.exports = new UnifiedEnrollmentScheduler();

