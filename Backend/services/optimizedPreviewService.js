/**
 * Optimized Preview Service
 *
 * Fast preview generation without loading all student data
 * Only loads essential information for preview
 */

const Enrollment = require('../models/Enrollment');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Department = require('../models/Department');

class OptimizedPreviewService {
  /**
   * Get subjects with enrollment counts (optimized for preview)
   */
  async getSubjectsWithEnrollments (params) {
    const { semesters, departments, academicYear } = params;

    console.log('\n📊 Generating OPTIMIZED enrollment preview...');
    console.log('   Semesters:', semesters);
    console.log('   Departments:', departments || 'All');

    // Build enrollment query
    const enrollmentQuery = {
      status: 'Enrolled',
      academicYear: academicYear || this.getCurrentAcademicYear(),
    };

    if (semesters && semesters.length > 0) {
      enrollmentQuery.semester = { $in: semesters };
    }

    // OPTIMIZATION 1: Use aggregation pipeline instead of populate
    const pipeline = [
      { $match: enrollmentQuery },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectData',
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData',
        },
      },
      {
        $unwind: '$subjectData',
      },
      {
        $unwind: '$studentData',
      },
      {
        $match: {
          'subjectData.isActive': true,
          'studentData.isActive': true,
        },
      },
    ];

    // Add department filter if specified
    if (departments && departments.length > 0) {
      pipeline.push({
        $match: {
          'studentData.department': { $in: departments },
        },
      });
    }

    // Group by subject and count students
    pipeline.push(
      {
        $group: {
          _id: '$subject',
          subjectData: { $first: '$subjectData' },
          totalStudents: { $sum: 1 },
          departments: { $addToSet: '$studentData.department' },
        },
      },
      {
        $project: {
          subject: '$subjectData',
          semesterId: '$subjectData.semesterId',
          totalStudents: 1,
          departments: 1,
        },
      },
    );

    console.log('   Running optimized aggregation...');
    const startTime = Date.now();

    const subjects = await Enrollment.aggregate(pipeline);

    const endTime = Date.now();
    console.log(`   ⚡ Aggregation completed in ${endTime - startTime}ms`);
    console.log(`   📊 Found ${subjects.length} subjects`);

    // Get department names for each subject
    const departmentIds = [...new Set(subjects.flatMap(s => s.departments))];
    const departmentMap = new Map();

    if (departmentIds.length > 0) {
      const departments = await Department.find({ _id: { $in: departmentIds } });
      departments.forEach(dept => {
        departmentMap.set(dept._id.toString(), dept.name);
      });
    }

    // Process results
    const result = subjects.map(data => {
      const departmentNames = data.departments
        .map(deptId => departmentMap.get(deptId?.toString()))
        .filter(Boolean);

      // Ensure subject is a plain object
      const subjectData = data.subject ? {
        _id: data.subject._id,
        code: data.subject.code,
        name: data.subject.name,
        type: data.subject.type,
        semesterId: data.subject.semesterId,
        credits: data.subject.credits,
        departmentId: data.subject.departmentId,
        isActive: data.subject.isActive,
      } : null;

      return {
        subject: subjectData,
        semesterId: data.semesterId,
        totalStudents: data.totalStudents,
        students: [], // Empty for preview - not needed
        departments: data.departments,
        departmentNames,
      };
    });

    // Sort by semester and total students
    result.sort((a, b) => {
      if (a.semesterId !== b.semesterId) {
        return a.semesterId - b.semesterId;
      }
      return b.totalStudents - a.totalStudents;
    });

    console.log(`   ✅ ${result.length} subjects with enrollments found`);
    result.forEach(s => {
      console.log(`      • ${s.subject.code} (Sem ${s.semesterId}): ${s.totalStudents} students`);
    });

    return result;
  }

  /**
   * Get current academic year
   */
  getCurrentAcademicYear () {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  }
}

module.exports = new OptimizedPreviewService();
