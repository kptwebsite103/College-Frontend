import React, { useState, useEffect } from 'react';
import './UserManagementContent.css';
import { listUsers, createUser, deleteUser, updateUser } from '../api/resources.js';
import { useAuth } from '../contexts/AuthContext';

const UserManagementContent = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
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
      console.log('Loaded users:', usersData);
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
    setShowAddUserForm(!showAddUserForm);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowAddUserForm(false);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // Prepare update data
      const updateData = {
        username: editingUser.username,
        email: editingUser.email,
        roles: editingUser.roles
      };
      
      // Only include password if it's provided
      if (editingUser.password && editingUser.password.trim()) {
        updateData.password = editingUser.password;
      }
      
      console.log('Updating user with data:', {
        ...updateData,
        password: updateData.password ? '[HIDDEN]' : '[NOT CHANGED]'
      });
      
      // Call update user API
      await updateUser(editingUser._id, updateData);
      console.log('User updated successfully:', editingUser);
      showNotification('success', `User "${editingUser.username}" updated successfully`);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      showNotification('error', `Failed to update user: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        // Use _id field for MongoDB
        const userId = userToDelete._id;
        console.log('Deleting user with ID:', userId);
        
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        // Call delete user API
        await deleteUser(userId);
        console.log('User deleted successfully:', userToDelete);
        showNotification('success', `User "${userToDelete.username}" deleted successfully`);
        loadUsers();
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('error', `Failed to delete user: ${error.message || 'Please try again.'}`);
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
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
      showNotification('success', 'User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      // Show error message (optional)
      showNotification('error', `Failed to create user: ${error.message || 'Please try again.'}`);
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
              key="all"
              className={`dropdown-item ${currentFilter === 'all' ? 'selected' : ''}`}
              onClick={() => handleDropdownSelect('all', 'All Users')}
            >
              All Users
            </div>
            <div 
              key="admin"
              className={`dropdown-item ${currentFilter === 'admin' ? 'selected' : ''}`}
              onClick={() => handleDropdownSelect('admin', 'Admin Users')}
            >
              Admin Users
            </div>
            <div 
              key="non-admin"
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
        {!showAddUserForm && !editingUser ? (
          filteredUsers.map(user => {
            const initials = user.username.split(' ').map(n => n[0]).join('').toUpperCase();
            const isAdmin = user.roles.includes('admin') || user.roles.includes('super-admin');
            const roleClass = isAdmin ? 'admin' : 'user';
            const roleText = user.roles.includes('super-admin') ? 'Super Admin' : user.roles.includes('admin') ? 'Admin' : 'Creator';

            return (
              <div key={user._id} className="user-card">
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
                </div>
                {canManageUsers && (
                  <div className="user-actions">
                    <button className="edit-btn" title="Edit User" onClick={() => handleEditUser(user)}>
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'%3E%3C/path%3E%3Cpath d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'%3E%3C/path%3E%3C/svg%3E" alt="Edit" />
                    </button>
                    <button className="delete-btn" title="Delete User" onClick={() => handleDeleteUser(user)}>
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 6 5 6 21 6'%3E%3C/polyline%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'%3E%3C/path%3E%3Cline x1='10' y1='11' x2='10' y2='17'%3E%3C/line%3E%3Cline x1='14' y1='11' x2='14' y2='17'%3E%3C/line%3E%3C/svg%3E" alt="Delete" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : canManageUsers ? (
          <div className="add-user-form">
            <div className="form-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="close-btn" onClick={editingUser ? handleCancelEdit : handleCancelAdd}>×</button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleSubmitUser} className="user-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={editingUser ? editingUser.username : newUser.username}
                  onChange={editingUser ? (e) => setEditingUser({...editingUser, username: e.target.value}) : handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">User Type</label>
                <select
                  id="role"
                  name="role"
                  value={editingUser ? editingUser.roles[0] : newUser.role}
                  onChange={editingUser ? (e) => setEditingUser({...editingUser, roles: [e.target.value]}) : handleInputChange}
                >
                  <option key="admin" value="admin">Admin</option>
                  <option key="super-admin" value="super-admin">Super Admin</option>
                  <option key="creator" value="creator">Creator</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={editingUser ? editingUser.password : newUser.password}
                  onChange={editingUser ? (e) => setEditingUser({...editingUser, password: e.target.value}) : handleInputChange}
                  placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editingUser ? editingUser.email : newUser.email}
                  onChange={editingUser ? (e) => setEditingUser({...editingUser, email: e.target.value}) : handleInputChange}
                  required
                />
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="submit-btn">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button type="button" className="cancel-btn" onClick={editingUser ? handleCancelEdit : handleCancelAdd}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="access-denied">
            <p>You don't have permission to add users.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete user "{userToDelete.username}"?</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-message">
              {notification.type === 'success' ? '✓' : '✗'} {notification.message}
            </span>
            <button className="notification-close" onClick={() => setNotification({ show: false, type: '', message: '' })}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementContent;
