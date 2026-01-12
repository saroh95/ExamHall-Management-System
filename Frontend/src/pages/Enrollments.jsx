import React, { useState, useEffect, useMemo } from 'react';
import { FiUsers, FiBook, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiDownload, FiSearch, FiX, FiTrash2, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { enrollmentAPI, subjectAPI, departmentAPI } from '../services/api';

const Enrollments = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrollmentStats, setEnrollmentStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoEnrolling, setAutoEnrolling] = useState(false);
  const [autoEnrollingElectives, setAutoEnrollingElectives] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  // Search states
  const [subjectSearch, setSubjectSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getSubjects();
      if (response.data.success) {
        setSubjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getDepartments();
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubjectSelect = async (subject) => {
    setSelectedSubject(subject);
    setStudentSearch(''); // Reset student search
    setLoading(true);

    try {
      // Fetch enrolled students
      const enrollmentsResponse = await enrollmentAPI.getSubjectEnrollments(subject._id);
      if (enrollmentsResponse.data.success) {
        setEnrolledStudents(enrollmentsResponse.data.data || []);
        
        // Fetch stats
        const statsResponse = await enrollmentAPI.getEnrollmentStats(subject._id);
        if (statsResponse.data.success) {
          setEnrollmentStats(statsResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoEnrollAll = async () => {
    if (!window.confirm('This will auto-enroll all active students in their respective subjects. Continue?')) {
      return;
    }

    setAutoEnrolling(true);
    try {
      const response = await enrollmentAPI.autoEnrollAllStudents();
      console.log('📊 Auto-Enroll Response:', response.data);
      
      if (response.data.success) {
        const { success = [], failed = [] } = response.data.data || {};
        
        // Calculate total enrollments
        const totalEnrollments = success.reduce((sum, s) => sum + (s.enrolled || 0), 0);
        const totalStudents = success.length;
        
        console.log(`✅ Successfully processed ${totalStudents} students`);
        console.log(`📚 Total enrollments created: ${totalEnrollments}`);
        console.log('Success details:', success);
        console.log('Failed details:', failed);
        
        // Show detailed error breakdown
        if (failed.length > 0) {
          const errorGroups = {};
          failed.forEach(f => {
            const errorMsg = f.error || 'Unknown error';
            errorGroups[errorMsg] = (errorGroups[errorMsg] || 0) + 1;
          });
          console.log('📊 Error Breakdown:');
          Object.entries(errorGroups).forEach(([error, count]) => {
            console.log(`   ${count}x: ${error}`);
          });
          console.log('\n🔍 First 10 failed students:', failed.slice(0, 10));
        }
        
        if (totalEnrollments > 0) {
          toast.success(
            `✅ Auto-enrolled ${totalStudents} students in ${totalEnrollments} total subjects!`,
            { autoClose: 5000 }
          );
        } else if (totalStudents > 0) {
          toast.warning(
            `⚠️ Processed ${totalStudents} students but no new enrollments (they may already be enrolled)`,
            { autoClose: 7000 }
          );
        } else {
          toast.error('❌ No students found to enroll!');
        }
        
        if (failed.length > 0) {
          toast.error(`⚠️ ${failed.length} students failed. Check console for details.`, { autoClose: 5000 });
        }
        
        // Refresh current subject if selected
        if (selectedSubject) {
          handleSubjectSelect(selectedSubject);
        }
      }
    } catch (error) {
      console.error('❌ Error auto-enrolling:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        fullResponse: error.response?.data
      });
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to auto-enroll students';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setAutoEnrolling(false);
    }
  };

  const handleAutoEnrollElectives = async () => {
    if (!window.confirm('This will auto-enroll all eligible students in Core and Open Electives using round-robin distribution. Continue?')) {
      return;
    }

    setAutoEnrollingElectives(true);
    try {
      const response = await enrollmentAPI.autoEnrollElectives();
      console.log('📊 Auto-Enroll Electives Response:', response.data);
      
      if (response.data.success) {
        const { studentsProcessed, coreElectiveEnrollments, openElectiveEnrollments, totalEnrollments } = response.data.data || {};
        
        console.log(`✅ Successfully processed ${studentsProcessed} students`);
        console.log(`📚 Core Elective enrollments: ${coreElectiveEnrollments}`);
        console.log(`🌐 Open Elective enrollments: ${openElectiveEnrollments}`);
        console.log(`📊 Total elective enrollments: ${totalEnrollments}`);
        
        if (totalEnrollments > 0) {
          toast.success(
            `✅ Auto-enrolled electives for ${studentsProcessed} students!\n` +
            `Core: ${coreElectiveEnrollments} | Open: ${openElectiveEnrollments}`,
            { autoClose: 5000 }
          );
        } else {
          toast.warning(
            `⚠️ No elective enrollments created. Students may already be enrolled or no electives available.`,
            { autoClose: 7000 }
          );
        }
        
        // Refresh current subject if selected
        if (selectedSubject) {
          handleSubjectSelect(selectedSubject);
        }
      }
    } catch (error) {
      console.error('❌ Error auto-enrolling electives:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        fullResponse: error.response?.data
      });
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to auto-enroll electives';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setAutoEnrollingElectives(false);
    }
  };

  const handleUnenrollStudent = async (enrollmentId, studentName) => {
    if (!window.confirm(`Are you sure you want to unenroll ${studentName}?`)) {
      return;
    }

    try {
      const response = await enrollmentAPI.dropEnrollment(enrollmentId);
      if (response.data.success) {
        toast.success(`Unenrolled ${studentName}`);
        // Refresh the subject
        handleSubjectSelect(selectedSubject);
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast.error('Failed to unenroll student');
    }
  };

  const handleClearSubjectEnrollments = async () => {
    if (!window.confirm(`⚠️ This will unenroll ALL ${enrolledStudents.length} students from "${selectedSubject.name}". Are you sure?`)) {
      return;
    }

    try {
      const response = await enrollmentAPI.clearSubjectEnrollments(selectedSubject._id);
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the subject
        handleSubjectSelect(selectedSubject);
      }
    } catch (error) {
      console.error('Error clearing enrollments:', error);
      toast.error('Failed to clear enrollments');
    }
  };

  const handleClearAllEnrollments = async () => {
    if (!window.confirm('⚠️ DANGER: This will delete ALL enrollments from ALL subjects. This cannot be undone! Are you absolutely sure?')) {
      return;
    }

    // Double confirmation
    const confirmation = prompt('Type "DELETE ALL" to confirm:');
    if (confirmation !== 'DELETE ALL') {
      toast.info('Action cancelled');
      return;
    }

    try {
      const response = await enrollmentAPI.clearAllEnrollments();
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh current subject if selected
        if (selectedSubject) {
          handleSubjectSelect(selectedSubject);
        }
      }
    } catch (error) {
      console.error('Error clearing all enrollments:', error);
      toast.error('Failed to clear all enrollments');
    }
  };

  const exportEnrollments = () => {
    if (!enrolledStudents.length) {
      toast.warning('No enrollments to export');
      return;
    }

    const csvContent = [
      ['Scholar ID', 'Name', 'Department', 'Semester', 'Enrollment Type', 'Status'].join(','),
      ...enrolledStudents.map(e => [
        e.student.scholarId,
        e.student.fullName,
        e.student.department?.name || 'N/A',
        e.semester,
        e.enrollmentType,
        e.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubject?.name || 'enrollments'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    
    const search = subjectSearch.toLowerCase();
    return subjects.filter(subject => 
      subject.code.toLowerCase().includes(search) ||
      subject.name.toLowerCase().includes(search) ||
      (subject.subjectType && subject.subjectType.toLowerCase().includes(search))
    );
  }, [subjects, subjectSearch]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return enrolledStudents;
    
    const search = studentSearch.toLowerCase();
    return enrolledStudents.filter(enrollment =>
      enrollment.student.scholarId.toLowerCase().includes(search) ||
      enrollment.student.fullName.toLowerCase().includes(search) ||
      (enrollment.student.department?.name && enrollment.student.department.name.toLowerCase().includes(search))
    );
  }, [enrolledStudents, studentSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FiBook className="mr-3 text-blue-600" />
            Enrollment Management
          </h1>
          <p className="text-gray-600 mt-2">View and manage student enrollments</p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleAutoEnrollAll}
              disabled={autoEnrolling || autoEnrollingElectives}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${autoEnrolling ? 'animate-spin' : ''}`} />
              {autoEnrolling ? 'Auto-Enrolling...' : 'Auto-Enroll Core Subjects'}
            </button>

            <button
              onClick={handleAutoEnrollElectives}
              disabled={autoEnrolling || autoEnrollingElectives}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              <FiCheckCircle className={`mr-2 ${autoEnrollingElectives ? 'animate-spin' : ''}`} />
              {autoEnrollingElectives ? 'Enrolling Electives...' : 'Auto-Enroll Electives'}
            </button>

            <button
              onClick={handleClearAllEnrollments}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition"
            >
              <FiTrash2 className="mr-2" />
              Clear All Enrollments
            </button>

            {selectedSubject && enrolledStudents.length > 0 && (
              <>
                <button
                  onClick={handleClearSubjectEnrollments}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:opacity-90 transition"
                >
                  <FiXCircle className="mr-2" />
                  Clear This Subject
                </button>
                
                <button
                  onClick={exportEnrollments}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition"
                >
                  <FiDownload className="mr-2" />
                  Export Enrollments
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subjects List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiBook className="mr-2 text-blue-600" />
                Subjects ({filteredSubjects.length})
              </h2>

              {/* Subject Search Bar */}
              <div className="mb-4 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {subjectSearch && (
                  <button
                    onClick={() => setSubjectSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No subjects found
                  </div>
                ) : (
                  filteredSubjects.map((subject) => (
                    <div
                      key={subject._id}
                      onClick={() => handleSubjectSelect(subject)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedSubject?._id === subject._id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{subject.code}</div>
                      <div className="text-sm text-gray-600">{subject.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {subject.subjectType || 'Core'} • Sem {subject.semesterId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Enrollment Details */}
          <div className="lg:col-span-2">
            {!selectedSubject ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FiUsers className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Select a subject to view enrollments</p>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading enrollments...</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                {enrollmentStats && enrollmentStats.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
                      <div className="text-3xl font-bold">{enrolledStudents.length}</div>
                      <div className="text-blue-100">Total Enrolled</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                      <div className="text-3xl font-bold">{enrollmentStats.length}</div>
                      <div className="text-green-100">Departments</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                      <div className="text-3xl font-bold">{selectedSubject.credits || 3}</div>
                      <div className="text-purple-100">Credits</div>
                    </div>
                  </div>
                )}

                {/* Department-wise Stats */}
                {enrollmentStats && enrollmentStats.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Department-wise Distribution</h3>
                    <div className="space-y-3">
                      {enrollmentStats.map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-800">{stat._id}</div>
                          <div className="flex items-center">
                            <div className="text-2xl font-bold text-blue-600 mr-4">{stat.count}</div>
                            <div className="text-sm text-gray-500">students</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enrolled Students Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <FiUsers className="mr-2 text-blue-600" />
                      Enrolled Students ({filteredStudents.length})
                    </h3>
                  </div>

                  {/* Student Search Bar */}
                  {enrolledStudents.length > 0 && (
                    <div className="mb-4 relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students by name, scholar ID, or department..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {studentSearch && (
                        <button
                          onClick={() => setStudentSearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  )}

                  {enrolledStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <FiAlertCircle className="mx-auto text-4xl text-gray-300 mb-2" />
                      <p className="text-gray-500">No students enrolled yet</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <FiSearch className="mx-auto text-4xl text-gray-300 mb-2" />
                      <p className="text-gray-500">No students match your search</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholar ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredStudents.map((enrollment) => (
                            <tr key={enrollment._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {enrollment.student.scholarId}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {enrollment.student.fullName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {enrollment.student.department?.name || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {enrollment.semester}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  enrollment.enrollmentType === 'Auto-Core' ? 'bg-blue-100 text-blue-800' :
                                  enrollment.enrollmentType === 'Auto-Common' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {enrollment.enrollmentType}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  enrollment.status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                                  enrollment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {enrollment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button
                                  onClick={() => handleUnenrollStudent(enrollment._id, enrollment.student.fullName)}
                                  className="text-red-600 hover:text-red-800 transition"
                                  title="Unenroll this student"
                                >
                                  <FiXCircle className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollments;
