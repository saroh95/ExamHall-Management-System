import React from 'react';
import { FiMail } from 'react-icons/fi';

const EmailSettings = ({ emailSettings, handleEmailChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FiMail className="mr-2" /> Email Server Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host *</label>
          <input
            type="text"
            name="smtpHost"
            value={emailSettings.smtpHost}
            onChange={handleEmailChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port *</label>
          <input
            type="number"
            name="smtpPort"
            min="1"
            max="65535"
            value={emailSettings.smtpPort}
            onChange={handleEmailChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username *</label>
          <input
            type="text"
            name="smtpUsername"
            value={emailSettings.smtpUsername}
            onChange={handleEmailChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password *</label>
          <input
            type="password"
            name="smtpPassword"
            value={emailSettings.smtpPassword}
            onChange={handleEmailChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="Leave blank to keep current"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Email *</label>
          <input
            type="email"
            name="fromEmail"
            value={emailSettings.fromEmail}
            onChange={handleEmailChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Name *</label>
          <input
            type="text"
            name="fromName"
            value={emailSettings.fromName}
            onChange={handleEmailChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={emailSettings.emailNotifications}
              onChange={handleEmailChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable Email Notifications
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiMail className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Test your email settings by sending a test email to your account.
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;