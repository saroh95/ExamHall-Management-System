import { useState, useEffect } from 'react';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { examSchedulerAPI } from '../../services/examSchedulerAPI';

function groupBy(arr, fn) {
  return arr.reduce((acc, val) => {
    const key = fn(val);
    acc[key] = acc[key] || [];
    acc[key].push(val);
    return acc;
  }, {});
}

const ClassroomAssignment = ({
  schedule,
  classroomAssignments,
  setClassroomAssignments,
  nextStep,
  prevStep,
  subjects = [],
  selectedDepartments = []
}) => {
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all classrooms from database for manual assignment
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const response = await examSchedulerAPI.getAllClassroomsForAssignment();
        if (response.data.success) {
          setClassrooms(response.data.data);
          console.log('✅ Fetched all classrooms for assignment:', response.data.data.length);
        } else {
          console.error('Failed to fetch classrooms:', response.data.message);
          setError('Failed to load classrooms from database');
        }
      } catch (error) {
        console.error('Error fetching classrooms:', error);
        setError('Error loading classrooms from database');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  // Check for classroom conflicts
  const checkClassroomConflicts = (currentAssignments) => {
    const conflicts = [];
    const classroomUsage = {};
    
    currentAssignments.forEach((classroomId, index) => {
      if (classroomId) {
        const exam = schedule[index];
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

  // Get available classrooms for a specific exam (excluding conflicting ones)
  const getAvailableClassrooms = (examIndex, currentAssignments) => {
    const exam = schedule[examIndex];
    const date = exam.date;
    const timeSlot = exam.timeSlot;
    
    return classrooms.filter(classroom => {
      // Check if this classroom is already used at the same time
      const isConflict = currentAssignments.some((assignedClassroomId, assignedIndex) => {
        if (assignedIndex === examIndex || !assignedClassroomId) return false;
        
        const assignedExam = schedule[assignedIndex];
        return assignedClassroomId === classroom._id && 
               assignedExam.date === date && 
               assignedExam.timeSlot === timeSlot;
      });
      
      return !isConflict;
    });
  };

  useEffect(() => {
    console.log('🏢 ClassroomAssignment received schedule:', schedule);
    console.log('🏢 ClassroomAssignment received classrooms:', classrooms);
    
    if (!schedule.length || !classrooms.length) {
      setAssignments([]);
      return;
    }

    // Enhanced classroom assignment with proper conflict prevention
    const newAssign = [];
    const classroomUsageTracker = {}; // Track classroom usage by date and time
    
    schedule.forEach((exam, index) => {
      console.log(`🏢 Processing exam ${index}:`, exam);
      
      const examDate = exam.date;
      const examTimeSlot = exam.timeSlot;
      let assignedClassroomId = null;
      
      // First, check if classroom is already assigned in the schedule and verify no conflicts
      if (exam.classroomId) {
        const usageKey = `${exam.classroomId}-${examDate}-${examTimeSlot}`;
        if (!classroomUsageTracker[usageKey]) {
          // No conflict, use the existing assignment
          assignedClassroomId = exam.classroomId;
          classroomUsageTracker[usageKey] = index;
          console.log(`🏢 Using existing classroom assignment: ${exam.classroomId} (no conflict)`);
        } else {
          console.log(`⚠️ Conflict detected with existing assignment for ${exam.classroomId}, finding alternative`);
        }
      }
      
      // If no valid assignment yet, find a suitable classroom
      if (!assignedClassroomId) {
        const needed = 50; // Default capacity needed
        
        // Find available classrooms that don't conflict with current usage
        const availableClassrooms = classrooms.filter(classroom => {
          const usageKey = `${classroom._id}-${examDate}-${examTimeSlot}`;
          return !classroomUsageTracker[usageKey] && classroom.capacity >= needed;
        });
        
        if (availableClassrooms.length > 0) {
          // Sort by capacity (smallest suitable room first for efficiency)
          availableClassrooms.sort((a, b) => a.capacity - b.capacity);
          const selectedClassroom = availableClassrooms[0];
          
          assignedClassroomId = selectedClassroom._id;
          const usageKey = `${selectedClassroom._id}-${examDate}-${examTimeSlot}`;
          classroomUsageTracker[usageKey] = index;
          
          console.log(`🏢 Auto-assigned classroom: ${selectedClassroom.name} (${selectedClassroom.capacity}) to exam ${index}`);
        } else {
          console.log(`❌ No suitable classroom found for exam ${index} - all classrooms are occupied or insufficient capacity`);
          
          // Fallback: use the largest available classroom even if it might cause conflicts
          const largestClassroom = classrooms.sort((a, b) => b.capacity - a.capacity)[0];
          if (largestClassroom) {
            assignedClassroomId = largestClassroom._id;
            console.log(`⚠️ Fallback assignment: ${largestClassroom.name} for exam ${index} (may cause conflicts)`);
          }
        }
      }
      
      newAssign.push(assignedClassroomId);
    });

    console.log('🏢 Final classroom assignments:', newAssign);
    
    // Check for any remaining conflicts
    const conflicts = checkClassroomConflicts(newAssign);
    if (conflicts.length > 0) {
      console.log(`⚠️ Found ${conflicts.length} conflicts after assignment, attempting to resolve...`);
      
      // Attempt to resolve conflicts by reassigning conflicted exams
      conflicts.forEach(conflict => {
        const [exam1Index, exam2Index] = conflict.conflictingExams;
        const exam1 = schedule[exam1Index];
        const exam2 = schedule[exam2Index];
        
        console.log(`🔄 Resolving conflict between exam ${exam1Index} and ${exam2Index}`);
        
        // Try to find alternative classroom for the second exam
        const availableAlternatives = classrooms.filter(classroom => {
          const usageKey = `${classroom._id}-${exam2.date}-${exam2.timeSlot}`;
          return !classroomUsageTracker[usageKey] && 
                 classroom._id !== newAssign[exam1Index] && 
                 classroom.capacity >= 50;
        });
        
        if (availableAlternatives.length > 0) {
          const alternative = availableAlternatives[0];
          newAssign[exam2Index] = alternative._id;
          const usageKey = `${alternative._id}-${exam2.date}-${exam2.timeSlot}`;
          classroomUsageTracker[usageKey] = exam2Index;
          console.log(`✅ Resolved conflict: moved exam ${exam2Index} to ${alternative.name}`);
        }
      });
    }
    
    setAssignments(newAssign);
    setError(null);
  }, [schedule, classrooms]);

  // Auto-resolve conflicts function
  const autoResolveConflicts = () => {
    console.log('🔧 Auto-resolving classroom conflicts...');
    
    const newAssignments = [...assignments];
    const classroomUsageTracker = {};
    const conflicts = checkClassroomConflicts(newAssignments);
    
    if (conflicts.length === 0) {
      setError('No conflicts to resolve!');
      return;
    }
    
    // Build usage tracker for non-conflicted assignments
    newAssignments.forEach((classroomId, index) => {
      if (classroomId) {
        const exam = schedule[index];
        const usageKey = `${classroomId}-${exam.date}-${exam.timeSlot}`;
        if (!classroomUsageTracker[usageKey]) {
          classroomUsageTracker[usageKey] = [index];
        } else {
          classroomUsageTracker[usageKey].push(index);
        }
      }
    });
    
    // Resolve each conflict
    let resolvedCount = 0;
    conflicts.forEach(conflict => {
      const conflictingExamIndices = conflict.conflictingExams;
      
      // Keep the first exam in the original classroom, reassign others
      for (let i = 1; i < conflictingExamIndices.length; i++) {
        const examIndex = conflictingExamIndices[i];
        const exam = schedule[examIndex];
        
        // Find an alternative classroom
        const availableClassrooms = classrooms.filter(classroom => {
          const usageKey = `${classroom._id}-${exam.date}-${exam.timeSlot}`;
          return !classroomUsageTracker[usageKey] && classroom.capacity >= 50;
        });
        
        if (availableClassrooms.length > 0) {
          // Sort by capacity (smallest suitable room first)
          availableClassrooms.sort((a, b) => a.capacity - b.capacity);
          const newClassroom = availableClassrooms[0];
          
          // Update assignment
          newAssignments[examIndex] = newClassroom._id;
          
          // Update usage tracker
          const newUsageKey = `${newClassroom._id}-${exam.date}-${exam.timeSlot}`;
          classroomUsageTracker[newUsageKey] = [examIndex];
          
          console.log(`✅ Resolved conflict: moved exam ${examIndex} to ${newClassroom.name}`);
          resolvedCount++;
        } else {
          console.log(`❌ Could not resolve conflict for exam ${examIndex} - no available classrooms`);
        }
      }
    });
    
    setAssignments(newAssignments);
    
    if (resolvedCount > 0) {
      setError(null);
      console.log(`✅ Auto-resolved ${resolvedCount} classroom conflicts`);
    } else {
      setError('Could not automatically resolve conflicts - no alternative classrooms available');
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    // Check for classroom conflicts
    const conflicts = checkClassroomConflicts(assignments);
    if (conflicts.length > 0) {
      setError(`Please resolve ${conflicts.length} classroom assignment conflicts before proceeding. Use the "Auto-Resolve Conflicts" button or manually assign different classrooms.`);
      return;
    }
    
    if (
      assignments.length !== schedule.length ||
      assignments.some(a => a === null)
    ) {
      setError('Please resolve unassigned exams before proceeding.');
      return;
    }
    
    setClassroomAssignments(assignments);
    nextStep();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classrooms from database...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Classroom Assignment</h3>
        <p className="text-sm text-gray-600">
          Classrooms have been auto-assigned based on exam schedule. You can review and adjust assignments if needed.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Classroom Conflicts Warning */}
      {(() => {
        const conflicts = checkClassroomConflicts(assignments);
        if (conflicts.length > 0) {
          return (
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
                {conflicts.map((conflict, idx) => {
                  const exam1 = schedule[conflict.conflictingExams[0]];
                  const exam2 = schedule[conflict.conflictingExams[1]];
                  const classroom = classrooms.find(c => c._id === conflict.classroomId);
                  return (
                    <li key={idx}>
                      <strong>{exam1?.subjectName || 'Unknown Subject'}</strong> and{' '}
                      <strong>{exam2?.subjectName || 'Unknown Subject'}</strong> - 
                      {classroom?.name || 'Unknown Classroom'} on {conflict.date} at {conflict.timeSlot}
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm mt-2 text-red-600">
                Please resolve these conflicts by assigning different classrooms or adjusting the schedule.
              </p>
            </div>
          );
        }
        return null;
      })()}

      <div className="space-y-4">
                         {schedule.map((exam, idx) => {
          // Enhanced subject lookup
          const subject = subjects.find(s => 
            s._id === exam.subjectId || 
            s.id === exam.subjectId ||
            String(s._id) === String(exam.subjectId) ||
            String(s.id) === String(exam.subjectId) ||
            (s._id && s._id.toString() === exam.subjectId) ||
            (s.id && s.id.toString() === exam.subjectId)
          );
          
          const assignedRoom = classrooms.find(c => c._id === assignments[idx]);
          
          // Get department information for this exam
          const examDepartments = [];
          if (subject) {
            if (subject.departmentId && Array.isArray(subject.departmentId)) {
              subject.departmentId.forEach(dept => {
                if (typeof dept === 'object' && dept.name) {
                  examDepartments.push(dept.name);
                } else if (typeof dept === 'object' && dept.code) {
                  examDepartments.push(dept.code);
                } else if (typeof dept === 'string') {
                  examDepartments.push(dept);
                }
              });
            } else if (subject.departmentId && typeof subject.departmentId === 'object' && subject.departmentId.name) {
              examDepartments.push(subject.departmentId.name);
            } else if (subject.department) {
              if (typeof subject.department === 'object' && subject.department.name) {
                examDepartments.push(subject.department.name);
              } else {
                examDepartments.push(subject.department);
              }
            }
          }
          
          // If no departments found from subject, try to infer from selected departments
          if (examDepartments.length === 0 && selectedDepartments && selectedDepartments.length > 0) {
            // This is a fallback - we'll show selected departments as potentially involved
            examDepartments.push('Multiple Departments');
          }
          
          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {subject?.name || `Unknown Subject (ID: ${exam.subjectId})`}
                </h4>
                {subject?.code && (
                  <span className="text-sm text-gray-500 ml-2">({subject.code})</span>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                    📅 {exam.date}
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                    ⏰ {exam.timeSlot}
                  </span>
                  {examDepartments.length > 0 && (
                    <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                      🏢 {examDepartments.join(', ')}
                    </span>
                  )}
                  {assignedRoom && (
                    <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full">
                      🏫 {assignedRoom.name} (Cap: {assignedRoom.capacity})
                      {examDepartments.length > 0 && ` - ${examDepartments.join(', ')}`}
                    </span>
                  )}
                  {exam.category && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full">
                      📋 {exam.category.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom Assignment
                </label>
                                 <select
                   value={assignments[idx] ?? ''}
                   onChange={e => {
                     const val = e.target.value || null;
                     const updated = [...assignments];
                     updated[idx] = val;
                     setAssignments(updated);
                     setError(null);
                   }}
                   className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                 >
                   <option value="">Select a classroom</option>
                   {getAvailableClassrooms(idx, assignments).map(r => (
                     <option key={r._id} value={r._id}>
                       {r.name} - {r.building} Floor {r.floor} (Capacity: {r.capacity}) {r.isAvailable ? '✓' : '⚠'} {r.maintenanceStatus === 'operational' ? '🟢' : '🔴'}
                     </option>
                   ))}
                 </select>
                
                {assignments[idx] == null ? (
                  <p className="text-xs text-red-600 mt-2">
                    No available room for this group—please add a new classroom, increase capacity, or adjust your schedule.
                  </p>
                ) : assignedRoom && (
                  <p className="text-xs text-green-600 mt-2">
                    Assigned: {assignedRoom.name} (Capacity: {assignedRoom.capacity})
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-md"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        
        <div className="flex gap-3">
          {/* Auto-resolve conflicts button - only show if there are conflicts */}
          {checkClassroomConflicts(assignments).length > 0 && (
            <button
              type="button"
              onClick={autoResolveConflicts}
              className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md"
            >
              🔧 Auto-Resolve Conflicts
            </button>
          )}
          
          <button
            type="submit"
            disabled={assignments.length !== schedule.length || assignments.some(a => a === null) || checkClassroomConflicts(assignments).length > 0}
            className={`flex items-center px-6 py-2.5 text-white rounded-lg transition shadow-md ${
              assignments.length !== schedule.length || assignments.some(a => a === null) || checkClassroomConflicts(assignments).length > 0
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90'
            }`}
          >
            Next <FiArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ClassroomAssignment;