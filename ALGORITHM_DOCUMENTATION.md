# 🧮 Algorithm Documentation
# Exam Hall Management System

## 🎯 **Overview**

This document provides detailed documentation of all algorithms used in the Exam Hall Management System, including their purpose, implementation, complexity analysis, and usage examples.

---

## 📊 **Algorithm Categories**

### **1. Scheduling Algorithms**
- Intelligent Parallel Scheduling
- Enrollment-Based Scheduling
- Conflict Detection Algorithm
- Time Slot Optimization

### **2. Assignment Algorithms**
- Balanced Teacher Duty Assignment
- Classroom Allocation Algorithm
- Seating Arrangement Generation
- Student-Exam Matching

### **3. Optimization Algorithms**
- Workload Balancing
- Resource Utilization
- Conflict Resolution
- Performance Optimization

---

## 🚀 **1. Intelligent Parallel Scheduling Algorithm**

### **Purpose**
Schedule multiple exams on the same day when students don't have conflicts, maximizing resource utilization and minimizing exam duration.

### **Algorithm Type**
Greedy Algorithm with Conflict Detection

### **Key Data Structures**
```javascript
// Student to classroom mapping for consistency
const studentClassroomMap = new Map();

// Student to seat mapping for consistency
const studentSeatMap = new Map();

// Department to classroom mapping
const departmentClassroomMap = new Map();

// Track used teachers to prevent conflicts
const usedTeachers = new Set();

// Classroom usage per time slot
const roomUsageBySlot = new Map(); // key: "date-start-end" -> Set(classroomId)
```

### **Algorithm Steps**

#### **Step 1: Subject Grouping**
```javascript
groupSubjectsByDepartment(subjects) {
  const groups = new Map();
  
  subjects.forEach(subject => {
    const departments = subject.departments || [subject.department];
    const key = departments.sort().join('-');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(subject);
  });
  
  return Array.from(groups.values());
}
```

#### **Step 2: Conflict Detection**
```javascript
detectStudentConflicts(subject1, subject2) {
  const students1 = new Set(subject1.enrollments.map(e => e.student._id));
  const students2 = new Set(subject2.enrollments.map(e => e.student._id));
  
  // Check for overlapping students
  for (const studentId of students1) {
    if (students2.has(studentId)) {
      return true; // Conflict found
    }
  }
  
  return false; // No conflict
}
```

#### **Step 3: Parallel Scheduling**
```javascript
scheduleSubjectsInParallel(subjects, timeSlot, date) {
  const scheduledExams = [];
  const availableClassrooms = this.getAvailableClassrooms(date, timeSlot);
  
  // Group subjects that can be scheduled together
  const groups = this.findNonConflictingGroups(subjects);
  
  groups.forEach(group => {
    if (group.length > 1) {
      // Schedule multiple subjects in same time slot
      const exam = this.createParallelExam(group, timeSlot, date, availableClassrooms);
      scheduledExams.push(exam);
    } else {
      // Schedule single subject
      const exam = this.createSingleExam(group[0], timeSlot, date, availableClassrooms);
      scheduledExams.push(exam);
    }
  });
  
  return scheduledExams;
}
```

### **Time Complexity**
- **Subject Grouping:** O(n) where n = number of subjects
- **Conflict Detection:** O(s²) where s = number of students
- **Parallel Scheduling:** O(g × c) where g = groups, c = classrooms
- **Overall:** O(n + s² + g × c)

### **Space Complexity**
- **Data Structures:** O(s + c + t) where s = students, c = classrooms, t = teachers
- **Overall:** O(s + c + t)

### **Usage Example**
```javascript
const scheduler = new IntelligentParallelScheduler();

const result = await scheduler.scheduleExams({
  examType: 'End-Semester',
  semesters: ['Semester 1', 'Semester 2'],
  departments: ['CSE', 'ECE'],
  dateRange: { start: '2024-12-01', end: '2024-12-15' },
  timeSlots: [
    { start: '10:00', end: '13:00' },
    { start: '14:00', end: '17:00' }
  ]
});
```

---

## ⚖️ **2. Balanced Teacher Duty Assignment Algorithm**

### **Purpose**
Ensure all teachers receive fair, balanced invigilation duties without conflicts, maintaining workload equity across all faculty members.

### **Algorithm Type**
Round-Robin with Workload Balancing

### **Key Data Structures**
```javascript
// Teacher workload tracking
const teacherWorkloadMap = new Map(); // teacherId -> workload count

// Available teachers per time slot
const availableTeachers = new Set();

// Exam invigilator assignments
const examAssignments = new Map(); // examId -> [assignments]
```

### **Algorithm Steps**

#### **Step 1: Workload Calculation**
```javascript
async getGlobalTeacherWorkload(teachers) {
  const workloadMap = new Map();
  
  // Initialize all teachers with 0 workload
  teachers.forEach(teacher => {
    workloadMap.set(teacher._id.toString(), {
      teacherId: teacher._id,
      teacherName: teacher.fullName,
      currentDuties: 0,
      upcomingDuties: 0,
      totalDuties: 0
    });
  });
  
  // Count existing duties
  const existingExams = await Exam.find({
    status: { $in: ['scheduled', 'in_progress'] },
    'invigilators.teacher': { $in: teachers.map(t => t._id) }
  });
  
  existingExams.forEach(exam => {
    exam.invigilators.forEach(invigilator => {
      const teacherId = invigilator.teacher.toString();
      if (workloadMap.has(teacherId)) {
        workloadMap.get(teacherId).currentDuties++;
        workloadMap.get(teacherId).totalDuties++;
      }
    });
  });
  
  return workloadMap;
}
```

#### **Step 2: Teacher Sorting by Workload**
```javascript
sortTeachersByWorkload(teachers, workloadMap) {
  return teachers.sort((a, b) => {
    const workloadA = workloadMap.get(a._id.toString())?.totalDuties || 0;
    const workloadB = workloadMap.get(b._id.toString())?.totalDuties || 0;
    
    // Primary sort: by total duties (ascending)
    if (workloadA !== workloadB) {
      return workloadA - workloadB;
    }
    
    // Secondary sort: by name (for consistency)
    return a.fullName.localeCompare(b.fullName);
  });
}
```

#### **Step 3: Conflict Detection**
```javascript
filterConflictingTeachers(teachers, examDate, timeSlot) {
  return teachers.filter(teacher => {
    // Check if teacher is already assigned in this time slot
    const hasConflict = this.teacherUsageBySlot.has(`${examDate}-${timeSlot.start}-${timeSlot.end}`);
    
    if (hasConflict) {
      const usedTeachers = this.teacherUsageBySlot.get(`${examDate}-${timeSlot.start}-${timeSlot.end}`);
      return !usedTeachers.has(teacher._id.toString());
    }
    
    return true;
  });
}
```

#### **Step 4: Round-Robin Assignment**
```javascript
createBalancedAssignments(availableTeachers, classroomCount, teachersPerClassroom) {
  const assignments = [];
  const sortedTeachers = this.sortTeachersByWorkload(availableTeachers, this.workloadMap);
  
  let teacherIndex = 0;
  
  for (let i = 0; i < classroomCount; i++) {
    const classroomAssignments = [];
    
    // Assign chief invigilator
    const chiefTeacher = sortedTeachers[teacherIndex % sortedTeachers.length];
    classroomAssignments.push({
      teacher: chiefTeacher._id,
      role: 'chief_invigilator',
      assignedClassrooms: [classrooms[i]._id]
    });
    
    teacherIndex++;
    
    // Assign regular invigilators
    for (let j = 1; j < teachersPerClassroom; j++) {
      const regularTeacher = sortedTeachers[teacherIndex % sortedTeachers.length];
      classroomAssignments.push({
        teacher: regularTeacher._id,
        role: 'invigilator',
        assignedClassrooms: [classrooms[i]._id]
      });
      
      teacherIndex++;
    }
    
    assignments.push(...classroomAssignments);
  }
  
  return assignments;
}
```

### **Time Complexity**
- **Workload Calculation:** O(t + e) where t = teachers, e = exams
- **Teacher Sorting:** O(t log t)
- **Conflict Detection:** O(t)
- **Assignment Creation:** O(c × p) where c = classrooms, p = teachers per classroom
- **Overall:** O(t log t + e + c × p)

### **Space Complexity**
- **Workload Map:** O(t)
- **Assignment Storage:** O(c × p)
- **Overall:** O(t + c × p)

### **Usage Example**
```javascript
const balancedDutyService = require('./balancedDutyAssignmentService');

const assignments = await balancedDutyService.assignBalancedInvigilators({
  examDate: '2024-12-01',
  timeSlot: { start: '10:00', end: '13:00' },
  classroomCount: 5,
  teachersPerClassroom: 2,
  existingAssignments: new Set(),
  preferences: {}
});
```

---

## 🏫 **3. Classroom Allocation Algorithm**

### **Purpose**
Allocate classrooms to exams based on student count, availability, and capacity constraints while maintaining consistency for students.

### **Algorithm Type**
Bin Packing with Constraints

### **Key Data Structures**
```javascript
// Classroom capacity mapping
const classroomCapacityMap = new Map(); // classroomId -> capacity

// Student count per exam
const examStudentCount = new Map(); // examId -> studentCount

// Available classrooms per time slot
const availableClassrooms = new Map(); // slotKey -> Set(classroomId)
```

### **Algorithm Steps**

#### **Step 1: Capacity Calculation**
```javascript
calculateRequiredCapacity(studentCount, seatingStrategy) {
  let requiredCapacity = studentCount;
  
  // Add buffer based on seating strategy
  switch (seatingStrategy) {
    case 'alternate':
      requiredCapacity = Math.ceil(studentCount * 1.2); // 20% buffer
      break;
    case 'department-wise':
      requiredCapacity = Math.ceil(studentCount * 1.1); // 10% buffer
      break;
    case 'compact':
      requiredCapacity = studentCount; // No buffer
      break;
  }
  
  return requiredCapacity;
}
```

#### **Step 2: Classroom Selection**
```javascript
selectClassrooms(requiredCapacity, availableClassrooms, examDate, timeSlot) {
  const selectedClassrooms = [];
  let remainingCapacity = requiredCapacity;
  
  // Sort classrooms by capacity (descending)
  const sortedClassrooms = Array.from(availableClassrooms)
    .map(id => this.classroomCapacityMap.get(id))
    .sort((a, b) => b.capacity - a.capacity);
  
  // Use first-fit decreasing algorithm
  for (const classroom of sortedClassrooms) {
    if (remainingCapacity <= 0) break;
    
    if (classroom.capacity >= remainingCapacity) {
      // Single classroom can accommodate all students
      selectedClassrooms.push(classroom);
      remainingCapacity = 0;
    } else {
      // Partial allocation
      selectedClassrooms.push(classroom);
      remainingCapacity -= classroom.capacity;
    }
  }
  
  if (remainingCapacity > 0) {
    throw new Error(`Insufficient classroom capacity. Required: ${requiredCapacity}, Available: ${requiredCapacity - remainingCapacity}`);
  }
  
  return selectedClassrooms;
}
```

#### **Step 3: Consistency Check**
```javascript
ensureConsistentAssignment(studentId, classroomId, examDate) {
  const key = `${studentId}-${examDate}`;
  
  if (this.studentClassroomMap.has(key)) {
    const previousClassroom = this.studentClassroomMap.get(key);
    if (previousClassroom !== classroomId) {
      // Student already assigned to different classroom
      return false;
    }
  }
  
  // Assign student to classroom
  this.studentClassroomMap.set(key, classroomId);
  return true;
}
```

### **Time Complexity**
- **Capacity Calculation:** O(1)
- **Classroom Selection:** O(c log c) where c = classrooms
- **Consistency Check:** O(s) where s = students
- **Overall:** O(c log c + s)

### **Space Complexity**
- **Classroom Maps:** O(c)
- **Student Mapping:** O(s)
- **Overall:** O(c + s)

### **Usage Example**
```javascript
const classroomAllocator = new ClassroomAllocator();

const allocatedClassrooms = await classroomAllocator.allocateClassrooms({
  studentCount: 120,
  examDate: '2024-12-01',
  timeSlot: { start: '10:00', end: '13:00' },
  seatingStrategy: 'alternate',
  existingAssignments: new Map()
});
```

---

## 🪑 **4. Seating Arrangement Generation Algorithm**

### **Purpose**
Generate consistent, organized seating arrangements for students in allocated classrooms, considering department grouping and layout constraints.

### **Algorithm Type**
Deterministic Assignment with Department Grouping

### **Key Data Structures**
```javascript
// Student seat mapping
const studentSeatMap = new Map(); // studentId -> { classroomId, seatNumber, row, column }

// Department student grouping
const departmentGroups = new Map(); // departmentId -> [students]

// Classroom seat layout
const seatLayouts = new Map(); // classroomId -> { rows, columns, layout }
```

### **Algorithm Steps**

#### **Step 1: Layout Analysis**
```javascript
analyzeClassroomLayout(classroom) {
  const layout = {
    rows: classroom.rows || 10,
    columns: classroom.columns || 6,
    totalSeats: (classroom.rows || 10) * (classroom.columns || 6),
    layout: classroom.layout || 'theater'
  };
  
  return layout;
}
```

#### **Step 2: Student Grouping**
```javascript
groupStudentsByDepartment(students) {
  const groups = new Map();
  
  students.forEach(student => {
    const department = student.department;
    if (!groups.has(department)) {
      groups.set(department, []);
    }
    groups.get(department).push(student);
  });
  
  // Sort students within each department
  groups.forEach((students, department) => {
    students.sort((a, b) => a.fullName.localeCompare(b.fullName));
  });
  
  return groups;
}
```

#### **Step 3: Seat Assignment**
```javascript
assignSeats(students, classroom, seatingStrategy) {
  const layout = this.analyzeClassroomLayout(classroom);
  const departmentGroups = this.groupStudentsByDepartment(students);
  const seatingArrangement = [];
  
  let currentRow = 1;
  let currentColumn = 1;
  
  // Assign seats based on strategy
  switch (seatingStrategy) {
    case 'department-wise':
      seatingArrangement = this.assignDepartmentWise(departmentGroups, layout);
      break;
    case 'alternate':
      seatingArrangement = this.assignAlternate(students, layout);
      break;
    case 'compact':
      seatingArrangement = this.assignCompact(students, layout);
      break;
  }
  
  return seatingArrangement;
}
```

#### **Step 4: Department-wise Assignment**
```javascript
assignDepartmentWise(departmentGroups, layout) {
  const arrangement = [];
  let currentSeat = 1;
  
  // Sort departments for consistent assignment
  const sortedDepartments = Array.from(departmentGroups.keys()).sort();
  
  sortedDepartments.forEach(department => {
    const students = departmentGroups.get(department);
    
    students.forEach(student => {
      const row = Math.ceil(currentSeat / layout.columns);
      const column = ((currentSeat - 1) % layout.columns) + 1;
      
      arrangement.push({
        student: {
          id: student._id,
          studentId: student.studentId,
          fullName: student.fullName,
          department: student.department
        },
        seatNumber: `R${row}C${column}`,
        row: row,
        column: column,
        position: currentSeat
      });
      
      currentSeat++;
    });
  });
  
  return arrangement;
}
```

#### **Step 5: Consistency Check**
```javascript
ensureConsistentSeating(studentId, classroomId, seatNumber) {
  const key = `${studentId}-${classroomId}`;
  
  if (this.studentSeatMap.has(key)) {
    const previousSeat = this.studentSeatMap.get(key);
    if (previousSeat.seatNumber !== seatNumber) {
      // Student already assigned to different seat
      return false;
    }
  }
  
  // Assign student to seat
  this.studentSeatMap.set(key, {
    classroomId,
    seatNumber,
    row: Math.ceil(seatNumber / this.getColumnsPerRow(classroomId)),
    column: ((seatNumber - 1) % this.getColumnsPerRow(classroomId)) + 1
  });
  
  return true;
}
```

### **Time Complexity**
- **Layout Analysis:** O(1)
- **Student Grouping:** O(s log s) where s = students
- **Seat Assignment:** O(s) where s = students
- **Consistency Check:** O(s) where s = students
- **Overall:** O(s log s)

### **Space Complexity**
- **Student Mapping:** O(s)
- **Department Groups:** O(s)
- **Seating Arrangement:** O(s)
- **Overall:** O(s)

### **Usage Example**
```javascript
const seatingGenerator = new SeatingArrangementGenerator();

const arrangement = await seatingGenerator.generateSeatingArrangement({
  students: enrolledStudents,
  classroom: selectedClassroom,
  seatingStrategy: 'department-wise',
  examDate: '2024-12-01'
});
```

---

## 🔍 **5. Conflict Detection Algorithm**

### **Purpose**
Detect and prevent conflicts in exam scheduling, including student conflicts, teacher conflicts, and resource conflicts.

### **Algorithm Type**
Graph-based Conflict Detection

### **Key Data Structures**
```javascript
// Conflict graph
const conflictGraph = new Map(); // examId -> Set(conflictingExamIds)

// Student enrollment mapping
const studentEnrollments = new Map(); // studentId -> Set(examIds)

// Teacher assignment mapping
const teacherAssignments = new Map(); // teacherId -> Set(examIds)

// Resource usage mapping
const resourceUsage = new Map(); // resourceId -> Set(examIds)
```

### **Algorithm Steps**

#### **Step 1: Student Conflict Detection**
```javascript
detectStudentConflicts(exam1, exam2) {
  const students1 = new Set(exam1.enrollments.map(e => e.student._id));
  const students2 = new Set(exam2.enrollments.map(e => e.student._id));
  
  // Check for overlapping students
  const intersection = new Set([...students1].filter(id => students2.has(id)));
  
  if (intersection.size > 0) {
    return {
      hasConflict: true,
      conflictingStudents: Array.from(intersection),
      conflictType: 'student_overlap'
    };
  }
  
  return { hasConflict: false };
}
```

#### **Step 2: Teacher Conflict Detection**
```javascript
detectTeacherConflicts(exam1, exam2) {
  const teachers1 = new Set(exam1.invigilators.map(i => i.teacher._id));
  const teachers2 = new Set(exam2.invigilators.map(i => i.teacher._id));
  
  // Check for overlapping teachers
  const intersection = new Set([...teachers1].filter(id => teachers2.has(id)));
  
  if (intersection.size > 0) {
    return {
      hasConflict: true,
      conflictingTeachers: Array.from(intersection),
      conflictType: 'teacher_overlap'
    };
  }
  
  return { hasConflict: false };
}
```

#### **Step 3: Time Conflict Detection**
```javascript
detectTimeConflicts(exam1, exam2) {
  // Check if exams are on the same date
  if (exam1.examDate !== exam2.examDate) {
    return { hasConflict: false };
  }
  
  // Check if time slots overlap
  const start1 = this.parseTime(exam1.startTime);
  const end1 = this.parseTime(exam1.endTime);
  const start2 = this.parseTime(exam2.startTime);
  const end2 = this.parseTime(exam2.endTime);
  
  const overlaps = (start1 < end2 && start2 < end1);
  
  if (overlaps) {
    return {
      hasConflict: true,
      conflictType: 'time_overlap',
      overlappingTime: {
        start: Math.max(start1, start2),
        end: Math.min(end1, end2)
      }
    };
  }
  
  return { hasConflict: false };
}
```

#### **Step 4: Resource Conflict Detection**
```javascript
detectResourceConflicts(exam1, exam2) {
  const classrooms1 = new Set(exam1.classrooms.map(c => c._id));
  const classrooms2 = new Set(exam2.classrooms.map(c => c._id));
  
  // Check for overlapping classrooms
  const intersection = new Set([...classrooms1].filter(id => classrooms2.has(id)));
  
  if (intersection.size > 0) {
    return {
      hasConflict: true,
      conflictingClassrooms: Array.from(intersection),
      conflictType: 'resource_overlap'
    };
  }
  
  return { hasConflict: false };
}
```

#### **Step 5: Comprehensive Conflict Check**
```javascript
checkAllConflicts(exam1, exam2) {
  const conflicts = [];
  
  // Check all types of conflicts
  const studentConflict = this.detectStudentConflicts(exam1, exam2);
  const teacherConflict = this.detectTeacherConflicts(exam1, exam2);
  const timeConflict = this.detectTimeConflicts(exam1, exam2);
  const resourceConflict = this.detectResourceConflicts(exam1, exam2);
  
  if (studentConflict.hasConflict) conflicts.push(studentConflict);
  if (teacherConflict.hasConflict) conflicts.push(teacherConflict);
  if (timeConflict.hasConflict) conflicts.push(timeConflict);
  if (resourceConflict.hasConflict) conflicts.push(resourceConflict);
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts,
    severity: this.calculateConflictSeverity(conflicts)
  };
}
```

### **Time Complexity**
- **Student Conflicts:** O(s) where s = students
- **Teacher Conflicts:** O(t) where t = teachers
- **Time Conflicts:** O(1)
- **Resource Conflicts:** O(r) where r = resources
- **Overall:** O(s + t + r)

### **Space Complexity**
- **Conflict Graph:** O(e²) where e = exams
- **Mapping Storage:** O(s + t + r)
- **Overall:** O(e² + s + t + r)

### **Usage Example**
```javascript
const conflictDetector = new ConflictDetector();

const conflicts = await conflictDetector.checkAllConflicts(exam1, exam2);

if (conflicts.hasConflict) {
  console.log('Conflicts detected:', conflicts.conflicts);
  // Handle conflicts
}
```

---

## 📈 **6. Performance Optimization Algorithms**

### **Purpose**
Optimize system performance through caching, query optimization, and resource management.

### **Algorithm Type**
Caching and Query Optimization

### **Key Data Structures**
```javascript
// Cache storage
const cache = new Map(); // key -> { data, timestamp, ttl }

// Query optimization
const queryCache = new Map(); // queryHash -> result

// Resource monitoring
const resourceUsage = new Map(); // resourceId -> usage stats
```

### **Algorithm Steps**

#### **Step 1: Cache Management**
```javascript
class CacheManager {
  constructor(ttl = 600000) { // 10 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data, customTtl = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl
    });
  }
  
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

#### **Step 2: Query Optimization**
```javascript
optimizeQuery(query, options = {}) {
  const {
    useCache = true,
    cacheKey = null,
    select = null,
    populate = null,
    lean = true
  } = options;
  
  // Check cache first
  if (useCache && cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
  }
  
  // Build optimized query
  let optimizedQuery = query;
  
  if (select) {
    optimizedQuery = optimizedQuery.select(select);
  }
  
  if (populate) {
    optimizedQuery = optimizedQuery.populate(populate);
  }
  
  if (lean) {
    optimizedQuery = optimizedQuery.lean();
  }
  
  return optimizedQuery;
}
```

#### **Step 3: Resource Monitoring**
```javascript
class ResourceMonitor {
  constructor() {
    this.usage = new Map();
    this.thresholds = {
      memory: 0.8, // 80% memory usage
      cpu: 0.7,    // 70% CPU usage
      connections: 100 // 100 database connections
    };
  }
  
  monitorResource(resourceId, usage) {
    this.usage.set(resourceId, {
      ...usage,
      timestamp: Date.now()
    });
    
    // Check thresholds
    this.checkThresholds(resourceId, usage);
  }
  
  checkThresholds(resourceId, usage) {
    if (usage.memory > this.thresholds.memory) {
      this.handleHighMemoryUsage(resourceId, usage);
    }
    
    if (usage.cpu > this.thresholds.cpu) {
      this.handleHighCpuUsage(resourceId, usage);
    }
    
    if (usage.connections > this.thresholds.connections) {
      this.handleHighConnectionUsage(resourceId, usage);
    }
  }
}
```

### **Time Complexity**
- **Cache Operations:** O(1) average case
- **Query Optimization:** O(q) where q = query complexity
- **Resource Monitoring:** O(1)
- **Overall:** O(1) average case

### **Space Complexity**
- **Cache Storage:** O(c) where c = cache size
- **Resource Monitoring:** O(r) where r = resources
- **Overall:** O(c + r)

### **Usage Example**
```javascript
const cacheManager = new CacheManager(600000); // 10 minutes TTL
const resourceMonitor = new ResourceMonitor();

// Cache expensive operation
const getCachedData = async (key, fetchFunction) => {
  let data = cacheManager.get(key);
  if (!data) {
    data = await fetchFunction();
    cacheManager.set(key, data);
  }
  return data;
};

// Monitor resource usage
resourceMonitor.monitorResource('database', {
  memory: 0.6,
  cpu: 0.4,
  connections: 50
});
```

---

## 🧪 **Algorithm Testing**

### **Unit Testing**
```javascript
describe('IntelligentParallelScheduler', () => {
  test('should detect student conflicts correctly', () => {
    const subject1 = { enrollments: [{ student: { _id: '1' } }] };
    const subject2 = { enrollments: [{ student: { _id: '1' } }] };
    
    const conflict = scheduler.detectStudentConflicts(subject1, subject2);
    expect(conflict.hasConflict).toBe(true);
  });
  
  test('should schedule non-conflicting subjects together', () => {
    const subjects = [subject1, subject2]; // No conflicts
    const result = scheduler.scheduleSubjectsInParallel(subjects, timeSlot, date);
    
    expect(result.length).toBe(1);
    expect(result[0].subjects.length).toBe(2);
  });
});
```

### **Performance Testing**
```javascript
describe('Algorithm Performance', () => {
  test('should handle large datasets efficiently', async () => {
    const startTime = Date.now();
    
    const result = await scheduler.scheduleExams({
      semesters: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'],
      departments: ['CSE', 'ECE', 'EE', 'ME', 'CE'],
      // ... large dataset
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds
    expect(result.exams.length).toBeGreaterThan(0);
  });
});
```

### **Integration Testing**
```javascript
describe('Algorithm Integration', () => {
  test('should work with real database data', async () => {
    // Setup test data
    await setupTestData();
    
    // Run algorithm
    const result = await scheduler.scheduleExams(testParams);
    
    // Verify results
    expect(result.success).toBe(true);
    expect(result.data.exams.length).toBeGreaterThan(0);
    
    // Cleanup
    await cleanupTestData();
  });
});
```

---

## 📊 **Algorithm Comparison**

| Algorithm | Time Complexity | Space Complexity | Use Case | Best For |
|-----------|----------------|------------------|----------|----------|
| Intelligent Parallel Scheduling | O(n + s² + g×c) | O(s + c + t) | Exam scheduling | Multiple exams per day |
| Balanced Teacher Assignment | O(t log t + e + c×p) | O(t + c×p) | Teacher duties | Fair workload distribution |
| Classroom Allocation | O(c log c + s) | O(c + s) | Resource allocation | Optimal classroom usage |
| Seating Arrangement | O(s log s) | O(s) | Seat assignment | Organized seating |
| Conflict Detection | O(s + t + r) | O(e² + s + t + r) | Conflict prevention | Preventing overlaps |
| Performance Optimization | O(1) avg | O(c + r) | System optimization | Performance improvement |

---

## 🔧 **Algorithm Configuration**

### **Scheduling Parameters**
```javascript
const schedulingConfig = {
  // Parallel scheduling
  enableParallelScheduling: true,
  maxParallelExams: 3,
  
  // Time slots
  timeSlots: [
    { start: '10:00', end: '13:00' },
    { start: '14:00', end: '17:00' }
  ],
  
  // Seating strategy
  seatingStrategy: 'department-wise', // 'alternate' | 'compact' | 'department-wise'
  
  // Teacher assignment
  teachersPerClassroom: 2,
  enableWorkloadBalancing: true,
  
  // Conflict detection
  enableConflictDetection: true,
  conflictResolutionStrategy: 'prevent' // 'prevent' | 'warn' | 'allow'
};
```

### **Performance Parameters**
```javascript
const performanceConfig = {
  // Caching
  cacheEnabled: true,
  cacheTTL: 600000, // 10 minutes
  maxCacheSize: 1000,
  
  // Query optimization
  enableQueryOptimization: true,
  useLeanQueries: true,
  enableIndexing: true,
  
  // Resource monitoring
  enableResourceMonitoring: true,
  memoryThreshold: 0.8,
  cpuThreshold: 0.7,
  connectionThreshold: 100
};
```

---

**This algorithm documentation provides comprehensive information about all algorithms used in the Exam Hall Management System, including their implementation, complexity analysis, and usage examples. These algorithms work together to provide efficient, fair, and conflict-free exam scheduling and management.**
