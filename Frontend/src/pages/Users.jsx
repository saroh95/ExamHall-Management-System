import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI, studentAPI, teacherAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import useDebounce from '../hooks/useDebounce';
import 'react-toastify/dist/ReactToastify.css';
import PageHeader from '../components/Users/PageHeader';
import UserStats from '../components/Users/UserStats';
import ActionBar from '../components/Users/ActionBar';
import UserForm from '../components/Users/UserForm';
import UserTable from '../components/Users/UserTable';
import AdminPanel from '../components/Users/AdminPanel';
import RolePermissions from '../components/Users/RolePermissions';
import PermissionManager from '../components/Users/PermissionManager';
import Footer from '../components/Users/Footer';

const UserManagement = () => {
  const navigate = useNavigate();
  const { currentUser, hasRole } = useUser();
  
  // Check if user has permission to access this page
  useEffect(() => {
    if (!hasRole('admin')) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [hasRole, navigate]);

  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // All users for stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  
  // Debounce search term to avoid searching on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'admin',
    isActive: true,
    password: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentTab, setCurrentTab] = useState('users');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Role definitions with permissions
  const [roles, setRoles] = useState({
    admin: { 
      dashboard: true, 
      users: true, 
      teachers: true, 
      students: true, 
      classrooms: true,
      subjects: true,
      settings: true,
      exams: true,
      reports: true
    },
    teacher: { 
      dashboard: true, 
      users: false, 
      teachers: false, 
      students: true, 
      classrooms: true,
      subjects: true,
      settings: false,
      exams: true,
      reports: true
    },
    student: { 
      dashboard: true, 
      users: false, 
      teachers: false, 
      students: false, 
      classrooms: false,
      subjects: false,
      settings: false,
      exams: false,
      reports: false
    },
    invigilator: { 
      dashboard: true, 
      users: false, 
      teachers: false, 
      students: true, 
      classrooms: true,
      subjects: false,
      settings: false,
      exams: true,
      reports: false
    }
  });

  // Fetch all users (User, Student, Teacher) from API
  const fetchUsers = async (page = 1, search = '', roleFilter = '') => {
    try {
      setLoading(true);
      
      // Fetch ALL users without pagination limits
      const [usersResponse, studentsResponse, teachersResponse] = await Promise.all([
        userAPI.getUsers({ limit: 1000, search }), // Get all admin users
        studentAPI.getStudents({ limit: 1000, search }), // Get all students
        teacherAPI.getTeachers({ limit: 1000, search }) // Get all teachers
      ]);
      
      // Combine all users with their type information
      const allUsers = [];
      
      // Add admin users
      if (usersResponse.data.success && usersResponse.data.data) {
        usersResponse.data.data.forEach(user => {
          allUsers.push({
            ...user,
            userType: 'admin',
            displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
            role: user.role || 'admin'
          });
        });
      }
      
      // Add students
      if (studentsResponse.data.success && studentsResponse.data.data) {
        studentsResponse.data.data.forEach(student => {
          allUsers.push({
            ...student,
            userType: 'student',
            displayName: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.scholarId,
            role: 'student',
            email: student.email,
            phone: student.phone || student.contactNumber
          });
        });
      }
      
      // Add teachers
      if (teachersResponse.data.success && teachersResponse.data.data) {
        teachersResponse.data.data.forEach(teacher => {
          allUsers.push({
            ...teacher,
            userType: 'teacher',
            displayName: teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.employeeId,
            role: 'teacher',
            email: teacher.instituteEmail || teacher.personalEmail,
            phone: teacher.phone || teacher.contactNumber
          });
        });
      }
      
      // Apply search and role filters
      let filteredUsers = allUsers;
      
      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.role?.toLowerCase().includes(searchLower) ||
          user.scholarId?.toLowerCase().includes(searchLower) ||
          user.employeeId?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply role filter if provided
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.userType === roleFilter);
      }
      
      // Store all users for stats
      setAllUsers(filteredUsers);
      
      // Simple pagination for combined results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
      setTotalPages(Math.ceil(filteredUsers.length / pageSize));
      setTotalUsers(filteredUsers.length);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to fetch users');
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and when filters change
  useEffect(() => {
    if (hasRole('admin')) {
      // Show loading indicator when search term changes
      if (searchTerm !== debouncedSearchTerm) {
        setIsSearching(true);
      }
      fetchUsers(1, debouncedSearchTerm, roleFilter);
    }
  }, [hasRole, debouncedSearchTerm, roleFilter]);

  // Hide loading indicator when search completes
  useEffect(() => {
    if (!loading) {
      setIsSearching(false);
    }
  }, [loading]);

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing user
        const response = await userAPI.updateUser(editingUser._id, formData);
        if (response.data.success) {
          toast.success('User updated successfully');
          setUsers(prev => prev.map(user => 
            user._id === editingUser._id ? response.data.data : user
          ));
        }
      } else {
        // Create new user
        const response = await userAPI.createUser(formData);
        if (response.data.success) {
          toast.success('User created successfully');
          setUsers(prev => [...prev, response.data.data]);
        }
      }
      
      // Reset form
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'admin',
        isActive: true,
        password: ''
      });
      setShowAddForm(false);
      setIsEditing(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  // Handle edit user
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      password: ''
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  // Handle delete user
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await userAPI.deleteUser(userId);
        if (response.data.success) {
          toast.success('User deleted successfully');
          setUsers(prev => prev.filter(user => user._id !== userId));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  // Handle user selection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      try {
        const response = await userAPI.bulkDelete(selectedUsers);
        if (response.data.success) {
          toast.success(`${response.data.data.deletedCount} users deleted successfully`);
          setUsers(prev => prev.filter(user => !selectedUsers.includes(user._id)));
          setSelectedUsers([]);
        }
      } catch (error) {
        console.error('Error bulk deleting users:', error);
        toast.error(error.response?.data?.message || 'Failed to delete users');
      }
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = async (status) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users to update');
      return;
    }
    
    try {
      const response = await userAPI.bulkStatusUpdate(selectedUsers, status);
      if (response.data.success) {
        toast.success(`${response.data.data.modifiedCount} users updated successfully`);
        setUsers(prev => prev.map(user => 
          selectedUsers.includes(user._id) 
            ? { ...user, isActive: status }
            : user
        ));
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error bulk updating users:', error);
      toast.error(error.response?.data?.message || 'Failed to update users');
    }
  };

  // Handle send credentials
  const sendCredentials = async (userId) => {
    try {
      const response = await userAPI.sendCredentials(userId);
      if (response.data.success) {
        toast.success('Credentials sent successfully');
      }
    } catch (error) {
      console.error('Error sending credentials:', error);
      toast.error(error.response?.data?.message || 'Failed to send credentials');
    }
  };

  // Handle bulk send credentials
  const sendBulkCredentials = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users to send credentials');
      return;
    }
    
    try {
      const response = await userAPI.bulkSendCredentials(selectedUsers);
      if (response.data.success) {
        toast.success(`Credentials sent to ${response.data.data.sentCount} users`);
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error bulk sending credentials:', error);
      toast.error(error.response?.data?.message || 'Failed to send credentials');
    }
  };

  // Handle search - now handled by debounced useEffect

  // Handle page change
  const handlePageChange = (page) => {
    fetchUsers(page, debouncedSearchTerm, roleFilter);
  };

  // Handle permission management
  const handleManagePermissions = (user) => {
    setSelectedUserForPermissions(user);
    setIsEditingPermissions(false);
  };

  const handleUpdatePermissions = async (userId, permissions) => {
    try {
      const response = await userAPI.updateUser(userId, { permissions });
      if (response.data.success) {
        toast.success('Permissions updated successfully');
        // Update the user in the local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, permissions } : user
        ));
        setAllUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, permissions } : user
        ));
        setSelectedUserForPermissions(null);
        setIsEditingPermissions(false);
      } else {
        throw new Error(response.data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const handleEditPermissions = () => {
    setIsEditingPermissions(true);
  };

  const handleSavePermissions = () => {
    // This will be handled by the PermissionManager component
  };

  const handleCancelPermissions = () => {
    setIsEditingPermissions(false);
    setSelectedUserForPermissions(null);
  };

  // Update role permissions
  const updateRolePermissions = (role, permissions) => {
    setRoles(prev => ({
      ...prev,
      [role]: permissions
    }));
    toast.success(`Permissions updated for ${role} role`);
  };

  if (!hasRole('admin')) {
    return null; // Don't render if not admin
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="User Management" 
          description="Manage all system users, roles and permissions" 
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${currentTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setCurrentTab('users')}
          >
            Users
          </button>
          <button
            className={`py-2 px-4 font-medium ${currentTab === 'admin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setCurrentTab('admin')}
          >
            Admin Tools
          </button>
          <button
            className={`py-2 px-4 font-medium ${currentTab === 'roles' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setCurrentTab('roles')}
          >
            Role Permissions
          </button>
        </div>

        {currentTab === 'users' && (
          <>
            <UserStats users={allUsers} />
            
            <ActionBar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              showBulkActions={showBulkActions}
              handleBulkDelete={handleBulkDelete}
              handleBulkStatusChange={handleBulkStatusChange}
              sendBulkCredentials={sendBulkCredentials}
              selectedUsers={selectedUsers}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              setIsEditing={setIsEditing}
              setFormData={setFormData}
              generatePassword={generatePassword}
              isSearching={isSearching}
            />

            {/* Permission Manager */}
            {selectedUserForPermissions && (
              <div className="mb-6">
                <PermissionManager
                  user={selectedUserForPermissions}
                  onUpdatePermissions={handleUpdatePermissions}
                  isEditing={isEditingPermissions}
                  onEdit={handleEditPermissions}
                  onSave={handleSavePermissions}
                  onCancel={handleCancelPermissions}
                />
              </div>
            )}

            {showAddForm && (
              <UserForm 
                formData={formData}
                isEditing={isEditing}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                setShowAddForm={setShowAddForm}
                setFormData={setFormData}
                setIsEditing={setIsEditing}
                generatePassword={generatePassword}
              />
            )}

            <UserTable 
              filteredUsers={users}
              selectedUsers={selectedUsers}
              handleSelectUser={handleSelectUser}
              handleSelectAll={handleSelectAll}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              searchTerm={searchTerm}
              setShowAddForm={setShowAddForm}
              setSearchTerm={setSearchTerm}
              sendCredentials={sendCredentials}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              handleManagePermissions={handleManagePermissions}
            />
          </>
        )}

        {currentTab === 'admin' && (
          <AdminPanel 
            users={users}
            selectedUsers={selectedUsers}
            handleBulkDelete={handleBulkDelete}
            handleBulkStatusChange={handleBulkStatusChange}
            sendBulkCredentials={sendBulkCredentials}
          />
        )}

        {currentTab === 'roles' && (
          <RolePermissions 
            roles={roles}
            updateRolePermissions={updateRolePermissions}
          />
        )}

        <Footer />
      </div>
    </div>
  );
};

export default UserManagement;