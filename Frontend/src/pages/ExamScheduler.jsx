import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
// Remove mock data import - we'll fetch real data from database
import ExamForm from '../components/ExamScheduler/ExamForm';
import DepartmentSelection from '../components/ExamScheduler/DepartmentSelection';
import SubjectSelection from '../components/ExamScheduler/SubjectSelection';
import ScheduleGenerator from '../components/ExamScheduler/ScheduleGenerator';
import ClassroomAssignment from '../components/ExamScheduler/ClassroomAssignment';
import InvigilatorAssignment from '../components/ExamScheduler/InvigilatorAssignment';
import SeatingArrangement from '../components/ExamScheduler/SeatingArrangement';

function ExamScheduler({ onCompleteExam }) {
  const navigate = useNavigate();
  // Get addExamToDashboard from Dashboard via Outlet context
  const { addExamToDashboard } = useOutletContext() || {};
  const [step, setStep] = useState(1);
  const [examDetails, setExamDetails] = useState({
    name: '',
    type: 'regular',
    startDate: '',
    endDate: '',
    timeSlots: [],
  });
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [classroomAssignments, setClassroomAssignments] = useState([]);
  const [invigilatorAssignments, setInvigilatorAssignments] = useState([]);
  const [seatingArrangements, setSeatingArrangements] = useState([]);
  const [realSubjects, setRealSubjects] = useState([]);
  const [realClassrooms, setRealClassrooms] = useState([]);
  const [realInvigilators, setRealInvigilators] = useState([]);

  useEffect(() => {
    console.log('📊 Parent: Schedule state changed:', schedule);
  }, [schedule]);

  useEffect(() => {
    console.log('📋 Parent: ExamDetails updated:', examDetails);
  }, [examDetails]);

  const nextStep = () => {
    if (step < 7) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetScheduler = () => {
    setStep(1);
    setExamDetails({ name: '', type: 'regular', startDate: '', endDate: '', timeSlots: [] });
    setSelectedDepartments([]);
    setSelectedSemesters([]);
    setSelectedSubjects([]);
    setSchedule([]);
    setClassroomAssignments([]);
    setInvigilatorAssignments([]);
    setSeatingArrangements([]);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Fetch real subjects from database using proper API
  const fetchRealSubjects = async () => {
    try {
      const { examSchedulerAPI } = await import('../services/examSchedulerAPI');
      const response = await examSchedulerAPI.getAvailableSubjects();
      if (response.data.success) {
        setRealSubjects(response.data.data);
        console.log('✅ Fetched real subjects:', response.data.data.length);
        console.log('📚 Sample subjects:', response.data.data.slice(0, 3).map(s => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          departmentId: s.departmentId
        })));
      } else {
        console.error('❌ Failed to fetch subjects:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
    }
  };

  // Fetch real classrooms from database using proper API
  const fetchRealClassrooms = async () => {
    try {
      const { examSchedulerAPI } = await import('../services/examSchedulerAPI');
      const response = await examSchedulerAPI.getAllClassroomsForAssignment();
      if (response.data.success) {
        setRealClassrooms(response.data.data);
        console.log('✅ Fetched all classrooms for assignment:', response.data.data.length);
      } else {
        console.error('❌ Failed to fetch classrooms:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching classrooms:', error);
    }
  };

  // Fetch real invigilators from database using proper API
  const fetchRealInvigilators = async () => {
    try {
      const { examSchedulerAPI } = await import('../services/examSchedulerAPI');
      const response = await examSchedulerAPI.getAllTeachersForInvigilation();
      if (response.data.success) {
        setRealInvigilators(response.data.data);
        console.log('✅ Fetched all teachers for invigilation:', response.data.data.length);
      } else {
        console.error('❌ Failed to fetch invigilators:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching invigilators:', error);
    }
  };

  // Fetch all real data when component mounts
  useEffect(() => {
    fetchRealSubjects();
    fetchRealClassrooms();
    fetchRealInvigilators();
  }, []);

  // Called when seating arrangements finalized - completes scheduling
  const finishExamScheduling = (finalSeatingArrangements) => {
    const newExam = {
      id: Date.now(),
      type: examDetails.type || 'Generated Exam',
      startDate: schedule[0]?.date,
      endDate: schedule[schedule.length - 1]?.date,
              details: schedule.map((item, idx) => ({
          subject: realSubjects.find(s => s._id === item.subjectId)?.name || item.subjectId,
          date: item.date,
          time: `${item.timeSlot?.start} - ${item.timeSlot?.end}`,
          room: realClassrooms.find(c => c._id === (classroomAssignments[idx] || item.classroomId))?.name || 'N/A'
        })),
      examDetails,
      selectedDepartments,
      selectedSemesters,
      selectedSubjects,
      schedule,
      classroomAssignments,
      invigilatorAssignments,
      seatingArrangements: finalSeatingArrangements,
      createdAt: new Date().toISOString()
    };
    if (typeof addExamToDashboard === 'function') {
      addExamToDashboard(newExam);
    }
    if (typeof onCompleteExam === 'function') {
      onCompleteExam(newExam);
    }
    resetScheduler();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ExamForm examDetails={examDetails} setExamDetails={setExamDetails} nextStep={nextStep} />;
      case 2:
        return (
          <DepartmentSelection
            selectedDepartments={selectedDepartments}
            setSelectedDepartments={setSelectedDepartments}
            selectedSemesters={selectedSemesters}
            setSelectedSemesters={setSelectedSemesters}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <SubjectSelection
            selectedSubjects={selectedSubjects}
            setSelectedSubjects={setSelectedSubjects}
            selectedDepartments={selectedDepartments}
            selectedSemesters={selectedSemesters}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <ScheduleGenerator
            examDetails={examDetails}
            selectedSubjects={selectedSubjects}
            selectedDepartments={selectedDepartments}
            selectedSemesters={selectedSemesters}
            schedule={schedule}
            setSchedule={setSchedule}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <ClassroomAssignment
            classrooms={realClassrooms}
            schedule={schedule}
            classroomAssignments={classroomAssignments}
            setClassroomAssignments={setClassroomAssignments}
            nextStep={nextStep}
            prevStep={prevStep}
            subjects={realSubjects}
            selectedDepartments={selectedDepartments}
          />
        );
      case 6:
        return (
          <InvigilatorAssignment
            invigilators={realInvigilators}
            schedule={schedule}
            classroomAssignments={classroomAssignments}
            invigilatorAssignments={invigilatorAssignments}
            setInvigilatorAssignments={setInvigilatorAssignments}
            nextStep={nextStep}
            prevStep={prevStep}
            subjects={realSubjects}
            classrooms={realClassrooms}
          />
        );
      case 7:
        return (
          <SeatingArrangement
            schedule={schedule}
            classroomAssignments={classroomAssignments}
            invigilatorAssignments={invigilatorAssignments}
            seatingArrangements={seatingArrangements}
            setSeatingArrangements={(arr) => {
              setSeatingArrangements(arr);
              finishExamScheduling(arr); // complete and notify dashboard
            }}
            nextStep={() => {}} // no next after final
            prevStep={prevStep}
            subjects={realSubjects}
            classrooms={realClassrooms}
            invigilators={realInvigilators}
            selectedDepartments={selectedDepartments}
            selectedSemesters={selectedSemesters}
          />
        );
      default:
        return <ExamForm examDetails={examDetails} setExamDetails={setExamDetails} nextStep={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
              >
                <FiArrowLeft className="mr-2" /> Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center ml-4">
                <FiCalendar className="mr-3 text-blue-600" /> Exam Scheduler
              </h1>
            </div>
            <p className="text-gray-600 ml-14">Schedule and manage all examinations</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center border border-blue-100">
            <FiCalendar className="text-blue-600 mr-2" />
            <span className="font-medium">Dashboard /</span>
            <span className="text-blue-600 font-medium ml-1">Exam Scheduler</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Step Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    stepNumber < step
                      ? 'bg-green-500 text-white'
                      : stepNumber === step
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
            <div className="text-xs text-center text-gray-500">
              {[
                'Exam Details',
                'Departments',
                'Subjects',
                'Schedule',
                'Classrooms',
                'Invigilators',
                'Seating'
              ][step - 1]}
            </div>
          </div>

          {/* Optional debug info */}
          {import.meta?.env?.MODE === 'development' && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <strong>Debug Info:</strong> Step {step} | Departments: {selectedDepartments.join(', ')} | Semesters: {selectedSemesters.join(', ')} | Subjects: {selectedSubjects.length} | Schedule: {schedule.length} items
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  );
}

ExamScheduler.propTypes = {
  onCompleteExam: PropTypes.func,
};

export default ExamScheduler;