import { useState } from 'react';
import PropTypes from 'prop-types';
import { FiPrinter, FiDownload, FiUser, FiShield, FiMapPin, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import unifiedExamSchedulerAPI from '../../services/unifiedExamSchedulerAPI';

function InvigilatorAssignmentView({ scheduledExams }) {
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

  const handlePrintInvigilators = (examId) => {
    const printData = examDetails[examId];
    if (!printData) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invigilator Duty Roster - ${printData.subject.name}</title>
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
            }
            th {
              background: #e0e0e0;
              font-weight: bold;
            }
            .role-chief {
              background: #fef3c7;
              font-weight: bold;
            }
            .note {
              margin-top: 20px;
              font-style: italic;
              color: #666;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              width: 40%;
              border-top: 1px solid #000;
              padding-top: 10px;
              text-align: center;
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
            <h1>INVIGILATOR DUTY ROSTER</h1>
            <h2>${printData.title}</h2>
            <p><strong>Date:</strong> ${new Date(printData.examDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${printData.startTime} - ${printData.endTime}</p>
            <p><strong>Duration:</strong> ${printData.duration} minutes</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th style="width: 150px;">Employee ID</th>
                <th>Invigilator Name</th>
                <th style="width: 120px;">Role</th>
                <th>Assigned Classroom(s)</th>
                <th style="width: 100px;">Students</th>
              </tr>
            </thead>
            <tbody>
              ${printData.invigilators.map((inv, idx) => {
                const assignedClassrooms = printData.classrooms.filter(c =>
                  inv.assignedClassrooms && inv.assignedClassrooms.some(ac => 
                    ac.toString() === c.classroom._id.toString()
                  )
                );
                const totalStudents = assignedClassrooms.reduce((sum, c) => sum + c.assignedStudents.length, 0);
                
                // Handle teacher data safely
                const teacherName = inv.teacher?.fullName || inv.teacher?.name || 'Unknown Teacher';
                const employeeId = inv.teacher?.employeeId || '-';
                
                return `
                  <tr class="${inv.role === 'chief_invigilator' ? 'role-chief' : ''}">
                    <td>${idx + 1}</td>
                    <td>${employeeId}</td>
                    <td>${teacherName}</td>
                    <td>${inv.role === 'chief_invigilator' ? '👑 Chief' : '📝 Invigilator'}</td>
                    <td>${assignedClassrooms.map(c => c.classroom.name).join(', ') || '-'}</td>
                    <td>${totalStudents}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="note">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Invigilators must report 15 minutes before the exam starts</li>
              <li>Verify student identity cards and admit cards</li>
              <li>Ensure no unauthorized materials or electronic devices</li>
              <li>Maintain exam hall discipline and silence</li>
              <li>Report any irregularities immediately</li>
            </ul>
          </div>
          
          <div class="signature-section">
            <div class="signature">
              Controller of Examinations
            </div>
            <div class="signature">
              Chief Invigilator Signature
            </div>
          </div>
          
          <button class="no-print" onclick="window.print()" style="padding: 10px 20px; margin: 20px auto; display: block; background: #4F46E5; color: white; border: none; cursor: pointer; border-radius: 5px;">Print</button>
          
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportInvigilators = (examId) => {
    const exam = examDetails[examId];
    if (!exam) return;

    let csv = 'Employee ID,Invigilator Name,Role,Department,Assigned Classrooms,Total Students\n';
    
    exam.invigilators.forEach(inv => {
      const assignedClassrooms = exam.classrooms.filter(c =>
        inv.assignedClassrooms && inv.assignedClassrooms.some(ac => 
          ac.toString() === c.classroom._id.toString()
        )
      );
      const classroomNames = assignedClassrooms.map(c => c.classroom.name).join('; ');
      const totalStudents = assignedClassrooms.reduce((sum, c) => sum + c.assignedStudents.length, 0);
      
      // Handle teacher data safely
      const teacherName = inv.teacher?.fullName || inv.teacher?.name || 'Unknown Teacher';
      const employeeId = inv.teacher?.employeeId || '';
      const departmentCode = inv.teacher?.department?.code || '';
      
      csv += `"${employeeId}","${teacherName}","${inv.role}","${departmentCode}","${classroomNames}",${totalStudents}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invigilators-${exam.subject.code}-${new Date().toISOString().split('T')[0]}.csv`;
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
    <div className="invigilator-assignment-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invigilator Assignments</h2>
        <p className="text-gray-600">Click on any exam to view and print invigilator duty roster</p>
      </div>

      <div className="space-y-4">
        {scheduledExams.map((exam) => {
          const isExpanded = expandedExam === exam._id;
          const details = examDetails[exam._id];
          const isLoading = loading[exam._id];

          return (
            <div key={exam._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <button
                onClick={() => toggleExam(exam._id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiShield className="text-green-600 text-xl" />
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
                      <span>👥 {exam.invigilators?.length || 0} invigilators</span>
                      <span>🏫 {exam.classrooms?.length || 0} classrooms</span>
                    </div>
                  </div>
                </div>
                {isExpanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : details ? (
                    <div>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handlePrintInvigilators(exam._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <FiPrinter />
                          Print Duty Roster
                        </button>
                        <button
                          onClick={() => handleExportInvigilators(exam._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <FiDownload />
                          Export CSV
                        </button>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Classrooms</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {details.invigilators.map((inv, idx) => {
                              const assignedClassrooms = details.classrooms.filter(c =>
                                inv.assignedClassrooms && inv.assignedClassrooms.some(ac => 
                                  ac.toString() === c.classroom._id.toString()
                                )
                              );
                              const totalStudents = assignedClassrooms.reduce((sum, c) => sum + c.assignedStudents.length, 0);
                              
                              // Handle cases where teacher data might not be populated
                              const teacherName = inv.teacher?.fullName || inv.teacher?.name || 'Unknown Teacher';
                              const employeeId = inv.teacher?.employeeId || '-';
                              
                              return (
                                <tr key={idx} className={`hover:bg-gray-50 ${inv.role === 'chief_invigilator' ? 'bg-yellow-50' : ''}`}>
                                  <td className="px-4 py-3 text-sm text-gray-900">{employeeId}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{teacherName}</td>
                                  <td className="px-4 py-3 text-sm">
                                    {inv.role === 'chief_invigilator' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                        <FiShield /> Chief
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                        <FiUser /> Invigilator
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {assignedClassrooms.length > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <FiMapPin className="text-gray-400" />
                                        {assignedClassrooms.map(c => c.classroom.name).join(', ')}
                                      </div>
                                    ) : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{totalStudents}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 py-4">
                      Failed to load invigilator details
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

InvigilatorAssignmentView.propTypes = {
  scheduledExams: PropTypes.array.isRequired
};

export default InvigilatorAssignmentView;

