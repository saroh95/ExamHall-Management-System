import React, { useState, useEffect } from 'react';
import { FiUser, FiUserCheck, FiUserX, FiClock, FiSearch, FiFilter, FiDownload, FiRefreshCw, FiFileText } from 'react-icons/fi';
import api from '../../services/api';

const AttendanceList = ({ examId, examDetails, initialRoom = '' }) => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    room: initialRoom || '',
    search: ''
  });
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // Load attendance data
  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.room) params.append('room', filters.room);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/attendance/${examId}?${params}`);
      if (response.data.success) {
        setAttendance(response.data.data.attendance);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      alert('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadAttendance();
    }
  }, [examId, filters]);

  // Keep room filter in sync with initialRoom when it changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, room: initialRoom || '' }));
  }, [initialRoom]);

  // Mark attendance for selected students
  const markAttendance = async (status, studentIds = null) => {
    try {
      setSaving(true);
      const studentsToMark = studentIds || Array.from(selectedStudents);
      
      if (studentsToMark.length === 0) {
        alert('Please select students to mark attendance');
        return;
      }

      const response = await api.post(`/attendance/${examId}/mark`, {
        studentIds: studentsToMark,
        status: status
      });

      if (response.data.success) {
        const nowIso = new Date().toISOString();
        const updatedIds = new Set(studentsToMark.map(id => String(id)));
        setAttendance(prev => prev.map(row => {
          if (updatedIds.has(String(row.studentId))) {
            return { ...row, status, markedAt: nowIso };
          }
          return row;
        }));
        setSummary(prev => ({
          ...prev,
          present: status === 'present' ? prev.present + studentsToMark.length : prev.present - (status === 'present' ? 0 : 0),
          absent: status === 'absent' ? prev.absent + studentsToMark.length : prev.absent,
          late: status === 'late' ? prev.late + studentsToMark.length : prev.late,
          not_taken: Math.max(0, (prev.not_taken || 0) - studentsToMark.length)
        }));
        setSelectedStudents(new Set());
      } else {
        alert('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  // Handle individual student status change
  const handleStatusChange = async (studentId, newStatus) => {
    try {
      setSaving(true);
      const response = await api.post(`/attendance/${examId}/mark`, {
        studentIds: [studentId],
        status: newStatus
      });

      if (response.data.success) {
        const nowIso = new Date().toISOString();
        setAttendance(prev => prev.map(row => row.studentId === studentId ? { ...row, status: newStatus, markedAt: nowIso } : row));
        setSummary(prev => {
          const delta = { present: 0, absent: 0, late: 0, not_taken: 0 };
          const existing = attendance.find(r => r.studentId === studentId)?.status || 'not_taken';
          if (existing !== newStatus) {
            if (existing === 'present') delta.present--;
            if (existing === 'absent') delta.absent--;
            if (existing === 'late') delta.late--;
            if (existing === 'not_taken') delta.not_taken--;
            if (newStatus === 'present') delta.present++;
            if (newStatus === 'absent') delta.absent++;
            if (newStatus === 'late') delta.late++;
          }
          return {
            ...prev,
            present: prev.present + delta.present,
            absent: prev.absent + delta.absent,
            late: prev.late + delta.late,
            not_taken: (prev.not_taken || 0) + delta.not_taken
          };
        });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = () => {
    if (bulkAction && selectedStudents.size > 0) {
      markAttendance(bulkAction);
    }
  };

  // Select all students
  const selectAll = () => {
    setSelectedStudents(new Set(attendance.map(student => student.studentId)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  // Export attendance to CSV
  const exportToCSV = () => {
    try {
      const csvData = [
        ['Roll Number', 'Student Name', 'Email', 'Department', 'Seat', 'Status', 'Marked At', 'Notes'],
        ...attendance.map(student => [
          student.rollNumber || '',
          `${student.firstName} ${student.lastName}`,
          student.email || '',
          student.department || '',
          student.seatName || 'Not assigned',
          student.status || 'absent',
          student.markedAt ? new Date(student.markedAt).toLocaleString() : '',
          student.notes || ''
        ])
      ];

      const csvContent = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${examDetails?.name?.replace(/\s+/g, '_') || 'exam'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export attendance data');
    }
  };

  // Export attendance summary
  const exportSummary = () => {
    try {
      const summaryData = [
        ['Attendance Summary'],
        [''],
        ['Total Students', summary.total],
        ['Present', summary.present],
        ['Absent', summary.absent],
        ['Late', summary.late],
        [''],
        ['Percentage Present', summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(2) + '%' : '0%'],
        ['Percentage Absent', summary.total > 0 ? ((summary.absent / summary.total) * 100).toFixed(2) + '%' : '0%'],
        [''],
        ['Generated on', new Date().toLocaleString()]
      ];

      const csvContent = summaryData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_summary_${examDetails?.name?.replace(/\s+/g, '_') || 'exam'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting summary:', error);
      alert('Failed to export attendance summary');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'not_taken': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <FiUserCheck className="w-4 h-4" />;
      case 'absent': return <FiUserX className="w-4 h-4" />;
      case 'late': return <FiClock className="w-4 h-4" />;
      case 'not_taken': return <FiUser className="w-4 h-4" />;
      default: return <FiUser className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FiRefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading attendance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <FiUser className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <FiUserCheck className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{summary.present}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <FiUserX className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <FiClock className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400">
          <div className="flex items-center">
            <FiUser className="w-8 h-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Not Taken</p>
              <p className="text-2xl font-bold text-gray-700">{summary.not_taken || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="not_taken">Not Taken</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              placeholder="Filter by department"
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              placeholder="Filter by room"
              value={filters.room}
              onChange={(e) => setFilters({...filters, room: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedStudents.size === attendance.length && attendance.length > 0}
              onChange={selectedStudents.size === attendance.length ? clearSelection : selectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Select All ({selectedStudents.size} selected)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bulk Action</option>
              <option value="not_taken">Unmark</option>
              <option value="present">Mark as Present</option>
              <option value="absent">Mark as Absent</option>
              <option value="late">Mark as Late</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || selectedStudents.size === 0 || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
          
          <button
            onClick={exportToCSV}
            disabled={attendance.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <FiFileText className="w-4 h-4 inline mr-1" />
            Export CSV
          </button>
          
          <button
            onClick={exportSummary}
            disabled={attendance.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4 inline mr-1" />
            Export Summary
          </button>
          
          <button
            onClick={loadAttendance}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === attendance.length && attendance.length > 0}
                    onChange={selectedStudents.size === attendance.length ? clearSelection : selectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marked At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.studentId)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedStudents);
                        if (e.target.checked) {
                          newSelected.add(student.studentId);
                        } else {
                          newSelected.delete(student.studentId);
                        }
                        setSelectedStudents(newSelected);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.rollNumber} • {student.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.seatName || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {getStatusIcon(student.status)}
                      <span className="ml-1 capitalize">{student.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.markedAt ? new Date(student.markedAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'not_taken')}
                        disabled={saving || student.status === 'not_taken'}
                        className={`px-2 py-1 text-xs rounded ${
                          student.status === 'not_taken' 
                            ? 'bg-gray-100 text-gray-800 cursor-not-allowed' 
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        Unmark
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'present')}
                        disabled={saving || student.status === 'present'}
                        className={`px-2 py-1 text-xs rounded ${
                          student.status === 'present' 
                            ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'absent')}
                        disabled={saving || student.status === 'absent'}
                        className={`px-2 py-1 text-xs rounded ${
                          student.status === 'absent' 
                            ? 'bg-red-100 text-red-800 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'late')}
                        disabled={saving || student.status === 'late'}
                        className={`px-2 py-1 text-xs rounded ${
                          student.status === 'late' 
                            ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed' 
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {attendance.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No students found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
