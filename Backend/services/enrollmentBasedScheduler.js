/**
 * Enrollment-Based Exam Scheduler Service
 *
 * Intelligently schedules exams based on actual student enrollments,
 * allocates classrooms, generates seating arrangements, and assigns teachers.
 */

const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');

class EnrollmentBasedScheduler {
  /**
   * Get all subjects that have student enrollments
   */
  async getSubjectsWithEnrollments (filters) {
    const { semesters, departments, academicYear } = filters;

    console.log('📚 Fetching subjects with enrollments...');
    console.log('Filters:', { semesters, departments, academicYear });

    // Build enrollment query
    const enrollmentQuery = {
      status: 'Enrolled',
      academicYear: academicYear || this.getCurrentAcademicYear(),
    };

    // Get all enrollments
    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate({
        path: 'subject',
        populate: { path: 'departmentId' },
      })
      .populate({
        path: 'student',
        populate: { path: 'department' },
      });

    console.log(`   Found ${enrollments.length} total enrollments`);

    // Group enrollments by subject
    const subjectEnrollmentMap = new Map();

    for (const enrollment of enrollments) {
      if (!enrollment.subject || !enrollment.student) continue;

      const subjectId = enrollment.subject._id.toString();
      const subjectSemester = enrollment.subject.semesterId;

      // Filter by semester
      if (semesters && !semesters.includes(subjectSemester)) continue;

      // Filter by department (if subject has specific department)
      if (departments && departments.length > 0) {
        const subjectDeptIds = enrollment.subject.departmentId?.map(d => d._id.toString()) || [];
        const studentDeptId = enrollment.student.department?._id.toString();

        const matchesDept = departments.some(deptId =>
          subjectDeptIds.includes(deptId.toString()) ||
          studentDeptId === deptId.toString(),
        );

        if (!matchesDept) continue;
      }

      if (!subjectEnrollmentMap.has(subjectId)) {
        subjectEnrollmentMap.set(subjectId, {
          subject: enrollment.subject,
          students: [],
          departments: new Set(),
        });
      }

      const subjectData = subjectEnrollmentMap.get(subjectId);
      subjectData.students.push(enrollment.student);
      if (enrollment.student.department) {
        subjectData.departments.add(enrollment.student.department._id.toString());
      }
    }

    // Convert to array
    const subjectsWithEnrollments = Array.from(subjectEnrollmentMap.values()).map(data => ({
      subject: data.subject,
      totalStudents: data.students.length,
      students: data.students,
      departments: Array.from(data.departments),
      semesterId: data.subject.semesterId,
    }));

    console.log(`   ✅ Found ${subjectsWithEnrollments.length} subjects with enrollments`);
    subjectsWithEnrollments.forEach(s => {
      console.log(`      ${s.subject.code}: ${s.totalStudents} students, ${s.departments.length} departments`);
    });

    return subjectsWithEnrollments;
  }

  /**
   * Calculate classrooms needed for a subject
   */
  async calculateClassroomsNeeded (totalStudents, date, timeSlot) {
    console.log(`\n🏢 Calculating classrooms for ${totalStudents} students...`);

    // Get available classrooms
    const allClassrooms = await Classroom.find({
      isActive: true,
      maintenanceStatus: 'operational',
    }).sort({ capacity: -1 }); // Largest first

    // Check availability for this date and time
    const availableClassrooms = [];

    for (const classroom of allClassrooms) {
      const isAvailable = await this.isClassroomAvailable(classroom._id, date, timeSlot);
      if (isAvailable) {
        availableClassrooms.push(classroom);
      }
    }

    console.log(`   Available classrooms: ${availableClassrooms.length}`);

    if (availableClassrooms.length === 0) {
      throw new Error('No available classrooms for the selected date and time');
    }

    // Calculate effective capacity (60% for alternate seating)
    const SEATING_FACTOR = 0.6;

    const classroomsNeeded = [];
    let studentsAllocated = 0;

    for (const classroom of availableClassrooms) {
      if (studentsAllocated >= totalStudents) break;

      const effectiveCapacity = Math.floor(classroom.capacity * SEATING_FACTOR);
      const studentsForThisRoom = Math.min(
        totalStudents - studentsAllocated,
        effectiveCapacity,
      );

      classroomsNeeded.push({
        classroom,
        effectiveCapacity,
        studentsToAssign: studentsForThisRoom,
      });

      studentsAllocated += studentsForThisRoom;

      console.log(`   ✅ ${classroom.name}: ${studentsForThisRoom}/${effectiveCapacity} students`);
    }

    if (studentsAllocated < totalStudents) {
      console.log(`   ⚠️  Warning: Could only allocate ${studentsAllocated}/${totalStudents} students`);
    }

    return classroomsNeeded;
  }

  /**
   * Check if classroom is available at given date and time
   */
  async isClassroomAvailable (classroomId, examDate, timeSlot) {
    const { start, end } = this.parseTimeSlot(timeSlot);

    // Check if any exam is using this classroom at this time
    const conflictingExam = await Exam.findOne({
      'classrooms.classroom': classroomId,
      examDate,
      status: { $in: ['scheduled', 'in_progress'] },
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start },
        },
      ],
    });

    return !conflictingExam;
  }

  /**
   * Distribute students across classrooms with department mixing
   */
  distributeStudentsAcrossClassrooms (students, classroomAllocations) {
    console.log(`\n👥 Distributing ${students.length} students across ${classroomAllocations.length} classrooms...`);

    // Group students by department
    const studentsByDept = new Map();
    students.forEach(student => {
      const deptId = student.department?._id?.toString() || 'unknown';
      if (!studentsByDept.has(deptId)) {
        studentsByDept.set(deptId, []);
      }
      studentsByDept.get(deptId).push(student);
    });

    console.log(`   Departments: ${studentsByDept.size}`);
    studentsByDept.forEach((students, deptId) => {
      console.log(`      Dept ${deptId}: ${students.length} students`);
    });

    // Initialize classroom assignments
    const assignments = classroomAllocations.map(allocation => ({
      classroom: allocation.classroom,
      effectiveCapacity: allocation.effectiveCapacity,
      studentsToAssign: allocation.studentsToAssign,
      assignedStudents: [],
      departments: new Set(),
    }));

    // Round-robin distribution to ensure department mixing
    let currentClassroomIndex = 0;

    for (const [deptId, deptStudents] of studentsByDept) {
      for (const student of deptStudents) {
        // Find next classroom with space
        let attempts = 0;
        while (attempts < assignments.length) {
          const assignment = assignments[currentClassroomIndex];

          if (assignment.assignedStudents.length < assignment.studentsToAssign) {
            assignment.assignedStudents.push(student);
            assignment.departments.add(deptId);
            break;
          }

          currentClassroomIndex = (currentClassroomIndex + 1) % assignments.length;
          attempts++;
        }

        if (attempts >= assignments.length) {
          console.log(`   ⚠️  Warning: Could not assign student ${student.scholarId}`);
        }

        // Move to next classroom for next student
        currentClassroomIndex = (currentClassroomIndex + 1) % assignments.length;
      }
    }

    // Log distribution statistics
    console.log('\n   Distribution results:');
    assignments.forEach((assignment, index) => {
      console.log(`      Classroom ${index + 1} (${assignment.classroom.name}):`);
      console.log(`         Students: ${assignment.assignedStudents.length}/${assignment.studentsToAssign}`);
      console.log(`         Departments: ${assignment.departments.size}`);
    });

    return assignments;
  }

  /**
   * Generate seating arrangement for a classroom
   */
  generateSeatingArrangement (students, classroom, strategy = 'alternate') {
    console.log(`\n🪑 Generating ${strategy} seating for ${classroom.name}...`);

    const layout = classroom.layout || {
      rows: Math.ceil(classroom.capacity / 10),
      columns: 10,
    };

    let seatingArrangement = [];

    if (strategy === 'alternate') {
      seatingArrangement = this.generateAlternateSeating(students, layout);
    } else if (strategy === 'department-wise') {
      seatingArrangement = this.generateDepartmentWiseSeating(students, layout);
    } else if (strategy === 'random') {
      seatingArrangement = this.generateRandomSeating(students, layout);
    } else {
      seatingArrangement = this.generateAlternateSeating(students, layout);
    }

    console.log(`   ✅ Generated ${seatingArrangement.filter(s => s.student).length} seats`);

    return seatingArrangement;
  }

  /**
   * Generate alternate seating (COVID-style)
   */
  generateAlternateSeating (students, layout) {
    const seating = [];
    let studentIndex = 0;

    for (let row = 1; row <= layout.rows; row++) {
      for (let col = 1; col <= layout.columns; col++) {
        // Alternate pattern: occupied seats on even positions
        if ((row + col) % 2 === 0 && studentIndex < students.length) {
          seating.push({
            row,
            column: col,
            student: students[studentIndex]._id,
            seatNumber: `R${row}-C${col}`,
            isOccupied: true,
          });
          studentIndex++;
        }
      }
    }

    return seating;
  }

  /**
   * Generate department-wise seating
   */
  generateDepartmentWiseSeating (students, layout) {
    // Group students by department
    const byDept = new Map();
    students.forEach(student => {
      const deptId = student.department?._id?.toString() || 'unknown';
      if (!byDept.has(deptId)) {
        byDept.set(deptId, []);
      }
      byDept.get(deptId).push(student);
    });

    const seating = [];
    let row = 1;
    let col = 1;

    for (const [deptId, deptStudents] of byDept) {
      for (const student of deptStudents) {
        if (row > layout.rows) break;

        seating.push({
          row,
          column: col,
          student: student._id,
          seatNumber: `R${row}-C${col}`,
          isOccupied: true,
        });

        col++;
        if (col > layout.columns) {
          col = 1;
          row++;
        }
      }
    }

    return seating;
  }

  /**
   * Generate random seating
   */
  generateRandomSeating (students, layout) {
    // Shuffle students
    const shuffled = [...students].sort(() => Math.random() - 0.5);

    const seating = [];
    let studentIndex = 0;

    for (let row = 1; row <= layout.rows; row++) {
      for (let col = 1; col <= layout.columns; col++) {
        if (studentIndex < shuffled.length) {
          seating.push({
            row,
            column: col,
            student: shuffled[studentIndex]._id,
            seatNumber: `R${row}-C${col}`,
            isOccupied: true,
          });
          studentIndex++;
        }
      }
    }

    return seating;
  }

  /**
   * Assign invigilators based on availability and workload
   */
  async assignInvigilators (examDate, timeSlot, classroomCount) {
    console.log(`\n👨‍🏫 Assigning invigilators for ${classroomCount} classrooms...`);

    const { start, end } = this.parseTimeSlot(timeSlot);

    // Get available teachers
    const allTeachers = await Teacher.find({ isActive: true });

    // Calculate current workload for each teacher on this date
    const teacherWorkload = new Map();

    for (const teacher of allTeachers) {
      const workload = await this.getTeacherWorkload(teacher._id, examDate);
      teacherWorkload.set(teacher._id.toString(), workload);
    }

    // Sort teachers by workload (least busy first)
    const sortedTeachers = allTeachers.sort((a, b) => {
      const workloadA = teacherWorkload.get(a._id.toString()) || 0;
      const workloadB = teacherWorkload.get(b._id.toString()) || 0;
      return workloadA - workloadB;
    });

    // Assign teachers (1 per classroom minimum)
    const teachersNeeded = Math.max(classroomCount, Math.ceil(classroomCount * 1.2));
    const assignments = [];

    for (let i = 0; i < Math.min(teachersNeeded, sortedTeachers.length); i++) {
      const teacher = sortedTeachers[i];

      assignments.push({
        teacher: teacher._id,
        role: i === 0 ? 'chief_invigilator' : 'invigilator',
        assignedClassrooms: [],
      });

      console.log(`   ✅ ${teacher.name} (workload: ${teacherWorkload.get(teacher._id.toString())})`);
    }

    return assignments;
  }

  /**
   * Get teacher's current workload on a specific date
   */
  async getTeacherWorkload (teacherId, date) {
    const exams = await Exam.find({
      'invigilators.teacher': teacherId,
      examDate: date,
      status: { $in: ['scheduled', 'in_progress'] },
    });

    return exams.length;
  }

  /**
   * Parse time slot string
   */
  parseTimeSlot (timeSlot) {
    // Handle different time slot formats
    if (typeof timeSlot === 'object' && timeSlot.start && timeSlot.end) {
      return { start: timeSlot.start, end: timeSlot.end };
    }

    if (typeof timeSlot === 'string') {
      const parts = timeSlot.split('-');
      if (parts.length === 2) {
        return { start: parts[0].trim(), end: parts[1].trim() };
      }
    }

    // Default fallback
    return { start: '10:00', end: '13:00' };
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
}

module.exports = new EnrollmentBasedScheduler();

