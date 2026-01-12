import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, TokenManager } from '../services/api';
import { toast } from 'react-toastify';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = TokenManager.getAccessToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        try {
          const response = await authAPI.getCurrentUser();
          if (response.data.success) {
            setCurrentUser(response.data.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          TokenManager.removeAccessToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.data.success) {
        TokenManager.setAccessToken(response.data.accessToken);
        setCurrentUser(response.data.data);
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Role-specific logins
  const studentLogin = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.studentLogin(credentials);
      if (response.data.success) {
        TokenManager.setAccessToken(response.data.token || response.data.accessToken);
        setCurrentUser({ role: 'student', ...response.data.data });
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      console.error('Student login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const teacherLogin = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.teacherLogin(credentials);
      if (response.data.success) {
        TokenManager.setAccessToken(response.data.token || response.data.accessToken);
        setCurrentUser({ role: 'teacher', ...response.data.data });
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      console.error('Teacher login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      TokenManager.removeAccessToken();
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        toast.success('Registration successful! Please check your email for verification.');
        return { success: true };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updatedData) => {
    try {
      setLoading(true);
      // This would need to be implemented in the backend
      // const response = await userAPI.updateUser(currentUser.id, updatedData);
      // if (response.data.success) {
      //   setCurrentUser(prev => ({ ...prev, ...response.data.data }));
      //   toast.success('Profile updated successfully');
      // }
      
      // For now, just update local state
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword(currentPassword, newPassword);
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Password change failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      
      if (response.data.success) {
        toast.success('Password reset email sent successfully');
        return { success: true };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(permission) || false;
  };

  // Check if user has role
  const hasRole = (role) => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    studentLogin,
    teacherLogin,
    logout,
    register,
    updateUserProfile,
    changePassword,
    forgotPassword,
    hasPermission,
    hasRole,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 