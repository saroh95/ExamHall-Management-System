import React, { useState } from 'react';
import { FiCheck, FiX, FiSave, FiEdit3 } from 'react-icons/fi';

const PermissionManager = ({ user, onUpdatePermissions, isEditing, onEdit, onSave, onCancel }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(user?.permissions || []);

  const modulePermissions = {
    'Students': {
      access: 'access_students',
      permissions: ['create_student', 'read_student', 'update_student', 'delete_student', 'bulk_upload', 'export_data']
    },
    'Teachers': {
      access: 'access_teachers',
      permissions: ['create_teacher', 'read_teacher', 'update_teacher', 'delete_teacher', 'bulk_upload', 'export_data']
    },
    'Subjects': {
      access: 'access_subjects',
      permissions: ['create_subject', 'read_subject', 'update_subject', 'delete_subject', 'bulk_upload', 'export_data']
    },
    'Classrooms': {
      access: 'access_classrooms',
      permissions: ['create_classroom', 'read_classroom', 'update_classroom', 'delete_classroom', 'export_data']
    },
    'Enrollments': {
      access: 'access_enrollments',
      permissions: ['create_enrollment', 'read_enrollment', 'update_enrollment', 'delete_enrollment', 'export_data']
    },
    'Users': {
      access: 'access_users',
      permissions: ['manage_users', 'export_data']
    },
    'Notifications': {
      access: 'access_notifications',
      permissions: ['send_notifications', 'export_data']
    },
    'Exams': {
      access: 'access_exams',
      permissions: ['create_exam', 'read_exam', 'update_exam', 'delete_exam', 'assign_invigilator', 'export_data']
    }
  };

  const handleModuleToggle = (moduleName) => {
    const module = modulePermissions[moduleName];
    const hasAccess = selectedPermissions.includes(module.access);
    
    if (hasAccess) {
      // Remove module access and all its permissions
      setSelectedPermissions(prev => 
        prev.filter(permission => 
          permission !== module.access && !module.permissions.includes(permission)
        )
      );
    } else {
      // Add module access and all its permissions
      setSelectedPermissions(prev => [
        ...prev.filter(permission => 
          permission !== module.access && !module.permissions.includes(permission)
        ),
        module.access,
        ...module.permissions
      ]);
    }
  };

  const handlePermissionToggle = (permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    onUpdatePermissions(user.id, selectedPermissions);
    onSave();
  };

  const handleCancel = () => {
    setSelectedPermissions(user?.permissions || []);
    onCancel();
  };

  const hasModuleAccess = (moduleName) => {
    const module = modulePermissions[moduleName];
    return selectedPermissions.includes(module.access);
  };

  const hasPermission = (permission) => {
    return selectedPermissions.includes(permission);
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Manage Permissions for {user.displayName || user.username}
          </h3>
          <p className="text-sm text-gray-600">
            Role: <span className="font-medium capitalize">{user.userType || user.role}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiEdit3 className="mr-2" />
              Edit Permissions
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <FiSave className="mr-2" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <FiX className="mr-2" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(modulePermissions).map(([moduleName, module]) => (
          <div key={moduleName} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">{moduleName}</h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasModuleAccess(moduleName)}
                  onChange={() => handleModuleToggle(moduleName)}
                  disabled={!isEditing}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {hasModuleAccess(moduleName) ? 'Full Access' : 'No Access'}
                </span>
              </label>
            </div>
            
            {hasModuleAccess(moduleName) && (
              <div className="ml-6 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {module.permissions.map(permission => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasPermission(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        disabled={!isEditing}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-xs text-gray-600 capitalize">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> When you grant access to a module, all related permissions are automatically included. 
            You can then customize individual permissions as needed.
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
