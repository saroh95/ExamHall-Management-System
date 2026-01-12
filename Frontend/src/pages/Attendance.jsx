import React, { useEffect, useState } from 'react';
import { FiCalendar, FiUserCheck, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import unifiedExamSchedulerAPI from '../services/unifiedExamSchedulerAPI';
import AttendanceList from '../components/Attendance/AttendanceList';

const AttendancePage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await api.get('/unified-exam-scheduler/exams');
      const list = resp.data?.data || [];
      setExams(list);
      // derive semesters available from exams (fallback 1-8 if not present)
      const semesters = Array.from(
        new Set(
          list
            .map(e => (e.subject && (e.subject.semester || e.semester)) || null)
            .filter(Boolean)
            .map(String)
        )
      ).sort((a,b)=>Number(a)-Number(b));
      setAvailableSemesters(semesters);
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Update subject list when semester changes
  useEffect(() => {
    // reset downstream selections
    setSelectedSubjectCode('');
    setSelectedExamId('');
    setSelectedExam(null);

    if (!selectedSemester) {
      setAvailableSubjects([]);
      return;
    }
    const subjects = Array.from(
      new Set(
        exams
          .filter(e => String((e.subject && (e.subject.semester || e.semester)) || '') === String(selectedSemester))
          .map(e => e.subject?.code)
          .filter(Boolean)
      )
    ).sort();
    setAvailableSubjects(subjects);
  }, [selectedSemester, exams]);

  // Update selected exam entity when examId changes
  useEffect(() => {
    if (!selectedExamId) {
      setSelectedExam(null);
      setAvailableRooms([]);
      setSelectedRoom('');
      return;
    }
    const found = exams.find(e => String(e._id || e.id) === String(selectedExamId));
    if (found) {
      setSelectedExam({
        id: found._id || found.id,
        name: found.subject?.name || found.name || 'Exam',
        date: found.examDate || found.date,
        startTime: found.startTime,
        endTime: found.endTime,
        subject: found.subject
      });

      // fetch exam details to extract rooms
      (async () => {
        try {
          const res = await unifiedExamSchedulerAPI.getExamDetails(found._id || found.id);
          const details = res?.data || res;
          const rooms = (details.classrooms || [])
            .map(c => c.classroom?.name)
            .filter(Boolean);
          const uniqueRooms = Array.from(new Set(rooms));
          setAvailableRooms(uniqueRooms);
          if (uniqueRooms.length > 0) setSelectedRoom(uniqueRooms[0]);
        } catch (e) {
          setAvailableRooms([]);
        }
      })();
    }
  }, [selectedExamId, exams]);

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUserCheck className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          </div>
          <button
            onClick={loadExams}
            disabled={loading}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Semester selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select semester</option>
                  {(availableSemesters.length ? availableSemesters : ['1','2','3','4','5','6','7','8']).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Subject selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  disabled={!selectedSemester}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">{selectedSemester ? 'Select subject' : 'Select semester first'}</option>
                  {availableSubjects.map(code => {
                    const sample = exams.find(e => e.subject?.code === code);
                    const name = sample?.subject?.name || code;
                    return (
                      <option key={code} value={code}>{code} - {name}</option>
                    );
                  })}
                </select>
              </div>

              {/* Exam selector filtered by semester+subject */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  disabled={!selectedSemester || !selectedSubjectCode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">{selectedSubjectCode ? 'Select exam' : 'Select subject first'}</option>
                  {exams
                    .filter(e => String((e.subject && (e.subject.semester || e.semester)) || '') === String(selectedSemester))
                    .filter(e => e.subject?.code === selectedSubjectCode)
                    .map(exam => (
                      <option key={exam._id || exam.id} value={exam._id || exam.id}>
                        {(exam.examDate || exam.date) || 'Date TBD'} • {(exam.startTime || '10:00')} - {(exam.endTime || '13:00')} • {(exam.classroom?.name || 'Room TBD')}
                      </option>
                    ))}
                </select>
              </div>

              {/* Room selector from exam details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  disabled={!selectedExamId || availableRooms.length === 0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">{selectedExamId ? (availableRooms.length ? 'Select room' : 'No rooms found') : 'Select exam first'}</option>
                  {availableRooms.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          {selectedExam ? (
            <AttendanceList examId={selectedExam.id} examDetails={selectedExam} initialRoom={selectedRoom} />
          ) : (
            <div className="text-gray-500 text-sm">Select semester, subject, and exam to manage attendance.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;


