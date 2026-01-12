// ...existing code...
import React, { useState, useEffect } from 'react';
import {FiSave, FiHome, FiSettings, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import SettingsTabs from '../components/Settings/SettingsTabs';
import SystemSettings from '../components/Settings/SystemSettings';
import EmailSettings from '../components/Settings/EmailSettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import SecuritySettings from '../components/Settings/SecuritySettings';
import BackupSettings from '../components/Settings/BackupSettings';
import Footer from '../components/Settings/Footer';
import ProfileSettings from '../components/Settings/ProfileSettings'; // Import ProfileSettings component
import { loadSettings, saveSettings, resetSettings } from '../services/settings';

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    systemName: 'Exam Hall Management',
    systemUrl: 'https://ehms.edu',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30, // minutes
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.ehms.edu',
    smtpPort: 587,
    smtpUsername: 'noreply@ehms.edu',
    smtpPassword: '',
    fromEmail: 'noreply@ehms.edu',
    fromName: 'EHMS System',
    emailNotifications: true,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    examReminders: true,
    resultPublish: true,
    scheduleChanges: true,
    systemUpdates: true,
    pushNotifications: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    passwordComplexity: 'medium',
    passwordExpiry: 90, // days
    twoFactorAuth: false,
    ipRestriction: false,
    allowedIPs: [],
    auditLogs: true,
  });

  // Backup settings state
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    backupLocation: 'local',
    cloudService: 'none',
    retainBackups: 30, // days
  });

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.tab) {
      return location.state.tab;
    }
    // Students and Teachers default to 'profile', Admins to 'system'
    const isStudentOrTeacher = currentUser?.role === 'student' || currentUser?.role === 'teacher';
    return isStudentOrTeacher ? 'profile' : 'system';
  });
  const [showIPForm, setShowIPForm] = useState(false);
  const [newIP, setNewIP] = useState('');

  // Load saved settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const saved = await loadSettings();
        if (saved) {
          if (saved.systemSettings) setSystemSettings(saved.systemSettings);
          if (saved.emailSettings) setEmailSettings(saved.emailSettings);
          if (saved.notificationSettings) setNotificationSettings(saved.notificationSettings);
          if (saved.securitySettings) setSecuritySettings(saved.securitySettings);
          if (saved.backupSettings) setBackupSettings(saved.backupSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadUserSettings();
  }, []);
  // Handler functions must be inside the component
  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings({
      ...emailSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleBackupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBackupSettings({
      ...backupSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddIP = () => {
    if (newIP && !securitySettings.allowedIPs.includes(newIP)) {
      setSecuritySettings({
        ...securitySettings,
        allowedIPs: [...securitySettings.allowedIPs, newIP]
      });
      setNewIP('');
      setShowIPForm(false);
    }
  };

  const handleRemoveIP = (ip) => {
    setSecuritySettings({
      ...securitySettings,
      allowedIPs: securitySettings.allowedIPs.filter(item => item !== ip)
    });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const all = {
      systemSettings,
      emailSettings,
      notificationSettings,
      securitySettings,
      backupSettings
    };
    
    try {
      const ok = await saveSettings(all);
      if (ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings. Check console for details.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Check console for details.');
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      try {
        const ok = await resetSettings();
        if (ok) {
          // Reload the page to refresh all settings
          window.location.reload();
        } else {
          alert('Failed to reset settings. Check console for details.');
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        alert('Failed to reset settings. Check console for details.');
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
              >
                <FiArrowLeft className="mr-1" /> Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center ml-2">
                <FiSettings className="mr-3 text-blue-600" /> System Settings
              </h1>
            </div>
            <p className="text-gray-600 ml-10">Configure and customize your EHMS application</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <FiHome className="text-blue-600 mr-2" />
            <span className="font-medium">Dashboard /</span>
            <span className="text-blue-600 font-medium ml-1">Settings</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser?.role} />
          
          <div className="p-6">
            {activeTab === 'profile' ? (
              <ProfileSettings />
            ) : (
              <>
                {/* Admin-only tabs */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'user') && (
                  <form onSubmit={handleSaveSettings}>
                    {activeTab === 'system' && (
                      <SystemSettings 
                        systemSettings={systemSettings} 
                        handleSystemChange={handleSystemChange} 
                      />
                    )}
                    {activeTab === 'email' && (
                      <EmailSettings 
                        emailSettings={emailSettings} 
                        handleEmailChange={handleEmailChange} 
                      />
                    )}
                    {activeTab === 'notifications' && (
                      <NotificationSettings 
                        notificationSettings={notificationSettings} 
                        handleNotificationChange={handleNotificationChange} 
                      />
                    )}
                    {activeTab === 'security' && (
                      <SecuritySettings 
                        securitySettings={securitySettings} 
                        handleSecurityChange={handleSecurityChange}
                        showIPForm={showIPForm}
                        setShowIPForm={setShowIPForm}
                        newIP={newIP}
                        setNewIP={setNewIP}
                        handleAddIP={handleAddIP}
                        handleRemoveIP={handleRemoveIP}
                      />
                    )}
                    {activeTab === 'backup' && (
                      <BackupSettings 
                        backupSettings={backupSettings} 
                        handleBackupChange={handleBackupChange} 
                      />
                    )}
                    <div className="pt-8 border-t border-gray-200 flex justify-between">
                      <button
                        type="button"
                        onClick={handleResetSettings}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:opacity-90 transition shadow-md flex items-center"
                      >
                        Reset to Default
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md flex items-center"
                      >
                        <FiSave className="mr-2" /> Save Settings
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default Settings;