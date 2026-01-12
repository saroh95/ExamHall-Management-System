/**
 * Rebalance Teacher Duties Script
 *
 * This script rebalances all future exam duties to ensure:
 * - All 87 teachers get fair, balanced duty assignments
 * - No teacher conflicts (same teacher at 2 places at same time)
 * - Even distribution of workload
 *
 * Usage:
 *   node Backend/scripts/rebalance-teacher-duties.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const environment = require('../config/environment');
const balancedDutyService = require('../services/balancedDutyAssignmentService');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');

async function rebalanceTeacherDuties () {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔄 TEACHER DUTY REBALANCING UTILITY');
    console.log('='.repeat(80));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Get current statistics
    console.log('📊 Current Duty Statistics:\n');
    const beforeStats = await balancedDutyService.getTeacherDutyStatistics();

    console.log(`   Total Teachers: ${beforeStats.totalTeachers}`);
    console.log(`   Teachers with duties: ${beforeStats.teachersWithDuties}`);
    console.log(`   Teachers without duties: ${beforeStats.teachersWithoutDuties}`);
    console.log(`   Min duties: ${beforeStats.minDuties}`);
    console.log(`   Max duties: ${beforeStats.maxDuties}`);
    console.log(`   Average duties: ${beforeStats.avgDuties}`);
    console.log(`   Balance score: ${beforeStats.balanceScore} (lower is better)`);

    if (beforeStats.teachersWithoutDuties > 0) {
      console.log('\n   ⚠️  Teachers with NO duties:');
      beforeStats.teachersNeedingDuties.slice(0, 10).forEach(t => {
        console.log(`      - ${t.name} (${t.employeeId})`);
      });
      if (beforeStats.teachersNeedingDuties.length > 10) {
        console.log(`      ... and ${beforeStats.teachersNeedingDuties.length - 10} more`);
      }
    }

    // Ask for confirmation (in interactive mode)
    if (process.stdout.isTTY) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise(resolve => {
        readline.question('\n⚠️  This will rebalance ALL future exam duties. Continue? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n❌ Rebalancing cancelled by user\n');
        process.exit(0);
      }
    }

    // Perform rebalancing
    console.log('\n🔄 Starting rebalancing process...\n');
    const result = await balancedDutyService.rebalanceAllFutureDuties();

    // Show results
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 REBALANCING RESULTS');
    console.log('='.repeat(80));
    console.log(`\n✅ Successfully rebalanced ${result.rebalancedCount} out of ${result.totalExams} exams\n`);

    const afterStats = result.statistics;

    console.log('📊 New Duty Statistics:\n');
    console.log(`   Total Teachers: ${afterStats.totalTeachers}`);
    console.log(`   Teachers with duties: ${afterStats.teachersWithDuties}`);
    console.log(`   Teachers without duties: ${afterStats.teachersWithoutDuties}`);
    console.log(`   Min duties: ${afterStats.minDuties}`);
    console.log(`   Max duties: ${afterStats.maxDuties}`);
    console.log(`   Average duties: ${afterStats.avgDuties}`);
    console.log(`   Balance score: ${afterStats.balanceScore} (lower is better)`);

    // Show improvement
    console.log('\n📈 Improvements:\n');
    const teacherImprovement = beforeStats.teachersWithoutDuties - afterStats.teachersWithoutDuties;
    const balanceImprovement = beforeStats.balanceScore - afterStats.balanceScore;

    if (teacherImprovement > 0) {
      console.log(`   ✅ ${teacherImprovement} more teacher(s) now have duties`);
    }
    if (balanceImprovement > 0) {
      console.log(`   ✅ Balance score improved by ${balanceImprovement} points`);
    }
    if (teacherImprovement === 0 && balanceImprovement === 0) {
      console.log('   ℹ️  Duties were already well balanced');
    }

    // Show top 10 teachers by duty count
    console.log('\n📋 Top 10 Teachers by Duty Count:\n');
    const top10 = afterStats.distribution.slice(-10).reverse();
    top10.forEach((teacher, idx) => {
      console.log(`   ${idx + 1}. ${teacher.teacherName} (${teacher.employeeId}): ${teacher.duties} duties`);
    });

    // Show bottom 10 teachers by duty count
    console.log('\n📋 Bottom 10 Teachers by Duty Count:\n');
    const bottom10 = afterStats.distribution.slice(0, 10);
    bottom10.forEach((teacher, idx) => {
      console.log(`   ${idx + 1}. ${teacher.teacherName} (${teacher.employeeId}): ${teacher.duties} duties`);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ REBALANCING COMPLETE');
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('\n❌ Error during rebalancing:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed\n');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  rebalanceTeacherDuties();
}

module.exports = rebalanceTeacherDuties;

