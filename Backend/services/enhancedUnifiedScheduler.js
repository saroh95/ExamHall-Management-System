/**
 * Enhanced Unified Exam Scheduler
 *
 * Combines:
 * - Enrollment-based scheduling (from unified scheduler)
 * - Smart conflict detection (from old scheduler)
 * - Intelligent subject grouping
 * - Shared subject handling
 * - Consistent seating arrangements
 */

const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const optimizedPreview = require('./optimizedPreviewService');
const Department = require('../models/Department');

class EnhancedUnifiedScheduler {
  /**
   * Main scheduling function with smart conflict detection
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
    console.log('🚀 ENHANCED UNIFIED EXAM SCHEDULING');
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

    // STEP 3: Smart scheduling with conflict detection
    const scheduledExams = await this.smartScheduleWithConflictDetection({
      subjectsWithEnrollments,
      availableDates,
      timeSlots,
      examType,
      seatingStrategy,
      academicYear,
      createdBy,
    });

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
   * Smart scheduling with conflict detection (from old scheduler)
   */
  async smartScheduleWithConflictDetection (options) {
    const {
      subjectsWithEnrollments,
      availableDates,
      timeSlots,
      examType,
      seatingStrategy,
      academicYear,
      createdBy,
    } = options;

    const scheduledExams = [];
    const scheduleMatrix = {}; // Track what's scheduled per date/time slot
    const roomUsageBySlot = new Map(); // key: date-start-end -> Set<classroomId>
    const teacherUsageBySlot = new Map(); // key: date-start-end -> Set<teacherId>
    const studentExamMap = new Map(); // Track student exam dates
    const semesterSeatingMap = new Map(); // Consistent seating per semester
    const semesterDeptRoomMap = new Map(); // key: semester-deptId -> [roomIds] - CONSISTENT rooms per semester+dept

    // PRE-LOAD existing exams from database to avoid conflicts across scheduling sessions
    console.log('\n🔍 Pre-loading existing exams to prevent classroom/teacher conflicts...');
    await this.preloadExistingAllocations(availableDates, roomUsageBySlot, teacherUsageBySlot, semesterDeptRoomMap);

    // Group subjects by semester
    const subjectsBySemester = {};
    subjectsWithEnrollments.forEach(subjectData => {
      const semester = subjectData.semesterId;
      if (!subjectsBySemester[semester]) {
        subjectsBySemester[semester] = [];
      }
      subjectsBySemester[semester].push(subjectData);
    });

    console.log('📚 Subjects grouped by semester:');
    Object.keys(subjectsBySemester).forEach(sem => {
      console.log(`   Semester ${sem}: ${subjectsBySemester[sem].length} subjects`);
    });
    console.log('');

    // Note: Department-first allocation happens dynamically during scheduling
    // Each department gets separate rooms, but rooms can be reused across different time slots
    console.log('📋 Department-wise seating: Each department will get separate classrooms per exam');
    console.log('   Rooms will be reused across different time slots (no permanent lock)\n');

    let dateIndex = 0;
    let timeSlotIndex = 0;

    // Process each semester with smart rules
    for (const semesterStr of Object.keys(subjectsBySemester).sort((a, b) => parseInt(a) - parseInt(b))) {
      const semester = parseInt(semesterStr);
      const semesterSubjects = subjectsBySemester[semester];

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📚 PROCESSING SEMESTER ${semester} (${semesterSubjects.length} subjects)`);
      console.log('='.repeat(70));

      // Categorize subjects
      const commonSubjects = semesterSubjects.filter(s => s.subject.isCommon === true);
      const sharedSubjects = semesterSubjects.filter(s =>
        !s.subject.isCommon &&
        (s.subject.sharedWith || s.departmentNames.length > 1),
      );
      const regularSubjects = semesterSubjects.filter(s =>
        !s.subject.isCommon &&
        !s.subject.sharedWith &&
        s.departmentNames.length === 1,
      );

      console.log(`   Common subjects: ${commonSubjects.length}`);
      console.log(`   Shared subjects: ${sharedSubjects.length}`);
      console.log(`   Regular subjects: ${regularSubjects.length}`);

      // Schedule in order: Common → Shared → Regular
      const orderedSubjects = [...commonSubjects, ...sharedSubjects, ...regularSubjects];

      for (const subjectData of orderedSubjects) {
        // Check if we need to move to next date
        if (dateIndex >= availableDates.length) {
          console.log('⚠️  Warning: Ran out of available dates');
          break;
        }

        let examDate = availableDates[dateIndex];
        let timeSlot = timeSlots[timeSlotIndex];
        let slotKey = `${dateIndex}-${timeSlotIndex}`;

        // Check for conflicts in current slot
        const hasSlotConflict = this.hasConflictInSlot(
          subjectData,
          slotKey,
          scheduleMatrix,
        );

        // Check for student date conflicts
        const hasDateConflict = this.checkStudentConflicts(
          subjectData.students,
          examDate,
          studentExamMap,
        );

        // If conflict, try to find available slot
        if (hasSlotConflict || hasDateConflict) {
          const availableSlot = this.findAvailableSlot(
            subjectData,
            dateIndex,
            timeSlotIndex,
            availableDates,
            timeSlots,
            scheduleMatrix,
            studentExamMap,
          );

          if (availableSlot) {
            dateIndex = availableSlot.dateIndex;
            timeSlotIndex = availableSlot.timeSlotIndex;
            examDate = availableDates[dateIndex];
            timeSlot = timeSlots[timeSlotIndex];
            slotKey = `${dateIndex}-${timeSlotIndex}`;
          } else {
            console.log(`\n⚠️  Could not find conflict-free slot for ${subjectData.subject.code}`);
            // Move to next date/time
            timeSlotIndex++;
            if (timeSlotIndex >= timeSlots.length) {
              timeSlotIndex = 0;
              dateIndex++;
            }
            continue;
          }
        }

        console.log(`\n${'─'.repeat(60)}`);
        console.log(`📝 SCHEDULING: ${subjectData.subject.code} - ${subjectData.subject.name}`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`   Date: ${examDate.toLocaleDateString()}`);
        console.log(`   Time: ${timeSlot.start} - ${timeSlot.end}`);
        console.log(`   Slot: Date ${dateIndex + 1}, Time Slot ${timeSlotIndex + 1}`);
        console.log(`   Students: ${subjectData.totalStudents}`);
        console.log(`   Departments: ${subjectData.departmentNames.join(', ')}`);
        console.log(`   Type: ${subjectData.subject.isCommon ? 'Common' : subjectData.subject.sharedWith ? 'Shared' : 'Regular'}`);

        // CRITICAL FIX: If subject has multiple departments, create SEPARATE exams per department
        const hasMultipleDepartments = subjectData.departments.length > 1;

        if (hasMultipleDepartments) {
          console.log('   🎯 MULTI-DEPARTMENT SUBJECT: Creating separate exams for each department');

          // Group students by department
          const studentsByDept = new Map();
          for (const student of subjectData.students) {
            const deptId = student.department?._id?.toString() || 'unknown';
            const deptName = student.department?.name || student.department?.code || 'Unknown';
            if (!studentsByDept.has(deptId)) {
              studentsByDept.set(deptId, { students: [], name: deptName, id: deptId });
            }
            studentsByDept.get(deptId).students.push(student);
          }

          console.log(`   📊 Will create ${studentsByDept.size} separate exams (one per department)`);

          // Create separate exam for each department
          for (const [deptId, deptData] of studentsByDept.entries()) {
            console.log(`\n   🏫 Creating exam for ${deptData.name} (${deptData.students.length} students)`);

            try {
              const slotDateKey = `${examDate.toDateString()}-${timeSlot.start}-${timeSlot.end}`;

              const classroomSeatingData = await this.allocateClassroomsWithConsistentSeating(
                deptData.students,
                examDate,
                timeSlot,
                seatingStrategy,
                subjectData.semesterId,
                semesterSeatingMap,
                roomUsageBySlot,
                slotDateKey,
                { ...subjectData, students: deptData.students }, // Override with dept-specific students
                semesterDeptRoomMap,
              );

              if (classroomSeatingData.length === 0) {
                console.log(`      ❌ No available classrooms for ${deptData.name} - skipping`);
                continue;
              }

              console.log(`      ✅ Allocated ${classroomSeatingData.length} classroom(s) for ${deptData.name}`);

              // Assign invigilators
              const invigilatorAssignments = await this.assignInvigilatorsToClassrooms(
                examDate,
                timeSlot,
                classroomSeatingData,
                teacherUsageBySlot,
                slotDateKey,
              );

              // Create exam for this department
              const exam = await this.createExam({
                examType,
                subject: subjectData.subject,
                semesterId: subjectData.semesterId,
                academicYear: academicYear || this.getCurrentAcademicYear(),
                examDate,
                timeSlot,
                classrooms: classroomSeatingData,
                invigilators: invigilatorAssignments,
                totalStudents: deptData.students.length,
                departments: [deptId], // Single department per exam
                createdBy,
              });

              scheduledExams.push(exam);

              // Mark classroom usage
              if (!roomUsageBySlot.has(slotDateKey)) {
                roomUsageBySlot.set(slotDateKey, new Set());
              }
              const usedRooms = roomUsageBySlot.get(slotDateKey);
              for (const c of classroomSeatingData) {
                usedRooms.add(c.classroom.toString());
              }

              // Mark teacher usage
              if (!teacherUsageBySlot.has(slotDateKey)) {
                teacherUsageBySlot.set(slotDateKey, new Set());
              }
              const usedTeachers = teacherUsageBySlot.get(slotDateKey);
              for (const inv of invigilatorAssignments) {
                usedTeachers.add(inv.teacher.toString());
              }

              // Mark students as having exam on this date
              deptData.students.forEach(student => {
                const dateKey = examDate.toISOString().split('T')[0];
                if (!studentExamMap.has(student._id.toString())) {
                  studentExamMap.set(student._id.toString(), new Set());
                }
                studentExamMap.get(student._id.toString()).add(dateKey);
              });

              console.log(`      ✅ Exam created for ${deptData.name} (ID: ${exam._id})`);

            } catch (error) {
              console.log(`      ❌ Error creating exam for ${deptData.name}: ${error.message}`);
              continue;
            }
          }

          // Update tracking for slot
          if (!scheduleMatrix[slotKey]) {
            scheduleMatrix[slotKey] = [];
          }
          scheduleMatrix[slotKey].push(subjectData);

        } else {
          // Single department subject - create one exam as before
          console.log('   📌 SINGLE-DEPARTMENT SUBJECT: Creating one exam');

          try {
            const slotDateKey = `${examDate.toDateString()}-${timeSlot.start}-${timeSlot.end}`;
            console.log(`   🔑 Slot Key: "${slotDateKey}"`);
            console.log('   🚫 Rooms already used in this slot:', Array.from(roomUsageBySlot.get(slotDateKey) || []));

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
              semesterDeptRoomMap,
            );

            if (classroomSeatingData.length === 0) {
              console.log('   ❌ No available classrooms - skipping\n');
              continue;
            }

            console.log(`   ✅ Allocated ${classroomSeatingData.length} classroom(s)`);

            // Log detailed classroom allocation for verification
            console.log('   📋 Detailed allocation:');
            const Classroom = require('../models/Classroom');
            const allocatedRoomIds = new Set();
            for (let i = 0; i < classroomSeatingData.length; i++) {
              const roomData = classroomSeatingData[i];
              const roomId = roomData.classroom.toString();
              const room = await Classroom.findById(roomData.classroom);
              const studentCount = roomData.assignedStudents.length;

              // Check for duplicate room allocation within this exam
              if (allocatedRoomIds.has(roomId)) {
                console.log(`      ❌ DUPLICATE! ${i + 1}. ${room?.name || roomId}: ${studentCount} students (SAME ROOM ALLOCATED TWICE!)`);
              } else {
                console.log(`      ${i + 1}. ${room?.name || roomId}: ${studentCount} students`);
                allocatedRoomIds.add(roomId);
              }
            }

            // Verify no duplicates
            if (allocatedRoomIds.size !== classroomSeatingData.length) {
              console.log(`   ⚠️  WARNING: Duplicate rooms detected! ${classroomSeatingData.length} allocations but only ${allocatedRoomIds.size} unique rooms`);
            }

            // Assign invigilators
            const invigilatorAssignments = await this.assignInvigilatorsToClassrooms(
              examDate,
              timeSlot,
              classroomSeatingData,
              teacherUsageBySlot,
              slotDateKey,
            );

            console.log(`   ✅ Assigned ${invigilatorAssignments.length} invigilator(s)`);

            // Create exam
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

            // Update tracking
            if (!scheduleMatrix[slotKey]) {
              scheduleMatrix[slotKey] = [];
            }
            scheduleMatrix[slotKey].push(subjectData);

            // Mark students as having exam on this date
            subjectData.students.forEach(student => {
              const dateKey = examDate.toISOString().split('T')[0];
              if (!studentExamMap.has(student._id.toString())) {
                studentExamMap.set(student._id.toString(), new Set());
              }
              studentExamMap.get(student._id.toString()).add(dateKey);
            });

            console.log(`   ✅ Exam created (ID: ${exam._id})`);

          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            continue;
          }
        } // End of multi-department check

        // Move to next slot
        timeSlotIndex++;
        if (timeSlotIndex >= timeSlots.length) {
          timeSlotIndex = 0;
          dateIndex++;
        }
      }
    }

    return scheduledExams;
  }

  /**
   * Check if subject has conflict in current slot
   */
  hasConflictInSlot (subjectData, slotKey, scheduleMatrix) {
    const scheduledInSlot = scheduleMatrix[slotKey] || [];

    if (scheduledInSlot.length === 0) {
      return false;
    }

    // Check if any student from subjectData is already scheduled in this slot
    const subjectStudentIds = new Set(subjectData.students.map(s => s._id.toString()));

    for (const scheduled of scheduledInSlot) {
      const scheduledStudentIds = new Set(scheduled.students.map(s => s._id.toString()));

      // Check for student overlap
      for (const studentId of subjectStudentIds) {
        if (scheduledStudentIds.has(studentId)) {
          return true; // Conflict found
        }
      }
    }

    return false;
  }

  /**
   * Find available slot for subject without conflicts
   */
  findAvailableSlot (subjectData, startDateIndex, startTimeIndex, availableDates, timeSlots, scheduleMatrix, studentExamMap) {
    for (let dateIdx = startDateIndex; dateIdx < availableDates.length; dateIdx++) {
      const startTime = (dateIdx === startDateIndex) ? startTimeIndex : 0;

      for (let timeIdx = startTime; timeIdx < timeSlots.length; timeIdx++) {
        const slotKey = `${dateIdx}-${timeIdx}`;
        const examDate = availableDates[dateIdx];

        const hasSlotConflict = this.hasConflictInSlot(subjectData, slotKey, scheduleMatrix);
        const hasDateConflict = this.checkStudentConflicts(subjectData.students, examDate, studentExamMap);

        if (!hasSlotConflict && !hasDateConflict) {
          return { dateIndex: dateIdx, timeSlotIndex: timeIdx };
        }
      }
    }

    return null; // No available slot found
  }

  /**
   * Check for student conflicts on a date
   */
  checkStudentConflicts (students, examDate, studentExamMap) {
    const dateKey = examDate.toISOString().split('T')[0];

    for (const student of students) {
      const studentId = student._id.toString();
      const studentDates = studentExamMap.get(studentId);

      if (studentDates && studentDates.has(dateKey)) {
        return true; // Student already has exam this day
      }
    }

    return false;
  }

  /**
   * Get subjects with enrolled students (same as unified scheduler)
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

    // Convert to array
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
   * Allocate classrooms with consistent seating
   */
  async allocateClassroomsWithConsistentSeating (students, examDate, timeSlot, seatingStrategy, semesterId, semesterSeatingMap, roomUsageBySlot, slotDateKey, subjectData, semesterDeptRoomMap) {
    // Get available classrooms
    const classrooms = await Classroom.find({
      isActive: true,
      maintenanceStatus: 'operational',
    }).select('roomNumber building floor capacity seatingLayout maintenanceStatus').sort({ capacity: -1 });

    if (classrooms.length === 0) {
      throw new Error('No available classrooms');
    }

    console.log(`\n   🏫 ALLOCATING CLASSROOMS FOR SEMESTER ${semesterId}`);

    const classroomSeatingData = [];
    // Department-wise grouping
    const studentsByDepartment = new Map();
    for (const s of students) {
      const deptId = s.department?._id?.toString() || 'unknown';
      const deptName = s.department?.name || s.department?.code || 'Unknown';
      if (!studentsByDepartment.has(deptId)) {
        studentsByDepartment.set(deptId, { students: [], name: deptName });
      }
      studentsByDepartment.get(deptId).students.push(s);
    }

    console.log('   📊 Students by department:');
    for (const [deptId, deptData] of studentsByDepartment.entries()) {
      console.log(`      • ${deptData.name}: ${deptData.students.length} students`);
    }

    // Exclude rooms already used in this slot
    const usedRooms = roomUsageBySlot?.get(slotDateKey) || new Set();
    console.log(`   🚫 ${usedRooms.size} rooms blocked in this slot:`, Array.from(usedRooms).map(id => {
      const room = classrooms.find(c => c._id.toString() === id);
      return room ? room.name : id;
    }));

    const availableRooms = classrooms.filter(c => !usedRooms.has(c._id.toString()));
    console.log(`   ✅ ${availableRooms.length} rooms available for allocation`);

    // Iterate departments to ensure separation AND consistency across all exam days
    const departmentIds = Array.from(studentsByDepartment.keys());
    let remainingStudents = [];

    for (const deptId of departmentIds) {
      const deptData = studentsByDepartment.get(deptId);
      const deptStudents = deptData.students;
      const deptName = deptData.name;

      console.log(`\n   🎯 Allocating for ${deptName}...`);

      // Check if this semester+dept already has assigned rooms (from previous exam days)
      const semDeptKey = `sem${semesterId}-dept${deptId}`;
      const assignedRoomsForThisDept = semesterDeptRoomMap.get(semDeptKey) || [];

      if (assignedRoomsForThisDept.length > 0) {
        console.log('      ♻️  Using CONSISTENT rooms from previous days:', assignedRoomsForThisDept.map(id => {
          const room = classrooms.find(c => c._id.toString() === id);
          return room ? room.name : id;
        }));
      }

      let deptRemaining = [...deptStudents];
      const roomsUsedForDept = [];

      // First, try to use already-assigned rooms (if any) that are available in this slot
      for (const roomId of assignedRoomsForThisDept) {
        if (deptRemaining.length === 0) break;

        // Check if this room is available in this slot (from pre-loaded data)
        if (usedRooms.has(roomId)) {
          console.log(`      ⚠️  Room ${roomId} not available (occupied by another semester)`);
          continue;
        }

        // CRITICAL: Check if already allocated in THIS function call (to another department)
        if (classroomSeatingData.some(c => c.classroom.toString() === roomId)) {
          console.log(`      ⚠️  Room ${roomId} already allocated to another department in this exam`);
          continue;
        }

        const classroom = classrooms.find(c => c._id.toString() === roomId);
        if (!classroom) continue;

        const capacity = Math.floor(classroom.capacity * 0.6);
        const studentsForThisClassroom = deptRemaining.slice(0, capacity);
        deptRemaining = deptRemaining.slice(capacity);

        if (studentsForThisClassroom.length > 0) {
          const seatingArrangement = this.generateSeatingArrangement(
            studentsForThisClassroom,
            classroom,
            seatingStrategy,
          );

          classroomSeatingData.push({
            classroom: classroom._id,
            assignedStudents: studentsForThisClassroom.map(s => s._id),
            seatingArrangement,
          });

          roomsUsedForDept.push(classroom._id.toString());
          console.log(`      ✅ ${classroom.name}: ${studentsForThisClassroom.length} students (CONSISTENT room)`);
        }
      }

      // If still students remaining, allocate new rooms from available pool
      if (deptRemaining.length > 0) {
        console.log(`      📌 Need ${Math.ceil(deptRemaining.length / 36)} more room(s) for remaining ${deptRemaining.length} students`);

        for (const classroom of availableRooms) {
          if (deptRemaining.length === 0) break;

          // Skip if already used in this function call or blocked
          if (classroomSeatingData.some(c => c.classroom.toString() === classroom._id.toString())) continue;
          if (usedRooms.has(classroom._id.toString())) continue;

          const capacity = Math.floor(classroom.capacity * 0.6);
          const studentsForThisClassroom = deptRemaining.slice(0, capacity);
          deptRemaining = deptRemaining.slice(capacity);

          if (studentsForThisClassroom.length > 0) {
            const seatingArrangement = this.generateSeatingArrangement(
              studentsForThisClassroom,
              classroom,
              seatingStrategy,
            );

            classroomSeatingData.push({
              classroom: classroom._id,
              assignedStudents: studentsForThisClassroom.map(s => s._id),
              seatingArrangement,
            });

            roomsUsedForDept.push(classroom._id.toString());
            console.log(`      ✅ ${classroom.name}: ${studentsForThisClassroom.length} students (NEW room)`);
          }
        }
      }

      // Save the rooms used for this dept+semester for future consistency
      if (roomsUsedForDept.length > 0) {
        semesterDeptRoomMap.set(semDeptKey, roomsUsedForDept);
        console.log(`      💾 Saved rooms for ${deptName} Sem${semesterId}:`, roomsUsedForDept.map(id => {
          const room = classrooms.find(c => c._id.toString() === id);
          return room ? room.name : id;
        }));
      }

      // Any leftovers from this department carry into a pooled remainder
      if (deptRemaining.length > 0) {
        console.log(`      ⚠️  ${deptRemaining.length} students couldn't be allocated`);
        remainingStudents = remainingStudents.concat(deptRemaining);
      }
    }
    // If still remaining across departments, use any leftover rooms (still avoiding used rooms)
    let fallbackIndex = 0;
    while (remainingStudents.length > 0 && fallbackIndex < availableRooms.length) {
      const classroom = availableRooms[fallbackIndex];
      // Skip classrooms already used in this function call
      const alreadySelected = classroomSeatingData.some(c => c.classroom.toString() === classroom._id.toString());
      if (alreadySelected) {
        fallbackIndex++;
        continue;
      }
      const capacity = Math.floor(classroom.capacity * 0.6);
      const studentsForThisClassroom = remainingStudents.slice(0, capacity);
      remainingStudents = remainingStudents.slice(capacity);

      if (studentsForThisClassroom.length > 0) {
        const seatingArrangement = this.generateSeatingArrangement(
          studentsForThisClassroom,
          classroom,
          seatingStrategy,
        );

        classroomSeatingData.push({
          classroom: classroom._id,
          assignedStudents: studentsForThisClassroom.map(s => s._id),
          seatingArrangement,
        });
      }
      fallbackIndex++;
    }

    if (remainingStudents.length > 0) {
      console.log(`   ⚠️  Warning: ${remainingStudents.length} students could not be allocated`);
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
      // Alternate seating (leave one seat empty between students)
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
      // Regular seating
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
   * Assign invigilators to classrooms using BALANCED DUTY SYSTEM
   */
  async assignInvigilatorsToClassrooms (examDate, timeSlot, classroomSeatingData, teacherUsageBySlot, slotDateKey) {
    console.log('\n   👨‍🏫 Assigning invigilators with BALANCED DUTY SYSTEM...');

    const classroomCount = classroomSeatingData.length;
    const existingAssignments = teacherUsageBySlot?.get(slotDateKey) || new Set();

    // Use balanced duty assignment service (singleton)
    const BalancedDutyAssignmentService = require('./balancedDutyAssignmentService');
    const balancedDutyService = BalancedDutyAssignmentService.getInstance();

    console.log(`   📊 Current global teacher index: ${balancedDutyService.globalTeacherIndex}`);

    const rawAssignments = await balancedDutyService.assignBalancedInvigilators({
      examDate,
      timeSlot,
      classroomCount,
      teachersPerClassroom: 2,
      existingAssignments,
    });

    if (rawAssignments.length === 0) {
      console.log('      ⚠️  No teachers could be assigned via balanced service, trying fallback...');

      // Fallback: Simple assignment without conflict checking
      const fallbackAssignments = await this.fallbackTeacherAssignment(classroomCount);
      if (fallbackAssignments.length > 0) {
        console.log(`      ✅ Fallback assignment successful: ${fallbackAssignments.length} teachers assigned`);
        return fallbackAssignments;
      }

      console.log('      ❌ All assignment methods failed');
      return [];
    }

    // Convert to exam format
    const invigilators = [];
    const teachersPerClassroom = 2;

    for (let i = 0; i < classroomCount; i++) {
      const classroom = classroomSeatingData[i];
      const startIdx = i * teachersPerClassroom;
      const classroomTeachers = rawAssignments.slice(startIdx, startIdx + teachersPerClassroom);

      classroomTeachers.forEach(assignment => {
        invigilators.push({
          teacher: assignment.teacher,
          role: assignment.role,
          assignedClassrooms: [classroom.classroom],
        });
      });
    }

    return invigilators;
  }

  /**
   * Fallback teacher assignment when balanced service fails
   */
  async fallbackTeacherAssignment (classroomCount) {
    try {
      console.log(`      🔄 Using fallback teacher assignment for ${classroomCount} classrooms`);

      const Teacher = require('../models/Teacher');
      const teachers = await Teacher.find({ isActive: true })
        .select('_id fullName employeeId')
        .limit(classroomCount * 2) // Need 2 teachers per classroom
        .lean();

      if (teachers.length === 0) {
        console.log('      ❌ No teachers found in fallback method');
        return [];
      }

      console.log(`      📋 Found ${teachers.length} teachers for fallback assignment`);

      const invigilators = [];
      const teachersPerClassroom = 2;

      for (let i = 0; i < classroomCount; i++) {
        const startIdx = i * teachersPerClassroom;
        const classroomTeachers = teachers.slice(startIdx, startIdx + teachersPerClassroom);

        classroomTeachers.forEach((teacher, idx) => {
          invigilators.push({
            teacher: teacher._id,
            role: idx === 0 ? 'chief_invigilator' : 'invigilator',
            assignedClassrooms: [], // Will be set later
          });
        });
      }

      console.log(`      ✅ Fallback assigned ${invigilators.length} teachers`);
      return invigilators;

    } catch (error) {
      console.error(`      ❌ Error in fallback assignment: ${error.message}`);
      return [];
    }
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
    } = data;

    const exam = await Exam.create({
      title: `${examType} - ${subject.name}`,
      type: examType,
      subject: subject._id,
      semester: `Semester ${semesterId}`,
      academicYear,
      examDate,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      duration: this.calculateDuration(timeSlot.start, timeSlot.end),
      classrooms,
      invigilators,
      totalStudents,
      departments,
      status: 'scheduled',
      isActive: true,
      createdBy,
    });

    return exam;
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
    // Simple duration calculation in minutes
    return 180; // Default 3 hours
  }

  getCurrentAcademicYear () {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (month >= 7) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  generateSummary (exams) {
    const totalExams = exams.length;
    const totalStudents = exams.reduce((sum, e) => sum + e.totalStudents, 0);
    const totalClassrooms = exams.reduce((sum, e) => sum + e.classrooms.length, 0);
    const totalInvigilators = exams.reduce((sum, e) => sum + e.invigilators.length, 0);

    return `
    Total Exams: ${totalExams}
    Total Students: ${totalStudents}
    Total Classrooms: ${totalClassrooms}
    Total Invigilators: ${totalInvigilators}
    `;
  }

  /**
   * Pre-load existing exam allocations from database to prevent conflicts
   * across separate scheduling sessions (e.g., 1st sem scheduled, then 5th sem)
   */
  async preloadExistingAllocations (availableDates, roomUsageBySlot, teacherUsageBySlot, semesterDeptRoomMap) {
    try {
      // Build date range for query
      const minDate = availableDates[0];
      const maxDate = availableDates[availableDates.length - 1];

      console.log(`   📅 Checking existing exams from ${minDate.toDateString()} to ${maxDate.toDateString()}`);

      // Query all scheduled exams in this date range - populate to get department info
      const existingExams = await Exam.find({
        examDate: { $gte: minDate, $lte: maxDate },
        status: { $in: ['scheduled', 'in_progress', 'completed'] },
        isActive: true,
      })
        .select('examDate startTime endTime classrooms invigilators semester departments')
        .populate({
          path: 'classrooms.assignedStudents',
          select: 'department',
          populate: { path: 'department', select: '_id name code' },
        });

      console.log(`   ✅ Found ${existingExams.length} existing exams in date range`);

      let totalRoomsBlocked = 0;
      let totalTeachersBlocked = 0;
      const semDeptRoomMapping = {};

      // Mark classrooms and teachers as used
      for (const exam of existingExams) {
        const examDateStr = new Date(exam.examDate).toDateString();
        const slotKey = `${examDateStr}-${exam.startTime}-${exam.endTime}`;

        // Extract semester number from string like "Semester 1"
        const semMatch = exam.semester?.match(/\d+/);
        const semesterId = semMatch ? semMatch[0] : null;

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

            // Track semester+dept -> room mapping for consistency
            if (semesterId && c.assignedStudents) {
              const deptIds = new Set();
              c.assignedStudents.forEach(student => {
                if (student.department?._id) {
                  deptIds.add(student.department._id.toString());
                }
              });

              // For each department in this classroom, remember the room
              deptIds.forEach(deptId => {
                const semDeptKey = `sem${semesterId}-dept${deptId}`;
                if (!semDeptRoomMapping[semDeptKey]) {
                  semDeptRoomMapping[semDeptKey] = new Set();
                }
                semDeptRoomMapping[semDeptKey].add(roomId);
              });
            }
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

      // Copy semester+dept room mappings to the map
      Object.entries(semDeptRoomMapping).forEach(([key, roomSet]) => {
        semesterDeptRoomMap.set(key, Array.from(roomSet));
      });

      console.log(`   🚫 Blocked ${totalRoomsBlocked} classroom slots and ${totalTeachersBlocked} teacher slots from existing exams`);
      console.log(`   💾 Loaded ${Object.keys(semDeptRoomMapping).length} semester+dept room mappings for consistency\n`);

    } catch (error) {
      console.error('   ⚠️  Error pre-loading existing allocations:', error.message);
      // Continue without pre-loading (graceful degradation)
    }
  }
}

module.exports = new EnhancedUnifiedScheduler();

