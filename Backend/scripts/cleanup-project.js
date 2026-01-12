/**
 * Project Cleanup Script
 *
 * Removes all unnecessary files that aren't connected to the frontend/backend app
 *
 * Usage:
 *   node Backend/scripts/cleanup-project.js
 */

const fs = require('fs');
const path = require('path');

// Files to remove (relative to project root)
const filesToRemove = [
  // Documentation files in root
  'ADVANCED_SCHEDULER_GUIDE.md',
  'API_TIMEOUT_FIX.md',
  'AUTH_DEBUG_GUIDE.md',
  'AUTHENTICATION_SYSTEM.md',
  'AUTO_ENROLLMENT_FIX.md',
  'BALANCED_TEACHER_DUTY_SYSTEM.md',
  'BATCH_CREDENTIALS_FIX.md',
  'BEFORE_AFTER_COMPARISON.md',
  'CE103_CE104_CS101_CS102_FIXED.md',
  'CHECK_ENROLLMENTS_INSTRUCTIONS.md',
  'CLASSROOM_CONFLICT_FIXES.md',
  'COMPLETE_SEATING_SYSTEM_GUIDE.md',
  'COMPLETE_SOLUTION_GUIDE.md',
  'COMPLETE_SYSTEM_FIXES.md',
  'COMPREHENSIVE_SEATING_FIX_FINAL.md',
  'CONSTANTS_ALIGNMENT.md',
  'CRASH_FIX_GUIDE.md',
  'CRASH_FIXED_SUMMARY.md',
  'DASHBOARD_SEATING_ALL_DEPARTMENTS_FIX.md',
  'DASHBOARD_UPCOMING_EXAMS_FIX.md',
  'DEBUG_ZERO_EXAMS.md',
  'DEPARTMENT_FIRST_PERMANENT_SEATING.md',
  'DEPARTMENT_WISE_SEATING_UPDATE.md',
  'EI_CORE_ELECTIVE_ENROLLMENT_FIX.md',
  'EI_ENROLLMENT_COMPLETE_FIX.md',
  'EI_ENROLLMENT_FIX_SUMMARY.md',
  'EI2_EIE_ENROLLMENT_FIX.md',
  'ELECTIVE_ENROLLMENT_FIX_SUMMARY.md',
  'ELECTIVE_SYSTEM_PRIORITY_BASED.md',
  'ENHANCED_UNIFIED_SCHEDULER_GUIDE.md',
  'ENROLLMENT_COMPREHENSIVE_FIX_SUMMARY.md',
  'ENROLLMENT_FIX_INSTRUCTIONS.md',
  'ENROLLMENT_FIX_VISUAL_GUIDE.md',
  'ENROLLMENT_FIXES_COMPREHENSIVE.md',
  'ENROLLMENT_FIXES_SUMMARY.md',
  'ENROLLMENT_FIXES.md',
  'ENROLLMENT_ISSUES_FIX_GUIDE.md',
  'ENROLLMENT_ISSUES_RESOLUTION_SUMMARY.md',
  'ENROLLMENT_LOGIC_FIX.md',
  'ENROLLMENT_PAGE_FEATURES.md',
  'ENROLLMENT_SUBJECT_ISSUES_FIX_SUMMARY.md',
  'ENROLLMENT_SYSTEM_COMPLETE_FIX.md',
  'ENROLLMENT_SYSTEM_COMPLETE.md',
  'EXAM_SCHEDULER_ANALYSIS.md',
  'EXAM_SCHEDULING_IMPROVEMENTS.md',
  'FINAL_FIX_SUMMARY.md',
  'FINAL_IMPLEMENTATION_SUMMARY.md',
  'FINAL_SEATING_FIX_SEPARATE_EXAMS.md',
  'FINAL_SUMMARY_FOR_USER.md',
  'FIRE_AND_FORGET_EMAIL_FIX.md',
  'FIX_TEACHER_DUTY_ISSUES.md',
  'FIX_UNKNOWN_TEACHERS.md',
  'FIXED_ERRORS.md',
  'FIXED_SCHEDULER_ISSUE.md',
  'FIXES_SUMMARY.md',
  'HOW_TO_USE_ADVANCED_SCHEDULER.txt',
  'IMPLEMENTATION_CHECKLIST.md',
  'IMPLEMENTATION_SUMMARY.md',
  'INTELLIGENT_PARALLEL_SCHEDULER_GUIDE.md',
  'INVIGILATOR_CONFLICT_FINAL_RESOLUTION.md',
  'INVIGILATOR_CONFLICT_RESOLUTION.md',
  'INVIGILATOR_NAMES_FIX.md',
  'INVIGILATOR_NAMES_FIXED.md',
  'NOTIFICATIONS_UPDATE_SUMMARY.md',
  'NOTIFY_STUDENTS_SIMPLE_GUIDE.md',
  'NOTIFY_STUDENTS_WITH_ATTACHMENTS_GUIDE.md',
  'PREVIEW_LOADING_FIX.md',
  'QUICK_FIX_SUMMARY.md',
  'QUICK_FIX_TEACHERS.md',
  'QUICK_START_EXAM_SCHEDULING.md',
  'QUICK_START_PARALLEL_SCHEDULER.md',
  'QUICK_START_SCHEDULING.md',
  'QUICK_START_UNIFIED_SCHEDULER.md',
  'QUICK_UPDATE_SUMMARY.md',
  'README_AUTO_ENROLLMENT.md',
  'README_FULL.md',
  'SCHEDULER_COMPARISON.md',
  'SCHEDULER_INTEGRATION_SUMMARY.md',
  'SCHEDULER_QUICK_START.md',
  'SCHEDULING_FIXED_COMPLETE.md',
  'SCREENSHOT_FORMAT_GUIDE.md',
  'SEATING_CONFLICT_FIXES.md',
  'SEATING_DUPLICATE_ROOM_FIX.md',
  'SEATING_VIEW_SUBJECT_COLUMN_FIX.md',
  'SEMESTER_4_ENROLLMENT_FIX.md',
  'SEMESTER_FORMAT_FIX.md',
  'SEND_CREDENTIALS_TIMEOUT_FIX.md',
  'SETTINGS_ROLE_ACCESS_FIX.md',
  'SIMPLIFIED_STUDENT_NOTIFICATIONS.md',
  'STRING_SHAREDWITH_FIX.md',
  'STUDENT_NOTIFICATIONS_GUIDE.md',
  'STUDENT_REGISTRATION_CONSTANTS.md',
  'STUDENT_TEACHER_LOGIN_FIXED.md',
  'STUDENT_TEACHER_PROFILE_SETTINGS.md',
  'SUBJECT_LOADING_FIX.md',
  'SUBJECT_REUPLOAD_INSTRUCTIONS.md',
  'subjects_fixes_summary.md',
  'SYSTEM_CONFIRMATION.md',
  'SYSTEM_WORKFLOW.md',
  'TEACHER_DUTY_IMPLEMENTATION_SUMMARY.md',
  'TEACHER_DUTY_QUICK_START.md',
  'TEACHER_NAMES_FINAL_FIX.md',
  'TEACHER_SUBJECT_IMPROVEMENTS.md',
  'TESTING_CHECKLIST.md',
  'TIME_FORMATTING_UPDATE.md',
  'TIMETABLE_FIX_GUIDE.md',
  'TIMETABLE_FORMAT_UPDATE.md',
  'TROUBLESHOOTING_UNIFIED_SCHEDULER.md',
  'UNIFIED_EXAM_SCHEDULER_GUIDE.md',
  'UNIFIED_EXAM_SCHEDULER_IMPLEMENTATION.md',
  'UNIFIED_SCHEDULER_FEATURES.md',
  'UNIFIED_SCHEDULER_PERFORMANCE_OPTIMIZATION.md',
  'UNIFIED_SCHEDULER_USER_GUIDE.md',
  'YOUR_REQUIREMENT_VS_SYSTEM.md',
  'ZERO_EXAMS_FIX_GUIDE.md',
  'CLEANUP_PLAN.md',

  // CSV files in root
  'CORRECTED_SUBJECTS_SEMESTER_1_2.csv',
  'subjects_list_fixed.csv',
  'subjects_with_electives.csv',

  // Backend test/debug scripts
  'Backend/add-sample-teachers.js',
  'Backend/auto-fix-subjects-after-upload.js',
  'Backend/autoEnrollElectives.js',
  'Backend/check-cse-electives.js',
  'Backend/check-current-state.js',
  'Backend/check-database.js',
  'Backend/check-ei-core-electives.js',
  'Backend/check-electives-in-db.js',
  'Backend/check-enrollment-details.js',
  'Backend/check-enrollment-distribution.js',
  'Backend/check-exam-invigilators.js',
  'Backend/check-specific-teacher.js',
  'Backend/check-student-count.js',
  'Backend/check-students.js',
  'Backend/check-subject-api-response.js',
  'Backend/check-subject-flags.js',
  'Backend/check-subjects.js',
  'Backend/check-teachers.js',
  'Backend/checkEnrollments.js',
  'Backend/clear-and-reenroll-electives.js',
  'Backend/comprehensive-enrollment-fix-v2.js',
  'Backend/comprehensive-enrollment-fix-v3.js',
  'Backend/comprehensive-enrollment-fix.js',
  'Backend/createAdmin.js',
  'Backend/createAdminUser.js',
  'Backend/debug-database.js',
  'Backend/debug-schedule-request.js',
  'Backend/diagnose-ei-enrollment.js',
  'Backend/diagnose-electives.js',
  'Backend/diagnose-enrollment.js',
  'Backend/diagnose-student-login.js',
  'Backend/diagnoseSchedulerIssue.js',
  'Backend/enrollAllStudents.js',
  'Backend/export-subjects-to-csv.js',
  'Backend/final-verification.js',
  'Backend/fix-all-subjects.js',
  'Backend/fix-ei-enrollment.js',
  'Backend/fix-elective-logic-reversal.js',
  'Backend/fix-elective-types.js',
  'Backend/fix-enrollment-final.js',
  'Backend/fix-enrollment-issues-comprehensive.js',
  'Backend/fix-enrollment-system.js',
  'Backend/fix-sharewith-enrollments.js',
  'Backend/fix-subject-sharedwith.js',
  'Backend/fix-swapped-electives.js',
  'Backend/fixAcademicYear.js',
  'Backend/quick-check-enrollment.js',
  'Backend/quick-test-enrollment-scheduling.js',
  'Backend/resetDatabase.js',
  'Backend/restart-server.js',
  'Backend/seed-1920-students-fixed.js',
  'Backend/seed-1920-students.js',
  'Backend/seed-simple-students.js',
  'Backend/seedClassrooms.js',
  'Backend/seedComprehensiveData.js',
  'Backend/seedData.js',
  'Backend/seedFresh.js',
  'Backend/seedInvigilators.js',
  'Backend/seedStudents.js',
  'Backend/show-distribution-simple.js',
  'Backend/sync-subject-type-fields.js',
  'Backend/test-1920-with-debug.js',
  'Backend/test-api-population.js',
  'Backend/test-bulk-upload-sample.csv',
  'Backend/test-corrected-enrollment-fixes.js',
  'Backend/test-eie-check.csv',
  'Backend/test-elective-enrollment.js',
  'Backend/test-email-final.js',
  'Backend/test-endpoints.js',
  'Backend/test-enrollment-based-scheduling.js',
  'Backend/test-enrollment-fixes-corrected.js',
  'Backend/test-enrollment-fixes.js',
  'Backend/test-enrollment-simple.js',
  'Backend/test-enrollment-system.js',
  'Backend/test-frontend-schedule.js',
  'Backend/test-new-scheduler.js',
  'Backend/test-schedule-debug.js',
  'Backend/test-schedule-endpoint.js',
  'Backend/test-schedule-generation.js',
  'Backend/test-simple-insert.js',
  'Backend/test-small-batches.js',
  'Backend/test-student-api.js',
  'Backend/test-student-format.js',
  'Backend/test-students.js',
  'Backend/test-subject-data.js',
  'Backend/test-upload-1920.js',
  'Backend/testSchedulerAPI.js',
  'Backend/update-app-password.js',
  'Backend/update-env.js',
  'Backend/update-subjects-structure.js',
  'Backend/upload-and-fix-subjects.js',
  'Backend/verify-elective-distribution.js',
  'Backend/verify-elective-types.js',
  'Backend/verify-teacher-ids.js',

  // Backend documentation files
  'Backend/DASHBOARD_SYSTEM.md',
  'Backend/ELECTIVE_AUTO_ENROLLMENT_GUIDE.md',
  'Backend/ENROLLMENT_BASED_EXAM_SCHEDULING_PROCESS.md',
  'Backend/ENROLLMENT_EXAM_SCHEDULING_USAGE.md',
  'Backend/EXAM_SCHEDULING_ARCHITECTURE.md',
  'Backend/EXAM_SCHEDULING_QUICK_GUIDE.md',
  'Backend/EXAM_SYSTEM_IMPLEMENTATION_GUIDE.md',
  'Backend/FRONTEND_IMPLEMENTATION_COMPLETE.md',
  'Backend/IMPLEMENTATION_COMPLETE_ENROLLMENT_SCHEDULING.md',
  'Backend/IMPLEMENTATION_COMPLETE.md',
  'Backend/INSTITUTE_EMAIL_SYSTEM.md',
  'Backend/MONGODB_SETUP_GUIDE.md',
  'Backend/SUBJECT_CSV_FORMAT.md',

  // Backend CSV files
  'Backend/subjects_example_format.csv',
  'Backend/subjects_export.csv',
  'Backend/test-eie-check.csv',

  // Backend package.json.scripts.txt
  'Backend/package.json.scripts.txt',
];

// Directories to remove
const directoriesToRemove = [
  'Backend/logs',
  'Backend/coverage',
  'Backend/__tests__',
  'Backend/uploads',
  'Backend/seed',
];

function removeFile (filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  Not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error removing ${filePath}: ${error.message}`);
    return false;
  }
}

function removeDirectory (dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dirPath}`);
      return true;
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error removing directory ${dirPath}: ${error.message}`);
    return false;
  }
}

function cleanupProject () {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🧹 PROJECT CLEANUP');
  console.log('='.repeat(60));

  let filesRemoved = 0;
  let dirsRemoved = 0;

  // Remove files
  console.log('\n📁 Removing unnecessary files...');
  filesToRemove.forEach(file => {
    if (removeFile(file)) {
      filesRemoved++;
    }
  });

  // Remove directories
  console.log('\n📂 Removing unnecessary directories...');
  directoriesToRemove.forEach(dir => {
    if (removeDirectory(dir)) {
      dirsRemoved++;
    }
  });

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files removed: ${filesRemoved}`);
  console.log(`Directories removed: ${dirsRemoved}`);
  console.log(`Total items cleaned: ${filesRemoved + dirsRemoved}`);
  console.log('\n✅ Project cleanup completed!');
  console.log('🎉 Your project is now clean and organized!');
  console.log(`${'='.repeat(60)}\n`);
}

// Run cleanup
cleanupProject();
