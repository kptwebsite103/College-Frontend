import React, { useState, useEffect } from 'react';
import './UserManagementContent.css';
import { listUsers, createUser } from '../api/resources.js';
import { useAuth } from '../contexts/AuthContext';

const UserManagementContent = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    role: 'creator',
    password: '',
    email: ''
  });

  // Check if user can manage users (Super Admin or Admin)
  const canManageUsers = currentUser?.roles && (currentUser.roles.includes('super-admin') || currentUser.roles.includes('admin'));

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await listUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownSelect = (value, text) => {
    setCurrentFilter(value);
    setIsDropdownOpen(false);
  };

  const handleAddUser = () => {
    setShowAddUserForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    console.log('Submitting user creation form with data:', {
      username: newUser.username,
      email: newUser.email,
      password: newUser.password ? '[HIDDEN]' : '',
      role: newUser.role
    });

    try {
      // Create user data object for API
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        roles: [newUser.role]
      };

      console.log('Sending API request with data:', {
        ...userData,
        password: '[HIDDEN]'
      });

      // Save user to database
      const result = await createUser(userData);
      console.log('API response:', result);

      // Reload users from database
      await loadUsers();

      // Reset form
      setNewUser({
        username: '',
        role: 'creator',
        password: '',
        email: ''
      });
      setShowAddUserForm(false);

      // Show success message (optional)
      console.log('User created successfully');
      alert('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      // Show error message (optional)
      alert(`Failed to create user: ${error.message || 'Please try again.'}`);
    }
  };

  const handleCancelAdd = () => {
    setNewUser({
      username: '',
      role: 'creator',
      password: '',
      email: ''
    });
    setShowAddUserForm(false);
  };

  const getFilteredUsers = () => {
    if (currentFilter === 'admin') {
      return users.filter(user => user.roles.includes('admin') || user.roles.includes('super-admin'));
    } else if (currentFilter === 'non-admin') {
      return users.filter(user => user.roles.includes('creator'));
    }
    return users;
  };

  const getSelectedText = () => {
    switch (currentFilter) {
      case 'admin': return 'Admin Users';
      case 'non-admin': return 'Non-Admin Users';
      default: return 'All Users';
    }
  };

  const createUserCard = (user) => {
    const initials = user.username.split(' ').map(n => n[0]).join('').toUpperCase();
    const isAdmin = user.roles.includes('admin') || user.roles.includes('super-admin');
    const roleClass = isAdmin ? 'admin' : 'user';
    const roleText = user.roles.includes('super-admin') ? 'Super Admin' : user.roles.includes('admin') ? 'Admin' : 'Creator';

    return (
      <div key={user.id} className="user-card">
        <div className="user-avatar">{initials}</div>
        <div className="user-name">{user.username}</div>
        <div className="user-info">
          <div className="info-item">
            <span className="info-label">Role:</span>
            <span className={`role-badge ${roleClass}`}>{roleText}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone:</span>
            <span>{user.phone}</span>
          </div>
        </div>
      </div>
    );
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="user-management-content">
      <div className="content-header">
        <div className="dropdown-container">
          <button 
            className={`dropdown-button ${isDropdownOpen ? 'active' : ''}`}
            onClick={toggleDropdown}
          >
            <span>{getSelectedText()}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
            <div 
              className={`dropdown-item ${currentFilter === 'all' ? 'selected' : ''}`}
              onClick={() => handleDropdownSelect('all', 'All Users')}
            >
              All Users
            </div>
            <div 
              className={`dropdown-item ${currentFilter === 'admin' ? 'selected' : ''}`}
              onClick={() => handleDropdownSelect('admin', 'Admin Users')}
            >
              Admin Users
            </div>
            <div 
              className={`dropdown-item ${currentFilter === 'non-admin' ? 'selected' : ''}`}
              onClick={() => handleDropdownSelect('non-admin', 'Non-Admin Users')}
            >
              Non-Admin Users
            </div>
          </div>
        </div>
        {canManageUsers && (
          <button className="add-user-btn" onClick={handleAddUser}>Add User</button>
        )}
      </div>

      <div className="users-grid">
        {!showAddUserForm ? (
          filteredUsers.map(user => createUserCard(user))
        ) : canManageUsers ? (
          <div className="add-user-form">
            <div className="form-header">
              <h3>Add New User</h3>
              <button className="close-btn" onClick={handleCancelAdd}>×</button>
            </div>
            <form onSubmit={handleSubmitUser} className="user-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">User Type</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="submit-btn">Create User</button>
                <button type="button" className="cancel-btn" onClick={handleCancelAdd}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="access-denied">
            <p>You don't have permission to add users.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementContent;
