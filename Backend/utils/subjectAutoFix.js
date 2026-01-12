// Safe auto-fix utility for subjects without creating new DB connections
const Subject = require('../models/Subject');

// Subject mapping for proper conflict detection
const SUBJECT_MAPPING = {
  // Semester 1
  'MA101': { isCommon: true, sharedWith: '' },
  'EE101': { isCommon: false, sharedWith: 'CE,EI,ME' },
  'EC101': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  'PH101': { isCommon: false, sharedWith: 'CE,EI,ME' },
  'CH101': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  'HS101': { isCommon: false, sharedWith: 'CE,EI,ME' },
  'CE101': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  'ME101': { isCommon: false, sharedWith: 'CE,ME,EI' },
  'CS101': { isCommon: false, sharedWith: 'CSE,ECE,EE' },
  'CE103': { isCommon: false, sharedWith: 'EE,ECE,CSE' },

  // Semester 2
  'MA102': { isCommon: true, sharedWith: '' },
  'EE102': { isCommon: false, sharedWith: 'EE,ECE,CSE' },
  'EC102': { isCommon: false, sharedWith: 'CE,EI,ME' },
  'PH102': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  'CH102': { isCommon: false, sharedWith: 'CE,EI,ME' },
  'HS102': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  'CE102': { isCommon: false, sharedWith: 'CE,EI,ME' },
  'ME102': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  // CS102 should be shared with CE, ME, EIE (not CSE/EE/ECE)
  'CS102': { isCommon: false, sharedWith: 'CE,ME,EI' },
  'CE104': { isCommon: false, sharedWith: 'CSE,EE,ECE' },

  // Semester 3
  'MA201': { isCommon: true, sharedWith: '' },

  // Semester 3 - Fix CS222 shared departments
  'CS222': { isCommon: false, sharedWith: 'ECE,EI' },

  // Semester 4 - MA4 shared with CSE
  'MA221': { isCommon: false, sharedWith: 'CSE' },

  // Semester 7-8 Management subjects - Fixed shared departments
  // HS401 should be for CE, ME, EIE
  'HS401': { isCommon: false, sharedWith: 'CE,ME,EI' },
  'HS402': { isCommon: false, sharedWith: 'EE,ECE,CSE' },
  // MS401 should be for CSE, EE, ECE
  'MS401': { isCommon: false, sharedWith: 'CSE,EE,ECE' },
  'MS402': { isCommon: false, sharedWith: 'EI,ME,CE' },
};

/**
 * Safely fix subjects after upload without creating new DB connections
 * Uses existing mongoose connection from the main app
 */
async function safeAutoFixSubjects () {
  try {
    console.log('🔧 Starting safe auto-fix for subjects...');
    let fixedCount = 0;

    // CRITICAL FIX: Explicitly fix CS102, MS401, HS401 first with uppercase codes
    const criticalFixes = [
      { code: 'CS102', isCommon: false, sharedWith: 'CE,ME,EI' },
      { code: 'MS401', isCommon: false, sharedWith: 'CSE,EE,ECE' },
      { code: 'HS401', isCommon: false, sharedWith: 'CE,ME,EI' },
    ];

    for (const fix of criticalFixes) {
      try {
        const result = await Subject.updateOne(
          { code: fix.code.toUpperCase() },
          {
            $set: {
              isCommon: fix.isCommon,
              sharedWith: fix.sharedWith,
            },
          },
        );

        if (result.matchedCount > 0) {
          console.log(`✅ [CRITICAL] Fixed ${fix.code}: isCommon=${fix.isCommon}, sharedWith="${fix.sharedWith}"`);
          fixedCount++;
        } else {
          console.log(`⚠️ [CRITICAL] Subject ${fix.code} not found in database`);
        }
      } catch (error) {
        console.log(`❌ [CRITICAL] Error fixing ${fix.code}:`, error.message);
      }
    }

    // Apply explicit mappings
    for (const [code, config] of Object.entries(SUBJECT_MAPPING)) {
      try {
        // Skip if already fixed in critical fixes
        if (['CS102', 'MS401', 'HS401'].includes(code)) continue;

        const result = await Subject.updateOne(
          { code: code.toUpperCase() },
          {
            $set: {
              isCommon: config.isCommon,
              sharedWith: config.sharedWith,
            },
          },
        );

        if (result.matchedCount > 0) {
          console.log(`✅ Fixed ${code}: isCommon=${config.isCommon}, sharedWith="${config.sharedWith}"`);
          fixedCount++;
        }
      } catch (error) {
        console.log(`⚠️ Error fixing ${code}:`, error.message);
      }
    }

    // Apply pattern-based fixes for unmapped subjects
    try {
      const allSubjects = await Subject.find({}).select('code semesterId isCommon sharedWith');

      for (const subject of allSubjects) {
        // Skip if already explicitly mapped
        if (SUBJECT_MAPPING[subject.code]) continue;

        let shouldUpdate = false;
        let newIsCommon = subject.isCommon || false;
        let newSharedWith = subject.sharedWith || '';

        // Pattern: Math subjects are usually common
        if (subject.code.startsWith('MA')) {
          newIsCommon = true;
          newSharedWith = '';
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          await Subject.updateOne(
            { _id: subject._id },
            {
              $set: {
                isCommon: newIsCommon,
                sharedWith: newSharedWith,
              },
            },
          );
          console.log(`🔧 Pattern-fixed ${subject.code}: isCommon=${newIsCommon}`);
          fixedCount++;
        }
      }
    } catch (error) {
      console.log('⚠️ Error in pattern-based fixes:', error.message);
    }

    console.log(`🎉 Safe auto-fix completed: ${fixedCount} subjects fixed`);
    return { success: true, fixedCount };

  } catch (error) {
    console.error('❌ Safe auto-fix failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Quick fix for just the essential subjects needed for conflict detection
 */
async function quickFixEssentialSubjects () {
  try {
    const essentialFixes = [
      { code: 'MA101', isCommon: true, sharedWith: '' },
      { code: 'MA102', isCommon: true, sharedWith: '' },
      { code: 'MA201', isCommon: true, sharedWith: '' },
      { code: 'EE101', isCommon: false, sharedWith: 'CE,EI,ME' },
      { code: 'EC101', isCommon: false, sharedWith: 'CSE,EE,ECE' },
      { code: 'PH101', isCommon: false, sharedWith: 'CE,EI,ME' },
      { code: 'CH101', isCommon: false, sharedWith: 'CSE,EE,ECE' },
    ];

    let fixedCount = 0;
    for (const fix of essentialFixes) {
      const result = await Subject.updateOne(
        { code: fix.code },
        { $set: { isCommon: fix.isCommon, sharedWith: fix.sharedWith } },
      );
      if (result.matchedCount > 0) fixedCount++;
    }

    return { success: true, fixedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  safeAutoFixSubjects,
  quickFixEssentialSubjects,
  SUBJECT_MAPPING,
};
