import React from 'react';
import { FiShield, FiX } from 'react-icons/fi';

const SecuritySettings = ({
  securitySettings,
  handleSecurityChange,
  showIPForm,
  setShowIPForm,
  newIP,
  setNewIP,
  handleAddIP,
  handleRemoveIP
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FiShield className="mr-2" /> Security Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Complexity *</label>
          <select
            name="passwordComplexity"
            value={securitySettings.passwordComplexity}
            onChange={handleSecurityChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          >
            <option value="low">Low (Minimum 6 characters)</option>
            <option value="medium">Medium (8+ chars with letters and numbers)</option>
            <option value="high">High (8+ chars with letters, numbers and symbols)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days) *</label>
          <input
            type="number"
            name="passwordExpiry"
            min="0"
            max="365"
            value={securitySettings.passwordExpiry}
            onChange={handleSecurityChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Set to 0 to disable password expiry</p>
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="twoFactorAuth"
              checked={securitySettings.twoFactorAuth}
              onChange={handleSecurityChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable Two-Factor Authentication (2FA)
            </label>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="ipRestriction"
              checked={securitySettings.ipRestriction}
              onChange={handleSecurityChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Restrict Admin Access by IP Address
            </label>
          </div>
          
          {securitySettings.ipRestriction && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Allowed IP Addresses</h4>
                <button
                  type="button"
                  onClick={() => setShowIPForm(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add IP Address
                </button>
              </div>
              
              {showIPForm && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    placeholder="e.g. 192.168.1.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddIP}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIPForm(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {securitySettings.allowedIPs.length > 0 ? (
                <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {securitySettings.allowedIPs.map((ip, index) => (
                    <li key={index} className="px-4 py-3 flex justify-between items-center">
                      <span className="font-mono text-sm">{ip}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIP(ip)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No IP addresses added yet</p>
              )}
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="auditLogs"
              checked={securitySettings.auditLogs}
              onChange={handleSecurityChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable Audit Logs (Track all admin activities)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;