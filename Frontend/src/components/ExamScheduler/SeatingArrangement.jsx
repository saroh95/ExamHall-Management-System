import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiArrowRight, FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { examSchedulerAPI } from '../../services/examSchedulerAPI';

// Enhanced seating arrangement algorithm with department mixing
// FIXED: Semester format matching now handles both "5" and "Semester 5" formats
function generateSeatingArrangement(students, classroomCapacity, examDetails) {
  console.log(`🎯 generateSeatingArrangement called with:`, {
    studentsCount: students?.length || 0,
    classroomCapacity,
    examDetails
  });
  
  if (!students || students.length === 0) {
    console.log(`🎯 No students provided, returning empty array`);
    return [];
  }

  // Group students by department for mixing
  const studentsByDepartment = {};
  students.forEach(student => {
    const deptId = student.department?._id || student.department || 'unknown';
    const deptName = student.department?.name || student.department?.code || 'Unknown Dept';
    
    if (!studentsByDepartment[deptId]) {
      studentsByDepartment[deptId] = {
        students: [],
        deptName: deptName
      };
    }
    studentsByDepartment[deptId].students.push(student);
  });

  const departmentIds = Object.keys(studentsByDepartment);
  console.log(`🏢 Found students from ${departmentIds.length} departments:`, 
    Object.values(studentsByDepartment).map(dept => `${dept.deptName}: ${dept.students.length}`));

  // Create mixed seating arrangement
  let seatedStudents = [];
  const maxStudents = Math.min(students.length, classroomCapacity || students.length);
  
  if (departmentIds.length >= 2) {
    // Mix students from different departments alternately
    console.log(`🎯 Mixing students from multiple departments`);
    
    // Create alternating pattern: Dept1, Dept2, Dept1, Dept2, etc.
    const deptQueues = departmentIds.map(deptId => [...studentsByDepartment[deptId].students]);
    let currentDeptIndex = 0;
    
    while (seatedStudents.length < maxStudents && deptQueues.some(queue => queue.length > 0)) {
      // Find next department with students
      let attempts = 0;
      while (attempts < departmentIds.length) {
        const currentQueue = deptQueues[currentDeptIndex];
        if (currentQueue.length > 0) {
          const student = currentQueue.shift(); // Remove from front
          seatedStudents.push({
            ...student,
            seatNumber: seatedStudents.length + 1,
            row: Math.floor(seatedStudents.length / 5) + 1,
            column: (seatedStudents.length % 5) + 1
          });
          break;
        }
        currentDeptIndex = (currentDeptIndex + 1) % departmentIds.length;
        attempts++;
      }
      currentDeptIndex = (currentDeptIndex + 1) % departmentIds.length;
    }
    
    console.log(`🎯 Mixed seating: ${seatedStudents.length} students from ${departmentIds.length} departments`);
    
    // Log the mixing pattern for verification
    const seatingPattern = seatedStudents.slice(0, 10).map((student, index) => {
      const deptName = student.department?.name || student.department?.code || 'Unknown';
      return `Seat ${index + 1}: ${deptName}`;
    });
    console.log(`🎯 First 10 seats pattern:`, seatingPattern);
    
  } else {
    // Single department or unknown departments - use random shuffle
    console.log(`🎯 Single department detected, using random shuffle`);
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    
    seatedStudents = shuffledStudents.slice(0, maxStudents).map((student, index) => ({
      ...student,
      seatNumber: index + 1,
      row: Math.floor(index / 5) + 1,
      column: (index % 5) + 1
    }));
  }

  // Final verification of scholar IDs
  const scholarIds = seatedStudents.map(s => s.scholarId).filter(Boolean);
  console.log(`🎯 Generated seating arrangement with ${seatedStudents.length} students, ${scholarIds.length} with scholar IDs`);
  
  if (scholarIds.length > 0) {
    console.log(`📋 Sample scholar IDs:`, scholarIds.slice(0, 5));
  }

  return seatedStudents;
}

const SeatingArrangement = ({
  schedule = [],
  classroomAssignments = [],
  invigilatorAssignments = [],
  seatingArrangements = [],
  setSeatingArrangements,
  nextStep,
  prevStep,
  subjects = [],
  classrooms = [],
  invigilators = [],
  selectedDepartments = [],
  selectedSemesters = []
}) => {
  const [arrangements, setArrangements] = useState(seatingArrangements);
  const [studentsByExam, setStudentsByExam] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSubjects, setLocalSubjects] = useState(subjects);
  const [localClassrooms, setLocalClassrooms] = useState(classrooms);
  const [localInvigilators, setLocalInvigilators] = useState(invigilators);

  // Debug logging for props
  useEffect(() => {
    console.log('🎯 SeatingArrangement received props:', {
      scheduleLength: schedule.length,
      classroomAssignmentsLength: classroomAssignments.length,
      classroomAssignments: classroomAssignments,
      subjectsLength: subjects.length,
      classroomsLength: classrooms.length,
      invigilatorsLength: invigilators.length,
      selectedDepartments: selectedDepartments,
      selectedSemesters: selectedSemesters
    });
    
    if (schedule.length > 0) {
      console.log('🎯 Sample exam from schedule:', schedule[0]);
      console.log('🎯 All schedule subject IDs:', schedule.map(s => s.subjectId));
    }
    
    if (classroomAssignments.length > 0) {
      console.log('🎯 Classroom assignments:', classroomAssignments);
    }
    
    if (subjects.length > 0) {
      console.log('🎯 Sample subjects:', subjects.slice(0, 3));
      console.log('🎯 All subject IDs:', subjects.map(s => ({ _id: s._id, name: s.name })));
    }
    
    if (classrooms.length > 0) {
      console.log('🎯 Sample classrooms:', classrooms.slice(0, 3));
    }
    
    if (invigilators.length > 0) {
      console.log('🎯 Sample invigilators:', invigilators.slice(0, 3).map(i => ({ _id: i._id, name: i.fullName })));
    }
  }, [schedule, classroomAssignments, subjects, classrooms, invigilators, selectedDepartments, selectedSemesters]);

  // Load data if not provided or empty
  useEffect(() => {
    const loadMissingData = async () => {
      try {
        // Load subjects if not provided
        if (!subjects || subjects.length === 0) {
          console.log('🔄 Loading subjects locally...');
          try {
            const { examSchedulerAPI } = await import('../../services/examSchedulerAPI');
            const response = await examSchedulerAPI.getAvailableSubjects();
            if (response.data.success) {
              setLocalSubjects(response.data.data);
              console.log('✅ Loaded subjects locally:', response.data.data.length);
            }
          } catch (error) {
            console.error('❌ Failed to load subjects locally:', error);
          }
        } else {
          setLocalSubjects(subjects);
        }

        // Load classrooms if not provided
        if (!classrooms || classrooms.length === 0) {
          console.log('🔄 Loading classrooms locally...');
          try {
            const { examSchedulerAPI } = await import('../../services/examSchedulerAPI');
            const response = await examSchedulerAPI.getAllClassroomsForAssignment();
            if (response.data.success) {
              setLocalClassrooms(response.data.data);
              console.log('✅ Loaded classrooms locally:', response.data.data.length);
            }
          } catch (error) {
            console.error('❌ Failed to load classrooms locally:', error);
          }
        } else {
          setLocalClassrooms(classrooms);
        }

        // Load invigilators if not provided
        if (!invigilators || invigilators.length === 0) {
          console.log('🔄 Loading invigilators locally...');
          try {
            const { examSchedulerAPI } = await import('../../services/examSchedulerAPI');
            const response = await examSchedulerAPI.getAllTeachersForInvigilation();
            if (response.data.success) {
              setLocalInvigilators(response.data.data);
              console.log('✅ Loaded invigilators locally:', response.data.data.length);
            }
          } catch (error) {
            console.error('❌ Failed to load invigilators locally:', error);
          }
        } else {
          setLocalInvigilators(invigilators);
        }
      } catch (error) {
        console.error('❌ Error loading missing data:', error);
      }
    };

    loadMissingData();
  }, [subjects, classrooms, invigilators]);

  // Enhanced subject lookup with comprehensive ID resolution
  const getSubjectInfo = (subjectId) => {
    console.log('🔍 Looking for subject with ID:', subjectId, typeof subjectId);
    console.log('📚 Available subjects count (props):', subjects?.length);
    console.log('📚 Available subjects count (local):', localSubjects?.length);
    
    const subjectsToUse = localSubjects && localSubjects.length > 0 ? localSubjects : subjects;
    
    if (!subjectId) {
      console.warn('❌ No subject ID provided');
      return { name: 'Subject Not Found', code: 'N/A', _id: subjectId };
    }

    if (!subjectsToUse || subjectsToUse.length === 0) {
      console.warn('❌ No subjects available for lookup');
      return { name: 'Subjects Not Loaded', code: 'LOADING', _id: subjectId };
    }
    
    // Log first few subjects to understand structure
    console.log('📋 Sample subjects:', subjectsToUse.slice(0, 3).map(s => ({ 
      _id: s._id, 
      id: s.id, 
      name: s.name, 
      code: s.code,
      _idType: typeof s._id,
      idType: typeof s.id
    })));
    
    // Try multiple ID formats and comparison methods
    let subject = null;
    
    // Method 1: Direct _id match
    subject = subjectsToUse.find(s => s._id === subjectId);
    if (subject) {
      console.log('✅ Found subject by direct _id match:', subject.name);
      return subject;
    }
    
    // Method 2: String comparison of _id
    subject = subjectsToUse.find(s => String(s._id) === String(subjectId));
    if (subject) {
      console.log('✅ Found subject by string _id match:', subject.name);
      return subject;
    }
    
    // Method 3: Direct id field match
    subject = subjectsToUse.find(s => s.id === subjectId);
    if (subject) {
      console.log('✅ Found subject by direct id match:', subject.name);
      return subject;
    }
    
    // Method 4: String comparison of id field
    subject = subjectsToUse.find(s => String(s.id) === String(subjectId));
    if (subject) {
      console.log('✅ Found subject by string id match:', subject.name);
      return subject;
    }
    
    // Method 5: Try ObjectId string conversion (handles MongoDB ObjectId format)
    if (typeof subjectId === 'string' && subjectId.length === 24) {
      subject = subjectsToUse.find(s => 
        (s._id && s._id.toString() === subjectId) ||
        (s.id && s.id.toString() === subjectId)
      );
      if (subject) {
        console.log('✅ Found subject by ObjectId string conversion:', subject.name);
        return subject;
      }
    }
    
    // Method 6: Name or code matching (fallback)
    if (typeof subjectId === 'string') {
      subject = subjectsToUse.find(s => 
        (s.name && s.name.toLowerCase() === subjectId.toLowerCase()) ||
        (s.code && s.code.toLowerCase() === subjectId.toLowerCase())
      );
      if (subject) {
        console.log('✅ Found subject by name/code match:', subject.name);
        return subject;
      }
    }
    
    // Method 7: Partial matching for debugging
    const partialMatches = subjectsToUse.filter(s => 
      (s.name && s.name.toLowerCase().includes(String(subjectId).toLowerCase())) ||
      (s.code && s.code.toLowerCase().includes(String(subjectId).toLowerCase()))
    );
    
    if (partialMatches.length > 0) {
      console.log('🔍 Partial matches found:', partialMatches.map(s => ({ name: s.name, code: s.code })));
    }
    
    console.warn('❌ Subject not found! Searched ID:', subjectId);
    console.warn('📊 Available subject IDs:', subjectsToUse.map(s => ({ _id: s._id, id: s.id, name: s.name, code: s.code })));
    
    return { 
      name: 'Unknown Subject', 
      code: 'UNKNOWN', 
      _id: subjectId,
      error: `Subject ID: ${subjectId} - Check if subject exists in database`
    };
  };

  // Enhanced classroom lookup with conflict detection
  const getClassroomInfo = (classroomId) => {
    console.log('🔍 Looking for classroom with ID:', classroomId);
    
    const classroomsToUse = localClassrooms && localClassrooms.length > 0 ? localClassrooms : classrooms;
    console.log('🏢 Available classrooms:', classroomsToUse?.map(c => ({ _id: c._id, name: c.name, capacity: c.capacity })));
    
    if (!classroomId) {
      console.log('⚠️ No classroom ID provided');
      return { name: 'No Classroom Assigned', capacity: 50 };
    }
    
    // Try multiple ID formats
    let classroom = null;
    
    // First try exact _id match
    classroom = classroomsToUse?.find(c => c._id === classroomId);
    
    // If not found, try string comparison
    if (!classroom) {
      classroom = classroomsToUse?.find(c => String(c._id) === String(classroomId));
    }
    
    // If still not found, try id field
    if (!classroom) {
      classroom = classroomsToUse?.find(c => c.id === classroomId);
    }
    
    // If still not found, try string comparison with id field
    if (!classroom) {
      classroom = classroomsToUse?.find(c => String(c.id) === String(classroomId));
    }
    
    console.log('✅ Found classroom:', classroom);
    
    if (!classroom) {
      console.warn('❌ Classroom not found! Available classrooms:', classroomsToUse?.map(c => ({ _id: c._id, id: c.id, name: c.name, capacity: c.capacity })));
      return { name: 'Classroom Not Found', capacity: 50 };
    }
    
    return classroom;
  };

  // Enhanced invigilator lookup with comprehensive teacher information
  const getInvigilatorInfo = (invigilatorId) => {
    if (!invigilatorId) {
      return { 
        name: 'Not Assigned',
        fullName: 'Not Assigned',
        employeeId: '',
        designation: '',
        workload: 0,
        department: ''
      };
    }
    
    // Find the teacher/invigilator in the available list
    const invigilatorsToUse = localInvigilators && localInvigilators.length > 0 ? localInvigilators : invigilators;
    const teacher = invigilatorsToUse.find(inv => 
      inv._id === invigilatorId || 
      String(inv._id) === String(invigilatorId) ||
      (inv._id && inv._id.toString() === invigilatorId)
    );
    
    if (teacher) {
      return {
        name: teacher.fullName,
        fullName: teacher.fullName,
        employeeId: teacher.employeeId,
        designation: teacher.designation || 'Invigilator',
        workload: teacher.workload || 0,
        department: teacher.department?.name || teacher.department || 'Unknown'
      };
    }
    
    return { 
      name: `Teacher (${invigilatorId})`,
      fullName: `Teacher (${invigilatorId})`,
      employeeId: invigilatorId,
      designation: 'Invigilator',
      workload: 1,
      department: 'Unknown'
    };
  };

  // Check for classroom conflicts
  const checkClassroomConflicts = () => {
    const conflicts = [];
    const classroomUsage = {};
    
    schedule.forEach((exam, index) => {
      const classroomId = classroomAssignments[index];
      if (classroomId) {
        const date = exam.date;
        const timeSlot = exam.timeSlot;
        const key = `${classroomId}-${date}-${timeSlot}`;
        
        if (classroomUsage[key]) {
          conflicts.push({
            classroomId,
            date,
            timeSlot,
            conflictingExams: [classroomUsage[key], index]
          });
        } else {
          classroomUsage[key] = index;
        }
      }
    });
    
    return conflicts;
  };

  // Fetch students for each exam based on departments and semesters
  useEffect(() => {
    const fetchStudentsForExams = async () => {
      console.log('🔍 Fetching students with:', { 
        selectedDepartments, 
        selectedSemesters, 
        schedule: schedule.length,
        subjects: subjects.length,
        classrooms: classrooms.length,
        classroomAssignments: classroomAssignments
      });
      
      console.log('🔍 Debug info:', {
        selectedDepartmentsType: typeof selectedDepartments[0],
        selectedSemestersType: typeof selectedSemesters[0],
        selectedDepartmentsValues: selectedDepartments,
        selectedSemestersValues: selectedSemesters
      });
      
      console.log('🔍 CRITICAL DEBUG - Starting student fetch process...');
      
      if (!schedule.length || !selectedDepartments.length || !selectedSemesters.length) {
        console.log('⚠️ Missing required data for student fetching');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🏛️ LOADING REAL STUDENTS from database...');
        
        const studentsData = {};
        let allRealStudents = [];
        
        // Try to fetch real students using the working API endpoint
        try {
          console.log('📡 Attempting to fetch real students...');
          console.log('🔍 Current selectedDepartments:', selectedDepartments);
          console.log('🔍 Current selectedSemesters:', selectedSemesters);
          
          // Get authentication token
          const token = localStorage.getItem('token');
          console.log('🔑 Token available:', !!token);
          
          // Try the exam scheduler specific endpoint (no auth required)
          console.log('🌐 Calling API: /api/students/for-exam-scheduler?isActive=true&limit=2000');
          const response = await fetch('/api/students/for-exam-scheduler?isActive=true&limit=2000', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Students API Response Status:', response.status);
          console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            const data = await response.json();
            console.log('📊 Students API Response:', data);
            console.log('📊 Response data type:', typeof data);
            console.log('📊 Response data keys:', Object.keys(data));
            
            if (data.success && data.data && data.data.length > 0) {
              allRealStudents = data.data;
              console.log(`🎉 SUCCESS! Loaded ${allRealStudents.length} real students from database`);
              console.log('📋 Sample real students:', allRealStudents.slice(0, 3).map(s => ({
                name: s.fullName,
                scholarId: s.scholarId,
                semester: s.semester,
                department: s.department
              })));
              
                             // Log the first few students' semester format
               console.log('🔍 First 5 students semester format:');
               allRealStudents.slice(0, 5).forEach((s, i) => {
                 console.log(`  ${i+1}. ${s.fullName}: semester="${s.semester}" (type: ${typeof s.semester})`);
               });
               
               // Log unique semester values found in database
               const uniqueSemesters = [...new Set(allRealStudents.map(s => s.semester))];
               console.log('🔍 Unique semester values in database:', uniqueSemesters);
               console.log('🔍 Selected semesters from frontend:', selectedSemesters);
               
               // Show which semesters will be filtered out
               const semestersToFilterOut = uniqueSemesters.filter(sem => {
                 return !selectedSemesters.some(selected => {
                   const targetSemester = `Semester ${selected}`;
                   const targetSemesterNumber = selected;
                   
                   return sem === targetSemester ||           // "Semester 5" === "Semester 5"
                          sem === targetSemesterNumber ||     // "5" === "5"
                          String(sem) === String(targetSemesterNumber) || // "5" === "5" (string comparison)
                          (typeof sem === 'string' && sem.includes(targetSemesterNumber)) || // "Semester 5".includes("5")
                          (typeof sem === 'string' && sem.endsWith(targetSemesterNumber)); // "Semester 5".endsWith("5")
                 });
               });
               
               if (semestersToFilterOut.length > 0) {
                 console.log(`🚫 SEMESTERS THAT WILL BE FILTERED OUT:`, semestersToFilterOut);
                 console.log(`🚫 Students from these semesters will NOT appear in seating arrangement`);
               } else {
                 console.log(`✅ All semesters in database match selected semesters`);
               }
            } else {
              console.warn('❌ Students API returned no data:', data);
              console.warn('❌ Data structure:', {
                success: data.success,
                hasData: !!data.data,
                dataLength: data.data ? data.data.length : 'undefined',
                message: data.message
              });
              throw new Error('No student data received');
            }
          } else {
            console.error('❌ Students API failed with status:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`API failed with status ${response.status}`);
          }
        } catch (apiError) {
          console.error('❌ API Error:', apiError);
          
          // Fallback: Try using examSchedulerAPI
          console.log('🔄 Trying examSchedulerAPI fallback...');
          try {
            const { studentAPI } = await import('../../services/api');
            const fallbackResponse = await studentAPI.getStudents({ isActive: true, limit: 2000 });
            
            if (fallbackResponse.data.success && fallbackResponse.data.data) {
              allRealStudents = fallbackResponse.data.data;
              console.log(`🎉 FALLBACK SUCCESS! Loaded ${allRealStudents.length} real students`);
            } else {
              throw new Error('Fallback API also failed');
            }
          } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            throw new Error('All API attempts failed');
          }
        }
        
        if (allRealStudents.length > 0) {
          console.log('🎯 Organizing students by department and semester for specific subject filtering...');
          
          // Store all students for general access
          studentsData['all-students'] = allRealStudents;
          
          // Create department-semester combinations for quick lookup
          console.log('🔍 Creating department-semester combinations...');
          console.log('🔍 selectedDepartments:', selectedDepartments);
          console.log('🔍 selectedSemesters:', selectedSemesters);
          
          for (const deptId of selectedDepartments) {
            for (const semester of selectedSemesters) {
              const key = `${deptId}-${semester}`;
              console.log(`🔍 Processing key: ${key}`);
              
              const filteredStudents = allRealStudents.filter(student => {
                // Check department match
                const studentDeptId = student.department?._id || student.department;
                const matchesDept = studentDeptId === deptId || 
                                  String(studentDeptId) === String(deptId);
                
                // Check semester match - handle both formats: "5" and "Semester 5"
                const studentSemester = student.semester;
                const targetSemester = `Semester ${semester}`;
                const targetSemesterNumber = semester;
                
                // Try multiple semester matching strategies
                const matchesSemester = 
                  studentSemester === targetSemester ||           // "Semester 5" === "Semester 5"
                  studentSemester === targetSemesterNumber ||     // "5" === "5"
                  String(studentSemester) === String(targetSemesterNumber) || // "5" === "5" (string comparison)
                  (typeof studentSemester === 'string' && studentSemester.includes(targetSemesterNumber)) || // "Semester 5".includes("5")
                  (typeof studentSemester === 'string' && studentSemester.endsWith(targetSemesterNumber)); // "Semester 5".endsWith("5")
                
                console.log(`🔍 Student ${student.fullName}: dept=${studentDeptId} (${matchesDept ? '✅' : '❌'}), semester="${studentSemester}" vs target="${targetSemesterNumber}" (${matchesSemester ? '✅' : '❌'})`);
                
                return matchesDept && matchesSemester;
              });
              
              studentsData[key] = filteredStudents;
              console.log(`📋 Filtered ${filteredStudents.length} real students for ${key} (${deptId} - Semester ${semester})`);
              
              if (filteredStudents.length > 0) {
                console.log('🎉 SUCCESS! Found real students with improved filtering logic');
                console.log('📋 Sample filtered student:', {
                  name: filteredStudents[0].fullName,
                  scholarId: filteredStudents[0].scholarId,
                  semester: filteredStudents[0].semester,
                  department: filteredStudents[0].department?.name || 'Unknown'
                });
              } else {
                console.log(`⚠️ No students found for ${key} - checking if this is a data format issue...`);
                console.log(`🔍 Debug: Looking for dept=${deptId}, semester=${semester}`);
                console.log(`🔍 Debug: Available students have these semesters:`, [...new Set(allRealStudents.map(s => s.semester))]);
              }
            }
          }
          
          console.log(`🏛️ Successfully loaded and organized ${allRealStudents.length} real students from database!`);
        } else {
          throw new Error('No real students could be loaded');
        }

        console.log('📊 Final students data:', studentsData);
        console.log('📊 Students data keys:', Object.keys(studentsData));
        Object.entries(studentsData).forEach(([key, students]) => {
          console.log(`📊 ${key}: ${students.length} students`);
        });
        
        setStudentsByExam(studentsData);
      } catch (error) {
        console.error('❌ Error loading real students:', error);
        setError('Unable to load real student data from database. This might be due to semester format mismatch. Using sample data for demonstration. Check browser console for detailed debugging info.');
        
        // Create realistic sample students as final fallback (based on real database structure)
        console.log('🧪 Creating sample students as final fallback (real database structure)...');
        const sampleStudents = [
          { _id: 'sample1', scholarId: 'CE2025001', fullName: 'Aarav Kumar', personalEmail: 'aarav.kumar@college.edu', department: { _id: selectedDepartments[0] || '68a23ab530645dd6418e4b04', name: 'Civil Engineering', code: 'CE' }, semester: `Semester ${selectedSemesters[0] || 5}`, section: 'A', isActive: true },
          { _id: 'sample2', scholarId: 'CE2025002', fullName: 'Vivaan Singh', personalEmail: 'vivaan.singh@college.edu', department: { _id: selectedDepartments[0] || '68a23ab530645dd6418e4b04', name: 'Civil Engineering', code: 'CE' }, semester: `Semester ${selectedSemesters[0] || 5}`, section: 'A', isActive: true },
          { _id: 'sample3', scholarId: 'CE2026003', fullName: 'Aditya Sharma', personalEmail: 'aditya.sharma@college.edu', department: { _id: selectedDepartments[0] || '68a23ab530645dd6418e4b04', name: 'Civil Engineering', code: 'CE' }, semester: `Semester ${selectedSemesters[0] || 5}`, section: 'B', isActive: true },
          { _id: 'sample4', scholarId: 'CE2027004', fullName: 'Vihaan Patel', personalEmail: 'vihaan.patel@college.edu', department: { _id: selectedDepartments[0] || '68a23ab530645dd6418e4b04', name: 'Civil Engineering', code: 'CE' }, semester: `Semester ${selectedSemesters[0] || 5}`, section: 'A', isActive: true },
          { _id: 'sample5', scholarId: 'CE2024005', fullName: 'Arjun Gupta', personalEmail: 'arjun.gupta@college.edu', department: { _id: selectedDepartments[0] || '68a23ab530645dd6418e4b04', name: 'Civil Engineering', code: 'CE' }, semester: `Semester ${selectedSemesters[0] || 5}`, section: 'B', isActive: true }
        ];
        
        // Extend with more sample students to fill classroom
        const extendedSampleStudents = [];
        for (let i = 0; i < 40; i++) {
          const baseStudent = sampleStudents[i % sampleStudents.length];
          extendedSampleStudents.push({
            ...baseStudent,
            _id: `sample${i + 1}`,
            scholarId: `CE${2024 + (i % 4)}${String(i + 1).padStart(3, '0')}`,
            fullName: `${baseStudent.fullName.split(' ')[0]} ${baseStudent.fullName.split(' ')[1]} ${i + 1}`,
            personalEmail: `student${i + 1}@college.edu`
          });
        }
        
        const studentsData = {};
        const key = `${selectedDepartments[0] || '68a23ab530645dd6418e4b04'}-${selectedSemesters[0] || 5}`;
        studentsData[key] = extendedSampleStudents;
        studentsData['all-students'] = extendedSampleStudents;
        
        console.log('🧪 Final fallback with sample students:', extendedSampleStudents.length);
        console.log('🧪 Sample student:', extendedSampleStudents[0]);
        setStudentsByExam(studentsData);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsForExams();
  }, [schedule, selectedDepartments, selectedSemesters]);

     // Enhanced generate seating arrangement for each exam with mixed departments
   const generateArrangement = (exam, index) => {
     console.log(`🎯 Exam ${index} data:`, exam);
     console.log(`🎯 Exam ${index} subjectId:`, exam.subjectId);
     
     // Use classroom assignment from props, or fallback to exam data
     const classroomId = classroomAssignments[index] || exam.classroomId;
     const classroom = getClassroomInfo(classroomId);
     const subject = getSubjectInfo(exam.subjectId);
     
     console.log(`🎯 Generating arrangement for exam ${index}:`, {
       exam,
       classroomId,
       classroom,
       subject,
       selectedDepartments,
       selectedSemesters
     });
     
     // CRITICAL: Validate that we only work with students from selected semester
     console.log(`🔒 SEMESTER VALIDATION: Only allowing students from semester(s): ${selectedSemesters}`);
     console.log(`🔒 This ensures NO students from other semesters (1,2,3,4,6,7,8) will appear in seating arrangement`);
     
                // ENHANCED LOGIC: Proper filtering based on semester AND subject-department matching
      let examStudents = [];
      
      // Find the subject to get its department and semester
      const subjectsToUse = localSubjects && localSubjects.length > 0 ? localSubjects : subjects;
      const examSubject = subjectsToUse.find(s => {
        return s._id === exam.subjectId || 
               String(s._id) === String(exam.subjectId) ||
               s.id === exam.subjectId ||
               String(s.id) === String(exam.subjectId) ||
               s.name === exam.subjectId ||
               s.code === exam.subjectId;
      });
      
      // Initialize variables that will be used throughout the function
      let subjectDeptId = null;
      let subjectSemester = null;
      let isCommonSubject = false;
      
      if (examSubject) {
        console.log(`📚 Found exam subject:`, examSubject);
        
        // Get subject details for proper filtering
        subjectDeptId = examSubject.department || examSubject.departmentId?.[0];
        subjectSemester = examSubject.semesterId || examSubject.semester;
        isCommonSubject = examSubject.isCommon || examSubject.type === 'common';
        
        console.log(`🔍 Subject details:`, {
          name: examSubject.name,
          department: subjectDeptId,
          semester: subjectSemester,
          isCommon: isCommonSubject,
          sharedWith: examSubject.sharedWith
        });
        
        if (isCommonSubject) {
          // For common subjects (like Mathematics, English), get students from ALL selected departments
          // BUT ONLY from the selected semester
          console.log(`🌐 Common subject - getting students from ALL selected departments (ONLY selected semester)`);
          
          for (const deptId of selectedDepartments) {
            for (const semester of selectedSemesters) {
              const key = `${deptId}-${semester}`;
              if (studentsByExam[key] && Array.isArray(studentsByExam[key])) {
                examStudents.push(...studentsByExam[key]);
                console.log(`👥 Added ${studentsByExam[key].length} students from ${key} for common subject`);
              }
            }
          }
          
          // Log department distribution for verification
          const deptDistribution = {};
          examStudents.forEach(student => {
            const deptName = student.department?.name || student.department?.code || 'Unknown';
            deptDistribution[deptName] = (deptDistribution[deptName] || 0) + 1;
          });
          console.log(`📊 Department distribution for common subject:`, deptDistribution);
          
        } else {
          // For department-specific subjects, ONLY get students from the relevant department
          // AND ONLY from the correct semester
          console.log(`🏢 Department-specific subject - ONLY students from department: ${subjectDeptId}, semester: ${subjectSemester}`);
          
          if (subjectDeptId && subjectSemester) {
            // First, try to get students from the subject's specific department and semester
            const primaryKey = `${subjectDeptId}-${subjectSemester}`;
            console.log(`🎯 Looking for students with key: ${primaryKey}`);
            
            if (studentsByExam[primaryKey] && Array.isArray(studentsByExam[primaryKey])) {
              examStudents = [...studentsByExam[primaryKey]];
              console.log(`👥 Found ${examStudents.length} students from primary department: ${primaryKey}`);
            } else {
              console.log(`⚠️ No students found for key: ${primaryKey}`);
              
              // Fallback: Look for students in the selected semester from the subject's department
              for (const semester of selectedSemesters) {
                const fallbackKey = `${subjectDeptId}-${semester}`;
                if (studentsByExam[fallbackKey] && Array.isArray(studentsByExam[fallbackKey])) {
                  examStudents = [...studentsByExam[fallbackKey]];
                  console.log(`👥 Fallback: Found ${examStudents.length} students from ${fallbackKey}`);
                  break;
                }
              }
            }
            
            // Add students from shared departments (same semester only)
            if (examSubject.sharedWith && examSubject.sharedWith.trim() !== '') {
              const sharedDepts = examSubject.sharedWith.split(',').map(d => d.trim());
              console.log(`🤝 Adding students from shared departments (same semester):`, sharedDepts);
              
              sharedDepts.forEach(sharedDept => {
                const sharedKey = `${sharedDept}-${subjectSemester}`;
                if (studentsByExam[sharedKey] && Array.isArray(studentsByExam[sharedKey])) {
                  const sharedStudents = studentsByExam[sharedKey];
                  examStudents.push(...sharedStudents);
                  console.log(`👥 Added ${sharedStudents.length} students from shared dept: ${sharedDept} (Semester: ${subjectSemester})`);
                }
              });
            }
            
          } else {
            console.log(`⚠️ Subject missing department or semester info, using fallback logic`);
            // Fallback: Only get students from selected semester
            for (const deptId of selectedDepartments) {
              for (const semester of selectedSemesters) {
                const key = `${deptId}-${semester}`;
                if (studentsByExam[key] && Array.isArray(studentsByExam[key])) {
                  examStudents.push(...studentsByExam[key]);
                  console.log(`👥 Fallback: Added ${studentsByExam[key].length} students from ${key}`);
                }
              }
            }
          }
        }
        
      } else {
        console.log(`⚠️ Subject not found for exam ${index}, using strict semester filtering only`);
        // Subject not found - ONLY use students from the selected semester
        for (const deptId of selectedDepartments) {
          for (const semester of selectedSemesters) {
            const key = `${deptId}-${semester}`;
            if (studentsByExam[key] && Array.isArray(studentsByExam[key])) {
              examStudents.push(...studentsByExam[key]);
              console.log(`👥 Added ${studentsByExam[key].length} students from ${key} (strict semester filtering)`);
            }
          }
        }
      }
      
      // CRITICAL: Final validation - ensure ONLY students from selected semester are included
      const originalCount = examStudents.length;
      examStudents = examStudents.filter(student => {
        const studentSemester = student.semester;
        
        // Check if student is from any of the selected semesters
        const isFromSelectedSemester = selectedSemesters.some(selectedSemester => {
          const targetSemester = `Semester ${selectedSemester}`;
          const targetSemesterNumber = selectedSemester;
          
          return studentSemester === targetSemester ||           // "Semester 5" === "Semester 5"
                 studentSemester === targetSemesterNumber ||     // "5" === "5"
                 String(studentSemester) === String(targetSemesterNumber) || // "5" === "5" (string comparison)
                 (typeof studentSemester === 'string' && studentSemester.includes(targetSemesterNumber)) || // "Semester 5".includes("5")
                 (typeof studentSemester === 'string' && studentSemester.endsWith(targetSemesterNumber)); // "Semester 5".endsWith("5")
        });
        
        if (!isFromSelectedSemester) {
          console.log(`🚫 FILTERING OUT: ${student.fullName} - wrong semester: "${studentSemester}" (not in selected: ${selectedSemesters})`);
        }
        
        return isFromSelectedSemester;
      });
      
      if (originalCount !== examStudents.length) {
        console.log(`🔍 Semester filtering: ${originalCount} → ${examStudents.length} students (removed ${originalCount - examStudents.length} wrong semester students)`);
      }
      
      // Additional validation: For department-specific subjects, ensure students are from relevant departments
      if (examSubject && !isCommonSubject && subjectDeptId) {
        const beforeDeptFilter = examStudents.length;
        examStudents = examStudents.filter(student => {
          const studentDeptId = student.department?._id || student.department;
          const isFromRelevantDept = studentDeptId === subjectDeptId || 
                                    String(studentDeptId) === String(subjectDeptId) ||
                                    (examSubject.sharedWith && examSubject.sharedWith.includes(String(studentDeptId)));
          
          if (!isFromRelevantDept) {
            console.log(`🚫 FILTERING OUT: ${student.fullName} - wrong department: ${student.department?.name} (subject requires: ${subjectDeptId})`);
          }
          
          return isFromRelevantDept;
        });
        
        if (beforeDeptFilter !== examStudents.length) {
          console.log(`🔍 Department filtering: ${beforeDeptFilter} → ${examStudents.length} students (removed ${beforeDeptFilter - examStudents.length} wrong department students)`);
        }
      }
    
         // Remove duplicates based on scholarId
     const uniqueStudents = examStudents.filter((student, index, self) => 
       index === self.findIndex(s => s.scholarId === student.scholarId)
     );
     
     // CRITICAL: Ensure ONLY students from selected semester are included
     let semesterFilteredStudents = uniqueStudents.filter(student => {
       const studentSemester = student.semester;
       
       // Check if student is from any of the selected semesters
       const isFromSelectedSemester = selectedSemesters.some(selectedSemester => {
         const targetSemester = `Semester ${selectedSemester}`;
         const targetSemesterNumber = selectedSemester;
         
         return studentSemester === targetSemester ||           // "Semester 5" === "Semester 5"
                studentSemester === targetSemesterNumber ||     // "5" === "5"
                String(studentSemester) === String(targetSemesterNumber) || // "5" === "5" (string comparison)
                (typeof studentSemester === 'string' && studentSemester.includes(targetSemesterNumber)) || // "Semester 5".includes("5")
                (typeof studentSemester === 'string' && studentSemester.endsWith(targetSemesterNumber)); // "Semester 5".endsWith("5")
       });
       
       if (!isFromSelectedSemester) {
         console.log(`🚫 Filtering out student ${student.fullName} - wrong semester: ${studentSemester} (not in selected: ${selectedSemesters})`);
       }
       
       return isFromSelectedSemester;
     });
     
     console.log(`🔍 Semester filtering: ${uniqueStudents.length} → ${semesterFilteredStudents.length} students (only selected semester)`);
     
     // FINAL VALIDATION: Double-check that no wrong semester students slipped through
     const wrongSemesterStudents = semesterFilteredStudents.filter(student => {
       const studentSemester = student.semester;
       const isFromSelectedSemester = selectedSemesters.some(selectedSemester => {
         const targetSemester = `Semester ${selectedSemester}`;
         const targetSemesterNumber = selectedSemester;
         
         return studentSemester === targetSemester ||           // "Semester 5" === "Semester 5"
                studentSemester === targetSemesterNumber ||     // "5" === "5"
                String(studentSemester) === String(targetSemesterNumber) || // "5" === "5" (string comparison)
                (typeof studentSemester === 'string' && studentSemester.includes(targetSemesterNumber)) || // "Semester 5".includes("5")
                (typeof studentSemester === 'string' && studentSemester.endsWith(targetSemesterNumber)); // "Semester 5".endsWith("5")
       });
       
       return !isFromSelectedSemester;
     });
     
     if (wrongSemesterStudents.length > 0) {
       console.error(`🚨 CRITICAL ERROR: Found ${wrongSemesterStudents.length} students from wrong semester!`);
       wrongSemesterStudents.forEach(s => {
         console.error(`🚨 Wrong semester student: ${s.fullName} - Semester: "${s.semester}" (should be from: ${selectedSemesters})`);
       });
       // Remove wrong semester students
       semesterFilteredStudents = semesterFilteredStudents.filter(student => !wrongSemesterStudents.includes(student));
       console.log(`🚨 Removed ${wrongSemesterStudents.length} wrong semester students. Final count: ${semesterFilteredStudents.length}`);
     } else {
       console.log(`✅ SEMESTER VALIDATION PASSED: All ${semesterFilteredStudents.length} students are from correct semester(s): ${selectedSemesters}`);
     }
     
     // Verify department mixing
     const departmentCounts = {};
     semesterFilteredStudents.forEach(student => {
       const deptName = student.department?.name || student.department?.code || 'Unknown';
       departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
     });
     
     console.log(`👥 Final students for exam ${index}: ${semesterFilteredStudents.length} students from departments:`, departmentCounts);
    
    // Use classroom capacity from the classroom object or fallback to exam data
    const classroomCapacity = classroom.capacity || exam.classroomCapacity || 50;
    
         const result = generateSeatingArrangement(semesterFilteredStudents, classroomCapacity, {
       subject: subject,
       exam: exam
     });
     
     console.log(`✅ Generated arrangement with ${result.length} students mixed from ${Object.keys(departmentCounts).length} departments (ONLY from selected semester: ${selectedSemesters})`);
     return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for classroom conflicts before proceeding
    const conflicts = checkClassroomConflicts();
    if (conflicts.length > 0) {
      setError(`Classroom conflicts detected: ${conflicts.length} exams have conflicting classroom assignments. Please resolve in the previous step.`);
      return;
    }
    
    const allArrangements = schedule.map((exam, index) => {
      const classroom = getClassroomInfo(classroomAssignments[index]);
      const invigilator = getInvigilatorInfo(invigilatorAssignments[index]);
      const students = generateArrangement(exam, index);
      
      return {
        ...exam,
        classroomId: classroomAssignments[index],
        classroomName: classroom.name,
        invigilatorId: invigilatorAssignments[index],
        invigilatorName: invigilator.name,
        students: students,
        totalStudents: students.length,
        seatingChart: generateSeatingChart(students, classroom.capacity)
      };
    });
    setArrangements(allArrangements);
    setSeatingArrangements(allArrangements);
    nextStep();
  };

  // Generate seating chart layout
  const generateSeatingChart = (students, capacity) => {
    console.log(`🎯 Generating seating chart for ${students.length} students with capacity ${capacity}`);
    
    // If no students, show empty classroom
    if (!students || students.length === 0) {
      console.log(`🎯 No students, showing empty classroom layout`);
      const rows = Math.ceil((capacity || 50) / 5);
      const chart = [];
      
      for (let row = 1; row <= rows; row++) {
        const rowSeats = [];
        for (let col = 1; col <= 5; col++) {
          const seatIndex = (row - 1) * 5 + (col - 1);
          rowSeats.push({
            seatNumber: seatIndex + 1,
            row: row,
            column: col,
            student: null
          });
        }
        chart.push(rowSeats);
      }
      
      return chart;
    }
    
    // Use actual capacity or fallback to accommodate all students
    const actualCapacity = capacity || Math.max(students.length, 50);
    const rows = Math.ceil(actualCapacity / 5);
    const chart = [];
    
    console.log(`🎯 Creating ${rows} rows with 5 columns each for capacity ${actualCapacity}`);
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let col = 1; col <= 5; col++) {
        const seatIndex = (row - 1) * 5 + (col - 1);
        const student = students[seatIndex];
        
        rowSeats.push({
          seatNumber: seatIndex + 1,
          row: row,
          column: col,
          student: student || null
        });
      }
      chart.push(rowSeats);
    }
    
    console.log(`🎯 Generated seating chart with ${chart.length} rows and ${actualCapacity} total seats`);
    return chart;
  };

     const printSchedule = () => {
     const printContent = document.getElementById('printableSeating');
     const printWindow = window.open('', '', 'width=900,height=700');
     printWindow.document.write(`
       <html>
       <head>
         <title>Seating Arrangement - Exam Security</title>
         <style>
           body { font-family: Arial, sans-serif; padding: 2em; }
           .session { page-break-inside: avoid; margin-bottom: 2em; }
           .seats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
           .seat { border: 1px solid #ddd; padding: 4px; font-size: 10px; }
           h4 { margin-bottom: 4px; }
           .meta { margin-bottom: 8px; font-size: 12px; }
           .security-notice { 
             background-color: #fef3c7; 
             border: 1px solid #f59e0b; 
             padding: 10px; 
             margin: 10px 0; 
             border-radius: 5px; 
             font-size: 12px; 
             color: #92400e;
           }
         </style>
       </head>
       <body>
         <h3>Seating Arrangement - Exam Security</h3>
         <div class="security-notice">
           <strong>🔒 SECURITY NOTICE:</strong> This document is for exam administration only. 
           Invigilator information is intentionally hidden from students for exam security.
         </div>
         ${printContent.innerHTML}
       </body>
       </html>
     `);
     printWindow.document.close();
     printWindow.focus();
     printWindow.print();
   };

  // Check for classroom conflicts
  const classroomConflicts = checkClassroomConflicts();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
             <div>
         <h3 className="text-2xl font-bold text-gray-800 mb-2">Seating Arrangement with Scholar IDs</h3>
         <p className="text-sm text-gray-600">
           Students are automatically assigned seats based on classroom capacity. Real scholar IDs are used when available.
         </p>
                   {selectedSemesters.length > 0 && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 text-sm font-medium">
                  🔒 STRICT SEMESTER FILTERING: Only students from {selectedSemesters.map(s => `Semester ${s}`).join(', ')} will appear
                </span>
              </div>
              <div className="mt-1 text-green-700 text-xs">
                ✅ Students from other semesters (1,2,3,4,6,7,8) are automatically filtered out
              </div>
              <div className="mt-2 text-green-700 text-xs">
                🏢 <strong>Department Distribution:</strong> Students will be pulled from ALL selected departments for proper mixing
              </div>
              <div className="mt-2 text-green-700 text-xs">
                📚 <strong>Subject-Department Matching:</strong> Students will only appear for subjects relevant to their department
              </div>
              <div className="mt-2 text-green-700 text-xs">
                🌐 <strong>Common Subjects:</strong> All departments can take common subjects (Math, English, etc.)
              </div>
              <div className="mt-2 text-green-700 text-xs">
                🏢 <strong>Department-Specific Subjects:</strong> Only students from the relevant department will appear
              </div>
              {Object.keys(studentsByExam).length > 0 && (
                <div className="mt-2 text-green-700 text-xs">
                  📊 <strong>Available Students:</strong> {(() => {
                    const summary = [];
                    Object.entries(studentsByExam).forEach(([key, students]) => {
                      if (key !== 'all-students' && students.length > 0) {
                        const [deptId, semester] = key.split('-');
                        const deptName = students[0]?.department?.name || students[0]?.department?.code || 'Unknown';
                        summary.push(`${deptName} (Sem ${semester}): ${students.length}`);
                      }
                    });
                    return summary.join(', ');
                  })()}
                </div>
              )}
            </div>
          )}
         
         {/* Security Notice */}
         <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
           <div className="flex items-center">
             <svg className="w-4 h-4 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
             </svg>
             <span className="text-amber-800 text-sm font-medium">
               🔒 EXAM SECURITY: Invigilator information is hidden from students
             </span>
           </div>
           <div className="mt-1 text-amber-700 text-xs">
             ⚠️ Students cannot see which teachers are assigned as invigilators for exam security
           </div>
         </div>
       </div>

      {/* Classroom Conflicts Warning */}
      {classroomConflicts.length > 0 && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Classroom Assignment Conflicts Detected</span>
          </div>
          <p className="text-sm mb-2">
            The following exams have conflicting classroom assignments (same classroom, same time):
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            {classroomConflicts.map((conflict, idx) => {
              const exam1 = schedule[conflict.conflictingExams[0]];
              const exam2 = schedule[conflict.conflictingExams[1]];
              const classroom = getClassroomInfo(conflict.classroomId);
              return (
                <li key={idx}>
                  <strong>{exam1?.subjectName || 'Unknown Subject'}</strong> and{' '}
                  <strong>{exam2?.subjectName || 'Unknown Subject'}</strong> - 
                  {classroom.name} on {conflict.date} at {conflict.timeSlot}
                </li>
              );
            })}
          </ul>
          <p className="text-sm mt-2 text-red-600">
            Please go back to the Classroom Assignment step and resolve these conflicts before proceeding.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student data and generating seating arrangements...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div id="printableSeating" className="space-y-6">
        {schedule.map((exam, index) => {
          const subject = getSubjectInfo(exam.subjectId);
          const classroom = getClassroomInfo(classroomAssignments[index]);
          const invigilator = getInvigilatorInfo(invigilatorAssignments[index]);
          const students = arrangements[index]?.students || generateArrangement(exam, index);
          const seatingChart = arrangements[index]?.seatingChart || generateSeatingChart(students, classroom.capacity);

          return (
            <div key={`${exam.date}-${index}`} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {subject.name === 'Subject Not Found' ? (
                    <span className="text-red-600">Subject Not Found</span>
                  ) : (
                    `${subject.name} (${subject.code})`
                  )}
                </h4>
                {subject.name === 'Subject Not Found' && (
                  <div className="text-red-500 text-sm mt-1">
                    Subject ID: {exam.subjectId} - Check if subject exists in database
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                    {exam.date}
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                    {exam.timeSlot}
                  </span>
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full">
                    {classroom.name === 'No Classroom Assigned' || classroom.name === 'Classroom Not Found' ? (
                      <span className="text-red-600">{classroom.name}</span>
                    ) : (
                      classroom.name
                    )}
                  </span>
                  <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                    Students: {students.length}/{classroom.capacity}
                  </span>
                                     <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 text-xs rounded-full">
                     🔒 Invigilator Assigned
                   </span>
                </div>
              </div>

                             {/* Seating Chart */}
               <div className="bg-gray-50 p-4 rounded-lg">
                 <div className="mb-3">
                   <h5 className="text-sm font-medium text-gray-700 mb-2">Seating Chart</h5>
                   
                   {/* Filtering Summary */}
                   <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-xs">
                     <div className="font-medium text-green-800 mb-1">🎯 Filtering Summary:</div>
                     <div className="text-green-700 space-y-1">
                       <div>✅ <strong>Semester Filter:</strong> Only {selectedSemesters.map(s => `Semester ${s}`).join(', ')} students</div>
                      {subject && (
                        <div>✅ <strong>Subject:</strong> {subject.name} ({subject.code})</div>
                      )}
                      {subject && subject.isCommon ? (
                         <div>✅ <strong>Type:</strong> Common Subject - All departments can take</div>
                       ) : (
                         <div>✅ <strong>Type:</strong> Department-Specific - Only relevant department students</div>
                       )}
                       <div>✅ <strong>Total Students:</strong> {students.length} (filtered from available pool)</div>
                     </div>
                   </div>
                   
                   <div className="text-xs text-gray-500 space-y-1">
                   <div>
                     📊 Students: {students.length} | 🏫 Classroom: {classroom.name} | 👥 Capacity: {classroom.capacity}
                   </div>
                   <div className="text-amber-600 font-medium">
                     🔒 Invigilator information hidden for exam security
                   </div>
                   {students.length > 0 && (
                     <div className="text-blue-600 text-xs">
                       🏢 Departments: {(() => {
                         const deptCounts = {};
                         students.forEach(s => {
                           const deptName = s.department?.name || s.department?.code || 'Unknown';
                           deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
                         });
                         return Object.entries(deptCounts)
                           .map(([dept, count]) => `${dept}: ${count}`)
                           .join(', ');
                       })()}
                     </div>
                   )}
                 </div>
                  {(classroom.name === 'No Classroom Assigned' || classroom.name === 'Classroom Not Found') && (
                    <div className="text-red-500 text-sm mt-1">
                      ⚠️ Please assign a classroom in the previous step
                    </div>
                  )}
                </div>
                
                {/* Classroom Layout */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4">
                  <div className="text-center text-xs text-gray-500 mb-2">Front of Classroom</div>
                  
                  {students.length > 0 ? (
                    <div className="space-y-2">
                      {seatingChart.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-5 gap-2">
                          {row.map((seat, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`h-16 border-2 rounded-md flex flex-col items-center justify-center p-1 text-xs transition-all ${
                                seat.student 
                                  ? 'bg-green-50 border-green-400 shadow-sm' 
                                  : 'bg-gray-100 border-gray-300'
                              }`}
                            >
                              <span className="font-medium text-gray-500 text-[8px] mb-1">
                                Seat {seat.seatNumber}
                              </span>
                              {seat.student ? (
                                <>
                                  <span className="text-center truncate w-full text-[8px] font-medium text-gray-700 leading-tight">
                                    {seat.student.fullName}
                                  </span>
                                  <span className="text-indigo-600 font-mono text-[7px] font-bold mt-1">
                                    {seat.student.scholarId}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400 text-[8px]">(empty)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm mb-2">No Students Assigned</div>
                      <div className="text-gray-300 text-xs">This classroom is empty</div>
                    </div>
                  )}
                  
                  <div className="text-center text-xs text-gray-500 mt-2">Back of Classroom</div>
                </div>

                                 {/* Student List */}
                 {students.length > 0 ? (
                   <div className="mt-4 pt-4 border-t border-gray-200">
                     <h6 className="text-sm font-medium text-gray-700 mb-2">Student List ({students.length} students)</h6>
                     
                     {/* Filtering Information */}
                     <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                       <div className="font-medium text-blue-800 mb-1">🔍 Filtering Applied:</div>
                       <div className="text-blue-700">
                         <div>✅ <strong>Semester:</strong> Only students from {selectedSemesters.map(s => `Semester ${s}`).join(', ')}</div>
                         {subject && !subject.isCommon && subject.department && (
                           <div>✅ <strong>Department:</strong> Only students from {subject.department?.name || subject.department} department</div>
                         )}
                         {subject && subject.isCommon && (
                           <div>✅ <strong>Common Subject:</strong> Students from all departments can take this subject</div>
                         )}
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs max-h-40 overflow-y-auto">
                       {students.map((student, idx) => (
                         <div key={idx} className="flex items-center space-x-2 p-2 bg-white rounded border shadow-sm">
                           <span className="font-mono text-indigo-600 font-bold text-[10px]">
                             {student.scholarId}
                           </span>
                           <span className="truncate text-gray-700 text-[10px]">
                             {student.fullName}
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-yellow-600 text-sm font-medium mb-2">No Students Found</div>
                      <div className="text-yellow-500 text-xs">
                        No students were found for this exam. This could be because:
                      </div>
                      <ul className="text-yellow-500 text-xs mt-2 text-left list-disc list-inside">
                        <li>No students are enrolled in the selected department/semester</li>
                        <li>The subject doesn't match any student records</li>
                        <li>Student data hasn't been loaded yet</li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🔄 Manually refreshing student data using NEW API...');
                          setStudentsByExam({});
                          setArrangements([]);
                          
                          const fetchStudentsForExams = async () => {
                            setLoading(true);
                            setError(null);
                            try {
                              console.log('🏛️ Using NEW /api/students/for-exam-scheduler endpoint...');
                              
                              // Use our new working endpoint
                              const response = await fetch('/api/students/for-exam-scheduler?isActive=true&limit=2000');
                              console.log('📡 Manual refresh response status:', response.status);
                              
                              if (response.ok) {
                                const data = await response.json();
                                console.log('📊 Manual refresh data:', data);
                                
                                if (data.success && data.data && data.data.length > 0) {
                                  const allRealStudents = data.data;
                                  console.log(`🎉 Manual refresh SUCCESS! Loaded ${allRealStudents.length} real students`);
                                  
                                  // Organize by department and semester
                                  const studentsData = {};
                                  studentsData['all-students'] = allRealStudents;
                                  
                                  for (const deptId of selectedDepartments) {
                                    for (const semester of selectedSemesters) {
                                      const key = `${deptId}-${semester}`;
                                      const filteredStudents = allRealStudents.filter(student => {
                                        const studentDeptId = student.department?._id || student.department;
                                        const matchesDept = studentDeptId === deptId || String(studentDeptId) === String(deptId);
                                        const studentSemester = student.semester;
                                        const targetSemester = `Semester ${semester}`;
                                        const targetSemesterNumber = semester;
                                        
                                        // Use the same improved semester matching logic
                                        const matchesSemester = 
                                          studentSemester === targetSemester ||           // "Semester 5" === "Semester 5"
                                          studentSemester === targetSemesterNumber ||     // "5" === "5"
                                          String(studentSemester) === String(targetSemesterNumber) || // "5" === "5" (string comparison)
                                          (typeof studentSemester === 'string' && studentSemester.includes(targetSemesterNumber)) || // "Semester 5".includes("5")
                                          (typeof studentSemester === 'string' && studentSemester.endsWith(targetSemesterNumber)); // "Semester 5".endsWith("5")
                                        
                                        console.log(`🔍 Manual filter: ${student.fullName} - dept: ${matchesDept}, semester: "${studentSemester}" vs target="${targetSemesterNumber}" (${matchesSemester})`);
                                        
                                        return matchesDept && matchesSemester;
                                      });
                                      
                                      studentsData[key] = filteredStudents;
                                      console.log(`📋 Manual refresh: ${filteredStudents.length} students for ${key}`);
                                    }
                                  }
                                  
                                  setStudentsByExam(studentsData);
                                  console.log('✅ Manual student data refresh completed successfully');
                                } else {
                                  throw new Error('Manual refresh returned no data');
                                }
                              } else {
                                const errorText = await response.text();
                                throw new Error(`Manual refresh failed: ${response.status} - ${errorText}`);
                              }
                            } catch (error) {
                              console.error('❌ Manual refresh error:', error);
                              setError(`Manual refresh failed: ${error.message}`);
                            } finally {
                              setLoading(false);
                            }
                          };
                          
                          fetchStudentsForExams();
                        }}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition"
                      >
                        🔄 Refresh Students
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🔍 DEBUG: Current state inspection...');
                          console.log('🔍 studentsByExam:', studentsByExam);
                          console.log('🔍 selectedDepartments:', selectedDepartments);
                          console.log('🔍 selectedSemesters:', selectedSemesters);
                          console.log('🔍 schedule:', schedule);
                          console.log('🔍 subjects:', subjects);
                          console.log('🔍 arrangements:', arrangements);
                          console.log('🔍 loading:', loading);
                          console.log('🔍 error:', error);
                        }}
                        className="mt-3 ml-2 px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        🔍 Debug Info
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-md"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        
        <div className="flex gap-4">
          {/* Refresh button to manually fetch students */}
          <button
            type="button"
            onClick={() => {
              console.log('🔄 Manually refreshing student data...');
              setStudentsByExam({});
              setArrangements([]);
              // This will trigger the useEffect to fetch students again
              const fetchStudentsForExams = async () => {
                setLoading(true);
                setError(null);
                try {
                  const studentsData = {};
                  
                  // Fetch students for each department and semester combination
                  for (const deptId of selectedDepartments) {
                    for (const semester of selectedSemesters) {
                      const key = `${deptId}-${semester}`;
                      console.log(`📚 Refreshing students for ${key}`);
                      
                      try {
                        const response = await examSchedulerAPI.getStudentsByDepartment(deptId, semester, {
                          isActive: true
                        });
                        
                        if (response.data.success) {
                          studentsData[key] = response.data.data;
                          console.log(`📋 Refreshed: ${response.data.data.length} students for ${key}`);
                        } else {
                          studentsData[key] = [];
                        }
                      } catch (error) {
                        console.error(`❌ Failed to refresh students for ${key}:`, error);
                        studentsData[key] = [];
                      }
                    }
                  }
                  
                  // Also fetch all students
                  try {
                    const allStudentsResponse = await fetch('/api/students?isActive=true&limit=1000');
                    if (allStudentsResponse.ok) {
                      const allStudentsData = await allStudentsResponse.json();
                      if (allStudentsData.success) {
                        studentsData['all-students'] = allStudentsData.data;
                        console.log(`📋 Refreshed: ${allStudentsData.data.length} total students`);
                      }
                    }
                  } catch (error) {
                    console.error(`❌ Failed to refresh all students:`, error);
                  }
                  
                  setStudentsByExam(studentsData);
                  console.log('✅ Student data refreshed successfully');
                } catch (error) {
                  console.error('❌ Error refreshing students:', error);
                  setError('Failed to refresh student data');
                } finally {
                  setLoading(false);
                }
              };
              
              fetchStudentsForExams();
            }}
            className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md text-sm"
          >
            🔄 Refresh Students
          </button>
          
          {/* Test API button */}
          <button
            type="button"
            onClick={async () => {
              console.log('🧪 Testing API endpoints...');
              
              // Test 1: Test the students API directly
              try {
                console.log('📚 Testing /api/students endpoint...');
                const response = await fetch('/api/students?isActive=true&limit=5');
                const data = await response.json();
                console.log('📚 /api/students response:', data);
                
                if (data.success && data.data.length > 0) {
                  console.log('📚 Sample student:', data.data[0]);
                }
              } catch (error) {
                console.error('❌ Error testing /api/students:', error);
              }
              
              // Test 2: Test department-specific endpoint if we have departments
              if (selectedDepartments.length > 0 && selectedSemesters.length > 0) {
                try {
                  const deptId = selectedDepartments[0];
                  const semester = selectedSemesters[0];
                  console.log(`📚 Testing /api/students/department/${deptId}/semester/${semester} endpoint...`);
                  
                  const response = await examSchedulerAPI.getStudentsByDepartment(deptId, semester, { isActive: true });
                  console.log(`📚 Department endpoint response:`, response.data);
                  
                  if (response.data.success && response.data.data.length > 0) {
                    console.log('📚 Sample student from dept:', response.data.data[0]);
                  }
                } catch (error) {
                  console.error('❌ Error testing department endpoint:', error);
                }
              }
              
              // Test 3: Show current state
              console.log('🧪 Current state:', {
                selectedDepartments,
                selectedSemesters,
                studentsByExam: Object.keys(studentsByExam),
                scheduleLength: schedule.length,
                classroomAssignments
              });
            }}
            className="flex items-center px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md text-sm"
          >
            🧪 Test API
          </button>
          
          {/* Debug button for development */}
          {import.meta?.env?.MODE === 'development' && (
            <button
              type="button"
              onClick={() => {
                console.log('🔍 Debug Info:');
                console.log('📊 Students by exam:', studentsByExam);
                console.log('🏢 Classroom assignments:', classroomAssignments);
                console.log('📚 Available subjects:', subjects);
                console.log('🏢 Available classrooms:', classrooms);
                console.log('📋 Selected departments:', selectedDepartments);
                console.log('📋 Selected semesters:', selectedSemesters);
                
                // Test student fetching
                Object.entries(studentsByExam).forEach(([key, students]) => {
                  console.log(`📊 ${key}: ${students.length} students`);
                  if (students.length > 0) {
                    console.log(`📋 Sample from ${key}:`, students[0]);
                  }
                });
              }}
              className="flex items-center px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow-md text-sm"
            >
              🐛 Debug
            </button>
          )}
          
          <button
            type="button"
            onClick={printSchedule}
            className="flex items-center px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition shadow-md"
          >
            <FiPrinter className="mr-2" /> Print
          </button>
          
          <button
            type="submit"
            disabled={classroomConflicts.length > 0}
            className={`flex items-center px-6 py-2.5 rounded-lg transition shadow-md ${
              classroomConflicts.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:opacity-90'
            }`}
          >
            Generate & Finish <FiArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </form>
  );
};

SeatingArrangement.propTypes = {
  schedule: PropTypes.arrayOf(
    PropTypes.shape({
      subjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      date: PropTypes.string.isRequired,
      timeSlot: PropTypes.shape({
        start: PropTypes.string.isRequired,
        end: PropTypes.string.isRequired
      }),
    })
  ),
  classroomAssignments: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  invigilatorAssignments: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  seatingArrangements: PropTypes.array,
  setSeatingArrangements: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string.isRequired,
      code: PropTypes.string
    })
  ),
  classrooms: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      capacity: PropTypes.number.isRequired
    })
  ),
  invigilators: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      fullName: PropTypes.string.isRequired,
      employeeId: PropTypes.string,
      designation: PropTypes.string,
      workload: PropTypes.number
    })
  ),
  selectedDepartments: PropTypes.arrayOf(PropTypes.string),
  selectedSemesters: PropTypes.arrayOf(PropTypes.string)
};

SeatingArrangement.defaultProps = {
  schedule: [],
  classroomAssignments: [],
  invigilatorAssignments: [],
  seatingArrangements: [],
  subjects: [],
  classrooms: [],
  invigilators: [],
  selectedDepartments: [],
  selectedSemesters: []
};

export default SeatingArrangement;