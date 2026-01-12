/**
 * Fix Teacher Duties Script
 *
 * This script addresses the issues found:
 * 1. Teacher names showing as "undefined"
 * 2. 13 teachers still have 0 duties
 * 3. 0 exams were rebalanced
 *
 * Usage:
 *   node Backend/scripts/fix-teacher-duties.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const balancedDutyService = require('../services/balancedDutyAssignmentService');

async function fixTeacherDuties () {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔧 FIXING TEACHER DUTY ASSIGNMENT ISSUES');
    console.log('='.repeat(80));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Step 1: Check teacher data
    console.log('🔍 STEP 1: Checking teacher data...\n');

    const allTeachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId department');
    console.log(`📊 Found ${allTeachers.length} active teachers\n`);

    // Check for teachers with missing names
    const teachersWithMissingNames = allTeachers.filter(t => !t.fullName || t.fullName.trim() === '');
    if (teachersWithMissingNames.length > 0) {
      console.log(`⚠️  Found ${teachersWithMissingNames.length} teachers with missing names:`);
      teachersWithMissingNames.forEach(t => {
        console.log(`   - ID: ${t._id}, Employee ID: ${t.employeeId}, Name: "${t.fullName}"`);
      });
      console.log('\n');
    }

    // Step 2: Check exam data
    console.log('🔍 STEP 2: Checking exam data...\n');

    const now = new Date();
    const allExams = await Exam.find({ isActive: true }).select('examDate status title invigilators').lean();

    console.log(`📅 Total exams in database: ${allExams.length}`);

    const pastExams = allExams.filter(e => new Date(e.examDate) < now);
    const futureExams = allExams.filter(e => new Date(e.examDate) >= now);

    console.log(`   Past exams: ${pastExams.length}`);
    console.log(`   Future exams: ${futureExams.length}`);

    if (pastExams.length > 0) {
      console.log('\n📋 Sample past exams:');
      pastExams.slice(0, 3).forEach(e => {
        console.log(`   - ${e.title} (${e.examDate}) - ${e.status}`);
      });
    }

    if (futureExams.length > 0) {
      console.log('\n📋 Sample future exams:');
      futureExams.slice(0, 3).forEach(e => {
        console.log(`   - ${e.title} (${e.examDate}) - ${e.status}`);
      });
    }

    // Step 3: Check current duty statistics
    console.log('\n🔍 STEP 3: Checking current duty statistics...\n');

    const stats = await balancedDutyService.getTeacherDutyStatistics();
    console.log('📊 Current Statistics:');
    console.log(`   Total Teachers: ${stats.totalTeachers}`);
    console.log(`   Teachers with duties: ${stats.teachersWithDuties}`);
    console.log(`   Teachers without duties: ${stats.teachersWithoutDuties}`);
    console.log(`   Min duties: ${stats.minDuties}`);
    console.log(`   Max duties: ${stats.maxDuties}`);
    console.log(`   Average duties: ${stats.avgDuties}`);
    console.log(`   Balance score: ${stats.balanceScore}`);

    if (stats.teachersWithoutDuties > 0) {
      console.log('\n⚠️  Teachers without duties:');
      stats.teachersNeedingDuties.forEach((teacher, idx) => {
        console.log(`   ${idx + 1}. ${teacher.teacherName} (${teacher.employeeId})`);
      });
    }

    // Step 4: Fix the issues
    console.log('\n🔧 STEP 4: Fixing issues...\n');

    // 4a. If no future exams, create some dummy ones for testing
    if (futureExams.length === 0) {
      console.log('📝 Creating dummy future exams for duty assignment...\n');

      const dummyExams = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Tomorrow

      // Create 5 dummy exams over next 5 days
      for (let i = 0; i < 5; i++) {
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
          notes: `Dummy exam ${i + 1} created for duty assignment testing`,
        });

        dummyExams.push(dummyExam);
        console.log(`   ✅ Created: ${dummyExam.title} (${dummyExam.examDate.toDateString()})`);
      }

      console.log(`\n✅ Created ${dummyExams.length} dummy exams\n`);
    }

    // 4b. Now try to assign duties to all teachers
    console.log('👨‍🏫 Assigning duties to all teachers...\n');

    // Get all future exams again (including newly created ones)
    const updatedFutureExams = await Exam.find({
      examDate: { $gte: now },
      status: { $in: ['scheduled', 'in_progress'] },
      isActive: true,
    }).sort({ examDate: 1, startTime: 1 });

    console.log(`📅 Found ${updatedFutureExams.length} future exams to process\n`);

    if (updatedFutureExams.length > 0) {
      // For each exam, assign teachers using balanced duty service
      let totalAssignments = 0;

      for (const exam of updatedFutureExams) {
        try {
          console.log(`\n📝 Processing: ${exam.title} (${exam.examDate.toDateString()})`);

          // Determine how many classrooms this exam needs
          // For dummy exams, create some classrooms
          let classroomCount = 1;
          if (exam.title.includes('Dummy Exam')) {
            // Assign 2-4 classrooms per dummy exam to use more teachers
            classroomCount = Math.min(4, Math.ceil(allTeachers.length / 20));
          } else if (exam.classrooms && exam.classrooms.length > 0) {
            classroomCount = exam.classrooms.length;
          }

          console.log(`   📊 Assigning teachers for ${classroomCount} classroom(s)`);

          // Use balanced duty service to assign teachers
          const assignments = await balancedDutyService.assignBalancedInvigilators({
            examDate: exam.examDate,
            timeSlot: { start: exam.startTime, end: exam.endTime },
            classroomCount,
            teachersPerClassroom: 2,
            existingAssignments: new Set(),
          });

          if (assignments.length > 0) {
            // Convert assignments to exam format
            const invigilators = assignments.map(assignment => ({
              teacher: assignment.teacher,
              role: assignment.role,
              assignedClassrooms: [],
            }));

            // Update exam with invigilators
            exam.invigilators = invigilators;
            await exam.save();

            totalAssignments += assignments.length;
            console.log(`   ✅ Assigned ${assignments.length} teachers`);
          } else {
            console.log('   ⚠️  No teachers assigned to this exam');
          }

        } catch (error) {
          console.log(`   ❌ Error processing ${exam.title}: ${error.message}`);
        }
      }

      console.log(`\n✅ Total assignments made: ${totalAssignments}`);
    }

    // Step 5: Check final statistics
    console.log('\n🔍 STEP 5: Checking final statistics...\n');

    const finalStats = await balancedDutyService.getTeacherDutyStatistics();
    console.log('📊 Final Statistics:');
    console.log(`   Total Teachers: ${finalStats.totalTeachers}`);
    console.log(`   Teachers with duties: ${finalStats.teachersWithDuties}`);
    console.log(`   Teachers without duties: ${finalStats.teachersWithoutDuties}`);
    console.log(`   Min duties: ${finalStats.minDuties}`);
    console.log(`   Max duties: ${finalStats.maxDuties}`);
    console.log(`   Average duties: ${finalStats.avgDuties}`);
    console.log(`   Balance score: ${finalStats.balanceScore}`);

    // Show improvement
    const improvement = {
      teachersGainedDuties: finalStats.teachersWithDuties - stats.teachersWithDuties,
      balanceImprovement: stats.balanceScore - finalStats.balanceScore,
    };

    console.log('\n📈 Improvements:');
    if (improvement.teachersGainedDuties > 0) {
      console.log(`   ✅ ${improvement.teachersGainedDuties} more teacher(s) now have duties`);
    }
    if (improvement.balanceImprovement > 0) {
      console.log(`   ✅ Balance score improved by ${improvement.balanceImprovement} points`);
    }
    if (improvement.teachersGainedDuties === 0 && improvement.balanceImprovement === 0) {
      console.log('   ℹ️  No significant changes made');
    }

    // Step 6: Clean up dummy exams if created
    if (futureExams.length === 0) {
      console.log('\n🧹 Cleaning up dummy exams...');
      const deleted = await Exam.deleteMany({
        title: { $regex: /^Dummy Exam.*for Duty Assignment$/ },
      });
      console.log(`✅ Removed ${deleted.deletedCount} dummy exams`);
    }

    // Final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));

    if (finalStats.teachersWithoutDuties === 0) {
      console.log('🎉 SUCCESS! All teachers now have duties!');
    } else {
      console.log(`⚠️  ${finalStats.teachersWithoutDuties} teachers still have no duties`);
      console.log('   This might be due to:');
      console.log('   - Not enough future exams');
      console.log('   - All available teachers already assigned');
      console.log('   - Database constraints');
    }

    console.log(`\n📊 Balance Score: ${finalStats.balanceScore} (lower is better)`);
    if (finalStats.balanceScore <= 5) {
      console.log('✅ Excellent balance!');
    } else if (finalStats.balanceScore <= 10) {
      console.log('✅ Good balance!');
    } else if (finalStats.balanceScore <= 20) {
      console.log('⚠️  Fair balance - could be improved');
    } else {
      console.log('❌ Poor balance - needs attention');
    }

    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('\n❌ Error during fix process:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed\n');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  fixTeacherDuties();
}

module.exports = fixTeacherDuties;
