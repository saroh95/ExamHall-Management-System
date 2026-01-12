import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RolePermissions = ({ roles, updateRolePermissions }) => {
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [permissions, setPermissions] = useState(roles[selectedRole] || {});
  const [isEditing, setIsEditing] = useState(false);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setPermissions(roles[role] || {});
    setIsEditing(false);
  };

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSave = () => {
    updateRolePermissions(selectedRole, permissions);
    setIsEditing(false);
  };

  const permissionGroups = [
    {
      name: 'General',
      permissions: ['dashboard', 'settings']
    },
    {
      name: 'User Management',
      permissions: ['users', 'teachers', 'students']
    },
    {
      name: 'Academic',
      permissions: ['classrooms', 'subjects', 'exams']
    },
    {
      name: 'Reports',
      permissions: ['reports']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Role Permissions</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Role Selection */}
          <div className="w-full md:w-1/4">
            <h3 className="font-medium mb-2">Select Role</h3>
            <div className="space-y-2">
              {Object.keys(roles).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full text-left px-4 py-2 rounded ${selectedRole === role ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="w-full md:w-3/4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Permissions for {selectedRole}</h3>
              {isEditing ? (
                <div className="space-x-2">
                  <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      setPermissions(roles[selectedRole]);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Permissions
                </button>
              )}
            </div>

            <div className="space-y-6">
              {permissionGroups.map(group => (
                <div key={group.name} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h4 className="font-medium">{group.name}</h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.permissions.map(permission => (
                      <div key={permission} className="flex items-center">
                        <input
                          id={`${selectedRole}-${permission}`}
                          name={permission}
                          type="checkbox"
                          checked={permissions?.[permission] || false}
                          onChange={() => handlePermissionChange(permission)}
                          disabled={!isEditing}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`${selectedRole}-${permission}`} className="ml-2 block text-sm text-gray-900 capitalize">
                          {permission.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Role Descriptions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-blue-800">Admin</h3>
            <p className="text-sm text-gray-600">
              Full access to all system features and settings. Can manage all users and content.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-green-800">Faculty</h3>
            <p className="text-sm text-gray-600">
              Can manage students, classrooms, and exams. Has access to academic reports.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-purple-800">Clerk</h3>
            <p className="text-sm text-gray-600">
              Can manage teachers and students. Has limited access to academic features.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">Invigilator</h3>
            <p className="text-sm text-gray-600">
              Can view student lists and manage exams. Limited to exam-related functions.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Student</h3>
            <p className="text-sm text-gray-600">
              Can access personal dashboard and view assigned content. Very limited permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;