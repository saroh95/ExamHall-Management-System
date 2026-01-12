/**
 * Fix Teacher Assignments Script
 *
 * This script fixes teacher assignment issues in the exam scheduling system
 *
 * Usage:
 *   node Backend/scripts/fix-teacher-assignments.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixTeacherAssignments () {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔧 FIXING TEACHER ASSIGNMENTS');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Step 1: Check teachers
    console.log('🔍 Step 1: Checking teachers...');
    const Teacher = require('../models/Teacher');
    const teachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId department');
    console.log(`   Found ${teachers.length} active teachers`);

    if (teachers.length === 0) {
      console.log('❌ No active teachers found! Please add teachers first.');
      return;
    }

    // Show sample teachers
    console.log('\n📋 Sample teachers:');
    teachers.slice(0, 5).forEach((teacher, idx) => {
      console.log(`   ${idx + 1}. ${teacher.fullName} (${teacher.employeeId})`);
    });

    // Step 2: Check exams without invigilators
    console.log('\n🔍 Step 2: Checking exams...');
    const Exam = require('../models/Exam');
    const examsWithoutInvigilators = await Exam.find({
      isActive: true,
      $or: [
        { invigilators: { $exists: false } },
        { invigilators: { $size: 0 } },
      ],
    }).select('_id title examDate startTime endTime classrooms');

    console.log(`   Found ${examsWithoutInvigilators.length} exams without invigilators`);

    if (examsWithoutInvigilators.length === 0) {
      console.log('✅ All exams already have invigilators assigned');
      return;
    }

    // Step 3: Fix exams without invigilators
    console.log('\n🔧 Step 3: Fixing exams without invigilators...');

    let fixedCount = 0;
    for (const exam of examsWithoutInvigilators) {
      try {
        // Get classroom count
        const classroomCount = exam.classrooms ? exam.classrooms.length : 1;

        // Assign teachers (2 per classroom)
        const teachersNeeded = classroomCount * 2;
        const selectedTeachers = teachers.slice(0, teachersNeeded);

        if (selectedTeachers.length < teachersNeeded) {
          console.log(`   ⚠️  Not enough teachers for exam ${exam._id} (needed: ${teachersNeeded}, available: ${selectedTeachers.length})`);
          continue;
        }

        // Create invigilator assignments
        const invigilators = [];
        for (let i = 0; i < classroomCount; i++) {
          const startIdx = i * 2;
          const classroomTeachers = selectedTeachers.slice(startIdx, startIdx + 2);

          classroomTeachers.forEach((teacher, idx) => {
            invigilators.push({
              teacher: teacher._id,
              role: idx === 0 ? 'chief_invigilator' : 'invigilator',
              assignedClassrooms: exam.classrooms && exam.classrooms[i] ? [exam.classrooms[i].classroom] : [],
            });
          });
        }

        // Update exam with invigilators
        await Exam.findByIdAndUpdate(exam._id, {
          invigilators,
        });

        console.log(`   ✅ Fixed exam: ${exam.title} (${invigilators.length} invigilators)`);
        fixedCount++;

      } catch (error) {
        console.error(`   ❌ Error fixing exam ${exam._id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} out of ${examsWithoutInvigilators.length} exams`);

    // Step 4: Verify fixes
    console.log('\n🔍 Step 4: Verifying fixes...');
    const remainingExamsWithoutInvigilators = await Exam.find({
      isActive: true,
      $or: [
        { invigilators: { $exists: false } },
        { invigilators: { $size: 0 } },
      ],
    }).countDocuments();

    console.log(`   Remaining exams without invigilators: ${remainingExamsWithoutInvigilators}`);

    if (remainingExamsWithoutInvigilators === 0) {
      console.log('✅ All exams now have invigilators assigned!');
    } else {
      console.log('⚠️  Some exams still need manual invigilator assignment');
    }

    // Step 5: Test teacher assignment service
    console.log('\n🧪 Step 5: Testing teacher assignment service...');
    try {
      const balancedDutyService = require('../services/balancedDutyAssignmentService');

      const testParams = {
        examDate: new Date(),
        timeSlot: { start: '10:00', end: '13:00' },
        classroomCount: 2,
        teachersPerClassroom: 2,
        existingAssignments: new Set(),
      };

      const testAssignments = await balancedDutyService.assignBalancedInvigilators(testParams);
      console.log(`   Test assignment result: ${testAssignments.length} teachers assigned`);

      if (testAssignments.length > 0) {
        console.log('✅ Teacher assignment service is working');
      } else {
        console.log('⚠️  Teacher assignment service returned no assignments');
      }
    } catch (error) {
      console.error(`   ❌ Error testing assignment service: ${error.message}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎯 TEACHER ASSIGNMENT FIX COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error in fix script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  fixTeacherAssignments();
}

module.exports = fixTeacherAssignments;
