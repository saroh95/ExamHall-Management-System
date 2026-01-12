/**
 * Enrollment-Based Exam Scheduling Routes
 *
 * API endpoints for intelligent exam scheduling based on student enrollments
 */

const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const enrollmentScheduler = require('../services/enrollmentBasedScheduler');
const Exam = require('../models/Exam');

// @route   POST /api/enrollment-exams/schedule
// @desc    Create exam schedule based on actual enrollments
// @access  Private (Admin)
router.post('/schedule', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    console.log('\n🚀 Starting Enrollment-Based Exam Scheduling...\n');

    const {
      examType,
      semesters,
      departments,
      dateRange,
      timeSlots,
      seatingStrategy,
      academicYear,
    } = req.body;

    // Validate inputs
    if (!examType || !semesters || !dateRange || !timeSlots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: examType, semesters, dateRange, timeSlots',
      });
    }

    console.log('📋 Input Parameters:');
    console.log('   Exam Type:', examType);
    console.log('   Semesters:', semesters);
    console.log('   Departments:', departments);
    console.log('   Date Range:', dateRange);
    console.log('   Time Slots:', timeSlots);
    console.log('   Seating Strategy:', seatingStrategy || 'alternate');

    // Step 1: Get subjects with enrollments
    const subjectsWithEnrollments = await enrollmentScheduler.getSubjectsWithEnrollments({
      semesters,
      departments,
      academicYear: academicYear || enrollmentScheduler.getCurrentAcademicYear(),
    });

    if (subjectsWithEnrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subjects found with student enrollments for the selected criteria',
      });
    }

    console.log(`\n✅ Found ${subjectsWithEnrollments.length} subjects to schedule\n`);

    // Step 2: Generate schedule
    const examSchedule = [];
    const scheduledExams = [];

    // Parse date range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const availableDates = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip Sundays (or customize based on your needs)
      if (date.getDay() !== 0) {
        availableDates.push(new Date(date));
      }
    }

    console.log(`📅 Available exam dates: ${availableDates.length}`);

    // Schedule subjects across dates and time slots
    let dateIndex = 0;
    let timeSlotIndex = 0;

    for (const subjectData of subjectsWithEnrollments) {
      if (dateIndex >= availableDates.length) {
        console.log('⚠️  Warning: Ran out of available dates');
        break;
      }

      const examDate = availableDates[dateIndex];
      const timeSlot = timeSlots[timeSlotIndex];

      console.log(`\n📝 Scheduling: ${subjectData.subject.code} - ${subjectData.subject.name}`);
      console.log(`   Date: ${examDate.toLocaleDateString()}`);
      console.log(`   Time: ${timeSlot.start} - ${timeSlot.end}`);
      console.log(`   Students: ${subjectData.totalStudents}`);

      try {
        // Step 3: Calculate classrooms needed
        const classroomAllocations = await enrollmentScheduler.calculateClassroomsNeeded(
          subjectData.totalStudents,
          examDate,
          timeSlot,
        );

        if (classroomAllocations.length === 0) {
          console.log('   ❌ No available classrooms - skipping');
          continue;
        }

        // Step 4: Distribute students across classrooms
        const studentDistribution = enrollmentScheduler.distributeStudentsAcrossClassrooms(
          subjectData.students,
          classroomAllocations,
        );

        // Step 5: Generate seating arrangements
        const classroomsWithSeating = studentDistribution.map(distribution => {
          const seatingArrangement = enrollmentScheduler.generateSeatingArrangement(
            distribution.assignedStudents,
            distribution.classroom,
            seatingStrategy || 'alternate',
          );

          return {
            classroom: distribution.classroom._id,
            assignedStudents: distribution.assignedStudents.map(s => s._id),
            seatingArrangement,
          };
        });

        // Step 6: Assign invigilators
        const invigilators = await enrollmentScheduler.assignInvigilators(
          examDate,
          timeSlot,
          classroomsWithSeating.length,
        );

        // Distribute invigilators across classrooms
        invigilators.forEach((inv, index) => {
          const classroomIndex = index % classroomsWithSeating.length;
          inv.assignedClassrooms = [classroomsWithSeating[classroomIndex].classroom];
        });

        // Step 7: Create exam document
        const exam = await Exam.create({
          title: `${examType} - ${subjectData.subject.name}`,
          subject: subjectData.subject._id,
          type: examType === 'mid_semester' ? 'mid_semester' : 'end_semester',
          semester: `Semester ${subjectData.semesterId}`,
          academicYear: academicYear || enrollmentScheduler.getCurrentAcademicYear(),
          examDate,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          duration: calculateDuration(timeSlot.start, timeSlot.end),
          totalMarks: examType === 'mid_semester' ? 40 : 80,
          passingMarks: examType === 'mid_semester' ? 16 : 32,
          departments: subjectData.departments,
          classrooms: classroomsWithSeating,
          invigilators,
          totalStudents: subjectData.totalStudents,
          totalClassrooms: classroomsWithSeating.length,
          totalInvigilators: invigilators.length,
          status: 'scheduled',
          isActive: true,
          createdBy: req.user._id,
          notes: `Auto-scheduled based on enrollment data. ${subjectData.totalStudents} students enrolled.`,
        });

        scheduledExams.push(exam);

        examSchedule.push({
          subject: {
            _id: subjectData.subject._id,
            code: subjectData.subject.code,
            name: subjectData.subject.name,
            semester: subjectData.semesterId,
          },
          examId: exam._id,
          date: examDate,
          timeSlot: `${timeSlot.start} - ${timeSlot.end}`,
          totalStudents: subjectData.totalStudents,
          classrooms: classroomsWithSeating.length,
          invigilators: invigilators.length,
        });

        console.log('   ✅ Scheduled successfully!');
        console.log(`      Classrooms: ${classroomsWithSeating.length}`);
        console.log(`      Invigilators: ${invigilators.length}`);

      } catch (error) {
        console.log(`   ❌ Error scheduling: ${error.message}`);
        continue;
      }

      // Move to next time slot/date
      timeSlotIndex++;
      if (timeSlotIndex >= timeSlots.length) {
        timeSlotIndex = 0;
        dateIndex++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SCHEDULING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Subjects: ${subjectsWithEnrollments.length}`);
    console.log(`Successfully Scheduled: ${scheduledExams.length}`);
    console.log(`Total Students: ${scheduledExams.reduce((sum, e) => sum + e.totalStudents, 0)}`);
    console.log(`Total Classrooms: ${scheduledExams.reduce((sum, e) => sum + e.totalClassrooms, 0)}`);
    console.log(`Total Invigilators: ${scheduledExams.reduce((sum, e) => sum + e.totalInvigilators, 0)}`);
    console.log('='.repeat(60));

    res.status(201).json({
      success: true,
      message: `Successfully scheduled ${scheduledExams.length} exams`,
      data: {
        examsScheduled: scheduledExams.length,
        totalStudents: scheduledExams.reduce((sum, e) => sum + e.totalStudents, 0),
        totalClassrooms: scheduledExams.reduce((sum, e) => sum + e.totalClassrooms, 0),
        totalInvigilators: scheduledExams.reduce((sum, e) => sum + e.totalInvigilators, 0),
        schedule: examSchedule,
        exams: scheduledExams,
      },
    });

  } catch (error) {
    console.error('\n❌ Error in enrollment-based scheduling:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating enrollment-based exam schedule',
      error: error.message,
    });
  }
});

// @route   GET /api/enrollment-exams/preview
// @desc    Preview subjects and student counts before scheduling
// @access  Private (Admin)
router.post('/preview', protect, checkPermission('create_exam'), async (req, res) => {
  try {
    const { semesters, departments, academicYear } = req.body;

    const subjectsWithEnrollments = await enrollmentScheduler.getSubjectsWithEnrollments({
      semesters,
      departments,
      academicYear,
    });

    const preview = subjectsWithEnrollments.map(data => ({
      subject: {
        _id: data.subject._id,
        code: data.subject.code,
        name: data.subject.name,
        semester: data.semesterId,
        type: data.subject.type,
      },
      totalStudents: data.totalStudents,
      departments: data.departments.length,
      estimatedClassrooms: Math.ceil(data.totalStudents / 36), // 60% of 60-seat classroom
    }));

    const stats = {
      totalSubjects: preview.length,
      totalStudents: preview.reduce((sum, s) => sum + s.totalStudents, 0),
      estimatedClassrooms: preview.reduce((sum, s) => sum + s.estimatedClassrooms, 0),
      bySemester: {},
    };

    // Group by semester
    preview.forEach(item => {
      const sem = item.subject.semester;
      if (!stats.bySemester[sem]) {
        stats.bySemester[sem] = { subjects: 0, students: 0 };
      }
      stats.bySemester[sem].subjects++;
      stats.bySemester[sem].students += item.totalStudents;
    });

    res.json({
      success: true,
      data: {
        stats,
        subjects: preview,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating preview',
      error: error.message,
    });
  }
});

// @route   GET /api/enrollment-exams/:examId/details
// @desc    Get detailed exam information with seating arrangement
// @access  Private
router.get('/:examId/details', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('subject', 'code name semesterId type')
      .populate('departments', 'name code')
      .populate({
        path: 'classrooms.classroom',
        select: 'name building floor capacity layout',
      })
      .populate({
        path: 'classrooms.assignedStudents',
        select: 'scholarId fullName department semester',
        populate: { path: 'department', select: 'name code' },
      })
      .populate({
        path: 'invigilators.teacher',
        select: 'name employeeId department',
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    res.json({
      success: true,
      data: exam,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exam details',
      error: error.message,
    });
  }
});

// Helper function to calculate duration
function calculateDuration (startTime, endTime) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return (end - start) / 60; // Duration in minutes
}

function parseTime (timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;

