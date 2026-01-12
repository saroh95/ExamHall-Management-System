const NodeCache = require('node-cache');

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300 });

class CacheService {
  // Get cached data
  static get (key) {
    return cache.get(key);
  }

  // Set cached data
  static set (key, value, ttl = 300) {
    return cache.set(key, value, ttl);
  }

  // Delete cached data
  static del (key) {
    return cache.del(key);
  }

  // Clear all cache
  static flush () {
    return cache.flushAll();
  }

  // Get cache statistics
  static getStats () {
    return cache.getStats();
  }

  // Cache student statistics
  static async getStudentStats () {
    const cacheKey = 'student_stats';
    let stats = this.get(cacheKey);

    if (!stats) {
      const Student = require('../models/Student');
      const Department = require('../models/Department');

      try {
        // Get total count
        const totalStudents = await Student.countDocuments();

        // Get department counts
        const deptCounts = await Student.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
          { $unwind: '$department' },
          { $project: { name: '$department.name', count: 1 } },
        ]);

        // Get year counts
        const yearCounts = await Student.aggregate([
          { $group: { _id: '$batchYear', count: { $sum: 1 } } },
          { $sort: { _id: -1 } },
        ]);

        stats = {
          totalStudents,
          departmentCounts: deptCounts.reduce((acc, item) => {
            acc[item.name] = item.count;
            return acc;
          }, {}),
          yearCounts: yearCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          lastUpdated: new Date(),
        };

        // Cache for 5 minutes
        this.set(cacheKey, stats, 300);
      } catch (error) {
        console.error('Error generating student stats:', error);
        return null;
      }
    }

    return stats;
  }

  // Invalidate student-related cache
  static invalidateStudentCache () {
    this.del('student_stats');
  }

  // Cache teacher statistics
  static async getTeacherStats () {
    const cacheKey = 'teacher_stats';
    let stats = this.get(cacheKey);

    if (!stats) {
      const Teacher = require('../models/Teacher');
      const Department = require('../models/Department');

      try {
        // Get total count
        const totalTeachers = await Teacher.countDocuments();

        // Get department counts
        const deptCounts = await Teacher.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
          { $unwind: '$department' },
          { $project: { name: '$department.name', count: 1 } },
        ]);

        // Get designation counts
        const designationCounts = await Teacher.aggregate([
          { $group: { _id: '$designation', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);

        stats = {
          totalTeachers,
          departmentCounts: deptCounts.reduce((acc, item) => {
            acc[item.name] = item.count;
            return acc;
          }, {}),
          designationCounts: designationCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          lastUpdated: new Date(),
        };

        // Cache for 5 minutes
        this.set(cacheKey, stats, 300);
      } catch (error) {
        console.error('Error generating teacher stats:', error);
        return null;
      }
    }

    return stats;
  }

  // Invalidate teacher-related cache
  static invalidateTeacherCache () {
    this.del('teacher_stats');
  }
}

module.exports = CacheService;
