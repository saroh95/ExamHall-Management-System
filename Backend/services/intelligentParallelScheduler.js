/**
 * Intelligent Parallel Exam Scheduler
 *
 * Schedules multiple exams on the same day when students don't have conflicts
 *
 * Example for Semester 1:
 * - Day 1: MA101 (common for all departments)
 * - Day 2: PH101 (ME, CE, EI) + CH101 (CSE, ECE, EE) - same time, no conflict
 * - Day 3: EE101 + ECE101 - same time
 * - Day 4: CS101 + ME101 - same time
 * - Day 5: HS101 + CE101 - same time
 * - Day 6: CE103
 */

const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const Department = require('../models/Department');

class IntelligentParallelScheduler {
  constructor () {
    this.studentClassroomMap = new Map(); // Track consistent classroom assignment
    this.studentSeatMap = new Map(); // Track consistent seat assignment
    this.departmentClassroomMap = new Map(); // Track department to classroom mapping
    this.usedTeachers = new Set(); // Track teachers already assigned
    this.teacherRotationIndex = 0; // Index for rotating teachers
  }

  /**
   * Main scheduling function with intelligent parallel scheduling
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
    console.log('🚀 INTELLIGENT PARALLEL EXAM SCHEDULER');
    console.log('='.repeat(80));
    console.log('Exam Type:', examType);
    console.log('Semesters:', semesters);
    console.log('Date Range:', dateRange);
    console.log('Time Slots:', timeSlots);
    console.log(`${'='.repeat(80)}\n`);

    this.studentClassroomMap.clear();
    this.studentSeatMap.clear();
    this.departmentClassroomMap.clear();
    this.usedTeachers.clear();
    this.teacherRotationIndex = 0;

    // Track classroom/teacher usage per slot to prevent conflicts across sessions
    const roomUsageBySlot = new Map(); // key: dateStr-start-end -> Set(classroomId)
    const teacherUsageBySlot = new Map(); // key: dateStr-start-end -> Set(teacherId)

    // STEP 1: Get subjects with full student details
    console.log('📚 Fetching subjects with enrollments...');
    const subjectsWithEnrollments = await this.getSubjectsWithEnrollments({
      semesters,
      departments,
      academicYear: academicYear || this.getCurrentAcademicYear(),
    });

    if (subjectsWithEnrollments.length === 0) {
      throw new Error('No subjects found with enrolled students');
    }

    console.log(`✅ Found ${subjectsWithEnrollments.length} subjects to schedule\n`);

    // STEP 1.5: Verify classrooms exist before proceeding
    const Classroom = require('../models/Classroom');
    const totalClassrooms = await Classroom.countDocuments({ isAvailable: true, capacity: { $gt: 0 } });
    console.log(`🏫 Classroom check: ${totalClassrooms} available classroom(s) found`);
    if (totalClassrooms === 0) {
      throw new Error('No available classrooms found in database. Please add classrooms with isAvailable=true and capacity > 0.');
    }

    // STEP 2a: Generate dates and format time slots
    const availableDates = this.generateExamDates(dateRange);
    const formattedTimeSlots = this.formatTimeSlotsToAMPM(timeSlots);
    // STEP 2b: Preload existing allocations to avoid cross-session conflicts
    await this.preloadExistingAllocations(availableDates, formattedTimeSlots, roomUsageBySlot, teacherUsageBySlot);

    console.log(`📅 Available dates: ${availableDates.length}`);
    console.log(`⏰ Time slots per day: ${formattedTimeSlots.length}\n`);

    // STEP 3: Group subjects by semester
    const bySemester = this.groupBySemester(subjectsWithEnrollments);

    // STEP 4: Schedule with intelligent parallel scheduling
    const scheduledExams = await this.scheduleAllSemesters({
      bySemester,
      availableDates,
      timeSlots: formattedTimeSlots,
      examType,
      seatingStrategy,
      academicYear,
      createdBy,
      roomUsageBySlot,
      teacherUsageBySlot,
    });

    // STEP 5: Generate summary
    const summary = this.generateSummary(scheduledExams, availableDates);

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 SCHEDULING COMPLETE');
    console.log('='.repeat(80));
    console.log(summary);
    console.log(`${'='.repeat(80)}\n`);

    // If no exams were scheduled but we had subjects, it's likely a resource issue
    if (scheduledExams.length === 0 && subjectsWithEnrollments.length > 0) {
      console.error(`\n❌ WARNING: ${subjectsWithEnrollments.length} subjects were found but 0 exams were scheduled!`);
      console.error(`   This usually means:`);
      console.error(`   1. No classrooms available (check if classrooms exist and are marked as active/available)`);
      console.error(`   2. All classrooms are already booked for the selected time slots`);
      console.error(`   3. Classroom capacity is insufficient for the number of students`);
      console.error(`   4. All scheduling attempts failed due to conflicts or errors\n`);
    }

    return {
      success: true,
      examsScheduled: scheduledExams.length,
      summary,
      exams: this.serializeExams(scheduledExams),
    };
  }

  /**
   * Schedule all semesters with intelligent parallel scheduling
   */
  async scheduleAllSemesters (options) {
    const { bySemester, availableDates, timeSlots, examType, seatingStrategy, academicYear, createdBy, roomUsageBySlot, teacherUsageBySlot } = options;

    const allExams = [];
    let globalDateIndex = 0;

    // Process each semester
    for (const semester of Object.keys(bySemester).sort((a, b) => parseInt(a) - parseInt(b))) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📚 SEMESTER ${semester}`);
      console.log('='.repeat(80));

      const subjects = bySemester[semester];

      // Find groups of subjects that can run in parallel
      const parallelGroups = this.findParallelGroups(subjects);

      console.log(`📊 Subjects: ${subjects.length}`);
      console.log(`🔀 Parallel Groups: ${parallelGroups.length}\n`);

      // Schedule each group on a separate day
      for (const group of parallelGroups) {
        if (globalDateIndex >= availableDates.length) {
          console.log('⚠️  Ran out of dates!');
          break;
        }

        const currentDate = availableDates[globalDateIndex];
        console.log(`\n📅 Day ${globalDateIndex + 1}: ${currentDate.toLocaleDateString()}`);

        // Schedule all subjects in this group on the same day at the same time
        const timeSlot = timeSlots[0]; // Use first time slot (10:00-13:00)

        for (const subjectData of group) {
          try {
            console.log(`\n   📝 Attempting to schedule: ${subjectData.subject.code} - ${subjectData.subject.name}`);
            console.log(`      Students: ${subjectData.totalStudents}`);
            console.log(`      Departments: ${subjectData.departmentNames.join(', ')}`);
            
            const scheduled = await this.scheduleSubject(
              subjectData,
              currentDate,
              timeSlot,
              examType,
              seatingStrategy,
              academicYear,
              parseInt(semester),
              createdBy,
              roomUsageBySlot,
              teacherUsageBySlot,
            );
            const examsArray = Array.isArray(scheduled) ? scheduled : (scheduled ? [scheduled] : []);
            for (const exam of examsArray) {
              allExams.push(exam);
            }
            const deptNames = subjectData.departmentNames.join(', ');
            console.log(`   ✅ ${timeSlot.start}-${timeSlot.end}: ${subjectData.subject.code} - ${subjectData.subject.name} (${deptNames}) [${subjectData.totalStudents} students] → ${examsArray.length} exam(s)`);
          } catch (error) {
            const deptNames = subjectData.departmentNames.join(', ');
            console.error(`\n   ❌ ERROR scheduling ${subjectData.subject.code} - ${subjectData.subject.name} (${deptNames}):`);
            console.error(`      Error: ${error.message}`);
            console.error(`      Stack: ${error.stack}`);
            // Don't silently skip - log the error clearly
            if (error.message.includes('No available classrooms')) {
              console.error(`      💡 Possible solutions:`);
              console.error(`         1. Check if classrooms exist in database`);
              console.error(`         2. Verify classrooms have isAvailable=true`);
              console.error(`         3. Check classroom capacity (should be > 0)`);
              console.error(`         4. Reduce number of concurrent exams`);
            }
          }
        }

        globalDateIndex++;
      }
    }

    return allExams;
  }

  /**
   * Find groups of subjects that can run in parallel (no student conflicts)
   */
  findParallelGroups (subjects) {
    const groups = [];
    const scheduled = new Set();

    // Sort subjects by number of students (descending) for better grouping
    const sortedSubjects = [...subjects].sort((a, b) => b.totalStudents - a.totalStudents);

    for (const subject of sortedSubjects) {
      if (scheduled.has(subject.subject._id.toString())) continue;

      // Start a new group with this subject
      const group = [subject];
      scheduled.add(subject.subject._id.toString());

      // Try to add more subjects that don't conflict
      for (const other of sortedSubjects) {
        if (scheduled.has(other.subject._id.toString())) continue;

        // Check if this subject can be added to the group
        if (!this.hasStudentConflict(group, other)) {
          group.push(other);
          scheduled.add(other.subject._id.toString());
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if adding a subject would create a student conflict
   */
  hasStudentConflict (group, newSubject) {
    const newStudentIds = new Set(newSubject.students.map(s => s._id.toString()));

    for (const groupSubject of group) {
      for (const student of groupSubject.students) {
        if (newStudentIds.has(student._id.toString())) {
          return true; // Conflict found - same student in both subjects
        }
      }
    }

    return false; // No conflict
  }

  /**
   * Schedule a single subject
   */
  async scheduleSubject (subjectData, date, timeSlot, examType, seatingStrategy, academicYear, semester, createdBy, roomUsageBySlot, teacherUsageBySlot) {
    const slotKey = `${date.toDateString()}-${this.convertTo24Hour(timeSlot.start)}-${this.convertTo24Hour(timeSlot.end)}`;

    // If multi-department subject, create separate exams per department
    const hasMultipleDepartments = (subjectData.departments || []).length > 1;
    const scheduledExams = [];

    if (hasMultipleDepartments) {
      // Group students by department
      const studentsByDept = new Map();
      for (const student of subjectData.students) {
        const deptId = student.department?._id?.toString() || 'unknown';
        if (!studentsByDept.has(deptId)) studentsByDept.set(deptId, []);
        studentsByDept.get(deptId).push(student);
      }

      for (const [deptId, deptStudents] of studentsByDept.entries()) {
        // Allocate per-department classrooms
        const classroomSeatingData = await this.allocateClassroomsWithConsistentAssignment(
          deptStudents,
          date,
          timeSlot,
          seatingStrategy,
          semester,
          roomUsageBySlot,
          slotKey,
        );

        if (classroomSeatingData.length === 0) {
          console.log(`   ⚠️  Skipping ${subjectData.subject.code} for department ${deptId}: No available classrooms`);
          continue;
        }

        const invigilatorAssignments = await this.assignInvigilatorsWithConflicts(classroomSeatingData, date, timeSlot, teacherUsageBySlot, slotKey);

        const exam = await this.createExam({
          examType,
          subject: subjectData.subject,
          semesterId: semester,
          academicYear,
          examDate: date,
          timeSlot,
          classrooms: classroomSeatingData,
          invigilators: invigilatorAssignments,
          totalStudents: deptStudents.length,
          departments: [deptId],
          createdBy,
        });

        // Mark usage
        if (!roomUsageBySlot.has(slotKey)) roomUsageBySlot.set(slotKey, new Set());
        const usedRooms = roomUsageBySlot.get(slotKey);
        for (const c of classroomSeatingData) usedRooms.add(c.classroom.toString());

        if (!teacherUsageBySlot.has(slotKey)) teacherUsageBySlot.set(slotKey, new Set());
        const usedTeachers = teacherUsageBySlot.get(slotKey);
        for (const inv of invigilatorAssignments) usedTeachers.add(inv.teacher.toString());

        scheduledExams.push(exam);
      }

      return scheduledExams;
    }

    // Single-department subject path
    const classroomSeatingData = await this.allocateClassroomsWithConsistentAssignment(
      subjectData.students,
      date,
      timeSlot,
      seatingStrategy,
      semester,
      roomUsageBySlot,
      slotKey,
    );

    if (classroomSeatingData.length === 0) {
      throw new Error('No available classrooms');
    }

    const invigilatorAssignments = await this.assignInvigilatorsWithConflicts(classroomSeatingData, date, timeSlot, teacherUsageBySlot, slotKey);

    const exam = await this.createExam({
      examType,
      subject: subjectData.subject,
      semesterId: semester,
      academicYear,
      examDate: date,
      timeSlot,
      classrooms: classroomSeatingData,
      invigilators: invigilatorAssignments,
      totalStudents: subjectData.totalStudents,
      departments: subjectData.departments,
      createdBy,
    });

    if (!roomUsageBySlot.has(slotKey)) roomUsageBySlot.set(slotKey, new Set());
    const usedRooms = roomUsageBySlot.get(slotKey);
    for (const c of classroomSeatingData) usedRooms.add(c.classroom.toString());

    if (!teacherUsageBySlot.has(slotKey)) teacherUsageBySlot.set(slotKey, new Set());
    const usedTeachers = teacherUsageBySlot.get(slotKey);
    for (const inv of invigilatorAssignments) usedTeachers.add(inv.teacher.toString());

    return exam;
  }

  /**
   * Allocate classrooms with consistent student assignment
   */
  async allocateClassroomsWithConsistentAssignment (students, date, timeSlot, seatingStrategy, semester, roomUsageBySlot, slotKey) {
    // Query classrooms - Classroom model only has isAvailable, not isActive
    const classrooms = await Classroom.find({
      isAvailable: true,
      capacity: { $gt: 0 }, // Ensure capacity is greater than 0
    }).select('roomNumber building floor capacity seatingLayout maintenanceStatus').sort({ roomNumber: 1 }); // Sort by roomNumber for consistent assignment

    if (classrooms.length === 0) {
      console.error('   ❌ No classrooms found matching criteria:');
      console.error('      - isAvailable: true');
      console.error('      - capacity > 0');
      throw new Error('No available classrooms found in database. Please add classrooms with isAvailable=true and capacity > 0.');
    }
    
    console.log(`   🏫 Found ${classrooms.length} available classroom(s) with total capacity: ${classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0)}`);

    const classroomSeatingData = [];
    const classroomStudentMap = new Map();

    // Exclude rooms already used in this slot
    const usedRooms = roomUsageBySlot?.get(slotKey) || new Set();
    const availableRoomCount = classrooms.length - usedRooms.size;
    
    console.log(`   📊 Classroom availability: ${classrooms.length} total, ${usedRooms.size} used in this slot, ${availableRoomCount} available for ${students.length} students`);

    // Department-wise seating strategy
    if (seatingStrategy === 'department-wise') {
      // Group students by department
      const studentsByDepartment = new Map();

      for (const student of students) {
        const deptId = student.department?._id?.toString() || 'unknown';
        if (!studentsByDepartment.has(deptId)) {
          studentsByDepartment.set(deptId, {
            department: student.department,
            students: [],
          });
        }
        studentsByDepartment.get(deptId).students.push(student);
      }

      // Assign each department to a specific classroom
      let classroomIndex = 0;

      for (const [deptId, deptData] of studentsByDepartment.entries()) {
        // Check if department already has an assigned classroom
        let assignedClassroom = this.departmentClassroomMap.get(deptId);

        if (!assignedClassroom) {
          // First time seeing this department - assign a classroom
          while (classroomIndex < classrooms.length) {
            const roomCandidate = classrooms[classroomIndex];
            const roomId = roomCandidate._id.toString();
            classroomIndex++;
            if (usedRooms.has(roomId)) continue; // skip rooms already used in this slot
            assignedClassroom = roomId;
            this.departmentClassroomMap.set(deptId, assignedClassroom);
            break;
          }
        }

        if (assignedClassroom) {
          // Also ensure we don't collide with other departments in this exam call
          if (usedRooms.has(assignedClassroom)) {
            // find next available room
            let foundAlternative = false;
            for (const room of classrooms) {
              const roomId = room._id.toString();
              if (usedRooms.has(roomId)) continue;
              if (!classroomStudentMap.has(roomId)) {
                assignedClassroom = roomId;
                foundAlternative = true;
                break;
              }
            }
            if (!foundAlternative) {
              console.warn(`   ⚠️  No alternative classroom found for department ${deptId}, original room is already used`);
              assignedClassroom = null;
            }
          }

          if (assignedClassroom) {
            if (!classroomStudentMap.has(assignedClassroom)) {
              classroomStudentMap.set(assignedClassroom, []);
            }

            // Add all students from this department to the classroom
            for (const student of deptData.students) {
              const studentId = student._id.toString();
              this.studentClassroomMap.set(studentId, assignedClassroom);
              classroomStudentMap.get(assignedClassroom).push(student);
            }
            // mark this room used in this slot to prevent reuse by concurrent semester/department
            usedRooms.add(assignedClassroom);
          } else {
            console.warn(`   ⚠️  Could not assign classroom to department ${deptId} with ${deptData.students.length} students`);
          }
        } else {
          console.warn(`   ⚠️  Could not find available classroom for department ${deptId} with ${deptData.students.length} students`);
        }
      }
    } else {
      // Alternate or other seating strategies
      for (const student of students) {
        const studentId = student._id.toString();

        // Check if student already has a classroom assignment
        let assignedClassroom = this.studentClassroomMap.get(studentId);

        if (!assignedClassroom) {
          // First exam - assign to a classroom
          for (const classroom of classrooms) {
            const roomId = classroom._id.toString();
            // Skip if room is already used in this slot
            if (usedRooms.has(roomId)) continue;
            
            const capacity = Math.floor(classroom.capacity * 0.6); // 60% for alternate seating
            const currentCount = classroomStudentMap.get(roomId)?.length || 0;

            if (currentCount < capacity) {
              assignedClassroom = roomId;
              this.studentClassroomMap.set(studentId, assignedClassroom);
              break;
            }
          }
        }

        if (assignedClassroom) {
          // Verify the assigned room isn't used in this slot
          if (usedRooms.has(assignedClassroom)) {
            // Find alternative
            let foundAlternative = false;
            for (const classroom of classrooms) {
              const roomId = classroom._id.toString();
              if (usedRooms.has(roomId)) continue;
              const capacity = Math.floor(classroom.capacity * 0.6);
              const currentCount = classroomStudentMap.get(roomId)?.length || 0;
              if (currentCount < capacity) {
                assignedClassroom = roomId;
                this.studentClassroomMap.set(studentId, assignedClassroom);
                foundAlternative = true;
                break;
              }
            }
            if (!foundAlternative) {
              console.warn(`   ⚠️  Could not find alternative classroom for student ${studentId}`);
              assignedClassroom = null;
            }
          }
          
          if (assignedClassroom) {
            if (!classroomStudentMap.has(assignedClassroom)) {
              classroomStudentMap.set(assignedClassroom, []);
            }
            classroomStudentMap.get(assignedClassroom).push(student);
          }
        }
      }
    }

    // Generate seating arrangements (consistent across all exams)
    for (const [classroomId, classroomStudents] of classroomStudentMap.entries()) {
      const classroom = classrooms.find(c => c._id.toString() === classroomId);
      
      if (!classroom) {
        console.warn(`   ⚠️  Classroom ${classroomId} not found, skipping`);
        continue;
      }

      const seatingArrangement = this.generateSeatingArrangementWithMemory(
        classroomStudents,
        classroom,
        seatingStrategy,
        classroomId,
      );

      classroomSeatingData.push({
        classroom: classroom._id,
        assignedStudents: classroomStudents.map(s => s._id),
        seatingArrangement,
      });
    }

    // Check if we successfully assigned any students
    if (classroomSeatingData.length === 0 && students.length > 0) {
      const usedRoomCount = usedRooms?.size || 0;
      const totalRoomCount = classrooms.length;
      const totalCapacity = classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0);
      const effectiveCapacity = Math.floor(totalCapacity * (seatingStrategy === 'alternate' ? 0.6 : 1));
      
      console.error(`\n   ❌ FAILED to allocate classrooms for ${students.length} students:`);
      console.error(`      Total classrooms: ${totalRoomCount}`);
      console.error(`      Used in this slot: ${usedRoomCount}`);
      console.error(`      Available: ${totalRoomCount - usedRoomCount}`);
      console.error(`      Total capacity: ${totalCapacity}`);
      console.error(`      Effective capacity (${seatingStrategy}): ${effectiveCapacity}`);
      console.error(`      Students to allocate: ${students.length}`);
      
      if (usedRoomCount >= totalRoomCount) {
        throw new Error(`All ${totalRoomCount} classroom(s) are already booked for this time slot. Try scheduling on a different date/time or add more classrooms.`);
      } else if (effectiveCapacity < students.length) {
        throw new Error(`Insufficient classroom capacity. Need capacity for ${students.length} students but only have ${effectiveCapacity} available (${seatingStrategy} seating). Add more classrooms or increase capacity.`);
      } else {
        throw new Error(`Failed to allocate classrooms. Check classroom availability and capacity settings.`);
      }
    }

    return classroomSeatingData;
  }

  /**
   * Generate seating arrangement with memory (same seat for all exams)
   */
  generateSeatingArrangementWithMemory (students, classroom, strategy, classroomId) {
    const seating = [];
    const rows = classroom.layout?.rows || 10;
    const cols = classroom.layout?.columns || 6;

    let studentIndex = 0;

    if (strategy === 'alternate' || strategy === 'department-wise') {
      // Alternate seating (leave empty seats)
      for (let row = 1; row <= rows && studentIndex < students.length; row++) {
        for (let col = 1; col <= cols && studentIndex < students.length; col += 2) {
          const student = students[studentIndex];
          const studentId = student._id.toString();
          const seatKey = `${classroomId}-${studentId}`;

          // Check if student already has a seat assigned
          let seatInfo = this.studentSeatMap.get(seatKey);

          if (!seatInfo) {
            // First time - assign seat
            seatInfo = {
              row,
              column: col,
              seatNumber: `R${row}-C${col}`,
            };
            this.studentSeatMap.set(seatKey, seatInfo);
          }

          seating.push({
            row: seatInfo.row,
            column: seatInfo.column,
            seatNumber: seatInfo.seatNumber,
            student: student._id,
            isOccupied: true,
          });
          studentIndex++;
        }
      }
    } else {
      // Consecutive seating
      for (let row = 1; row <= rows && studentIndex < students.length; row++) {
        for (let col = 1; col <= cols && studentIndex < students.length; col++) {
          const student = students[studentIndex];
          const studentId = student._id.toString();
          const seatKey = `${classroomId}-${studentId}`;

          let seatInfo = this.studentSeatMap.get(seatKey);

          if (!seatInfo) {
            seatInfo = {
              row,
              column: col,
              seatNumber: `R${row}-C${col}`,
            };
            this.studentSeatMap.set(seatKey, seatInfo);
          }

          seating.push({
            row: seatInfo.row,
            column: seatInfo.column,
            seatNumber: seatInfo.seatNumber,
            student: student._id,
            isOccupied: true,
          });
          studentIndex++;
        }
      }
    }

    return seating;
  }

  /**
   * Assign invigilators using BALANCED DUTY SYSTEM
   */
  async assignInvigilatorsWithConflicts (classroomSeatingData, date, timeSlot, teacherUsageBySlot, slotKey) {
    console.log('\n👨‍🏫 BALANCED DUTY ASSIGNMENT (Parallel Scheduler)');

    const classroomCount = classroomSeatingData.length;

    if (classroomCount === 0) {
      console.warn('⚠️ No classrooms provided for invigilation assignment');
      return [];
    }

    // Get teachers already assigned in this slot
    const existingAssignments = teacherUsageBySlot?.get(slotKey) || new Set();

    // Use balanced duty assignment service
    const BalancedDutyAssignmentService = require('./balancedDutyAssignmentService');
    const balancedDutyService = BalancedDutyAssignmentService.getInstance();

    const rawAssignments = await balancedDutyService.assignBalancedInvigilators({
      examDate: date,
      timeSlot,
      classroomCount,
      teachersPerClassroom: 2, // Chief + Regular per classroom
      existingAssignments,
    });

    if (rawAssignments.length === 0) {
      console.warn('⚠️ No teachers could be assigned! System may have no active teachers.');
      return [];
    }

    // Convert to exam format with classroom assignments
    const invigilators = [];
    const teachersPerClassroom = 2;

    for (let i = 0; i < classroomCount; i++) {
      const classroomData = classroomSeatingData[i];
      const startIdx = i * teachersPerClassroom;
      const classroomTeachers = rawAssignments.slice(startIdx, startIdx + teachersPerClassroom);

      classroomTeachers.forEach(assignment => {
        invigilators.push({
          teacher: assignment.teacher,
          role: assignment.role,
          assignedClassrooms: [classroomData.classroom],
        });

        console.log(`   ${assignment.role === 'chief_invigilator' ? '👑' : '👤'} ${assignment.teacherName} (${assignment.employeeId}) - Duties: ${assignment.currentWorkload}`);
      });
    }

    console.log(`✅ Created ${invigilators.length} invigilator assignments (${new Set(invigilators.map(i => i.teacher.toString())).size} unique teachers)`);

    return invigilators;
  }

  /**
   * Create exam document
   */
  async createExam (data) {
    const { examType, subject, semesterId, academicYear, examDate, timeSlot, classrooms, invigilators, totalStudents, departments, createdBy } = data;

    const examTypeMap = {
      'Mid-Semester': 'mid_semester',
      'End-Semester': 'end_semester',
      'Quiz': 'quiz',
      'Assignment': 'assignment',
    };

    const startTime24 = this.convertTo24Hour(timeSlot.start);
    const endTime24 = this.convertTo24Hour(timeSlot.end);

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
      totalMarks: 100,
      passingMarks: 40,
      classrooms,
      invigilators,
      totalStudents,
      departments,
      status: 'scheduled',
      isActive: true,
      createdBy: createdBy || null,
    });

    console.log(`📝 Created exam: ${exam._id}`);
    console.log(`   Invigilators saved: ${exam.invigilators.length}`);
    if (exam.invigilators.length > 0) {
      console.log(`   First invigilator teacher ID: ${exam.invigilators[0].teacher}`);
    }

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
   * Get subjects with full student details
   */
  async getSubjectsWithEnrollments (filters) {
    const { semesters, departments, academicYear } = filters;

    const enrollmentQuery = {
      status: 'Enrolled',
      academicYear: academicYear || this.getCurrentAcademicYear(),
    };

    if (semesters && semesters.length > 0) {
      enrollmentQuery.semester = { $in: semesters };
    }

    console.log(`   🔍 Enrollment query:`, JSON.stringify(enrollmentQuery, null, 2));
    
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

    console.log(`   📊 Found ${enrollments.length} total enrollments`);
    
    const subjectMap = new Map();
    let skippedCount = 0;
    let skippedNoSubject = 0;
    let skippedNoStudent = 0;

    for (const enrollment of enrollments) {
      if (!enrollment.subject) {
        skippedNoSubject++;
        continue;
      }
      if (!enrollment.student) {
        skippedNoStudent++;
        continue;
      }

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

    return Array.from(subjectMap.values()).map(data => ({
      ...data,
      departments: Array.from(data.departments),
      departmentNames: Array.from(data.departmentNames),
      totalStudents: data.students.length,
    }));
    
    const result = Array.from(subjectMap.values()).map(data => ({
      ...data,
      departments: Array.from(data.departments),
      departmentNames: Array.from(data.departmentNames),
      totalStudents: data.students.length,
    }));
    
    console.log(`   ✅ Processed enrollments: ${enrollments.length} total`);
    console.log(`      - Subjects with students: ${result.length}`);
    console.log(`      - Skipped (no subject): ${skippedNoSubject}`);
    console.log(`      - Skipped (no student): ${skippedNoStudent}`);
    console.log(`      - Total students: ${result.reduce((sum, s) => sum + s.totalStudents, 0)}`);
    
    if (result.length === 0) {
      console.error(`   ❌ No subjects found with enrolled students!`);
      console.error(`      Possible reasons:`);
      console.error(`      1. No enrollments match the semester filter: ${semesters?.join(', ') || 'all'}`);
      console.error(`      2. No enrollments match the academic year: ${academicYear || this.getCurrentAcademicYear()}`);
      console.error(`      3. All subjects are inactive`);
      console.error(`      4. All students are inactive`);
      if (departments && departments.length > 0) {
        console.error(`      5. Department filter may be excluding all enrollments: ${departments.join(', ')}`);
      }
    }
    
    return result;
  }

  /**
   * Group subjects by semester
   */
  groupBySemester (subjects) {
    const bySemester = {};

    subjects.forEach(subjectData => {
      const sem = subjectData.semesterId;

      if (!bySemester[sem]) {
        bySemester[sem] = [];
      }

      bySemester[sem].push(subjectData);
    });

    return bySemester;
  }

  /**
   * Format time slots to AM/PM
   */
  formatTimeSlotsToAMPM (timeSlots) {
    return timeSlots.map(slot => ({
      start: this.convertTo12Hour(slot.start),
      end: this.convertTo12Hour(slot.end),
      original: slot,
    }));
  }

  /**
   * Pre-load existing exams and mark room/teacher usage per slot
   */
  async preloadExistingAllocations (availableDates, formattedTimeSlots, roomUsageBySlot, teacherUsageBySlot) {
    try {
      const minDate = availableDates[0];
      const maxDate = availableDates[availableDates.length - 1];

      const existingExams = await Exam.find({
        examDate: { $gte: minDate, $lte: maxDate },
        status: { $in: ['scheduled', 'in_progress'] },
        isActive: true,
      }).select('examDate startTime endTime classrooms invigilators');

      for (const exam of existingExams) {
        const slotKey = `${new Date(exam.examDate).toDateString()}-${exam.startTime}-${exam.endTime}`;

        if (!roomUsageBySlot.has(slotKey)) roomUsageBySlot.set(slotKey, new Set());
        if (!teacherUsageBySlot.has(slotKey)) teacherUsageBySlot.set(slotKey, new Set());

        const usedRooms = roomUsageBySlot.get(slotKey);
        const usedTeachers = teacherUsageBySlot.get(slotKey);

        (exam.classrooms || []).forEach(c => usedRooms.add(c.classroom.toString()));
        (exam.invigilators || []).forEach(inv => usedTeachers.add(inv.teacher.toString()));
      }
    } catch (e) {
      console.log('⚠️  Preload existing allocations failed:', e.message);
    }
  }

  /**
   * Convert 24-hour to 12-hour format
   */
  convertTo12Hour (time24) {
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes || '00'} ${ampm}`;
  }

  /**
   * Convert 12-hour to 24-hour format
   */
  convertTo24Hour (time) {
    if (!time) return '10:00';

    // Check if already in 24-hour format
    if (time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      const [h, m] = time.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }

    // Convert from AM/PM format
    const [timePart, period] = time.split(' ');
    if (!timePart || !period) return '10:00';

    const parts = timePart.split(':');
    let hours = parseInt(parts[0]) || 0;
    const minutes = parts[1] ? parseInt(parts[1]) : 0;

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
    return 180; // 3 hours
  }

  getCurrentAcademicYear () {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }

  generateSummary (exams, dates) {
    const totalExams = exams.length;
    const totalStudents = [...new Set(exams.flatMap(e =>
      e.classrooms.flatMap(c => c.assignedStudents.map(s => s.toString())),
    ))].length;
    const totalClassrooms = exams.reduce((sum, e) => sum + e.classrooms.length, 0);
    const uniqueClassrooms = new Set(exams.flatMap(e =>
      e.classrooms.map(c => c.classroom.toString()),
    )).size;
    const totalInvigilators = exams.reduce((sum, e) => sum + e.invigilators.length, 0);

    // Count unique exam days
    const uniqueDates = new Set(exams.map(e => e.examDate.toDateString())).size;

    return `
    Total Exams: ${totalExams}
    Total Students: ${totalStudents}
    Exam Days: ${uniqueDates} (saved ${dates.length - uniqueDates} days with parallel scheduling!)
    Total Classroom Allocations: ${totalClassrooms}
    Unique Classrooms Used: ${uniqueClassrooms}
    Total Invigilators: ${totalInvigilators}
    Students with Consistent Classrooms: ${this.studentClassroomMap.size}
    `;
  }

  serializeExams (exams) {
    return exams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      type: exam.type,
      subject: exam.subject,
      semester: exam.semester,
      academicYear: exam.academicYear,
      examDate: exam.examDate,
      date: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      time: `${exam.startTime}-${exam.endTime}`,
      duration: exam.duration,
      classrooms: exam.classrooms || [],
      invigilators: exam.invigilators || [],
      totalStudents: exam.totalStudents || 0,
      departments: exam.departments || [],
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    }));
  }
}

module.exports = new IntelligentParallelScheduler();

