const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  systemSettings: {
    systemName: { type: String, default: 'Exam Hall Management' },
    systemUrl: { type: String, default: 'https://ehms.edu' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    maintenanceMode: { type: Boolean, default: false },
    maxLoginAttempts: { type: Number, default: 5 },
    sessionTimeout: { type: Number, default: 30 }, // minutes
  },
  emailSettings: {
    smtpHost: { type: String, default: 'smtp.ehms.edu' },
    smtpPort: { type: Number, default: 587 },
    smtpUsername: { type: String, default: 'noreply@ehms.edu' },
    smtpPassword: { type: String, default: '' },
    fromEmail: { type: String, default: 'noreply@ehms.edu' },
    fromName: { type: String, default: 'EHMS System' },
    emailNotifications: { type: Boolean, default: true },
  },
  notificationSettings: {
    examReminders: { type: Boolean, default: true },
    resultPublish: { type: Boolean, default: true },
    scheduleChanges: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
  },
  securitySettings: {
    passwordComplexity: { type: String, default: 'medium' },
    passwordExpiry: { type: Number, default: 90 }, // days
    twoFactorAuth: { type: Boolean, default: false },
    ipRestriction: { type: Boolean, default: false },
    allowedIPs: [{ type: String }],
    auditLogs: { type: Boolean, default: true },
  },
  backupSettings: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'daily' },
    backupTime: { type: String, default: '02:00' },
    backupLocation: { type: String, default: 'local' },
    cloudService: { type: String, default: 'none' },
    retainBackups: { type: Number, default: 30 }, // days
  },
}, {
  timestamps: true,
});

// Index for efficient queries
SettingsSchema.index({ userId: 1 });

module.exports = mongoose.model('Settings', SettingsSchema);
