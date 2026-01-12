// components/ProfilePanel.js
import React from 'react';

const UserIcon = props => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const CogIcon = props => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.03 7.03 0 00-1.69-.98l-.38-2.65A.5.5 0 0014 2h-4a.5.5 0 00-.5.42l-.38 2.65c-.63.23-1.22.54-1.77.91l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.5.5 0 00.12.64l2.11 1.65c-.05.32-.08.65-.08.99s.03.67.08.99l-2.11 1.65a.5.5 0 00-.12.64l2 3.46c.14.24.44.32.68.22l2.49-1c.55.37 1.14.68 1.77.91l.38 2.65c.05.28.27.48.5.48h4c.23 0 .45-.2.5-.48l.38-2.65c.63-.23 1.22-.54 1.77-.91l2.49 1c.24.1.54.02.68-.22l2-3.46a.5.5 0 00-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z" />
  </svg>
);

const ArrowRightOnRectangleIcon = props => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
  </svg>
);

const ProfilePanel = ({ onProfile, onSettings, onLogout, user }) => {
  return (
    <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold text-white">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500 truncate w-40">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="p-2 space-y-1">
        <button 
          onClick={onProfile}
          className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
          View Profile
        </button>
        <button 
          onClick={onSettings}
          className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <CogIcon className="h-5 w-5 text-gray-400 mr-2" />
          Settings
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-400 mr-2" />
          Logout
        </button>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 p-3">
        <div className="text-xs text-gray-500">Last login: Today at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    </div>
  );
};

export default ProfilePanel;
