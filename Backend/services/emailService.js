// ...existing code...
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {

  async sendUserCredentials (user, email, password) {
    const subject = 'Your Account Credentials - Exam Hall Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Welcome to Exam Hall Management System!
        </h2>
        <p>Dear ${user.firstName || user.username || 'User'},</p>
        <p>Your account has been created/updated. Here are your credentials:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Account Credentials</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Email ID:</strong> ${email}</li>
            <li style="margin: 10px 0;"><strong>Password:</strong> ${password}</li>
            <li style="margin: 10px 0;"><strong>Role:</strong> ${user.role}</li>
          </ul>
        </div>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">Important Instructions:</h4>
          <ul>
            <li>Please change your password after first login</li>
            <li>Keep your credentials secure and don't share with others</li>
            <li>Use your account for all academic communications</li>
          </ul>
        </div>
        <p>If you have any questions, please contact the administrator.</p>
        <p>Best regards,<br>
        <strong>Exam Hall Management System</strong></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #7f8c8d;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
  constructor () {
    // Support both SMTP_* and EMAIL_* env variable schemes
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
    const secure = (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true' || port === 465;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail (to, subject, html, text = null, attachments = []) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text,
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, subject, messageId: result.messageId, attachmentCount: attachments?.length || 0 });
      return result;
    } catch (error) {
      logger.error('Email sending failed', { to, subject, error: error.message });
      throw error;
    }
  }

  async sendWelcomeEmail (user) {
    const subject = 'Welcome to Exam Hall Management System';
    const html = `
      <h1>Welcome ${user.name}!</h1>
      <p>Thank you for joining the Exam Hall Management System.</p>
      <p>Your account has been created successfully.</p>
      <p>Best regards,<br>Exam Hall Management Team</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail (user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset for your account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Exam Hall Management Team</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendExamNotification (user, exam) {
    const subject = `Exam Notification: ${exam.title}`;
    const html = `
      <h1>Exam Notification</h1>
      <p>Hello ${user.name},</p>
      <p>You have been assigned to an exam:</p>
      <ul>
        <li><strong>Exam:</strong> ${exam.title}</li>
        <li><strong>Date:</strong> ${new Date(exam.date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${exam.startTime} - ${exam.endTime}</li>
        <li><strong>Classroom:</strong> ${exam.classroom?.roomNumber || 'TBD'}</li>
      </ul>
      <p>Please check your dashboard for more details.</p>
      <p>Best regards,<br>Exam Hall Management Team</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendStudentCredentials (student, instituteEmail, password) {
    // Debug logging
    console.log('📧 Email Service - Received student:', {
      fullName: student.fullName,
      department: student.department,
      departmentName: student.department?.name,
      instituteEmail,
      personalEmail: student.personalEmail,
    });

    // Get department name with fallback
    const departmentName = student.department?.name || student.department || 'N/A';

    const subject = 'Your Institute Email Credentials - NIT Silchar';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Welcome to NIT Silchar!
        </h2>
        
        <p>Dear ${student.fullName},</p>
        
        <p>Your student account has been successfully created. Here are your institute credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Institute Email Credentials</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Institute Email:</strong> ${instituteEmail}</li>
            <li style="margin: 10px 0;"><strong>Password:</strong> ${password}</li>
            <li style="margin: 10px 0;"><strong>Scholar ID:</strong> ${student.scholarId}</li>
            <li style="margin: 10px 0;"><strong>Department:</strong> ${departmentName}</li>
            <li style="margin: 10px 0;"><strong>Batch Year:</strong> ${student.batchYear}</li>
            <li style="margin: 10px 0;"><strong>Semester:</strong> ${student.semester || 'N/A'}</li>
            <li style="margin: 10px 0;"><strong>Section:</strong> ${student.section || 'N/A'}</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">Important Instructions:</h4>
          <ul>
            <li>Please change your password after first login</li>
            <li>Keep your credentials secure and don't share with others</li>
            <li>Use your institute email for all academic communications</li>
            <li>Access your email at: <a href="https://mail.google.com">Gmail</a></li>
            <li>This email was sent to your personal email: <strong>${student.personalEmail}</strong></li>
          </ul>
        </div>
        
        <p>If you have any questions, please contact the IT department.</p>
        
        <p>Best regards,<br>
        <strong>NIT Silchar Administration</strong></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #7f8c8d;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail(student.personalEmail, subject, html);
  }

  async sendTeacherCredentials (teacher, instituteEmail, password) {
    // Debug logging
    console.log('📧 Email Service - Received teacher:', {
      fullName: teacher.fullName,
      department: teacher.department,
      departmentName: teacher.department?.name,
      instituteEmail,
      personalEmail: teacher.personalEmail,
    });

    // Get department name with fallback
    const departmentName = teacher.department?.name || teacher.department || 'N/A';

    const subject = 'Your Institute Email Credentials - NIT Silchar';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Welcome to NIT Silchar Faculty!
        </h2>
        
        <p>Dear ${teacher.fullName},</p>
        
        <p>Your faculty account has been successfully created. Here are your institute credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Institute Email Credentials</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Institute Email:</strong> ${instituteEmail}</li>
            <li style="margin: 10px 0;"><strong>Password:</strong> ${password}</li>
            <li style="margin: 10px 0;"><strong>Employee ID:</strong> ${teacher.employeeId}</li>
            <li style="margin: 10px 0;"><strong>Department:</strong> ${departmentName}</li>
            <li style="margin: 10px 0;"><strong>Designation:</strong> ${teacher.designation}</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">Important Instructions:</h4>
          <ul>
            <li>Please change your password after first login</li>
            <li>Keep your credentials secure and don't share with others</li>
            <li>Use your institute email for all academic communications</li>
            <li>This email was sent to your personal email: <strong>${teacher.personalEmail}</strong></li>
          </ul>
        </div>
        
        <p>If you have any questions, please contact the IT department.</p>
        
        <p>Best regards,<br>
        <strong>NIT Silchar Administration</strong></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #7f8c8d;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail(teacher.personalEmail, subject, html);
  }
}

module.exports = new EmailService();
