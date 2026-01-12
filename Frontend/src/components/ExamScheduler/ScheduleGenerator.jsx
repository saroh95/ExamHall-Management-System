import { useState, useEffect } from 'react';
import { FiArrowRight, FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { examSchedulerAPI } from '../../services/examSchedulerAPI';
import { toast } from 'react-toastify';

const ScheduleGenerator = ({
  examDetails,
  selectedSubjects,
  selectedDepartments,
  selectedSemesters,
  schedule,
  setSchedule,
  nextStep,
  prevStep
}) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Parse "YYYY-MM-DD" → Date or null
  const parseDate = ds => {
    const d = new Date(ds);
    return isNaN(d) ? null : d;
  };
  const isSunday = d => d.getDay() === 0;

  // Build available dates array
  useEffect(() => {
    const { startDate, endDate } = examDetails;
    if (!startDate || !endDate) return;
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) {
      setError('Invalid date format. Use YYYY-MM-DD.');
      setAvailableDates([]);
      return;
    }
    if (start > end) {
      setError('Start date must precede end date.');
      setAvailableDates([]);
      return;
    }
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (!isSunday(d)) dates.push(new Date(d));
    }
    setAvailableDates(dates);
    setError(null);
  }, [examDetails.startDate, examDetails.endDate]);

  const formatDate = d =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const generateSchedule = async () => {
    setError(null);
    const { timeSlots } = examDetails;
    
    if (availableDates.length < 2) {
      setError('Need at least two valid dates.');
      return;
    }
    if (!timeSlots || timeSlots.length < 1) {
      setError('Define at least one time slot.');
      return;
    }
    if (!selectedSubjects.length) {
      setError('Select subjects first.');
      return;
    }
    if (!selectedDepartments.length) {
      setError('Select departments first.');
      return;
    }
    if (!selectedSemesters.length) {
      setError('Select semesters first.');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare schedule data for API
      const scheduleData = {
        examDetails,
        selectedSubjects,
        selectedDepartments,
        selectedSemesters,
        availableDates: availableDates.map(d => d.toISOString().split('T')[0]),
        timeSlots
      };

      // Validate schedule with backend
      const validationResponse = await examSchedulerAPI.validateSchedule(scheduleData);
      
      if (!validationResponse.data.success) {
        setError(validationResponse.data.message || 'Schedule validation failed');
        return;
      }

      // Check for conflicts
      const conflictsResponse = await examSchedulerAPI.getScheduleConflicts(scheduleData);
      
      if (conflictsResponse.data.conflicts && conflictsResponse.data.conflicts.length > 0) {
        setError(`Schedule conflicts found: ${conflictsResponse.data.conflicts.join(', ')}`);
        return;
      }

      // Generate schedule using backend
      const scheduleResponse = await examSchedulerAPI.createExamSchedule(scheduleData);
      
      if (scheduleResponse.data.success) {
        setSchedule(scheduleResponse.data.data);
        toast.success('Schedule generated successfully!');
        
        // Log auto-assignment details
        console.log('📊 Auto-Assignment Details from Backend:');
        scheduleResponse.data.data.forEach((exam, index) => {
          console.log(`  ${index + 1}. ${exam.subjectName} (${exam.subjectCode})`);
          console.log(`     🏢 Auto-assigned Classroom: ${exam.classroomName || 'None'} (${exam.classroomCapacity || 'N/A'} capacity)`);
          console.log(`     👨‍🏫 Auto-assigned Invigilator: ${exam.invigilatorName || 'None'}`);
        });
      } else {
        setError(scheduleResponse.data.message || 'Failed to generate schedule');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      setError('Failed to generate schedule. Please try again.');
      toast.error('Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!schedule.length) {
      setError('Please generate schedule first.');
    } else {
      nextStep();
    }
  };

  // Group by date for display
  const grouped = schedule.reduce((acc, itm) => {
    (acc[itm.date] = acc[itm.date] || []).push(itm);
    return acc;
  }, {});

  // Print handler: opens a new print window for the schedule table only
  const printSchedule = () => {
    const tableArea = document.getElementById('printableSchedule');
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <html>
      <head>
        <title>Exam Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2em; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #444; padding: 8px 12px; }
          th { background: #f3f3f3; }
          h4 { margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h4>Generated Exam Schedule</h4>
        ${tableArea.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Generate Exam Schedule</h3>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v6H9V5zm0 8h2v2H9v-2z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Parameters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Available Dates:</h4>
          <div className="flex flex-wrap gap-2">
            {availableDates.length ? (
              availableDates.map((d, i) => (
                <span
                  key={i}
                  className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full"
                >
                  {formatDate(d)}
                </span>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Departments:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedDepartments.length ? (
              selectedDepartments.map(deptId => (
                <span
                  key={deptId}
                  className="inline-block bg-green-100 text-green-800 px-3 py-1 text-sm rounded-full"
                >
                  Dept {deptId}
                </span>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Time Slots:</h4>
          <div className="flex flex-wrap gap-2">
            {examDetails.timeSlots?.length ? (
              examDetails.timeSlots.map((slot, i) => (
                <span
                  key={i}
                  className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 text-sm rounded-full"
                >
                  {slot.start}–{slot.end}
                </span>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Subjects:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.length ? (
              selectedSubjects.map(id => (
                <span
                  key={id}
                  className="inline-block bg-purple-100 text-purple-800 px-3 py-1 text-sm rounded-full"
                >
                  Subject {id}
                </span>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-md"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={generateSchedule}
            disabled={
              loading ||
              !selectedSubjects.length ||
              !selectedDepartments.length ||
              !selectedSemesters.length ||
              availableDates.length < 2 ||
              !examDetails.timeSlots?.length
            }
            className={`flex items-center px-6 py-2.5 rounded-lg transition shadow-md ${
              loading ||
              !selectedSubjects.length ||
              !selectedDepartments.length ||
              !selectedSemesters.length ||
              availableDates.length < 2 ||
              !examDetails.timeSlots?.length
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:opacity-90'
            }`}
          >
            {loading ? 'Generating...' : 'Generate Schedule'}
          </button>
          
          {schedule.length > 0 && (
            <button
              type="button"
              onClick={printSchedule}
              className="flex items-center px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition shadow-md"
            >
              <FiPrinter className="mr-2" /> Print
            </button>
          )}
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!schedule.length}
            className={`flex items-center px-6 py-2.5 rounded-lg transition shadow-md ${
              !schedule.length
                ? 'bg-indigo-300 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-teal-700 text-white hover:opacity-90'
            }`}
          >
            Next <FiArrowRight className="ml-2" />
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      {schedule.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">
              Generated Schedule ({schedule.length} items)
            </h4>
            <button
              onClick={printSchedule}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <FiPrinter className="mr-1" /> Print
            </button>
          </div>
          
          <div id="printableSchedule" className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Code', 'Subject', 'Department', 'Time', 'Classroom', 'Invigilator'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(grouped).map(([date, items]) =>
                  items.map((it, idx) => (
                    <tr key={`${date}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {idx === 0 ? formatDate(date) : ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {it.subjectCode}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {it.subjectName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {it.departmentName || `Dept ${it.departmentId}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {it.timeSlot && typeof it.timeSlot === 'string' 
                          ? it.timeSlot 
                          : it.timeSlot?.start && it.timeSlot?.end 
                            ? `${it.timeSlot.start} - ${it.timeSlot.end}`
                            : '10:00 AM - 1:00 PM'
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {it.classroomName || 'Auto-assigned'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {it.invigilatorName || 'Auto-assigned'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGenerator;