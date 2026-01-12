/**
 * Test Teacher Rotation Script
 *
 * Tests the balanced round-robin algorithm to ensure all teachers are rotated through
 */

const BalancedDutyAssignmentService = require('../services/balancedDutyAssignmentService');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');

async function testTeacherRotation () {
  console.log('🔄 Testing Teacher Rotation Algorithm\n');

  try {
    // Get the service instance
    const service = BalancedDutyAssignmentService.getInstance();

    // Reset for clean test
    service.resetGlobalIndex();
    console.log(`   Reset global index to: ${service.getGlobalIndex()}\n`);

    // Get all active teachers
    const teachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId department').lean();
    console.log(`   Found ${teachers.length} active teachers\n`);

    if (teachers.length === 0) {
      console.log('   ❌ No active teachers found!');
      return;
    }

    // Test multiple rounds of assignment
    const testRounds = 5;
    const classroomsPerRound = 3; // 3 classrooms = 6 teachers needed per round
    const allAssignments = [];

    console.log(`   Testing ${testRounds} rounds with ${classroomsPerRound} classrooms each (${classroomsPerRound * 2} teachers per round)\n`);

    for (let round = 1; round <= testRounds; round++) {
      console.log(`📋 Round ${round}:`);

      const roundAssignments = await service.assignBalancedInvigilators({
        examDate: new Date(),
        timeSlot: { start: '10:00', end: '13:00' },
        classroomCount: classroomsPerRound,
        teachersPerClassroom: 2,
        existingAssignments: new Set(),
      });

      if (roundAssignments.length > 0) {
        allAssignments.push(...roundAssignments);

        // Show which teachers were assigned in this round
        const teacherNames = roundAssignments.map(a => a.teacherName);
        console.log(`   Teachers assigned: ${teacherNames.join(', ')}`);
        console.log(`   Global index after round: ${service.getGlobalIndex()}\n`);
      } else {
        console.log(`   ❌ No assignments made in round ${round}\n`);
      }
    }

    // Analyze rotation results
    console.log('📊 Rotation Analysis:');
    console.log(`   Total assignments made: ${allAssignments.length}`);

    const uniqueTeachers = new Set(allAssignments.map(a => a.teacher.toString()));
    console.log(`   Unique teachers used: ${uniqueTeachers.size}/${teachers.length}`);

    const rotationCoverage = ((uniqueTeachers.size / teachers.length) * 100).toFixed(1);
    console.log(`   Rotation coverage: ${rotationCoverage}%`);

    // Show teacher assignment counts
    const teacherCounts = {};
    allAssignments.forEach(a => {
      const teacherId = a.teacher.toString();
      teacherCounts[teacherId] = (teacherCounts[teacherId] || 0) + 1;
    });

    console.log('\n   Teacher assignment counts:');
    Object.entries(teacherCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([teacherId, count]) => {
        const teacher = teachers.find(t => t._id.toString() === teacherId);
        const name = teacher ? teacher.fullName : 'Unknown';
        console.log(`      ${name}: ${count} assignments`);
      });

    // Show rotation statistics
    const rotationStats = service.getRotationStatistics();
    console.log('\n   Service rotation statistics:');
    console.log(`      Global teacher index: ${rotationStats.globalTeacherIndex}`);
    console.log(`      Total teachers assigned: ${rotationStats.totalTeachersAssigned}`);
    console.log(`      Unique teachers in history: ${rotationStats.uniqueTeachersInHistory}`);
    console.log(`      Total assignments in history: ${rotationStats.totalAssignmentsInHistory}`);

    // Check if all teachers were used
    if (uniqueTeachers.size === teachers.length) {
      console.log('\n   ✅ SUCCESS: All teachers were rotated through!');
    } else {
      console.log(`\n   ⚠️  PARTIAL: Only ${uniqueTeachers.size}/${teachers.length} teachers were used`);

      // Show which teachers weren't used
      const unusedTeachers = teachers.filter(t => !uniqueTeachers.has(t._id.toString()));
      console.log('   Unused teachers:');
      unusedTeachers.forEach(t => {
        console.log(`      - ${t.fullName} (${t.employeeId})`);
      });
    }

  } catch (error) {
    console.error('   ❌ Error testing rotation:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testTeacherRotation()
    .then(() => {
      console.log('\n✅ Rotation test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = testTeacherRotation;
