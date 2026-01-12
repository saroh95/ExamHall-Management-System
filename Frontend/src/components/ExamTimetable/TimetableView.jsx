import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiPrinter, FiDownload } from 'react-icons/fi';
import api from '../../services/api';
import { formatTimeRange } from '../../utils/timeFormatter';

function TimetableView({ scheduledExams, semesters, dateRange }) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (scheduledExams && scheduledExams.length > 0) {
      generateTimetableFromExams();
    } else {
      setLoading(false);
    }
  }, [scheduledExams]);

  const generateTimetableFromExams = () => {
    try {
      setLoading(true);
      
      // Generate timetable from scheduledExams data
      const timetableData = processTimetableData(scheduledExams);
      setTimetable(timetableData);
      setError(null);
    } catch (err) {
      console.error('Error generating timetable:', err);
      setError('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const processTimetableData = (exams) => {
    const buildTimeString = (exam) => {
      // If time is already a string with " - " (like "9:00 AM - 12:00 PM"), return as-is
      if (exam.time && typeof exam.time === 'string' && exam.time.includes(' - ')) {
        // Check if it's already formatted (contains AM/PM)
        if (exam.time.includes('AM') || exam.time.includes('PM')) {
          return exam.time;
        }
        // Otherwise format it
        const [start, end] = exam.time.split(' - ').map(t => t.trim());
        return formatTimeRange(start, end);
      }
      const start = exam.startTime || (exam.time?.start);
      const end = exam.endTime || (exam.time?.end);
      if (start && end) {
        return formatTimeRange(start, end);
      }
      return formatTimeRange('10:00', '13:00');
    };
    // Group exams by date
    const examsByDate = {};
    
    exams.forEach(exam => {
      // Handle both examDate and date fields, and ensure it's a valid date
      const dateValue = exam.examDate || exam.date;
      if (!dateValue) {
        console.warn('Exam missing date:', exam);
        return;
      }
      
      let dateKey;
      try {
        // Try to parse the date
        const parsedDate = new Date(dateValue);
        if (isNaN(parsedDate.getTime())) {
          // Invalid date, use string as-is if it looks like a date
          dateKey = typeof dateValue === 'string' ? dateValue : new Date().toISOString().split('T')[0];
        } else {
          dateKey = parsedDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('Error parsing date:', dateValue, error);
        dateKey = new Date().toISOString().split('T')[0];
      }
      
      if (!examsByDate[dateKey]) {
        examsByDate[dateKey] = [];
      }
      examsByDate[dateKey].push(exam);
    });

    // Convert to timetable format
    const timetable = Object.entries(examsByDate)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, exams]) => ({
        date: date,
        dateFormatted: new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        exams: exams.map(exam => ({
          subject: exam.subject,
          time: buildTimeString(exam),
          classrooms: exam.classrooms || [],
          students: exam.totalStudents || 0
        }))
      }));

    // Calculate stats
    const totalStudents = exams.reduce((sum, exam) => sum + (exam.totalStudents || 0), 0);
    const totalClassrooms = exams.reduce((sum, exam) => sum + (exam.classrooms?.length || 0), 0);

    return {
      timetable,
      stats: {
        totalExams: exams.length,
        totalDays: timetable.length,
        totalStudents,
        totalClassrooms
      }
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!timetable) return;

    // Generate CSV in the required format
    let csv = 'Date,Subject Code,Name of Subject,Time\n';
    
    timetable.timetable.forEach(day => {
      // Remove duplicates
      const uniqueExams = [];
      const seenSubjects = new Set();
      
      day.exams.forEach(exam => {
        const subjectKey = `${exam.subject.code}-${exam.time}`;
        if (!seenSubjects.has(subjectKey)) {
          seenSubjects.add(subjectKey);
          uniqueExams.push(exam);
        }
      });

      uniqueExams.forEach(exam => {
        const formattedDate = new Date(day.date).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        csv += `"${formattedDate}","${exam.subject.code}","${exam.subject.name}","${exam.time}"\n`;
      });
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-timetable-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!timetable || timetable.timetable.length === 0) {
    return (
      <div className="text-center text-gray-600 p-8">
        No exams scheduled
      </div>
    );
  }

  return (
    <div className="exam-timetable">
      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-gray-900">Exam Timetable</h2>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiPrinter />
            Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FiDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 print:mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">Total Exams</div>
          <div className="text-2xl font-bold text-blue-900">{timetable.stats.totalExams}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">Exam Days</div>
          <div className="text-2xl font-bold text-green-900">{timetable.stats.totalDays}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">Total Students</div>
          <div className="text-2xl font-bold text-purple-900">{timetable.stats.totalStudents}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-orange-600 text-sm font-medium">Classrooms</div>
          <div className="text-2xl font-bold text-orange-900">{timetable.stats.totalClassrooms}</div>
        </div>
      </div>

      {/* Timetable - Grouped Format */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Subject Code
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Name of Subject
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {timetable.timetable.map((day, dayIndex) => {
                // Remove duplicate subjects - keep only unique subjects per day
                const uniqueExams = [];
                const seenSubjects = new Set();
                
                day.exams.forEach(exam => {
                  const subjectKey = `${exam.subject.code}-${exam.time}`;
                  if (!seenSubjects.has(subjectKey)) {
                    seenSubjects.add(subjectKey);
                    uniqueExams.push(exam);
                  }
                });

                // Group by time slot
                const examsByTime = {};
                uniqueExams.forEach(exam => {
                  if (!examsByTime[exam.time]) {
                    examsByTime[exam.time] = [];
                  }
                  examsByTime[exam.time].push(exam);
                });

                let firstRowForDate = true;
                const allRows = [];

                Object.entries(examsByTime).forEach(([time, examsInSlot]) => {
                  examsInSlot.forEach((exam, examIdx) => {
                    const isFirstInTimeSlot = examIdx === 0;
                    allRows.push({
                      exam,
                      time,
                      showDate: firstRowForDate,
                      showTime: isFirstInTimeSlot,
                      timeSlotRowspan: examsInSlot.length,
                      dateRowspan: uniqueExams.length
                    });
                    firstRowForDate = false;
                  });
                });

                return allRows.map((row, rowIdx) => (
                  <tr key={`${dayIndex}-${rowIdx}`} className="hover:bg-gray-50">
                    {row.showDate && (
                      <td 
                        rowSpan={row.dateRowspan} 
                        className="border border-gray-300 px-4 py-3 text-sm text-gray-900 align-top font-medium"
                      >
                        {day.dateFormatted}
                      </td>
                    )}
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                      {row.exam.subject.code}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                      {row.exam.subject.name}
                    </td>
                    {row.showTime && (
                      <td 
                        rowSpan={row.timeSlotRowspan} 
                        className="border border-gray-300 px-4 py-3 text-sm text-gray-900 align-top"
                      >
                        {row.time}
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <p className="font-semibold">Note: Multiple subjects on the same day are scheduled at the same time for different departments.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .exam-timetable, .exam-timetable * {
            visibility: visible;
          }
          .exam-timetable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          
          /* Print-specific table styles */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          
          /* Ensure borders print correctly */
          .border {
            border: 1px solid #000 !important;
          }
          
          /* Remove shadows in print */
          .shadow-md {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

TimetableView.propTypes = {
  scheduledExams: PropTypes.array.isRequired,
  semesters: PropTypes.array.isRequired,
  dateRange: PropTypes.object.isRequired
};

export default TimetableView;

