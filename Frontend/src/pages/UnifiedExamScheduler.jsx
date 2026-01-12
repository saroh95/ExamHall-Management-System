import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiCheck, FiClock, FiUsers, FiMapPin } from 'react-icons/fi';
import unifiedExamSchedulerAPI from '../services/unifiedExamSchedulerAPI';
import api from '../services/api';
import TimetableView from '../components/ExamTimetable/TimetableView';
import SeatingArrangementView from '../components/ExamTimetable/SeatingArrangementView';
import InvigilatorAssignmentView from '../components/ExamTimetable/InvigilatorAssignmentView';

function UnifiedExamScheduler() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable', 'seating', 'invigilators'

  // Form data
  const [formData, setFormData] = useState({
    examType: 'End-Semester',
    semesters: [],
    departments: [],
    dateRange: {
      start: '',
      end: ''
    },
    timeSlots: [
      { start: '10:00', end: '13:00' }
    ],
    seatingStrategy: 'department-wise', // Department-wise by default
    academicYear: '2025-2026',
    useParallelScheduling: true // Enable intelligent parallel scheduling by default
  });

  // Preview data
  const [previewData, setPreviewData] = useState(null);
  
  // Scheduled exams
  const [scheduledExams, setScheduledExams] = useState([]);

  // Available options
  const [departments, setDepartments] = useState([]);

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleDateRangeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
    setError(null);
  };

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...formData.timeSlots];
    newTimeSlots[index][field] = value;
    setFormData(prev => ({
      ...prev,
      timeSlots: newTimeSlots
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [
        ...prev.timeSlots,
        { start: '', end: '' }
      ]
    }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const toggleSemester = (semester) => {
    setFormData(prev => {
      const semesters = prev.semesters.includes(semester)
        ? prev.semesters.filter(s => s !== semester)
        : [...prev.semesters, semester];
      return { ...prev, semesters };
    });
  };

  const toggleDepartment = (deptId) => {
    setFormData(prev => {
      const departments = prev.departments.includes(deptId)
        ? prev.departments.filter(d => d !== deptId)
        : [...prev.departments, deptId];
      return { ...prev, departments };
    });
  };

  const validateStep1 = () => {
    if (!formData.examType) {
      setError('Please select exam type');
      return false;
    }
    if (formData.semesters.length === 0) {
      setError('Please select at least one semester');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dateRange.start || !formData.dateRange.end) {
      setError('Please select date range');
      return false;
    }
    if (new Date(formData.dateRange.start) > new Date(formData.dateRange.end)) {
      setError('Start date must be before end date');
      return false;
    }
    if (formData.timeSlots.length === 0) {
      setError('Please add at least one time slot');
      return false;
    }
    for (const slot of formData.timeSlots) {
      if (!slot.start || !slot.end) {
        setError('All time slots must have start and end times');
        return false;
      }
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting optimized preview generation...');
      const startTime = Date.now();
      
      const result = await unifiedExamSchedulerAPI.getEnrollmentPreview({
        semesters: formData.semesters,
        departments: formData.departments.length > 0 ? formData.departments : null,
        academicYear: formData.academicYear
      });

      const endTime = Date.now();
      console.log(`✅ Preview generated in ${endTime - startTime}ms`);

      setPreviewData(result.data);
      setStep(3);
    } catch (err) {
      console.error('❌ Preview error:', err);
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Schedule the exams
      const result = await unifiedExamSchedulerAPI.scheduleExams(formData);
      
      console.log('📊 Scheduling result:', {
        success: result.success,
        examsScheduled: result.data?.examsScheduled,
        examsCount: result.data?.exams?.length || 0,
        summary: result.data?.summary
      });

      // Check if any exams were actually scheduled
      if (result.data?.examsScheduled === 0 || (result.data?.exams?.length || 0) === 0) {
        console.warn('⚠️ No exams were scheduled. Check backend logs for details.');
        setError('No exams were scheduled. This may be due to:\n- No available classrooms\n- All classrooms already booked\n- No students enrolled in selected subjects\n\nPlease check the backend console for detailed error messages.');
        setLoading(false);
        return;
      }

      // Fetch the scheduled exams from API to get fully populated data
      // This ensures all fields (subject, departments, classrooms, etc.) are properly populated
      // Fetch exams for all scheduled semesters within the date range
      const allFetchedExams = [];
      for (const sem of formData.semesters) {
        try {
          const semExams = await unifiedExamSchedulerAPI.getScheduledExams({ 
            semester: sem,
            startDate: formData.dateRange.start,
            endDate: formData.dateRange.end
          });
          console.log(`📅 Fetched ${semExams.data?.length || 0} exams for semester ${sem}`);
          if (semExams.data && Array.isArray(semExams.data)) {
            allFetchedExams.push(...semExams.data);
          }
        } catch (e) {
          console.warn(`Failed to fetch exams for semester ${sem}:`, e);
        }
      }

      // Filter to only include exams scheduled in this batch (within date range and with proper status)
      const startDate = new Date(formData.dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(formData.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      const filteredExams = allFetchedExams.filter(exam => {
        if (!exam.examDate) return false;
        const examDate = new Date(exam.examDate);
        return examDate >= startDate && examDate <= endDate && exam.isActive !== false;
      });

      console.log(`✅ Final filtered exams: ${filteredExams.length} exams to display`);

      // Use fetched exams if available, otherwise fall back to result data
      const examsToDisplay = filteredExams.length > 0 ? filteredExams : (result.data?.exams || []);
      
      if (examsToDisplay.length === 0) {
        console.warn('⚠️ No exams found after filtering. This may indicate a date/semester mismatch.');
        setError('Exams were scheduled but could not be retrieved. Please check:\n- Date range matches scheduled dates\n- Semester filters are correct\n- Backend console for errors');
        setLoading(false);
        return;
      }

      setScheduledExams(examsToDisplay);
      setSuccess(true);
      setStep(4);
    } catch (err) {
      console.error('Scheduling error:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        response: err.response
      });
      
      // Extract error message
      let errorMessage = 'Failed to schedule exams';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.data?.error) {
        errorMessage = err.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      // Add helpful context
      if (errorMessage.includes('classroom')) {
        errorMessage += '\n\n💡 Please check:\n- Classrooms exist in database\n- Classrooms have isAvailable=true\n- Classrooms have capacity > 0';
      } else if (errorMessage.includes('subject') || errorMessage.includes('enrollment')) {
        errorMessage += '\n\n💡 Please check:\n- Students are enrolled in selected subjects\n- Enrollments match selected semesters\n- Academic year is correct';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      examType: 'End-Semester',
      semesters: [],
      departments: [],
      dateRange: { start: '', end: '' },
      timeSlots: [
        { start: '10:00', end: '13:00' }
      ],
      seatingStrategy: 'department-wise', // Department-wise by default
      academicYear: '2025-2026',
      useParallelScheduling: true // Enable intelligent parallel scheduling by default
    });
    setPreviewData(null);
    setScheduledExams([]);
    setSuccess(false);
    setError(null);
    setActiveTab('timetable');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiCalendar className="mr-3" />
            Unified Exam Scheduler
          </h1>
          <p className="text-gray-600 mt-2">
            Schedule exams based on enrolled students with automatic classroom allocation and seating
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            {['Setup', 'Schedule Details', 'Preview', 'Complete'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step > index + 1
                      ? 'bg-green-500 text-white'
                      : step === index + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > index + 1 ? <FiCheck /> : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                {index < 3 && (
                  <div className={`h-1 w-16 mx-4 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">Scheduling Error</h3>
                <div className="text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <strong>Success!</strong> Exams scheduled successfully
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* STEP 1: Setup */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Step 1: Basic Setup</h2>

              {/* Exam Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type *
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) => handleInputChange('examType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Mid-Semester">Mid-Semester</option>
                  <option value="End-Semester">End-Semester</option>
                  <option value="Supplementary">Supplementary</option>
                </select>
              </div>

              {/* Semesters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Semesters *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <button
                      key={sem}
                      onClick={() => toggleSemester(sem)}
                      className={`py-3 px-4 rounded-lg font-medium transition ${
                        formData.semesters.includes(sem)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Departments (Optional - leave empty for all)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {departments.map(dept => (
                    <button
                      key={dept._id}
                      onClick={() => toggleDepartment(dept._id)}
                      className={`py-3 px-4 rounded-lg font-medium transition ${
                        formData.departments.includes(dept._id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {dept.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule Details */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Step 2: Schedule Details</h2>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Date Range *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slots *
                </label>
                {formData.timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-4 mb-3">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    {formData.timeSlots.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addTimeSlot}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Add Time Slot
                </button>
              </div>

              {/* Seating Strategy */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seating Strategy
                </label>
                <select
                  value={formData.seatingStrategy}
                  onChange={(e) => handleInputChange('seatingStrategy', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="alternate">Alternate (Social Distancing)</option>
                  <option value="department-wise">Department-wise (Each dept in separate classroom)</option>
                  <option value="random">Random Shuffle</option>
                </select>
                {formData.seatingStrategy === 'department-wise' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Department-wise Seating:</strong>
                      <br />
                      • Each department will be assigned to a separate classroom (e.g., CSE in G301, ECE in G302)
                      <br />
                      • Students will keep the SAME seats across ALL exams
                      <br />
                      • Consistent seating arrangement for better organization
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced Scheduling */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="advancedScheduling"
                    checked={formData.useAdvancedScheduling}
                    onChange={(e) => handleInputChange('useAdvancedScheduling', e.target.checked)}
                    className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <label htmlFor="advancedScheduling" className="font-medium text-gray-900 cursor-pointer">
                      Use Advanced Scheduling (Recommended)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Enables intelligent conflict detection and groups subjects with no student overlap in the same time slot.
                      <br />
                      <strong>Example:</strong> PH101 (ME,CE,EI) + CH101 (CSE,ECE,EE) scheduled together.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Preview...
                    </>
                  ) : (
                    'Preview'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && previewData && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Step 3: Preview & Confirm</h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <FiCalendar className="text-blue-600 text-2xl mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {previewData.summary.totalSubjects}
                  </div>
                  <div className="text-sm text-blue-600">Subjects</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <FiUsers className="text-green-600 text-2xl mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {previewData.summary.totalStudents}
                  </div>
                  <div className="text-sm text-green-600">Students</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <FiMapPin className="text-purple-600 text-2xl mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {previewData.summary.estimatedClassrooms}
                  </div>
                  <div className="text-sm text-purple-600">Classrooms</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <FiClock className="text-orange-600 text-2xl mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {Math.ceil(previewData.summary.estimatedInvigilators)}
                  </div>
                  <div className="text-sm text-orange-600">Invigilators</div>
                </div>
              </div>

              {/* Subjects List */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Subjects to be Scheduled</h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departments</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rooms</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.subjects.map((subject, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.code}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{subject.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{subject.semester}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{subject.students}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {subject.departments.join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {subject.estimatedClassrooms}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Confirm & Schedule Exams'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Complete with Timetable, Seating & Invigilators */}
          {step === 4 && success && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheck className="text-green-600 text-4xl" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Scheduling Complete!</h2>
                <p className="text-gray-600 mb-4">
                  Successfully scheduled {scheduledExams.length} exams with:
                </p>
                <div className="flex justify-center gap-6 text-sm text-gray-600">
                  <div>✅ Parallel scheduling (multiple exams per day)</div>
                  <div>✅ No student conflicts</div>
                  <div>✅ Consistent seating arrangements</div>
                  <div>✅ Invigilator assignments</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className={`${
                        activeTab === 'timetable'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                      <FiCalendar />
                      Exam Timetable
                    </button>
                    <button
                      onClick={() => setActiveTab('seating')}
                      className={`${
                        activeTab === 'seating'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                      <FiMapPin />
                      Seating Arrangements
                    </button>
                    <button
                      onClick={() => setActiveTab('invigilators')}
                      className={`${
                        activeTab === 'invigilators'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                      <FiUsers />
                      Invigilator Assignments
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mb-6">
                {activeTab === 'timetable' && (
                  <TimetableView 
                    scheduledExams={scheduledExams}
                    semesters={formData.semesters}
                    dateRange={formData.dateRange}
                  />
                )}
                
                {activeTab === 'seating' && (
                  <SeatingArrangementView 
                    scheduledExams={scheduledExams}
                  />
                )}
                
                {activeTab === 'invigilators' && (
                  <InvigilatorAssignmentView 
                    scheduledExams={scheduledExams}
                  />
                )}
                
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Schedule More Exams
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedExamScheduler;

