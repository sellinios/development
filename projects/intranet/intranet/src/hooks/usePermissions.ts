import { useState, useEffect } from 'react';
import api from '../lib/api';

interface Permissions {
  [resource: string]: string[];
}

let cachedPermissions: Permissions | null = null;

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permissions>(cachedPermissions || {});
  const [loading, setLoading] = useState(!cachedPermissions);

  useEffect(() => {
    if (!cachedPermissions) {
      fetchPermissions();
    }
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/users/profile/permissions');
      // The backend returns { user_id, email, roles, permissions }
      const permissionsData = response.data.permissions || {};
      cachedPermissions = permissionsData;
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      cachedPermissions = {};
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions[resource]?.includes(action) || false;
  };

  const hasAnyPermission = (resource: string): boolean => {
    return permissions[resource] && permissions[resource].length > 0;
  };

  const canViewPage = (pageKey: string): boolean => {
    // Check if user has 'view' permission for the page/module
    // This aligns with our page-based permission system
    switch (pageKey) {
      case 'dashboard':
        return hasPermission('dashboard', 'view') || true; // Everyone can see dashboard by default
      case 'users':
        return hasPermission('users', 'view');
      case 'crm':
        return hasPermission('crm', 'view');
      case 'hr':
        return hasPermission('hr', 'view');
      case 'applicants':
        return hasPermission('applicants', 'view') || hasPermission('hr', 'view');
      case 'entities':
        return hasPermission('entities', 'view');
      case 'projects':
        return hasPermission('projects', 'view');
      case 'assets':
        return hasPermission('assets', 'view');
      case 'reports':
        return hasPermission('reports', 'view');
      case 'support':
        return hasPermission('support', 'view');
      case 'admin':
        return hasPermission('admin', 'view') || hasPermission('admin', 'manage') || isSuperAdmin();
      case 'websites':
        return hasPermission('websites', 'view') || hasPermission('content', 'view') || isAdmin();
      case 'content':
        return hasPermission('content', 'view') || hasPermission('content', 'create') || isAdmin();
      default:
        return false;
    }
  };

  const getUserRole = (): string => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role || 'employee';
    }
    return 'employee';
  };

  const isSuperAdmin = (): boolean => {
    return getUserRole() === 'superadmin';
  };

  const isAdmin = (): boolean => {
    const role = getUserRole();
    return role === 'superadmin' || role === 'admin';
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    canViewPage,
    getUserRole,
    isSuperAdmin,
    isAdmin,
    refreshPermissions: fetchPermissions
  };
};

// Clear cache on logout
export const clearPermissionsCache = () => {
  cachedPermissions = null;
};