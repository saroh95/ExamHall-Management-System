import { useState } from 'react';
import PropTypes from 'prop-types';
import { FiPrinter, FiDownload, FiMapPin, FiUsers, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import unifiedExamSchedulerAPI from '../../services/unifiedExamSchedulerAPI';

function SeatingArrangementView({ scheduledExams }) {
  const [expandedExam, setExpandedExam] = useState(null);
  const [examDetails, setExamDetails] = useState({});
  const [loading, setLoading] = useState({});

  const toggleExam = async (examId) => {
    if (expandedExam === examId) {
      setExpandedExam(null);
      return;
    }

    setExpandedExam(examId);

    // Fetch detailed exam info if not already loaded
    if (!examDetails[examId]) {
      setLoading(prev => ({ ...prev, [examId]: true }));
      try {
        const result = await unifiedExamSchedulerAPI.getExamDetails(examId);
        setExamDetails(prev => ({ ...prev, [examId]: result.data }));
      } catch (error) {
        console.error('Error fetching exam details:', error);
      } finally {
        setLoading(prev => ({ ...prev, [examId]: false }));
      }
    }
  };

  const handlePrintSeating = (examId) => {
    // Store current exam for printing
    const printData = examDetails[examId];
    if (!printData) return;

    // Create a print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Seating Arrangement - ${printData.subject.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1, h2 {
              text-align: center;
            }
            .header {
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .classroom {
              margin-bottom: 40px;
              page-break-after: always;
            }
            .classroom-header {
              background: #f0f0f0;
              padding: 10px;
              font-weight: bold;
              border: 1px solid #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #e0e0e0;
              font-weight: bold;
            }
            .note {
              margin-top: 20px;
              font-style: italic;
              color: #666;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SEATING ARRANGEMENT</h1>
            <h2>${printData.title}</h2>
            <p><strong>Date:</strong> ${new Date(printData.examDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${printData.startTime} - ${printData.endTime}</p>
            <p><strong>Duration:</strong> ${printData.duration} minutes</p>
            <p><strong>Total Students:</strong> ${printData.totalStudents}</p>
          </div>
          
          ${printData.classrooms.map((classroom, idx) => `
            <div class="classroom">
              <div class="classroom-header">
                ${classroom.classroom.name} - ${classroom.classroom.building}, Floor ${classroom.classroom.floor}
                <br>Capacity: ${classroom.classroom.capacity} | Students: ${classroom.assignedStudents.length}
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 150px;">Seat Number</th>
                    <th style="width: 150px;">Scholar ID</th>
                    <th>Student Name</th>
                    <th style="width: 100px;">Department</th>
                  </tr>
                </thead>
                <tbody>
                  ${classroom.seatingArrangement.map((seat, seatIdx) => {
                    const student = classroom.assignedStudents.find(s => s._id === seat.student);
                    return `
                      <tr>
                        <td>${seatIdx + 1}</td>
                        <td><strong>${seat.seatNumber}</strong></td>
                        <td>${student ? student.scholarId : '-'}</td>
                        <td>${student ? student.fullName : '-'}</td>
                        <td>${student && student.department ? student.department.code : '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div class="note">
            <p>Note: Students must carry their ID cards and admit cards. Mobile phones are strictly prohibited.</p>
          </div>
          
          <button class="no-print" onclick="window.print()" style="padding: 10px 20px; margin: 20px auto; display: block; background: #4F46E5; color: white; border: none; cursor: pointer; border-radius: 5px;">Print</button>
          
          <script>
            // Auto-print on load
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportSeating = (examId) => {
    const exam = examDetails[examId];
    if (!exam) return;

    // Generate CSV
    let csv = 'Classroom,Seat Number,Row,Column,Scholar ID,Student Name,Department\n';
    
    exam.classrooms.forEach(classroom => {
      classroom.seatingArrangement.forEach(seat => {
        const student = classroom.assignedStudents.find(s => s._id === seat.student);
        csv += `"${classroom.classroom.name}","${seat.seatNumber}",${seat.row},${seat.column},"${student ? student.scholarId : ''}","${student ? student.fullName : ''}","${student && student.department ? student.department.code : ''}"\n`;
      });
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating-${exam.subject.code}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!scheduledExams || scheduledExams.length === 0) {
    return (
      <div className="text-center text-gray-600 p-8">
        No exams available
      </div>
    );
  }

  return (
    <div className="seating-arrangement-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Seating Arrangements</h2>
        <p className="text-gray-600">Click on any exam to view and print seating arrangements</p>
      </div>

      <div className="space-y-4">
        {scheduledExams.map((exam) => {
          const isExpanded = expandedExam === exam._id;
          const details = examDetails[exam._id];
          const isLoading = loading[exam._id];

          return (
            <div key={exam._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {/* Exam Header - Clickable */}
              <button
                onClick={() => toggleExam(exam._id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FiMapPin className="text-indigo-600 text-xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {exam.subject.code} - {exam.subject.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(exam.examDate || exam.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} • {exam.startTime}-{exam.endTime}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>👥 {exam.totalStudents} students</span>
                      <span>🏫 {exam.classrooms?.length || 0} classrooms</span>
                    </div>
                  </div>
                </div>
                {isExpanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : details ? (
                    <div>
                      {/* Action Buttons */}
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handlePrintSeating(exam._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <FiPrinter />
                          Print Seating
                        </button>
                        <button
                          onClick={() => handleExportSeating(exam._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <FiDownload />
                          Export CSV
                        </button>
                      </div>

                      {/* Classrooms */}
                      <div className="space-y-4">
                        {details.classrooms.map((classroom, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-900">
                                {classroom.classroom.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {classroom.classroom.building}, Floor {classroom.classroom.floor} • 
                                Capacity: {classroom.classroom.capacity} • 
                                Students: {classroom.assignedStudents.length}
                              </p>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scholar ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {classroom.seatingArrangement.slice(0, 10).map((seat, seatIdx) => {
                                    const student = classroom.assignedStudents.find(s => s._id === seat.student);
                                    return (
                                      <tr key={seatIdx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900">{seatIdx + 1}</td>
                                        <td className="px-4 py-2 text-sm font-semibold text-indigo-600">{seat.seatNumber}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{student ? student.scholarId : '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{student ? student.fullName : '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                          {student && student.department ? student.department.code : '-'}
                                        </td>
                                        
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            
                            {classroom.seatingArrangement.length > 10 && (
                              <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-600">
                                Showing 10 of {classroom.seatingArrangement.length} seats. Print or export to see all.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 py-4">
                      Failed to load seating details
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

SeatingArrangementView.propTypes = {
  scheduledExams: PropTypes.array.isRequired
};

export default SeatingArrangementView;

