import React, { useState, useEffect } from 'react';
import { usePermissions } from '../utils/rolePermissions';
import { getRoleDisplayName, getAssignableRoles, canManageUser } from '../utils/rolePermissions';

export default function UserManagement() {
  const { currentUser, permissions, highestRole } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roles: ['user'],
    password: ''
  });

  useEffect(() => {
    if (permissions.canViewUserList) {
      fetchUsers();
    } else {
      setLoading(false);
      setError('You do not have permission to view users.');
    }
  }, [permissions.canViewUserList]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(editingUser ? 'Failed to update user' : 'Failed to create user');
      }

      // Reset form and refresh users
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        roles: ['user'],
        password: ''
      });
      setEditingUser(null);
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    if (!canManageUser(currentUser, user)) {
      setError('You do not have permission to edit this user');
      return;
    }
    
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roles: Array.isArray(user.roles) ? user.roles : [user.roles || 'user'],
      password: ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (user) => {
    if (!canManageUser(currentUser, user)) {
      setError('You do not have permission to delete this user');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${user.username || user.email}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const assignableRoles = getAssignableRoles(currentUser);

  if (loading) return <div>Loading users...</div>;
  if (error && !permissions.canViewUserList) return <div className="error-message">{error}</div>;

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        {permissions.canCreateUsers && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create User
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  setFormData({
                    username: '',
                    email: '',
                    firstName: '',
                    lastName: '',
                    roles: ['user'],
                    password: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              )}

              {assignableRoles.length > 0 && (
                <div className="form-group">
                  <label>Roles</label>
                  <select
                    multiple
                    value={formData.roles}
                    onChange={(e) => {
                      const selectedRoles = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, roles: selectedRoles});
                    }}
                  >
                    {assignableRoles.map(role => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Name</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>
                  {Array.isArray(user.roles) 
                    ? user.roles.map(role => getRoleDisplayName(role)).join(', ')
                    : getRoleDisplayName(user.roles || 'user')
                  }
                </td>
                <td>
                  {permissions.canEditUsers && canManageUser(currentUser, user) && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                  )}
                  {permissions.canDeleteUsers && canManageUser(currentUser, user) && (
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="no-users">
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
