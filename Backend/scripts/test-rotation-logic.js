/**
 * Test Rotation Logic Script
 *
 * Tests the balanced round-robin algorithm logic without database access
 */

const BalancedDutyAssignmentService = require('../services/balancedDutyAssignmentService');

async function testRotationLogic () {
  console.log('🔄 Testing Teacher Rotation Logic (No Database)\n');

  try {
    // Get the service instance
    const service = BalancedDutyAssignmentService.getInstance();

    // Reset for clean test
    service.resetGlobalIndex();
    console.log(`   Reset global index to: ${service.getGlobalIndex()}\n`);

    // Create mock teachers
    const mockTeachers = [
      { _id: '1', fullName: 'Teacher 1', employeeId: 'T001', department: 'CSE' },
      { _id: '2', fullName: 'Teacher 2', employeeId: 'T002', department: 'CSE' },
      { _id: '3', fullName: 'Teacher 3', employeeId: 'T003', department: 'ECE' },
      { _id: '4', fullName: 'Teacher 4', employeeId: 'T004', department: 'ECE' },
      { _id: '5', fullName: 'Teacher 5', employeeId: 'T005', department: 'ME' },
      { _id: '6', fullName: 'Teacher 6', employeeId: 'T006', department: 'ME' },
      { _id: '7', fullName: 'Teacher 7', employeeId: 'T007', department: 'CE' },
      { _id: '8', fullName: 'Teacher 8', employeeId: 'T008', department: 'CE' },
    ];

    console.log(`   Created ${mockTeachers.length} mock teachers\n`);

    // Test multiple rounds of assignment
    const testRounds = 4;
    const classroomsPerRound = 2; // 2 classrooms = 4 teachers needed per round
    const allAssignments = [];

    console.log(`   Testing ${testRounds} rounds with ${classroomsPerRound} classrooms each (${classroomsPerRound * 2} teachers per round)\n`);

    for (let round = 1; round <= testRounds; round++) {
      console.log(`📋 Round ${round}:`);

      // Create mock workload map
      const workloadMap = new Map();
      mockTeachers.forEach(teacher => {
        workloadMap.set(teacher._id, {
          teacherId: teacher._id,
          teacherName: teacher.fullName,
          employeeId: teacher.employeeId,
          totalDuties: 0,
          duties: [],
        });
      });

      // Test the createBalancedAssignments method directly
      const roundAssignments = service.createBalancedAssignments(
        mockTeachers,
        classroomsPerRound,
        2, // teachersPerClassroom
        workloadMap,
      );

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
    console.log(`   Unique teachers used: ${uniqueTeachers.size}/${mockTeachers.length}`);

    const rotationCoverage = ((uniqueTeachers.size / mockTeachers.length) * 100).toFixed(1);
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
        const teacher = mockTeachers.find(t => t._id.toString() === teacherId);
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
    if (uniqueTeachers.size === mockTeachers.length) {
      console.log('\n   ✅ SUCCESS: All teachers were rotated through!');
    } else {
      console.log(`\n   ⚠️  PARTIAL: Only ${uniqueTeachers.size}/${mockTeachers.length} teachers were used`);

      // Show which teachers weren't used
      const unusedTeachers = mockTeachers.filter(t => !uniqueTeachers.has(t._id.toString()));
      console.log('   Unused teachers:');
      unusedTeachers.forEach(t => {
        console.log(`      - ${t.fullName} (${t.employeeId})`);
      });
    }

    // Test the round-robin pattern
    console.log('\n🔄 Round-Robin Pattern Analysis:');
    const assignmentOrder = allAssignments.map(a => a.teacherName);
    console.log(`   Assignment order: ${assignmentOrder.join(' → ')}`);

    // Check if the pattern is truly round-robin
    let isRoundRobin = true;
    for (let i = 0; i < allAssignments.length; i++) {
      const expectedIndex = i % mockTeachers.length;
      const actualTeacher = allAssignments[i].teacher.toString();
      const expectedTeacher = mockTeachers[expectedIndex]._id.toString();

      if (actualTeacher !== expectedTeacher) {
        isRoundRobin = false;
        break;
      }
    }

    if (isRoundRobin) {
      console.log('   ✅ Round-robin pattern is correct!');
    } else {
      console.log('   ❌ Round-robin pattern is incorrect!');
    }

  } catch (error) {
    console.error('   ❌ Error testing rotation:', error.message);
    console.error('   Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testRotationLogic()
    .then(() => {
      console.log('\n✅ Rotation logic test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = testRotationLogic;
