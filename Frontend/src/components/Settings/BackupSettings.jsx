import React from 'react';
import { FiDatabase } from 'react-icons/fi';

const BackupSettings = ({ backupSettings, handleBackupChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FiDatabase className="mr-2" /> Backup Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="autoBackup"
              checked={backupSettings.autoBackup}
              onChange={handleBackupChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable Automatic Backups
            </label>
          </div>
        </div>
        
        {backupSettings.autoBackup && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency *</label>
              <select
                name="backupFrequency"
                value={backupSettings.backupFrequency}
                onChange={handleBackupChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Time *</label>
              <input
                type="time"
                name="backupTime"
                value={backupSettings.backupTime}
                onChange={handleBackupChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Location *</label>
              <select
                name="backupLocation"
                value={backupSettings.backupLocation}
                onChange={handleBackupChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              >
                <option value="local">Local Server</option>
                <option value="cloud">Cloud Storage</option>
              </select>
            </div>
            
            {backupSettings.backupLocation === 'cloud' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Service *</label>
                <select
                  name="cloudService"
                  value={backupSettings.cloudService}
                  onChange={handleBackupChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  required
                >
                  <option value="none">Select a service</option>
                  <option value="aws">Amazon S3</option>
                  <option value="google">Google Drive</option>
                  <option value="azure">Microsoft Azure</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retain Backups (days) *</label>
              <input
                type="number"
                name="retainBackups"
                min="1"
                max="365"
                value={backupSettings.retainBackups}
                onChange={handleBackupChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>
          </>
        )}
      </div>
      
      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-1">Manual Backup</h4>
            <p className="text-sm text-gray-500">Create an immediate backup of the system</p>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
          >
            Create Backup Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;