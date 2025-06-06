import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon, Unlock, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

interface UserNew {
  id: number;
  username: string;
  email: string;
  person_id?: number;
  role: string;
  active: boolean;
  last_login?: string;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  person?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}


const UsersNew: React.FC = () => {
  const [users, setUsers] = useState<UserNew[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'user', label: 'User', visible: true, required: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'role', label: 'Role', visible: true },
    { key: 'employee', label: 'Employee', visible: true },
    { key: 'last_login', label: 'Last Login', visible: true },
    { key: 'failed_attempts', label: 'Failed Attempts', visible: false },
    { key: 'created_at', label: 'Created', visible: false },
    { key: 'updated_at', label: 'Updated', visible: false },
    { key: 'status', label: 'Status', visible: true },
  ]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('users/');
      console.log('Users API response:', response.data);
      setUsers(response.data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUser = async (user: UserNew) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }
    
    try {
      await api.delete(`users/${user.id}`);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleUnlockUser = async (user: UserNew) => {
    try {
      await api.post(`users/${user.id}/unlock`);
      loadUsers();
    } catch (error) {
      console.error('Failed to unlock user:', error);
      alert('Failed to unlock user');
    }
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.person && `${user.person.first_name} ${user.person.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.active) ||
                         (filterStatus === 'inactive' && !user.active) ||
                         (filterStatus === 'locked' && user.locked_until && new Date(user.locked_until) > new Date());
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      case 'hr':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCell = (user: UserNew, column: Column) => {
    const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
    
    switch (column.key) {
      case 'user':
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {user.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {user.username}
              </div>
            </div>
          </div>
        );
      case 'email':
        return <div className="text-sm text-gray-900">{user.email}</div>;
      case 'role':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
        );
      case 'employee':
        return (
          <div className="text-sm text-gray-900">
            {user.person ? (
              <span>{user.person.first_name} {user.person.last_name}</span>
            ) : (
              <span className="text-gray-400">No linked employee</span>
            )}
          </div>
        );
      case 'last_login':
        return (
          <div className="text-sm text-gray-500">
            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
          </div>
        );
      case 'failed_attempts':
        return (
          <div className="text-sm text-gray-900">
            {user.failed_login_attempts}
          </div>
        );
      case 'created_at':
        return (
          <div className="text-sm text-gray-500">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
        );
      case 'updated_at':
        return (
          <div className="text-sm text-gray-500">
            {new Date(user.updated_at).toLocaleDateString()}
          </div>
        );
      case 'status':
        return (
          <div className="flex items-center gap-2">
            {isLocked ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Locked
              </span>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
            )}
            {user.failed_login_attempts > 0 && (
              <span className="text-xs text-gray-500">
                {user.failed_login_attempts} failed attempts
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderActions = (user: UserNew) => {
    const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
    
    return (
      <div className="flex items-center justify-center gap-2">
        {isLocked && (
          <button
            onClick={() => handleUnlockUser(user)}
            className="text-yellow-600 hover:text-yellow-900"
            title="Unlock user"
          >
            <Unlock className="w-4 h-4" />
          </button>
        )}
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
      <PageTemplate maxWidth="full">
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate maxWidth="full">
      <PageHeader 
        title="System User Accounts"
        subtitle="Manage system access, user credentials, and permissions"
        actions={
          <div className="flex items-center gap-4">
            <ColumnManager
              columns={columns}
              onColumnsChange={setColumns}
              storageKey="users-new-visible-columns"
            />
            <Link
              to="/users/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Link>
          </div>
        }
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <UsersIcon className="w-5 h-5" />
          <span className="font-medium">{filteredUsers.length} users found</span>
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
            <option value="hr">HR</option>
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
            <option value="locked">Locked</option>
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
    </PageTemplate>
  );
};

export default UsersNew;