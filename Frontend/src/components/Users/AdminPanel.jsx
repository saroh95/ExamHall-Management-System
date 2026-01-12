import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPanel = ({ users, sendCredentials, sendBulkCredentials, selectedUsers, handleSelectUser }) => {
  const [registrationData, setRegistrationData] = useState({
    personalEmail: '',
    role: 'Student',
    department: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Generate username (e.g., jdoe123)
  const generateUsername = (email) => {
    const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit number
    return `${prefix}${randomSuffix}`;
  };

  // Generate random password (12 characters)
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Generate institutional email
  const generateInstitutionalEmail = (username, role) => {
    const domain = role === 'Faculty' ? 'faculty.university.edu' : 'student.university.edu';
    return `${username}@${domain}`;
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      // Generate credentials
      const username = generateUsername(registrationData.personalEmail);
      const password = generatePassword();
      const institutionalEmail = generateInstitutionalEmail(username, registrationData.role);

      // In a real app, this would call your backend API
      // const response = await axios.post('/api/users/register', {
      //   ...registrationData,
      //   username,
      //   email: institutionalEmail,
      //   password,
      //   status: 'Pending',
      //   needsPasswordReset: true
      // });

      // Simulate API call
      toast.success(`Successfully registered ${registrationData.role.toLowerCase()}`);

      // Send credentials email (simulated)
      const emailContent = `
        <h2>Welcome to University Portal</h2>
        <p>Your institutional account has been created by the administrator.</p>
        
        <h3>Your Login Credentials</h3>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Institutional Email:</strong> ${institutionalEmail}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        
        <p style="color: red; font-weight: bold;">
          You must change your password after first login.
        </p>
        
        <p>
          <a href="https://portal.university.edu/login" 
             style="background: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
            Login Now
          </a>
        </p>
        
        <p>If you didn't request this account, please contact support immediately.</p>
      `;

      // In a real app, this would call your email service
      // await axios.post('/api/email/send', {
      //   to: registrationData.personalEmail,
      //   subject: 'Your Institutional Account Credentials',
      //   html: emailContent
      // });

      toast.info(`Credentials sent to ${registrationData.personalEmail}`);

      // Reset form
      setRegistrationData({
        personalEmail: '',
        role: 'Student',
        department: '',
      });

    } catch (error) {
      toast.error(`Registration failed: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="admin-panel">
      {/* Quick Actions Section */}
      <div className="quick-actions">
        <button 
          onClick={() => document.getElementById('registration-modal').showModal()}
          className="btn btn-primary"
        >
          Register New User
        </button>
      </div>

      {/* Registration Modal */}
      <dialog id="registration-modal" className="modal">
        <div className="modal-content">
          <h3>Register New User</h3>
          <form onSubmit={handleRegisterUser}>
            <div className="form-group">
              <label>Personal Email</label>
              <input
                type="email"
                value={registrationData.personalEmail}
                onChange={(e) => setRegistrationData({...registrationData, personalEmail: e.target.value})}
                required
                placeholder="user@personal.com"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={registrationData.role}
                onChange={(e) => setRegistrationData({...registrationData, role: e.target.value})}
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
              </select>
            </div>

            {registrationData.role === 'Faculty' && (
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={registrationData.department}
                  onChange={(e) => setRegistrationData({...registrationData, department: e.target.value})}
                  placeholder="Computer Science"
                />
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => document.getElementById('registration-modal').close()}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isRegistering}
                className="btn btn-primary"
              >
                {isRegistering ? 'Registering...' : 'Register User'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* User Management Table */}
      <div className="user-management">
        <h2>User Management</h2>
        <table>
          {/* Table headers */}
          <thead>
            <tr>
              <th>Select</th>
              <th>Username</th>
              <th>Role</th>
              <th>Institutional Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          
          {/* Table body */}
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td>
                  <button onClick={() => sendCredentials(user.id)}>
                    Resend Credentials
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-panel {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .quick-actions {
          margin-bottom: 20px;
        }
        .modal {
          border: none;
          border-radius: 8px;
          padding: 20px;
          max-width: 500px;
        }
        .modal::backdrop {
          background: rgba(0,0,0,0.5);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input, select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-primary {
          background: #0066cc;
          color: white;
        }
        .btn-secondary {
          background: #ddd;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;