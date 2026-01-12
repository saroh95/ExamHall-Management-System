import React from 'react';
import { FiSettings } from 'react-icons/fi';

const SystemSettings = ({ systemSettings, handleSystemChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FiSettings className="mr-2" /> General System Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Name *</label>
          <input
            type="text"
            name="systemName"
            value={systemSettings.systemName}
            onChange={handleSystemChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System URL *</label>
          <input
            type="url"
            name="systemUrl"
            value={systemSettings.systemUrl}
            onChange={handleSystemChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone *</label>
          <select
            name="timezone"
            value={systemSettings.timezone}
            onChange={handleSystemChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          >
            <option value="Asia/Kolkata">(GMT+5:30) India Standard Time</option>
            <option value="America/New_York">(GMT-5:00) Eastern Time</option>
            <option value="Europe/London">(GMT+0:00) Greenwich Mean Time</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Format *</label>
          <select
            name="dateFormat"
            value={systemSettings.dateFormat}
            onChange={handleSystemChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2023)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2023)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2023-12-25)</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={systemSettings.maintenanceMode}
              onChange={handleSystemChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Maintenance Mode (System will be unavailable to non-admin users)
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts *</label>
          <input
            type="number"
            name="maxLoginAttempts"
            min="1"
            max="10"
            value={systemSettings.maxLoginAttempts}
            onChange={handleSystemChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes) *</label>
          <input
            type="number"
            name="sessionTimeout"
            min="5"
            max="1440"
            value={systemSettings.sessionTimeout}
            onChange={handleSystemChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;