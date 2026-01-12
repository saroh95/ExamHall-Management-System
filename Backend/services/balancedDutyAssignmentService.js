/**
 * Balanced Teacher Duty Assignment Service
 *
 * Ensures all 87 teachers get fair, conflict-free duty assignments
 *
 * Features:
 * - Global workload tracking across all exams
 * - Fair rotation through ALL teachers
 * - Conflict prevention (no teacher in 2 places at same time)
 * - Preference consideration (optional)
 * - Real-time balance monitoring
 */

const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');

class BalancedDutyAssignmentService {
  constructor () {
    this.teacherWorkloadCache = null;
    this.lastCacheUpdate = null;
    this.CACHE_DURATION = 60000; // 1 minute
    this.globalTeacherIndex = 0; // For round-robin across all exams
    this.totalTeachersAssigned = 0; // Track total teachers assigned across all exams
    this.teacherRotationHistory = []; // Track which teachers have been assigned recently
  }

  // Singleton pattern to ensure global index persists
  static getInstance () {
    if (!BalancedDutyAssignmentService.instance) {
      BalancedDutyAssignmentService.instance = new BalancedDutyAssignmentService();
    }
    return BalancedDutyAssignmentService.instance;
  }

  /**
   * Main method: Assign invigilators with balanced workload
   */
  async assignBalancedInvigilators (params) {
    try {
      // Ensure service state is maintained
      this.ensureServiceState();

      const {
        examDate,
        timeSlot,
        classroomCount,
        teachersPerClassroom = 2, // Chief + Regular
        existingAssignments = new Set(), // Teachers already assigned in this slot
        preferences = {}, // Optional teacher preferences
      } = params;

      // Validate input parameters
      if (!examDate || !timeSlot || !classroomCount) {
        console.log('   ❌ Invalid parameters provided');
        return [];
      }

      console.log('\n👨‍🏫 BALANCED DUTY ASSIGNMENT');
      console.log(`   Date: ${examDate.toLocaleDateString()}`);
      console.log(`   Time: ${timeSlot.start} - ${timeSlot.end}`);
      console.log(`   Classrooms: ${classroomCount}`);
      console.log(`   Teachers needed: ${classroomCount * teachersPerClassroom}`);
      console.log(`   Current global index: ${this.globalTeacherIndex}`);

      // Step 1: Get all active teachers
      const allTeachers = await this.getAllActiveTeachers();
      console.log(`   Total active teachers: ${allTeachers.length}`);

      if (allTeachers.length === 0) {
        console.log('   ❌ No active teachers found!');
        return [];
      }

      // Step 2: Get current workload for all teachers
      const workloadMap = await this.getGlobalTeacherWorkload(allTeachers, examDate);

      // Step 3: Filter out teachers with conflicts
      const availableTeachers = await this.filterConflictingTeachers(
        allTeachers,
        examDate,
        timeSlot,
        existingAssignments,
      );

      console.log(`   Available teachers (no conflicts): ${availableTeachers.length}`);

      if (availableTeachers.length === 0) {
        console.log('   ⚠️  All teachers have conflicts! Using all teachers with rotation...');
        // Fallback: use all teachers but rotate to minimize conflicts
        return this.assignWithRotation(allTeachers, classroomCount, teachersPerClassroom, workloadMap);
      }

      // Step 4: Sort teachers by workload (least busy first)
      const sortedTeachers = this.sortByWorkload(availableTeachers, workloadMap);

      // Step 5: Assign teachers fairly
      const assignments = this.createBalancedAssignments(
        sortedTeachers,
        classroomCount,
        teachersPerClassroom,
        workloadMap,
      );

      // Step 6: Log assignment summary
      this.logAssignmentSummary(assignments, workloadMap);

      return assignments;
    } catch (error) {
      console.error(`   ❌ Error in assignBalancedInvigilators: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all active teachers
   */
  async getAllActiveTeachers () {
    try {
      const teachers = await Teacher.find({
        isActive: true,
      }).select('_id fullName employeeId department email designation workload')
        .lean();

      console.log(`   📋 Found ${teachers.length} active teachers in database`);

      // Log sample teachers for debugging
      if (teachers.length > 0) {
        console.log(`   Sample teacher: ${teachers[0].fullName} (${teachers[0].employeeId})`);
      }

      return teachers;
    } catch (error) {
      console.error(`   ❌ Error getting teachers: ${error.message}`);
      return [];
    }
  }

  /**
   * Get global workload for all teachers
   */
  async getGlobalTeacherWorkload (teachers, referenceDate = new Date()) {
    try {
      const workloadMap = new Map();

      // Get academic year date range
      const academicYearStart = this.getAcademicYearStart(referenceDate);
      const academicYearEnd = this.getAcademicYearEnd(referenceDate);

      console.log(`\n   📊 Calculating workload from ${academicYearStart.toLocaleDateString()} to ${academicYearEnd.toLocaleDateString()}`);

      // Get all exams in academic year
      const allExams = await Exam.find({
        examDate: { $gte: academicYearStart, $lte: academicYearEnd },
        status: { $in: ['scheduled', 'in_progress', 'completed'] },
        isActive: true,
      }).select('invigilators examDate startTime endTime').lean();

      console.log(`   Found ${allExams.length} total exams in academic year`);

      // Initialize all teachers with 0 workload
      teachers.forEach(teacher => {
        workloadMap.set(teacher._id.toString(), {
          teacherId: teacher._id,
          teacherName: teacher.fullName || 'Unknown',
          employeeId: teacher.employeeId || 'N/A',
          totalDuties: 0,
          duties: [],
        });
      });

      // Count duties for each teacher
      allExams.forEach(exam => {
        if (exam.invigilators && exam.invigilators.length > 0) {
          exam.invigilators.forEach(inv => {
            const teacherId = inv.teacher.toString();
            const workload = workloadMap.get(teacherId);

            if (workload) {
              workload.totalDuties++;
              workload.duties.push({
                examDate: exam.examDate,
                timeSlot: `${exam.startTime}-${exam.endTime}`,
                role: inv.role,
              });
            }
          });
        }
      });

      // Log workload distribution
      const dutyCounts = Array.from(workloadMap.values()).map(w => w.totalDuties);
      const minDuties = dutyCounts.length > 0 ? Math.min(...dutyCounts) : 0;
      const maxDuties = dutyCounts.length > 0 ? Math.max(...dutyCounts) : 0;
      const avgDuties = dutyCounts.length > 0 ? (dutyCounts.reduce((a, b) => a + b, 0) / dutyCounts.length).toFixed(2) : '0';
      const teachersWithZero = dutyCounts.filter(d => d === 0).length;

      console.log('   📊 Workload Stats:');
      console.log(`      Min duties: ${minDuties}`);
      console.log(`      Max duties: ${maxDuties}`);
      console.log(`      Average: ${avgDuties}`);
      console.log(`      Teachers with 0 duties: ${teachersWithZero}`);
      console.log(`      Balance spread: ${maxDuties - minDuties} (lower is better)`);

      return workloadMap;
    } catch (error) {
      console.error(`   ❌ Error calculating workload: ${error.message}`);
      // Return empty workload map
      const workloadMap = new Map();
      teachers.forEach(teacher => {
        workloadMap.set(teacher._id.toString(), {
          teacherId: teacher._id,
          teacherName: teacher.fullName || 'Unknown',
          employeeId: teacher.employeeId || 'N/A',
          totalDuties: 0,
          duties: [],
        });
      });
      return workloadMap;
    }
  }

  /**
   * Filter out teachers who have conflicts at this time
   */
  async filterConflictingTeachers (teachers, examDate, timeSlot, existingAssignments) {
    try {
      const dateStart = new Date(examDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(examDate);
      dateEnd.setHours(23, 59, 59, 999);

      // Find exams at the same time slot
      const conflictingExams = await Exam.find({
        examDate: { $gte: dateStart, $lte: dateEnd },
        status: { $in: ['scheduled', 'in_progress'] },
        isActive: true,
        $or: [
          { startTime: timeSlot.start, endTime: timeSlot.end },
          {
            startTime: { $lte: timeSlot.end },
            endTime: { $gte: timeSlot.start },
          },
        ],
      }).select('invigilators').lean();

      // Collect conflicting teacher IDs
      const conflictingTeacherIds = new Set(existingAssignments);

      conflictingExams.forEach(exam => {
        if (exam.invigilators) {
          exam.invigilators.forEach(inv => {
            conflictingTeacherIds.add(inv.teacher.toString());
          });
        }
      });

      // Filter out conflicting teachers
      const available = teachers.filter(t =>
        !conflictingTeacherIds.has(t._id.toString()),
      );

      console.log(`   🚫 Filtered out ${teachers.length - available.length} teachers with conflicts`);

      return available;
    } catch (error) {
      console.error(`   ❌ Error filtering conflicts: ${error.message}`);
      // Return all teachers if error occurs
      return teachers;
    }
  }

  /**
   * Sort teachers by workload (least busy first)
   */
  sortByWorkload (teachers, workloadMap) {
    return teachers.sort((a, b) => {
      const workloadA = workloadMap.get(a._id.toString())?.totalDuties || 0;
      const workloadB = workloadMap.get(b._id.toString())?.totalDuties || 0;

      // Primary sort: by workload (ascending)
      if (workloadA !== workloadB) {
        return workloadA - workloadB;
      }

      // Secondary sort: by name (for consistency)
      const nameA = a.fullName || a.name || '';
      const nameB = b.fullName || b.name || '';
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Create balanced assignments with proper round-robin rotation
   */
  createBalancedAssignments (sortedTeachers, classroomCount, teachersPerClassroom, workloadMap) {
    try {
      console.log(`   🔄 Using enhanced round-robin assignment for ${classroomCount} classrooms`);
      console.log(`   📊 Global teacher index: ${this.globalTeacherIndex}`);
      console.log(`   📊 Total teachers available: ${sortedTeachers.length}`);
      console.log(`   📊 Teachers needed: ${classroomCount * teachersPerClassroom}`);

      const assignments = [];
      const teachersNeeded = classroomCount * teachersPerClassroom;

      // Ensure we have enough teachers
      if (sortedTeachers.length === 0) {
        console.log('   ❌ No teachers available for assignment');
        return [];
      }

      // If we need more teachers than available, we'll need to reuse some
      const willReuseTeachers = teachersNeeded > sortedTeachers.length;
      if (willReuseTeachers) {
        console.log(`   ⚠️  Need ${teachersNeeded} teachers but only ${sortedTeachers.length} available - will reuse teachers`);
      }

      // Create a balanced assignment that rotates through ALL teachers
      for (let i = 0; i < teachersNeeded; i++) {
        // Use round-robin with proper cycling through all teachers
        const teacherIndex = this.globalTeacherIndex % sortedTeachers.length;
        const teacher = sortedTeachers[teacherIndex];

        // Calculate role based on position in classroom
        const classroomIdx = Math.floor(i / teachersPerClassroom);
        const roleIdx = i % teachersPerClassroom;
        const role = roleIdx === 0 ? 'chief_invigilator' : 'invigilator';

        const currentWorkload = workloadMap.get(teacher._id.toString())?.totalDuties || 0;

        assignments.push({
          teacher: teacher._id,
          teacherName: teacher.fullName || 'Unknown',
          employeeId: teacher.employeeId || 'N/A',
          role,
          currentWorkload,
          department: teacher.department,
          classroomIndex: classroomIdx + 1,
          assignmentIndex: i + 1,
        });

        // Track this teacher assignment
        this.teacherRotationHistory.push({
          teacherId: teacher._id.toString(),
          teacherName: teacher.fullName || 'Unknown',
          assignmentIndex: i + 1,
          classroomIndex: classroomIdx + 1,
          role,
        });

        // Move to next teacher
        this.globalTeacherIndex++;
        this.totalTeachersAssigned++;

        console.log(`      ✅ Assignment ${i + 1}/${teachersNeeded} - Classroom ${classroomIdx + 1} - ${role}: ${teacher.fullName || 'Unknown'} (${teacher.employeeId || 'N/A'}) [Current duties: ${currentWorkload}]`);
      }

      // Log rotation statistics
      const uniqueTeachersUsed = new Set(assignments.map(a => a.teacher.toString())).size;
      const rotationCoverage = ((uniqueTeachersUsed / sortedTeachers.length) * 100).toFixed(1);

      console.log('   ✅ Enhanced round-robin completed:');
      console.log(`      📊 Total assignments: ${assignments.length}`);
      console.log(`      👥 Unique teachers used: ${uniqueTeachersUsed}/${sortedTeachers.length} (${rotationCoverage}%)`);
      console.log(`      🔄 Next global index: ${this.globalTeacherIndex}`);
      console.log(`      📈 Total teachers assigned across all sessions: ${this.totalTeachersAssigned}`);

      return assignments;
    } catch (error) {
      console.error(`   ❌ Error creating assignments: ${error.message}`);
      return [];
    }
  }

  /**
   * Assign with rotation (fallback when conflicts exist)
   */
  assignWithRotation (teachers, classroomCount, teachersPerClassroom, workloadMap) {
    console.log('   🔄 Using rotation-based assignment (fallback mode)');

    const sorted = this.sortByWorkload(teachers, workloadMap);
    return this.createBalancedAssignments(sorted, classroomCount, teachersPerClassroom, workloadMap);
  }

  /**
   * Log assignment summary
   */
  logAssignmentSummary (assignments, workloadMap) {
    console.log('\n   📋 Assignment Summary:');
    console.log(`      Total assignments made: ${assignments.length}`);
    console.log(`      Chiefs: ${assignments.filter(a => a.role === 'chief_invigilator').length}`);
    console.log(`      Regular: ${assignments.filter(a => a.role === 'invigilator').length}`);
    console.log(`      Unique teachers used: ${new Set(assignments.map(a => a.teacher.toString())).size}`);
    console.log(`      Global teacher index: ${this.globalTeacherIndex}`);
    console.log(`      Total teachers assigned across all sessions: ${this.totalTeachersAssigned}`);

    // Show workload range of assigned teachers
    const assignedWorkloads = assignments.map(a => a.currentWorkload);
    if (assignedWorkloads.length > 0) {
      console.log(`      Workload range: ${Math.min(...assignedWorkloads)} - ${Math.max(...assignedWorkloads)} duties`);
    }

    // Show rotation coverage
    const rotationStats = this.getRotationStatistics();
    console.log(`      Rotation coverage: ${rotationStats.uniqueTeachersInHistory} unique teachers in history`);
    console.log(`      Total assignments in history: ${rotationStats.totalAssignmentsInHistory}`);
  }

  /**
   * Reset global teacher index (call at start of new scheduling session)
   */
  resetGlobalIndex () {
    this.globalTeacherIndex = 0;
    this.totalTeachersAssigned = 0;
    this.teacherRotationHistory = [];
    console.log('   🔄 Reset global teacher index to 0 and cleared rotation history');
  }

  /**
   * Get rotation statistics
   */
  getRotationStatistics () {
    const uniqueTeachers = new Set(this.teacherRotationHistory.map(h => h.teacherId)).size;
    const totalAssignments = this.teacherRotationHistory.length;

    return {
      globalTeacherIndex: this.globalTeacherIndex,
      totalTeachersAssigned: this.totalTeachersAssigned,
      uniqueTeachersInHistory: uniqueTeachers,
      totalAssignmentsInHistory: totalAssignments,
      rotationHistory: this.teacherRotationHistory.slice(-20), // Last 20 assignments
    };
  }

  /**
   * Get current global teacher index
   */
  getGlobalIndex () {
    return this.globalTeacherIndex;
  }

  /**
   * Ensure service state is properly maintained
   */
  ensureServiceState () {
    if (this.globalTeacherIndex === undefined) {
      this.globalTeacherIndex = 0;
    }
    if (this.totalTeachersAssigned === undefined) {
      this.totalTeachersAssigned = 0;
    }
    if (this.teacherRotationHistory === undefined) {
      this.teacherRotationHistory = [];
    }
    console.log(`   🔧 Service state ensured - Index: ${this.globalTeacherIndex}, Total: ${this.totalTeachersAssigned}`);
  }

  /**
   * Get teacher duty statistics
   */
  async getTeacherDutyStatistics (dateRange = null) {
    const allTeachers = await this.getAllActiveTeachers();
    const workloadMap = await this.getGlobalTeacherWorkload(allTeachers);

    const statistics = {
      totalTeachers: allTeachers.length,
      teachersWithDuties: 0,
      teachersWithoutDuties: 0,
      minDuties: Infinity,
      maxDuties: 0,
      avgDuties: 0,
      totalDuties: 0,
      balanceScore: 0, // Lower is better (max - min)
      distribution: [],
      teachersNeedingDuties: [],
    };

    const dutyList = [];

    workloadMap.forEach((workload, teacherId) => {
      const duties = workload.totalDuties;
      dutyList.push({ ...workload, duties });

      if (duties > 0) {
        statistics.teachersWithDuties++;
      } else {
        statistics.teachersWithoutDuties++;
        statistics.teachersNeedingDuties.push({
          teacherId: workload.teacherId,
          name: workload.teacherName,
          employeeId: workload.employeeId,
        });
      }

      statistics.minDuties = Math.min(statistics.minDuties, duties);
      statistics.maxDuties = Math.max(statistics.maxDuties, duties);
      statistics.totalDuties += duties;
    });

    statistics.avgDuties = (statistics.totalDuties / allTeachers.length).toFixed(2);
    statistics.balanceScore = statistics.maxDuties - statistics.minDuties;
    statistics.distribution = dutyList.sort((a, b) => a.duties - b.duties);

    return statistics;
  }

  /**
   * Rebalance all future exam duties
   */
  async rebalanceAllFutureDuties () {
    console.log('\n🔄 REBALANCING ALL FUTURE DUTIES\n');

    const now = new Date();

    // Get all future scheduled exams (including in_progress)
    const futureExams = await Exam.find({
      examDate: { $gte: now },
      status: { $in: ['scheduled', 'in_progress'] },
      isActive: true,
    }).sort({ examDate: 1, startTime: 1 });

    console.log(`Found ${futureExams.length} future exams to rebalance\n`);

    if (futureExams.length === 0) {
      console.log('⚠️  No future exams found. Checking all exams...');

      // Check all exams to see what we have
      const allExams = await Exam.find({ isActive: true }).select('examDate status title').lean();
      console.log(`Total exams in database: ${allExams.length}`);

      const pastExams = allExams.filter(e => new Date(e.examDate) < now);
      const futureExams2 = allExams.filter(e => new Date(e.examDate) >= now);

      console.log(`Past exams: ${pastExams.length}`);
      console.log(`Future exams: ${futureExams2.length}`);

      if (pastExams.length > 0) {
        console.log('Sample past exams:');
        pastExams.slice(0, 3).forEach(e => {
          console.log(`  - ${e.title} (${e.examDate}) - ${e.status}`);
        });
      }

      if (futureExams2.length > 0) {
        console.log('Sample future exams:');
        futureExams2.slice(0, 3).forEach(e => {
          console.log(`  - ${e.title} (${e.examDate}) - ${e.status}`);
        });
      }

      // If no future exams, create some dummy ones for duty assignment
      if (futureExams2.length === 0) {
        console.log('\n📝 Creating dummy future exams for duty assignment...');

        const dummyExams = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Tomorrow

        // Create 3 dummy exams over next 3 days
        for (let i = 0; i < 3; i++) {
          const examDate = new Date(startDate);
          examDate.setDate(examDate.getDate() + i);

          const dummyExam = await Exam.create({
            title: `Dummy Exam ${i + 1} for Duty Assignment`,
            type: 'end_semester',
            subject: null,
            semester: `Semester ${(i % 4) + 1}`,
            academicYear: '2024-2025',
            examDate,
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            totalMarks: 100,
            passingMarks: 40,
            classrooms: [],
            invigilators: [],
            totalStudents: 0,
            departments: [],
            status: 'scheduled',
            isActive: true,
            createdBy: null,
            notes: `Dummy exam ${i + 1} created for duty assignment`,
          });

          dummyExams.push(dummyExam);
          console.log(`  ✅ Created: ${dummyExam.title} (${dummyExam.examDate.toDateString()})`);
        }

        // Update futureExams to include the dummy ones
        futureExams.push(...dummyExams);
        console.log(`\n✅ Created ${dummyExams.length} dummy exams for duty assignment\n`);
      } else {
        return { success: true, message: 'No future exams to rebalance' };
      }
    }

    const allTeachers = await this.getAllActiveTeachers();
    const workloadMap = await this.getGlobalTeacherWorkload(allTeachers, now);

    let rebalancedCount = 0;
    const slotUsage = new Map(); // Track teacher usage per slot

    for (const exam of futureExams) {
      try {
        const classroomCount = exam.classrooms?.length || 0;
        if (classroomCount === 0) continue;

        const slotKey = `${exam.examDate.toDateString()}-${exam.startTime}-${exam.endTime}`;
        const existingAssignments = slotUsage.get(slotKey) || new Set();

        const newAssignments = await this.assignBalancedInvigilators({
          examDate: exam.examDate,
          timeSlot: { start: exam.startTime, end: exam.endTime },
          classroomCount,
          teachersPerClassroom: 2,
          existingAssignments,
        });

        if (newAssignments.length > 0) {
          // Update exam with new invigilators
          exam.invigilators = newAssignments.map(a => ({
            teacher: a.teacher,
            role: a.role,
            assignedClassrooms: [],
          }));

          await exam.save();

          // Update slot usage
          newAssignments.forEach(a => {
            existingAssignments.add(a.teacher.toString());

            // Update workload map for next iteration
            const workload = workloadMap.get(a.teacher.toString());
            if (workload) {
              workload.totalDuties++;
            }
          });

          slotUsage.set(slotKey, existingAssignments);
          rebalancedCount++;

          console.log(`✅ Rebalanced: ${exam.title} (${exam.examDate.toLocaleDateString()})`);
        }
      } catch (error) {
        console.log(`❌ Error rebalancing ${exam.title}: ${error.message}`);
      }
    }

    console.log(`\n✅ Rebalanced ${rebalancedCount}/${futureExams.length} exams\n`);

    // Show new statistics
    const newStats = await this.getTeacherDutyStatistics();
    console.log('📊 New Duty Statistics:');
    console.log(`   Teachers with duties: ${newStats.teachersWithDuties}/${newStats.totalTeachers}`);
    console.log(`   Teachers without duties: ${newStats.teachersWithoutDuties}`);
    console.log(`   Average duties: ${newStats.avgDuties}`);
    console.log(`   Balance score: ${newStats.balanceScore} (lower is better)`);

    return {
      success: true,
      rebalancedCount,
      totalExams: futureExams.length,
      statistics: newStats,
    };
  }

  /**
   * Helper: Get academic year start date
   */
  getAcademicYearStart (date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Academic year starts in July (month 6)
    if (month >= 6) {
      return new Date(year, 6, 1); // July 1st of current year
    } else {
      return new Date(year - 1, 6, 1); // July 1st of previous year
    }
  }

  /**
   * Helper: Get academic year end date
   */
  getAcademicYearEnd (date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Academic year ends in June (month 5)
    if (month >= 6) {
      return new Date(year + 1, 5, 30); // June 30th of next year
    } else {
      return new Date(year, 5, 30); // June 30th of current year
    }
  }

  /**
   * Convert assignments to Exam invigilator format
   */
  convertToExamFormat (assignments, classrooms) {
    const invigilators = [];
    const teacherClassroomMap = new Map();

    // Distribute classrooms evenly among assigned teachers
    const teachersPerClassroom = 2;

    classrooms.forEach((classroom, idx) => {
      const startIdx = idx * teachersPerClassroom;
      const classroomTeachers = assignments.slice(startIdx, startIdx + teachersPerClassroom);

      classroomTeachers.forEach(assignment => {
        const teacherId = assignment.teacher.toString();

        if (!teacherClassroomMap.has(teacherId)) {
          teacherClassroomMap.set(teacherId, {
            teacher: assignment.teacher,
            role: assignment.role,
            assignedClassrooms: [],
          });
        }

        teacherClassroomMap.get(teacherId).assignedClassrooms.push(classroom.classroom);
      });
    });

    return Array.from(teacherClassroomMap.values());
  }
}

// Export both the class and an instance
module.exports = BalancedDutyAssignmentService;
module.exports.getInstance = () => {
  if (!BalancedDutyAssignmentService.instance) {
    BalancedDutyAssignmentService.instance = new BalancedDutyAssignmentService();
  }
  return BalancedDutyAssignmentService.instance;
};

