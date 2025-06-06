import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import api from '../lib/api';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  entity_id?: string;
  entity?: {
    id: string;
    name: string;
    type: string;
  };
  position_id: number;
  position?: {
    id: number;
    title: string;
  };
  date_hired: string;
  leave_balance: number;
  profile_picture: string;
  phone_number: string;
  address: string;
  active: boolean;
  entities?: Array<{
    entity_id: string;
    entity: {
      id: string;
      name: string;
      type: string;
    };
    role: string;
  }>;
}

interface UserForm {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: string;
  entity_id: string;
  position_id: number;
  leave_balance: number;
  profile_picture: string;
  phone_number: string;
  address: string;
  active: boolean;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'name', label: 'User', visible: true, required: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'phone_number', label: 'Phone', visible: false },
    { key: 'role', label: 'Role', visible: true },
    { key: 'department', label: 'Department', visible: true },
    { key: 'position', label: 'Position', visible: true },
    { key: 'address', label: 'Address', visible: false },
    { key: 'date_hired', label: 'Date Hired', visible: false },
    { key: 'leave_balance', label: 'Leave Balance', visible: false },
    { key: 'status', label: 'Status', visible: true },
  ]);
  
  const [formData, setFormData] = useState<UserForm>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'employee',
    entity_id: '',
    position_id: 0,
    leave_balance: 0,
    profile_picture: '',
    phone_number: '',
    address: '',
    active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('users/', formData);
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await api.put(`users/${selectedUser.id}/`, formData);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }
    
    try {
      await api.delete(`users/${user.id}`);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'employee',
      entity_id: '',
      position_id: 0,
      leave_balance: 0,
      profile_picture: '',
      phone_number: '',
      address: '',
      active: true,
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.active) ||
                         (filterStatus === 'inactive' && !user.active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCell = (user: User, column: Column) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </div>
            </div>
          </div>
        );
      case 'email':
        return <div className="text-sm text-gray-900">{user.email}</div>;
      case 'phone_number':
        return <div className="text-sm text-gray-900">{user.phone_number || '-'}</div>;
      case 'role':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
        );
      case 'department':
        return <div className="text-sm text-gray-900">{user.entity ? user.entity.name : '-'}</div>;
      case 'position':
        return <div className="text-sm text-gray-900">{user.position ? user.position.title : '-'}</div>;
      case 'address':
        return <div className="text-sm text-gray-900">{user.address || '-'}</div>;
      case 'date_hired':
        return (
          <div className="text-sm text-gray-900">
            {user.date_hired ? new Date(user.date_hired).toLocaleDateString() : '-'}
          </div>
        );
      case 'leave_balance':
        return <div className="text-sm text-gray-900">{user.leave_balance} days</div>;
      case 'status':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.active ? 'Active' : 'Inactive'}
          </span>
        );
      default:
        return null;
    }
  };

  const renderActions = (user: User) => {
    return (
      <div className="flex space-x-2 justify-center">
        <Link
          to={`/users/edit/${user.id}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </Link>
        <button
          onClick={() => handleDeleteUser(user)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </div>
    );
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

  return (
    <PageTemplate variant="tight">
      <PageHeader 
        title="System User Accounts"
        subtitle="Manage system access, user credentials, and permissions"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className={TEMPLATE_STYLES.buttons.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
        }
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon className="w-5 h-5" />
            <span className="font-medium">{filteredUsers.length} users found</span>
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            storageKey="users-visible-columns"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <DynamicTable
        data={filteredUsers}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
      />
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={showCreateModal ? handleCreateUser : handleUpdateUser}>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {showCreateModal ? 'Create New User' : 'Edit User'}
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.last_name}
                          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {showCreateModal && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={formData.active}
                            onChange={() => setFormData({...formData, active: true})}
                            className="mr-2"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!formData.active}
                            onChange={() => setFormData({...formData, active: false})}
                            className="mr-2"
                          />
                          <span className="text-sm">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedUser(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {showCreateModal ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </PageTemplate>
  );
};

export default Users;