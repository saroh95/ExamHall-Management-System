import React from 'react';
import { FiSettings, FiMail, FiBell, FiShield, FiDatabase, FiUser } from 'react-icons/fi';

const SettingsTabs = ({ activeTab, setActiveTab, userRole }) => {
  // Students and Teachers only see Profile tab
  const isStudentOrTeacher = userRole === 'student' || userRole === 'teacher';

  return (
    <div className="border-b border-gray-200">
      <nav className="flex overflow-x-auto">
        {/* Profile tab - visible to all */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center">
            <FiUser className="mr-2" /> Profile
          </div>
        </button>

        {/* Admin-only tabs */}
        {!isStudentOrTeacher && (
          <>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'system' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <FiSettings className="mr-2" /> System
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'email' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <FiMail className="mr-2" /> Email
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'notifications' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <FiBell className="mr-2" /> Notifications
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'security' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <FiShield className="mr-2" /> Security
              </div>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'backup' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center">
                <FiDatabase className="mr-2" /> Backup
              </div>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

export default SettingsTabs;