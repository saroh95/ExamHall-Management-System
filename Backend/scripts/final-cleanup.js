/**
 * Final Cleanup Script
 *
 * Removes unnecessary test and debug scripts, keeping only essential ones
 *
 * Usage:
 *   node Backend/scripts/final-cleanup.js
 */

const fs = require('fs');
const path = require('path');

// Scripts to keep (essential for the app)
const scriptsToKeep = [
  'cleanup-project.js',
  'fix-teacher-duties.js',
  'force-assign-all-teachers.js',
  'rebalance-teacher-duties.js',
  'simple-fix-duties.js',
  'test-server-start.js',
  'test-teacher-duties.js',
];

// Scripts to remove (test/debug scripts)
const scriptsToRemove = [
  'analyze-oct23-afternoon.js',
  'analyze-scheduling-problem.js',
  'backfillDepartmentEnrollments.js',
  'check-exam-status.js',
  'checkClassrooms.js',
  'checkSchedulingPrerequisites.js',
  'consolidate-parallel-exams.js',
  'deduplicate-classroom-teachers.js',
  'detect-invigilator-conflicts.js',
  'fix-bad-timeslots.js',
  'force-assign-duties.js',
  'optimizeDatabaseIndexes.js',
  'testPreviewAPI.js',
  'testPreviewPerformance.js',
  'testScheduling.js',
];

function removeScript (scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  try {
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
      console.log(`✅ Removed: ${scriptName}`);
      return true;
    } else {
      console.log(`⚠️  Not found: ${scriptName}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error removing ${scriptName}: ${error.message}`);
    return false;
  }
}

function finalCleanup () {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🧹 FINAL CLEANUP - SCRIPTS');
  console.log('='.repeat(60));

  console.log('\n📁 Removing unnecessary test/debug scripts...');
  let scriptsRemoved = 0;

  scriptsToRemove.forEach(script => {
    if (removeScript(script)) {
      scriptsRemoved++;
    }
  });

  console.log('\n📋 Scripts kept (essential):');
  scriptsToKeep.forEach(script => {
    console.log(`   ✅ ${script}`);
  });

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Scripts removed: ${scriptsRemoved}`);
  console.log(`Scripts kept: ${scriptsToKeep.length}`);
  console.log('\n✅ Final cleanup completed!');
  console.log('🎉 Your project is now perfectly clean and organized!');
  console.log(`${'='.repeat(60)}\n`);
}

// Run cleanup
finalCleanup();
