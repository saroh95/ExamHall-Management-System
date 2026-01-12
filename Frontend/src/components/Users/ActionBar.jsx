import React from 'react';

const ActionBar = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  showBulkActions,
  handleBulkDelete,
  handleBulkStatusChange,
  sendBulkCredentials,
  selectedUsers,
  showAddForm,
  setShowAddForm,
  setIsEditing,
  setFormData,
  generatePassword,
  isSearching = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              {isSearching ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>

        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setIsEditing(false);
              setFormData({
                username: '',
                name: '',
                email: '',
                phone: '',
                role: 'Faculty',
                status: 'Active',
                password: generatePassword()
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {showBulkActions && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2 self-center">
            {selectedUsers.length} selected
          </span>
          <button
            onClick={() => handleBulkStatusChange('Active')}
            className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm"
          >
            Activate
          </button>
          <button
            onClick={() => handleBulkStatusChange('Inactive')}
            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm"
          >
            Deactivate
          </button>
          <button
            onClick={sendBulkCredentials}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm"
          >
            Send Credentials
          </button>
          <button
            onClick={handleBulkDelete}
            className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionBar;