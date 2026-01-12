import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { examSchedulerAPI } from '../../services/examSchedulerAPI';

const InvigilatorAssignment = ({
  schedule = [],
  classroomAssignments = [],
  invigilatorAssignments = [],
  setInvigilatorAssignments,
  nextStep,
  prevStep,
  subjects = [],
  classrooms = []
}) => {
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [invigilators, setInvigilators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSubjects, setLocalSubjects] = useState(subjects);
  const [localClassrooms, setLocalClassrooms] = useState(classrooms);

  // Fetch all teachers for invigilation from database
  useEffect(() => {
    const fetchInvigilators = async () => {
      try {
        setLoading(true);
        const response = await examSchedulerAPI.getAllTeachersForInvigilation();
        if (response.data.success) {
          setInvigilators(response.data.data);
          console.log('✅ Fetched all teachers for invigilation:', response.data.data.length);
        } else {
          console.error('Failed to fetch teachers:', response.data.message);
          setError('Failed to load teachers from database');
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setError('Error loading teachers from database');
      } finally {
        setLoading(false);
      }
    };

    fetchInvigilators();
  }, []);

  // Load data if not provided or empty
  useEffect(() => {
    const loadMissingData = async () => {
      try {
        // Load subjects if not provided
        if (!subjects || subjects.length === 0) {
          console.log('🔄 Loading subjects locally in InvigilatorAssignment...');
          try {
            const { examSchedulerAPI } = await import('../../services/examSchedulerAPI');
            const response = await examSchedulerAPI.getAvailableSubjects();
            if (response.data.success) {
              setLocalSubjects(response.data.data);
              console.log('✅ Loaded subjects locally in InvigilatorAssignment:', response.data.data.length);
            }
          } catch (error) {
            console.error('❌ Failed to load subjects locally:', error);
          }
        } else {
          setLocalSubjects(subjects);
        }

        // Load classrooms if not provided
        if (!classrooms || classrooms.length === 0) {
          console.log('🔄 Loading classrooms locally in InvigilatorAssignment...');
          try {
            const { examSchedulerAPI } = await import('../../services/examSchedulerAPI');
            const response = await examSchedulerAPI.getAllClassroomsForAssignment();
            if (response.data.success) {
              setLocalClassrooms(response.data.data);
              console.log('✅ Loaded classrooms locally in InvigilatorAssignment:', response.data.data.length);
            }
          } catch (error) {
            console.error('❌ Failed to load classrooms locally:', error);
          }
        } else {
          setLocalClassrooms(classrooms);
        }
      } catch (error) {
        console.error('❌ Error loading missing data in InvigilatorAssignment:', error);
      }
    };

    loadMissingData();
  }, [subjects, classrooms]);

  const buildInvigilatorMap = (baseAssignments = []) => {
    const map = {};
    invigilators.forEach(inv => {
      map[inv._id] = { 
        workload: inv.workload || 0, 
        slots: [] 
      };
    });
    baseAssignments.forEach((invId, idx) => {
      if (invId != null) {
        const { date, timeSlot } = schedule[idx];
        map[invId].workload += 1;
        map[invId].slots.push({ date, ...timeSlot });
      }
    });
    return map;
  };

  const hasConflict = (invMap, invId, date, slot) => {
    return invMap[invId].slots.some(s =>
      s.date === date &&
      !(slot.end <= s.start || slot.start >= s.end)
    );
  };

  useEffect(() => {
    console.log('👨‍🏫 InvigilatorAssignment received schedule:', schedule);
    console.log('👨‍🏫 InvigilatorAssignment received invigilators:', invigilators);
    
    if (!schedule.length || !invigilators.length) {
      setAssignments([]);
      return;
    }

    // Use auto-assigned invigilators from the schedule
    const newAssign = schedule.map(exam => {
      // If invigilator is already assigned in the schedule, use it
      if (exam.invigilatorId) {
        return exam.invigilatorId;
      }
      // Otherwise, find a suitable invigilator (fallback)
      const invMap = buildInvigilatorMap([]);
      const available = Object.entries(invMap)
        .filter(([id, info]) => !hasConflict(invMap, id, exam.date, exam.timeSlot))
        .map(([id, info]) => ({ id, workload: info.workload }))
        .sort((a, b) => a.workload - b.workload);
      
      return available.length > 0 ? available[0].id : null;
    });

    setAssignments(newAssign);
    setError(newAssign.includes(null) 
      ? 'Some sessions could not be auto-assigned. Please review.' 
      : null
    );
  }, [schedule, invigilators]);

  const handleChange = (idx, invId) => {
    setAssignments(prev => {
      const updated = [...prev];
      updated[idx] = invId;
      return updated;
    });
    setError(null);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (assignments.some(a => a == null)) {
      setError('Please assign all invigilators before proceeding.');
      return;
    }
    setInvigilatorAssignments(assignments);
    nextStep();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invigilators from database...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Assign Invigilators</h3>
        <p className="text-sm text-gray-600">
          Invigilators have been auto-assigned based on workload and availability. You can review and adjust assignments if needed.
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

      <div className="space-y-4">
        {schedule.map((exam, idx) => {
          // Enhanced subject lookup with multiple ID formats using local subjects
          const subjectsToUse = localSubjects && localSubjects.length > 0 ? localSubjects : subjects;
          const classroomsToUse = localClassrooms && localClassrooms.length > 0 ? localClassrooms : classrooms;
          
          let subject = null;
          if (exam.subjectId) {
            subject = subjectsToUse.find(s => 
              s._id === exam.subjectId || 
              String(s._id) === String(exam.subjectId) ||
              s.id === exam.subjectId ||
              String(s.id) === String(exam.subjectId) ||
              s.name === exam.subjectId ||
              s.code === exam.subjectId ||
              (s._id && s._id.toString() === exam.subjectId)
            );
          }
          
          if (!subject) {
            console.warn(`❌ Subject not found for ID: ${exam.subjectId}`);
            console.warn('Available subjects:', subjectsToUse.map(s => ({ _id: s._id, name: s.name })));
            subject = { name: `Unknown Subject (ID: ${exam.subjectId})`, code: 'N/A' };
          }
          
          const room = classroomsToUse.find(c => c._id === classroomAssignments[idx]) || { name: 'Unassigned' };
          // Use invigilator name from schedule if available, otherwise find from invigilators list
          const assignedInvigilator = exam.invigilatorName ? 
            { _id: exam.invigilatorId, name: exam.invigilatorName, workload: 0 } : 
            (assignments[idx] ? invigilators.find(inv => inv._id === assignments[idx]) : null);
          
          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {subject.name.includes('Unknown Subject') ? (
                    <span className="text-red-600">{subject.name}</span>
                  ) : (
                    `${subject.name} (${subject.code})`
                  )}
                </h4>
                {subject.name.includes('Unknown Subject') && (
                  <div className="text-red-500 text-sm mt-1">
                    Subject ID: {exam.subjectId} - Check if subject exists in database
                    <br />
                    <span className="text-xs">Available subjects: {subjectsToUse.length}, Using local: {localSubjects.length > 0 ? 'Yes' : 'No'}</span>
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
                    {room.name}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invigilator
                </label>
                <select
                  value={assignments[idx] ?? ''}
                  onChange={e => handleChange(idx, e.target.value || null)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="">Select an invigilator</option>
                  {invigilators.map(inv => (
                    <option 
                      key={inv._id} 
                      value={inv._id}
                      disabled={hasConflict(buildInvigilatorMap(assignments), inv._id, exam.date, exam.timeSlot)}
                    >
                      {inv.fullName} - {inv.employeeId} (Workload: {inv.workload + (assignments[idx]===inv._id ? 1 : 0)}) {inv.isInvigilator ? '✓' : ''}
                    </option>
                  ))}
                </select>
                
                {assignedInvigilator && (
                  <p className="text-xs text-green-600 mt-2">
                    Assigned: {assignedInvigilator.name} (Workload: {assignedInvigilator.workload + 1})
                  </p>
                )}
                {assignments[idx] == null && (
                  <p className="text-xs text-red-600 mt-2">
                    No invigilator assigned—please select one
                  </p>
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
        <button
          type="submit"
          className={`flex items-center px-6 py-2.5 text-white rounded-lg transition shadow-md ${
            assignments.some(a => a == null)
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90'
          }`}
        >
          Next <FiArrowRight className="ml-2" />
        </button>
      </div>
    </form>
  );
};

InvigilatorAssignment.propTypes = {
  schedule: PropTypes.arrayOf(
    PropTypes.shape({
      subjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      date: PropTypes.string.isRequired,
      timeSlot: PropTypes.shape({
        start: PropTypes.string.isRequired,
        end: PropTypes.string.isRequired
      }).isRequired
    })
  ),
  classroomAssignments: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  invigilatorAssignments: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  setInvigilatorAssignments: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string
    })
  ),
  classrooms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    })
  )
};

InvigilatorAssignment.defaultProps = {
  schedule: [],
  classroomAssignments: [],
  invigilatorAssignments: [],
  subjects: [],
  classrooms: []
};

export default InvigilatorAssignment;