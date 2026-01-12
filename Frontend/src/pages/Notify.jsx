import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { subjects, classrooms, invigilators } from '../data/mockData';
// Local mock students array (replace with real data as needed)
const students = [
  { id: 1, name: 'Student One', email: 'student1@example.com' },
  { id: 2, name: 'Student Two', email: 'student2@example.com' },
  { id: 3, name: 'Student Three', email: 'student3@example.com' },
];

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2MB

const NotificationPreview = ({
  examDetails = { name: '', type: '', startDate: '', endDate: '' },
  schedule = [],
  classroomAssignments = [],
  invigilatorAssignments = [],
  seatingArrangements = [],
  prevStep = () => {},
}) => {
  const [studentPdf, setStudentPdf] = useState(null);
  const [teacherPdf, setTeacherPdf] = useState(null);
  const [sending, setSending] = useState(false);
  // Local mock students array (replace with real data as needed)
  // Remove duplicate declaration, use the top-level students array
  // State to choose recipient group
  const [recipientType, setRecipientType] = useState('students'); // 'students' or 'teachers'
  const [studentSemester, setStudentSemester] = useState('');
  const navigate = useNavigate();

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      alert("File too large! (max 2MB)");
    }
    if (recipientType === 'students') setStudentPdf(file);
    else setTeacherPdf(file);
  };

  // Email prompt state and logic
  const [emailPrompt, setEmailPrompt] = useState('');
  React.useEffect(() => {
    // Only set the prompt if it is empty (first load or type change)
    if (emailPrompt) return;
    let preview = '';
    if (recipientType === 'students') {
      const student = students[0];
      if (student) {
        const studentSeating = seatingArrangements.find(sa => sa.studentId === student.id);
        const exams = schedule
          .map((exam, idx) => {
            if (!exam.students?.includes(student.id)) return null;
            return {
              subject: subjects.find(s => s.id === exam.subjectId)?.name || 'Unknown',
              date: exam.date,
              time: exam.timeSlot,
              classroom: classrooms.find(c => c.id === classroomAssignments[idx])?.name || "Not assigned",
              seat: seatingArrangements.find(sa => sa.studentId === student.id && sa.examIndex === idx)?.seat ||
                (studentSeating && studentSeating.seat) ||
                'Not assigned'
            };
          })
          .filter(Boolean);
        preview = generateStudentEmail(student, exams, studentSeating?.seat);
      }
    } else {
      const invigDutiesMap = {};
      invigilatorAssignments.forEach((invId, i) => {
        if (!invId) return;
        if (!invigDutiesMap[invId]) invigDutiesMap[invId] = [];
        invigDutiesMap[invId].push({
          subject: subjects.find(s => s.id === schedule[i]?.subjectId)?.name || 'Unknown',
          date: schedule[i]?.date,
          time: schedule[i]?.timeSlot || {},
          classroom: classrooms.find(c => c.id === classroomAssignments[i])?.name || "Not assigned",
        });
      });
      const firstTeacherId = Object.keys(invigDutiesMap)[0];
      if (firstTeacherId) {
        const invigilator = invigilators.find(i => i.id === Number(firstTeacherId)) || {};
        preview = generateInvigilatorEmail(invigilator, invigDutiesMap[firstTeacherId]);
      } else {
        preview = `Dear Faculty Name,\n\nYou have been assigned invigilation duties for the upcoming ${examDetails.name} (${examDetails.type}). Here are your duties:\n\n1. Subject: [Subject Name]\n   Date: [Date]\n   Time: [Start Time] - [End Time]\n   Classroom: [Classroom]\n\nPlease report 15 minutes before your duty. If unavailable, notify the examination office at the earliest.\n\nRegards,\nExam Coordination Team`;
      }
    }
    setEmailPrompt(preview);
  }, [recipientType, examDetails, schedule, classroomAssignments, invigilatorAssignments, seatingArrangements]);
  // Helper to auto-generate student email content
  const generateStudentEmail = (student, exams, seat) => {
    let body = `Dear ${student.name},

Please find your exam schedule and seating arrangement for the upcoming ${examDetails.name} (${examDetails.type}) being held from ${examDetails.startDate} to ${examDetails.endDate}.

Exam Schedule:\n`;

    exams.forEach((item, idx) => {
      body += `
${idx + 1}. Subject: ${item.subject}
   Date: ${item.date}
   Time: ${item.time.start} - ${item.time.end}
   Classroom: ${item.classroom}
   Seat: ${item.seat ? item.seat : 'Not assigned'}
`;
    });

    body += `
If you have any questions, contact the examination office.

Best regards,
Exam Coordination Team
`;

    return body;
  };

  // Helper to auto-generate invigilator/teacher email content
  const generateInvigilatorEmail = (invigilator, duties) => {
    let body = `Dear ${invigilator.name},

You have been assigned invigilation duties for the upcoming ${examDetails.name} (${examDetails.type}). Here are your duties:

`;

    duties.forEach((item, idx) => {
      body += `
${idx + 1}. Subject: ${item.subject}
   Date: ${item.date}
   Time: ${item.time.start} - ${item.time.end}
   Classroom: ${item.classroom}
`;
    });

    body += `
Please report 15 minutes before your duty. If unavailable, notify the examination office at the earliest.

Regards,
Exam Coordination Team
`;

    return body;
  };

  // Main sending logic
  const sendNotifications = async (customEmailBody) => {
    setSending(true);
    try {
      if (recipientType === 'students') {
        const payload = {
          recipients: 'students',
          subject: `Your Exam Schedule & Seating Arrangement: ${examDetails.name}`,
          html: customEmailBody.replace(/\n/g, '<br/>'),
          text: customEmailBody,
          filters: studentSemester ? { semester: `Semester ${studentSemester}` } : {}
        };
        await api.post('/notifications/email', payload);
        alert('Notifications sent to all students!');
      } else {
        // Teachers: individualized duties email
        const payload = {
          subject: `Your Invigilation Duties: ${examDetails.name}`,
          introHtml: `<p>You have been assigned invigilation duties for ${examDetails.name} (${examDetails.type}). Below are your duties:</p>`,
          textIntro: `You have been assigned invigilation duties for ${examDetails.name} (${examDetails.type}). Below are your duties:`,
        };
        await api.post('/notifications/email/teacher-duties', payload);
        alert('Invigilation duty emails sent to all teachers with duties!');
      }
    } catch (e) {
      alert('Failed to send notifications: ' + (e?.response?.data?.message || e?.message || 'Unknown Error'));
    }
    
    setSending(false);
  };


  return (
    <div>
      {/* Choose recipient type */}
      <div className="mb-4">
        <label className="font-semibold mr-4">Send Notification To:</label>
        <label className="mr-4">
          <input
            type="radio"
            value="students"
            checked={recipientType === 'students'}
            onChange={() => setRecipientType('students')}
            className="mr-1"
          />
          Students
        </label>
        <label>
          <input
            type="radio"
            value="teachers"
            checked={recipientType === 'teachers'}
            onChange={() => setRecipientType('teachers')}
            className="mr-1"
          />
          Teachers
        </label>
      </div>

      {/* Student semester filter */}
      {recipientType === 'students' && (
        <div className="mb-4">
          <label className="font-semibold mr-3">Semester (optional):</label>
          <select
            className="border border-gray-300 rounded px-2 py-1"
            value={studentSemester}
            onChange={(e) => setStudentSemester(e.target.value)}
          >
            <option value="">All</option>
            {['1','2','3','4','5','6','7','8'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* PDF upload for selected group */}
      <div className="mb-4">
        <label className="font-semibold block mb-2">Attach PDF (optional):</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handlePdfUpload}
          disabled={sending}
        />
      </div>

      {/* Editable email prompt section */}
      <div className="mb-4">
        <label className="font-semibold block mb-2">Email Prompt (Editable):</label>
        <textarea
          className="w-full h-40 p-2 border border-gray-300 rounded"
          value={emailPrompt}
          onChange={e => setEmailPrompt(e.target.value)}
        />
      </div>

      {/* ...existing summary UI... */}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          disabled={sending}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => sendNotifications(emailPrompt)}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          {sending ? (recipientType === 'students' ? "Sending to Students..." : "Sending to Teachers...") : "Send Notifications"}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreview;
