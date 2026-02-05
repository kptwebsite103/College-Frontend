// Role-based access control utilities
import { useAuth } from '../contexts/AuthContext';

// Define role hierarchy (higher number = higher authority)
export const ROLE_HIERARCHY = {
  'user': 0,
  'creator': 1,
  'admin': 2,
  'super-admin': 3
};

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  'user': {
    // Basic user permissions - can view public content
    canViewContent: true,
    canViewOwnProfile: true,
  },
  'creator': {
    // Creator permissions - can create items but not users
    canViewContent: true,
    canViewOwnProfile: true,
    canCreateItems: true,
    canEditOwnItems: true,
    canDeleteOwnItems: true,
    // Cannot manage users
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUserList: false,
  },
  'admin': {
    // Admin permissions - can create items and users
    canViewContent: true,
    canViewOwnProfile: true,
    canCreateItems: true,
    canEditOwnItems: true,
    canDeleteOwnItems: true,
    canEditAllItems: true,
    canDeleteAllItems: true,
    // Can manage users but with limitations
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUserList: true,
    // Cannot edit/delete super-admins
    canManageSuperAdmin: false,
  },
  'super-admin': {
    // Super Admin permissions - full control
    canViewContent: true,
    canViewOwnProfile: true,
    canCreateItems: true,
    canEditOwnItems: true,
    canDeleteOwnItems: true,
    canEditAllItems: true,
    canDeleteAllItems: true,
    // Full user management
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUserList: true,
    canManageSuperAdmin: true,
    // Additional super-admin specific permissions
    canAccessSystemSettings: true,
    canManageSystemConfig: true,
    canViewSystemLogs: true,
  }
};

// Helper function to get user's highest role
export function getHighestRole(user) {
  if (!user || !user.roles) return 'user';
  
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  let highestRole = 'user';
  let highestLevel = 0;
  
  roles.forEach(role => {
    const roleName = String(role).toLowerCase();
    if (ROLE_HIERARCHY[roleName] > highestLevel) {
      highestLevel = ROLE_HIERARCHY[roleName];
      highestRole = roleName;
    }
  });
  
  return highestRole;
}

// Helper function to check if user has specific permission
export function hasPermission(user, permission) {
  const highestRole = getHighestRole(user);
  const permissions = ROLE_PERMISSIONS[highestRole];
  return permissions ? permissions[permission] || false : false;
}

// Helper function to check if user can perform action on target user
export function canManageUser(currentUser, targetUser) {
  const currentRole = getHighestRole(currentUser);
  const targetRole = getHighestRole(targetUser);
  
  // Super admin can manage everyone
  if (currentRole === 'super-admin') {
    return true;
  }
  
  // Admin cannot manage super-admins
  if (currentRole === 'admin' && targetRole === 'super-admin') {
    return false;
  }
  
  // Admin can manage creators and users
  if (currentRole === 'admin' && ['creator', 'user'].includes(targetRole)) {
    return true;
  }
  
  // Creator cannot manage any users
  if (currentRole === 'creator') {
    return false;
  }
  
  return false;
}

// Helper function to check if user can edit/delete item
export function canManageItem(currentUser, item) {
  const currentRole = getHighestRole(currentUser);
  
  // Super admin can manage all items
  if (currentRole === 'super-admin') {
    return true;
  }
  
  // Admin can manage all items
  if (currentRole === 'admin') {
    return true;
  }
  
  // Creator can only manage their own items
  if (currentRole === 'creator') {
    return item.createdBy === currentUser.id;
  }
  
  return false;
}

// Helper function to get role display name
export function getRoleDisplayName(role) {
  const roleNames = {
    'user': 'User',
    'creator': 'Creator',
    'admin': 'Admin',
    'super-admin': 'Super Admin'
  };
  return roleNames[role] || 'Unknown';
}

// Helper function to get all available roles for a user to assign
export function getAssignableRoles(currentUser) {
  const currentRole = getHighestRole(currentUser);
  
  switch (currentRole) {
    case 'super-admin':
      return ['user', 'creator', 'admin', 'super-admin'];
    case 'admin':
      return ['user', 'creator', 'admin'];
    case 'creator':
      return []; // Creators cannot assign roles
    default:
      return []; // Regular users cannot assign roles
  }
}

// React hook for role-based permissions
export function usePermissions() {
  const { currentUser } = useAuth();
  const highestRole = getHighestRole(currentUser);
  
  return {
    highestRole,
    permissions: ROLE_PERMISSIONS[highestRole] || {},
    hasPermission: (permission) => hasPermission(currentUser, permission),
    canManageUser: (targetUser) => canManageUser(currentUser, targetUser),
    canManageItem: (item) => canManageItem(currentUser, item),
    getAssignableRoles: () => getAssignableRoles(currentUser),
    isSuperAdmin: highestRole === 'super-admin',
    isAdmin: highestRole === 'admin',
    isCreator: highestRole === 'creator',
    isUser: highestRole === 'user',
  };
}
