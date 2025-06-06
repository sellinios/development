import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Edit2, Trash2, Plus, Users, Shield } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  permissions: Record<string, string[]>;
  user_count: number;
  created_at: string;
  updated_at: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'role', label: 'Role', visible: true, required: true },
    { key: 'description', label: 'Description', visible: true },
    { key: 'user_count', label: 'Users', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'permissions_count', label: 'Permissions', visible: false },
    { key: 'created_at', label: 'Created', visible: false },
    { key: 'updated_at', label: 'Updated', visible: false },
  ]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: {} as Record<string, string[]>
  });

  // Available permissions
  const availablePermissions = {
    users: ['create', 'read', 'update', 'delete'],
    roles: ['create', 'read', 'update', 'delete'],
    entities: ['create', 'read', 'update', 'delete'],
    reports: ['read', 'generate', 'export'],
    leave: ['request', 'approve', 'reject'],
    system: ['manage', 'backup', 'restore'],
    profile: ['read', 'update']
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles/');
      setRoles(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description,
      permissions: role.permissions || {}
    });
    setIsCreateMode(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permissions: {}
    });
    setIsCreateMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await api.delete(`/roles/${roleId}`);
      fetchRoles();
    } catch (err) {
      alert('Failed to delete role');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isCreateMode) {
        await api.post('/roles/', formData);
      } else if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, {
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions
        });
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      alert('Failed to save role');
    }
  };

  const handlePermissionToggle = (resource: string, action: string) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (!newPermissions[resource]) {
        newPermissions[resource] = [];
      }

      const actionIndex = newPermissions[resource].indexOf(action);
      if (actionIndex > -1) {
        newPermissions[resource].splice(actionIndex, 1);
        if (newPermissions[resource].length === 0) {
          delete newPermissions[resource];
        }
      } else {
        newPermissions[resource].push(action);
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const isSystemRole = (roleName: string) => {
    return ['superadmin', 'admin', 'manager', 'employee'].includes(roleName);
  };

  const renderCell = (role: Role, column: Column) => {
    switch (column.key) {
      case 'role':
        return (
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {role.display_name}
              </div>
              <div className="text-sm text-gray-500">{role.name}</div>
            </div>
          </div>
        );
      case 'description':
        return <div className="text-sm text-gray-500">{role.description}</div>;
      case 'user_count':
        return (
          <div className="flex items-center">
            <Users className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-900">{role.user_count}</span>
          </div>
        );
      case 'type':
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            isSystemRole(role.name) 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {isSystemRole(role.name) ? 'System' : 'Custom'}
          </span>
        );
      case 'permissions_count': {
        const permissionCount = Object.values(role.permissions || {}).flat().length;
        return <div className="text-sm text-gray-900">{permissionCount} permissions</div>;
      }
      case 'created_at':
        return (
          <div className="text-sm text-gray-900">
            {new Date(role.created_at).toLocaleDateString()}
          </div>
        );
      case 'updated_at':
        return (
          <div className="text-sm text-gray-900">
            {new Date(role.updated_at).toLocaleDateString()}
          </div>
        );
      default:
        return null;
    }
  };

  const renderActions = (role: Role) => {
    if (!isSystemRole(role.name) || role.name === 'manager') {
      return (
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => handleEdit(role)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit Role"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!isSystemRole(role.name) && (
            <button
              onClick={() => handleDelete(role.id)}
              className="text-red-600 hover:text-red-900"
              disabled={role.user_count > 0}
              title={role.user_count > 0 ? "Cannot delete role with users" : "Delete Role"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }
    return <span className="text-gray-400 text-sm">Protected</span>;
  };

  if (loading) {
    return (
      <PageTemplate variant="tight">
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate variant="tight">
        <div className="text-red-600 text-center py-8">{error}</div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate variant="tight">
      <PageHeader 
        title="Role Management"
        subtitle="Manage system roles and permissions"
        actions={
          <button
            onClick={handleCreate}
            className={TEMPLATE_STYLES.buttons.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </button>
        }
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-5 h-5" />
            <span className="font-medium">{roles.length} roles configured</span>
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            storageKey="role-management-visible-columns"
          />
        </div>
      </div>

      <DynamicTable
        data={roles}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
      />
      
      {roles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No roles found</p>
        </div>
      )}

      {/* Modal for creating/editing roles */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {isCreateMode ? 'Create New Role' : 'Edit Role'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!isCreateMode}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                  {Object.entries(availablePermissions).map(([resource, actions]) => (
                    <div key={resource} className="mb-4">
                      <h4 className="font-medium text-sm text-gray-900 mb-2 capitalize">
                        {resource}
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {actions.map((action) => (
                          <label key={action} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.permissions[resource]?.includes(action) || false}
                              onChange={() => handlePermissionToggle(resource, action)}
                              className="mr-2"
                            />
                            <span className="text-sm">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isCreateMode ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default RoleManagement;