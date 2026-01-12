import React from 'react';
import { FiBell } from 'react-icons/fi';

const NotificationSettings = ({ notificationSettings, handleNotificationChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FiBell className="mr-2" /> Notification Preferences
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <h4 className="text-md font-medium text-gray-900 mb-3">Notification Types</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="examReminders"
                checked={notificationSettings.examReminders}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Exam Reminders
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="resultPublish"
                checked={notificationSettings.resultPublish}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Result Publication Notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="scheduleChanges"
                checked={notificationSettings.scheduleChanges}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Exam Schedule Changes
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="systemUpdates"
                checked={notificationSettings.systemUpdates}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                System Updates and Maintenance
              </label>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 border-t border-gray-200 pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Delivery Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Email Notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="pushNotifications"
                checked={notificationSettings.pushNotifications}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Push Notifications (Mobile App)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={notificationSettings.smsNotifications}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                SMS Notifications
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;