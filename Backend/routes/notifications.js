const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const EmailService = require('../services/emailService');
const Exam = require('../models/Exam');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, PNG, and JPG files are allowed.'));
    }
  },
});

// POST /api/notifications/email
// Body: { recipients: 'students'|'teachers'|'both', subject: string, html: string, text?: string, filters?: { semester?, departmentId? } }
router.post('/email', protect, async (req, res) => {
  try {
    const { recipients = 'both', subject, html, text, filters = {} } = req.body || {};
    if (!subject || !html) {
      return res.status(400).json({ success: false, message: 'Subject and HTML content are required' });
    }

    const toAddresses = new Set();

    const addEmails = (docs, field = 'instituteEmail') => {
      for (const d of docs) {
        const email = d?.[field];
        if (email) toAddresses.add(String(email).toLowerCase());
      }
    };

    if (recipients === 'students' || recipients === 'both') {
      const query = { isActive: true };
      if (filters.semester) query.semester = filters.semester;
      if (filters.departmentId) query.department = filters.departmentId;
      const students = await Student.find(query).select('instituteEmail');
      addEmails(students, 'instituteEmail');
    }

    if (recipients === 'teachers' || recipients === 'both') {
      const query = { isActive: true };
      if (filters.departmentId) query.department = filters.departmentId;
      const teachers = await Teacher.find(query).select('instituteEmail');
      addEmails(teachers, 'instituteEmail');
    }

    const emails = Array.from(toAddresses);
    if (emails.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipient emails found' });
    }

    // Send in batches to avoid SMTP limits
    const emailService = new EmailService();
    const batchSize = 50;
    const results = { sent: 0, failed: 0, errors: [] };
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      try {
        await Promise.all(batch.map(addr => emailService.sendEmail(addr, subject, html, text)));
        results.sent += batch.length;
      } catch (err) {
        results.failed += batch.length;
        results.errors.push(err.message || String(err));
      }
    }

    return res.json({ success: true, message: 'Emails processed', data: { total: emails.length, ...results } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send emails', error: error.message });
  }
});

// POST /api/notifications/email/teacher-duties
// Body: { subject?: string, introHtml?: string, textIntro?: string, filters?: { departmentId?, startDate?, endDate? } }
router.post('/email/teacher-duties', protect, async (req, res) => {
  try {
    const { subject, introHtml = '', textIntro = '', filters = {} } = req.body || {};

    // Build exam query for upcoming or date range
    const query = { isActive: true, status: 'scheduled' };
    if (filters.startDate || filters.endDate) {
      query.examDate = {};
      if (filters.startDate) query.examDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.examDate.$lte = new Date(filters.endDate);
    } else {
      query.examDate = { $gte: new Date() };
    }

    const exams = await Exam.find(query)
      .populate('subject', 'name code')
      .populate('classrooms.classroom', 'roomNumber building')
      .populate('invigilators.teacher', 'fullName instituteEmail department');

    // Map teacherId -> duties
    const dutiesByTeacher = new Map();
    for (const exam of exams) {
      const dateStr = (() => {
        try {
          return new Date(exam.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch {
          return String(exam.examDate);
        }
      })();
      const timeStr = `${exam.startTime || '10:00'} - ${exam.endTime || '13:00'}`;
      const classroomNames = (exam.classrooms || []).map(c => c?.classroom?.roomNumber).filter(Boolean);
      for (const inv of (exam.invigilators || [])) {
        const teacher = inv?.teacher;
        if (!teacher || !teacher.instituteEmail) continue;
        if (filters.departmentId && String(teacher.department) !== String(filters.departmentId)) continue;
        const key = String(teacher._id);
        if (!dutiesByTeacher.has(key)) {
          dutiesByTeacher.set(key, { teacher, items: [] });
        }
        dutiesByTeacher.get(key).items.push({
          date: dateStr,
          time: timeStr,
          subjectCode: exam.subject?.code,
          subjectName: exam.subject?.name,
          classrooms: classroomNames,
          role: inv.role || 'Invigilator',
        });
      }
    }

    if (dutiesByTeacher.size === 0) {
      return res.status(400).json({ success: false, message: 'No teacher duties found for the given filters' });
    }

    const emailService = new EmailService();
    let sent = 0, failed = 0; const errors = [];
    for (const { teacher, items } of dutiesByTeacher.values()) {
      const hdr = `<p>Dear ${teacher.fullName || 'Faculty'},</p>${introHtml}`;
      const list = items.map((it, idx) => (
        `<p>${idx + 1}. <strong>${it.subjectCode || ''} - ${it.subjectName || ''}</strong><br/>
				Date: ${it.date}<br/>
				Time: ${it.time}<br/>
				Role: ${it.role}<br/>
				Classroom(s): ${it.classrooms.join(', ') || 'TBD'}</p>`
      )).join('');
      const ftr = '<p>Regards,<br/>Exam Coordination Team</p>';
      const html = `${hdr}${list}${ftr}`;
      const text = `${textIntro}\n\n${items.map((it, idx) => (
        `${idx + 1}. ${it.subjectCode || ''} - ${it.subjectName || ''}\nDate: ${it.date}\nTime: ${it.time}\nRole: ${it.role}\nClassroom(s): ${it.classrooms.join(', ') || 'TBD'}`
      )).join('\n\n')}\n\nRegards,\nExam Coordination Team`;

      try {
        await emailService.sendEmail(
          teacher.instituteEmail,
          subject || 'Your Invigilation Duties',
          html,
          text,
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        errors.push({ email: teacher.instituteEmail, error: err.message });
      }
    }

    return res.json({ success: true, message: 'Teacher duty emails processed', data: { total: dutiesByTeacher.size, sent, failed, errors } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send teacher duty emails', error: error.message });
  }
});

// GET /api/notifications/email/teacher-duties/preview
// Query: ?departmentId=&startDate=&endDate=
// Returns the per-teacher duty list WITHOUT sending emails
router.get('/email/teacher-duties/preview', protect, async (req, res) => {
  try {
    const { departmentId, startDate, endDate } = req.query || {};

    // Build exam query for upcoming or date range
    const query = { isActive: true, status: 'scheduled' };
    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    } else {
      query.examDate = { $gte: new Date() };
    }

    const exams = await Exam.find(query)
      .populate('subject', 'name code')
      .populate('classrooms.classroom', 'roomNumber building')
      .populate('invigilators.teacher', 'fullName instituteEmail department');

    // Map teacherId -> duties
    const dutiesByTeacher = new Map();
    for (const exam of exams) {
      const dateStr = (() => {
        try {
          return new Date(exam.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch {
          return String(exam.examDate);
        }
      })();
      const timeStr = `${exam.startTime || '10:00'} - ${exam.endTime || '13:00'}`;
      const classroomNames = (exam.classrooms || []).map(c => c?.classroom?.roomNumber).filter(Boolean);
      for (const inv of (exam.invigilators || [])) {
        const teacher = inv?.teacher;
        if (!teacher || !teacher.instituteEmail) continue;
        if (departmentId && String(teacher.department) !== String(departmentId)) continue;
        const key = String(teacher._id);
        if (!dutiesByTeacher.has(key)) {
          dutiesByTeacher.set(key, { teacher: { id: teacher._id, name: teacher.fullName, email: teacher.instituteEmail }, items: [] });
        }
        dutiesByTeacher.get(key).items.push({
          date: dateStr,
          time: timeStr,
          subjectCode: exam.subject?.code,
          subjectName: exam.subject?.name,
          classrooms: classroomNames,
          role: inv.role || 'Invigilator',
        });
      }
    }

    const list = Array.from(dutiesByTeacher.values())
      .map(entry => ({
        teacher: entry.teacher,
        duties: entry.items.sort((a, b) => new Date(a.date) - new Date(b.date)),
      }))
      .sort((a, b) => a.teacher.name.localeCompare(b.teacher.name));

    if (list.length === 0) {
      return res.status(404).json({ success: false, message: 'No teacher duties found for the given filters' });
    }

    return res.json({ success: true, data: { totalTeachers: list.length, list } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to build teacher duty preview', error: error.message });
  }
});

// POST /api/notifications/email/student-exams
// Body (FormData): subject, introHtml, textIntro, filters (JSON string), seatingFile?, timetableFile?
router.post('/email/student-exams', protect, upload.fields([
  { name: 'seatingFile', maxCount: 1 },
  { name: 'timetableFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const { subject, introHtml = '', textIntro = '' } = req.body || {};
    const filters = req.body.filters ? JSON.parse(req.body.filters) : {};

    // Get uploaded files
    const attachments = [];
    if (req.files) {
      if (req.files.seatingFile && req.files.seatingFile[0]) {
        attachments.push({
          filename: req.files.seatingFile[0].originalname,
          content: req.files.seatingFile[0].buffer,
        });
      }
      if (req.files.timetableFile && req.files.timetableFile[0]) {
        attachments.push({
          filename: req.files.timetableFile[0].originalname,
          content: req.files.timetableFile[0].buffer,
        });
      }
    }

    // Build student query
    const studentQuery = { isActive: true };
    if (filters.departmentId) studentQuery.department = filters.departmentId;
    if (filters.semester) studentQuery.semester = filters.semester;
    if (filters.section) studentQuery.section = filters.section;

    const students = await Student.find(studentQuery).select('fullName instituteEmail semester section department enrolledSubjects');

    if (students.length === 0) {
      return res.status(400).json({ success: false, message: 'No students found for the given filters' });
    }

    // Build exam query
    const examQuery = { isActive: true, status: 'scheduled' };
    if (filters.startDate || filters.endDate) {
      examQuery.examDate = {};
      if (filters.startDate) examQuery.examDate.$gte = new Date(filters.startDate);
      if (filters.endDate) examQuery.examDate.$lte = new Date(filters.endDate);
    } else {
      examQuery.examDate = { $gte: new Date() };
    }

    const exams = await Exam.find(examQuery)
      .populate('subject', 'name code semester')
      .populate('classrooms.classroom', 'roomNumber building');

    const emailService = new EmailService();
    let sent = 0, failed = 0; const errors = [];
    for (const student of students) {
      const enrolledSubjectIds = (student.enrolledSubjects || []).map(s => String(s));
      const relevantExams = exams.filter(exam => enrolledSubjectIds.includes(String(exam.subject?._id)));

      if (relevantExams.length === 0) continue;

      const hdr = `<p>Dear ${student.fullName || 'Student'},</p>${introHtml}`;
      const list = relevantExams.map((exam, idx) => {
        const dateStr = (() => {
          try {
            return new Date(exam.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          } catch {
            return String(exam.examDate);
          }
        })();
        const timeStr = `${exam.startTime || '10:00'} - ${exam.endTime || '13:00'}`;
        const classroomNames = (exam.classrooms || []).map(c => c?.classroom?.roomNumber).filter(Boolean);
        return `<p>${idx + 1}. <strong>${exam.subject?.code || ''} - ${exam.subject?.name || ''}</strong><br/>
        Date: ${dateStr}<br/>
        Time: ${timeStr}<br/>
        Classroom(s): ${classroomNames.join(', ') || 'TBD'}</p>`;
      }).join('');
      const ftr = '<p>Regards,<br/>Exam Coordination Team</p>';
      const html = `${hdr}${list}${ftr}`;
      const text = `${textIntro}\n\n${relevantExams.map((exam, idx) => {
        const dateStr = (() => {
          try {
            return new Date(exam.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          } catch {
            return String(exam.examDate);
          }
        })();
        const timeStr = `${exam.startTime || '10:00'} - ${exam.endTime || '13:00'}`;
        const classroomNames = (exam.classrooms || []).map(c => c?.classroom?.roomNumber).filter(Boolean);
        return `${idx + 1}. ${exam.subject?.code || ''} - ${exam.subject?.name || ''}\nDate: ${dateStr}\nTime: ${timeStr}\nClassroom(s): ${classroomNames.join(', ') || 'TBD'}`;
      }).join('\n\n')}\n\nRegards,\nExam Coordination Team`;

      try {
        await emailService.sendEmail(
          student.instituteEmail,
          subject || 'Your Upcoming Exams',
          html,
          text,
          attachments,
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        errors.push({ email: student.instituteEmail, error: err.message });
      }
    }

    return res.json({
      success: true,
      message: 'Student exam emails processed',
      data: {
        total: students.length,
        sent,
        failed,
        errors,
        attachments: attachments.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send student exam emails', error: error.message });
  }
});

// GET /api/notifications/email/student-exams/preview
// Query: ?departmentId=&semester=&section=&startDate=&endDate=
// Returns the per-student exam list WITHOUT sending emails
router.get('/email/student-exams/preview', protect, async (req, res) => {
  try {
    const { departmentId, semester, section, startDate, endDate } = req.query || {};

    // Build student query
    const studentQuery = { isActive: true };
    if (departmentId) studentQuery.department = departmentId;
    if (semester) studentQuery.semester = semester;
    if (section) studentQuery.section = section;

    const students = await Student.find(studentQuery)
      .select('fullName instituteEmail semester section enrolledSubjects')
      .populate('department', 'name code')
      .limit(100); // Limit for preview

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found for the given filters' });
    }

    // Build exam query
    const examQuery = { isActive: true, status: 'scheduled' };
    if (startDate || endDate) {
      examQuery.examDate = {};
      if (startDate) examQuery.examDate.$gte = new Date(startDate);
      if (endDate) examQuery.examDate.$lte = new Date(endDate);
    } else {
      examQuery.examDate = { $gte: new Date() };
    }

    const exams = await Exam.find(examQuery)
      .populate('subject', 'name code semester')
      .populate('classrooms.classroom', 'roomNumber building');

    const list = students.map(student => {
      const enrolledSubjectIds = (student.enrolledSubjects || []).map(s => String(s));
      const relevantExams = exams.filter(exam => enrolledSubjectIds.includes(String(exam.subject?._id)));

      return {
        student: {
          id: student._id,
          name: student.fullName,
          email: student.instituteEmail,
          semester: student.semester,
          section: student.section,
          department: student.department?.name || 'Unknown',
        },
        exams: relevantExams.map(exam => {
          const dateStr = (() => {
            try {
              return new Date(exam.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            } catch {
              return String(exam.examDate);
            }
          })();
          const timeStr = `${exam.startTime || '10:00'} - ${exam.endTime || '13:00'}`;
          const classroomNames = (exam.classrooms || []).map(c => c?.classroom?.roomNumber).filter(Boolean);
          return {
            date: dateStr,
            time: timeStr,
            subjectCode: exam.subject?.code,
            subjectName: exam.subject?.name,
            classrooms: classroomNames,
          };
        }).sort((a, b) => new Date(a.date) - new Date(b.date)),
      };
    }).filter(item => item.exams.length > 0)
      .sort((a, b) => a.student.name.localeCompare(b.student.name));

    if (list.length === 0) {
      return res.status(404).json({ success: false, message: 'No student exams found for the given filters' });
    }

    return res.json({ success: true, data: { totalStudents: list.length, list } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to build student exam preview', error: error.message });
  }
});

module.exports = router;
