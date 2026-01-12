import React, { useEffect, useMemo, useState } from 'react';
import { FiMail, FiRefreshCw, FiSend, FiUsers, FiBell } from 'react-icons/fi';
import { notificationAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import { formatTimeRange } from '../utils/timeFormatter';

const defaultRange = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
};

const Notifications = () => {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'students'
  const [teacherFilters, setTeacherFilters] = useState({ departmentId: '', ...defaultRange() });
  const [studentMessage, setStudentMessage] = useState({
    subject: 'Important: Upcoming Exams & Seating Arrangements',
    message: 'Please note your upcoming exam schedule and seating arrangement details below. Ensure you arrive at the correct classroom on time.'
  });
  const [attachments, setAttachments] = useState({
    seatingFile: null,
    timetableFile: null
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [teacherData, setTeacherData] = useState({ totalTeachers: 0, list: [] });

  const canSend = useMemo(() => currentUser?.role === 'admin' || currentUser?.role === 'user', [currentUser]);

  const loadTeacherPreview = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getTeacherDutyPreview({
        departmentId: teacherFilters.departmentId || undefined,
        startDate: teacherFilters.startDate,
        endDate: teacherFilters.endDate
      });
      setTeacherData(res.data.data || { totalTeachers: 0, list: [] });
      toast.success(`Loaded ${res.data.data?.totalTeachers || 0} teachers`);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      toast.error(msg || 'Failed to load teacher preview');
      setTeacherData({ totalTeachers: 0, list: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type, file) => {
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, Excel, PNG, and JPG files are allowed');
        return;
      }
    }
    setAttachments({ ...attachments, [type]: file });
  };

  const sendTeacherEmails = async () => {
    if (!canSend) return;
    if (!teacherData.list.length) {
      toast.warning('No teacher duties to send');
      return;
    }
    if (!window.confirm(`Send duty emails to ${teacherData.totalTeachers} teachers?`)) return;
    setSending(true);
    try {
      const res = await notificationAPI.sendTeacherDutyEmails({
        subject: 'Your Invigilation Duties',
        filters: {
          departmentId: teacherFilters.departmentId || undefined,
          startDate: teacherFilters.startDate,
          endDate: teacherFilters.endDate
        }
      });
      const queued = res.data.data?.queued || res.data.data?.total || 0;
      toast.success(`✅ ${queued} teacher duty emails queued for sending!`);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      toast.error(msg || 'Failed to send teacher emails');
    } finally {
      setSending(false);
    }
  };

  const sendStudentEmails = async () => {
    if (!canSend) return;
    if (!studentMessage.subject.trim() || !studentMessage.message.trim()) {
      toast.warning('Please enter both subject and message');
      return;
    }
    if (!window.confirm('Send notifications to all students with upcoming exams?')) return;
    setSending(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('subject', studentMessage.subject);
      formData.append('introHtml', `<p>${studentMessage.message}</p>`);
      formData.append('textIntro', studentMessage.message);
      
      // Empty filters - send to all students with exams
      const filters = {};
      formData.append('filters', JSON.stringify(filters));

      // Add file attachments if present
      if (attachments.seatingFile) {
        formData.append('seatingFile', attachments.seatingFile);
      }
      if (attachments.timetableFile) {
        formData.append('timetableFile', attachments.timetableFile);
      }

      const res = await notificationAPI.sendStudentExamEmailsWithFiles(formData);
      const total = res.data.data?.total || 0;
      const attachCount = res.data.data?.attachments || 0;
      const attachMsg = attachCount > 0 ? ` with ${attachCount} attachment(s)` : '';
      toast.success(`✅ ${total} student emails queued for sending${attachMsg}!`);
      
      // Clear attachments after sending
      setAttachments({ seatingFile: null, timetableFile: null });
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      toast.error(msg || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'teachers') {
      loadTeacherPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center text-gray-800">
            <FiMail className="mr-2 text-blue-600" /> Notifications
          </h1>
          <div className="flex gap-3">
            {activeTab === 'teachers' && (
              <button 
                onClick={loadTeacherPreview} 
                disabled={loading} 
                className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-60"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            )}
            {canSend && (
              <button 
                onClick={activeTab === 'teachers' ? sendTeacherEmails : sendStudentEmails} 
                disabled={sending || loading || (activeTab === 'teachers' && !teacherData.list.length)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-60"
              >
                <FiSend /> {sending ? 'Sending...' : 'Send Notifications'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === 'teachers'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiUsers /> Teacher Duties
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === 'students'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiBell /> Notify Students
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow p-4">
          {activeTab === 'teachers' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700 block mb-1">Department ID (optional)</label>
                <input 
                  value={teacherFilters.departmentId} 
                  onChange={e => setTeacherFilters({ ...teacherFilters, departmentId: e.target.value })} 
                  className="w-full border rounded px-3 py-2" 
                  placeholder="Leave empty for all" 
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={teacherFilters.startDate} 
                  onChange={e => setTeacherFilters({ ...teacherFilters, startDate: e.target.value })} 
                  className="w-full border rounded px-3 py-2" 
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">End Date</label>
                <input 
                  type="date" 
                  value={teacherFilters.endDate} 
                  onChange={e => setTeacherFilters({ ...teacherFilters, endDate: e.target.value })} 
                  className="w-full border rounded px-3 py-2" 
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Message Editor */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FiMail className="text-blue-600" /> Email Message (Editable)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Email Subject</label>
                    <input 
                      value={studentMessage.subject} 
                      onChange={e => setStudentMessage({ ...studentMessage, subject: e.target.value })} 
                      className="w-full border rounded px-3 py-2 bg-white" 
                      placeholder="e.g., Important: Upcoming Exams & Seating Arrangements" 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Message Body</label>
                    <textarea 
                      value={studentMessage.message} 
                      onChange={e => setStudentMessage({ ...studentMessage, message: e.target.value })} 
                      className="w-full border rounded px-3 py-2 bg-white" 
                      rows="3"
                      placeholder="e.g., Please note your upcoming exam schedule and seating arrangement details below..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 This message will appear at the top of the email, followed by the student's exam details.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Attachments */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📎 Attach Files (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Seating Arrangement</label>
                    <input 
                      type="file"
                      accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange('seatingFile', e.target.files[0])}
                      className="w-full border rounded px-3 py-2 bg-white text-sm"
                    />
                    {attachments.seatingFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {attachments.seatingFile.name} ({(attachments.seatingFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">PDF, Excel, PNG, JPG (Max 10MB)</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Exam Timetable</label>
                    <input 
                      type="file"
                      accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange('timetableFile', e.target.files[0])}
                      className="w-full border rounded px-3 py-2 bg-white text-sm"
                    />
                    {attachments.timetableFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {attachments.timetableFile.name} ({(attachments.timetableFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">PDF, Excel, PNG, JPG (Max 10MB)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-lg shadow">
          {activeTab === 'teachers' ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Teachers: {teacherData.totalTeachers}
                </div>
                <button 
                  onClick={loadTeacherPreview} 
                  disabled={loading} 
                  className="px-3 py-1.5 text-sm bg-gray-100 border rounded hover:bg-gray-50 disabled:opacity-60"
                >
                  Reload
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 text-left">Teacher</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Duties</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Loading preview...</td></tr>
                  ) : (
                    (teacherData.list || []).map((row, idx) => (
                      <tr key={idx} className="align-top hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.teacher?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.teacher?.email}</td>
                        <td className="px-4 py-3 text-sm">
                          {(row.duties || []).map((duty, j) => {
                            const [startTime, endTime] = (duty.time || '').split(' - ');
                            const formattedTime = startTime && endTime ? formatTimeRange(startTime.trim(), endTime.trim()) : duty.time;
                            
                            return (
                              <div key={j} className="mb-2 pb-2 border-b last:border-0">
                                <div className="font-medium text-gray-900">{duty.subjectCode} - {duty.subjectName}</div>
                                <div className="text-gray-600 text-xs mt-1">{duty.date} • {formattedTime} • {duty.role}</div>
                                <div className="text-gray-500 text-xs">Rooms: {duty.classrooms?.join(', ') || 'TBD'}</div>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                  {!loading && !teacherData.list.length && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No data</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
