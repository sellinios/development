import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Shield, Save, RefreshCw, FileText, Users, Building, Package, Briefcase, HeadphonesIcon, Settings } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: Record<string, string[]>;
}

interface PageModule {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  actions: string[];
}

const PAGE_MODULES: PageModule[] = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard and home page',
    icon: FileText,
    actions: ['view']
  },
  {
    key: 'users',
    name: 'User Management',
    description: 'System users, roles, and authentication',
    icon: Users,
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Customer relationship management',
    icon: Briefcase,
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'hr',
    name: 'HR Management',
    description: 'Human resources and employee management',
    icon: Users,
    actions: ['view', 'create', 'edit', 'delete', 'approve']
  },
  {
    key: 'entities',
    name: 'Organization Structure',
    description: 'Companies, departments, and teams',
    icon: Building,
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'projects',
    name: 'Projects',
    description: 'Project management and tracking',
    icon: Briefcase,
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'assets',
    name: 'Assets',
    description: 'Company assets and equipment',
    icon: Package,
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'reports',
    name: 'Reports',
    description: 'System reports and analytics',
    icon: FileText,
    actions: ['view', 'generate', 'export']
  },
  {
    key: 'support',
    name: 'IT Support',
    description: 'Technical support and tickets',
    icon: HeadphonesIcon,
    actions: ['view', 'create', 'edit', 'delete', 'resolve']
  },
  {
    key: 'admin',
    name: 'Admin Panel',
    description: 'System administration',
    icon: Settings,
    actions: ['view', 'manage']
  }
];

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  generate: 'Generate',
  export: 'Export',
  resolve: 'Resolve',
  manage: 'Manage'
};

const PagePermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());
  const [modifiedPermissions, setModifiedPermissions] = useState<Record<number, Record<string, string[]>>>({});

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles/');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId: number) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const hasPermission = (role: Role, module: string, action: string): boolean => {
    // Check modified permissions first
    if (modifiedPermissions[role.id]) {
      const modifiedActions = modifiedPermissions[role.id][module];
      if (modifiedActions !== undefined) {
        return modifiedActions.includes(action);
      }
    }
    // Fall back to original permissions
    return role.permissions[module]?.includes(action) || false;
  };

  const togglePermission = (roleId: number, module: string, action: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Don't allow editing system roles' critical permissions
    if (role.name === 'superadmin') {
      alert('Cannot modify Super Admin permissions');
      return;
    }

    const currentPermissions = modifiedPermissions[roleId] || { ...role.permissions };
    
    if (!currentPermissions[module]) {
      currentPermissions[module] = [];
    }

    const actionIndex = currentPermissions[module].indexOf(action);
    if (actionIndex > -1) {
      // Remove action
      currentPermissions[module] = currentPermissions[module].filter(a => a !== action);
      // Remove module if no actions left
      if (currentPermissions[module].length === 0) {
        delete currentPermissions[module];
      }
    } else {
      // Add action
      currentPermissions[module] = [...currentPermissions[module], action];
    }

    setModifiedPermissions({
      ...modifiedPermissions,
      [roleId]: currentPermissions
    });
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      
      // Save each modified role
      for (const [roleId, permissions] of Object.entries(modifiedPermissions)) {
        await api.put(`/roles/${roleId}/`, {
          permissions
        });
      }

      // Reload roles and clear modifications
      await loadRoles();
      setModifiedPermissions({});
      alert('Permissions saved successfully');
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      alert(error.response?.data?.error || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const hasModifications = Object.keys(modifiedPermissions).length > 0;

  if (loading) {
    return (
      <PageTemplate>
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <PageHeader 
        title="Permission Management"
        subtitle="Configure role permissions and page access for the entire system"
        actions={
          <div className="flex gap-2">
            <button
              onClick={loadRoles}
              className={`${TEMPLATE_STYLES.buttons.secondary} flex items-center gap-2`}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {hasModifications && (
              <button
                onClick={savePermissions}
                disabled={saving}
                className={`${TEMPLATE_STYLES.buttons.primary} flex items-center gap-2 disabled:opacity-50`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        {roles.map((role) => {
          const isExpanded = expandedRoles.has(role.id);
          const isSuperAdmin = role.name === 'superadmin';
          
          return (
            <div key={role.id} className="bg-white shadow rounded-lg">
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRole(role.id)}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${isSuperAdmin ? 'text-red-600' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{role.display_name}</h3>
                    <p className="text-sm text-gray-500">{role.description || `System role: ${role.name}`}</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isExpanded && (
                <div className="px-6 pb-4">
                  <div className="border-t pt-4">
                    {PAGE_MODULES.map((module) => {
                      const Icon = module.icon;
                      const hasAnyPermission = module.actions.some(action => hasPermission(role, module.key, action));
                      
                      return (
                        <div key={module.key} className="mb-6 last:mb-0">
                          <div className="flex items-start gap-3 mb-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${hasAnyPermission ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{module.name}</h4>
                              <p className="text-sm text-gray-500">{module.description}</p>
                              
                              <div className="mt-2 flex flex-wrap gap-2">
                                {module.actions.map((action) => {
                                  const hasAccess = hasPermission(role, module.key, action);
                                  const isModified = modifiedPermissions[role.id]?.[module.key] !== undefined;
                                  
                                  return (
                                    <button
                                      key={action}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePermission(role.id, module.key, action);
                                      }}
                                      disabled={isSuperAdmin}
                                      className={`
                                        px-3 py-1 text-sm rounded-full transition-colors
                                        ${hasAccess 
                                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }
                                        ${isModified ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
                                        ${isSuperAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                                      `}
                                    >
                                      {ACTION_LABELS[action] || action}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Permission Guide</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>View:</strong> Can access and see the module/page</p>
          <p>• <strong>Create:</strong> Can add new items</p>
          <p>• <strong>Edit:</strong> Can modify existing items</p>
          <p>• <strong>Delete:</strong> Can remove items</p>
          <p>• <strong>Approve:</strong> Can approve requests (HR specific)</p>
          <p>• <strong>Manage:</strong> Full administrative access</p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default PagePermissions;