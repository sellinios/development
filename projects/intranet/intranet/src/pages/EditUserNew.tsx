import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Shield, Clock, AlertCircle } from 'lucide-react';
import api from '../lib/api';

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

const EditUserNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserNew | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    person_id: undefined as number | undefined,
    role: 'employee',
    active: true,
  });

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`users/${id}`);
      const userData = response.data;
      setUser(userData);
      
      setFormData({
        username: userData.username,
        email: userData.email,
        password: '', // Never load password
        person_id: userData.person_id,
        role: userData.role,
        active: userData.active,
      });
    } catch (error: any) {
      console.error('Failed to load user:', error);
      alert('Failed to load user data: ' + (error.response?.data?.error || error.message));
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const submitData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        active: formData.active,
        person_id: formData.person_id || null,
      };
      
      // Only include password if it's been changed
      if (formData.password) {
        submitData.password = formData.password;
      }
      
      await api.put(`users/${id}`, submitData);
      navigate('/users');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    try {
      await api.post(`users/${id}/unlock`);
      await loadUser(); // Reload user data
      alert('User account unlocked successfully');
    } catch (error: any) {
      console.error('Failed to unlock user:', error);
      alert(error.response?.data?.error || 'Failed to unlock user');
    }
  };

  const handleResetAttempts = async () => {
    try {
      await api.post(`users/${id}/reset-attempts`);
      await loadUser(); // Reload user data
      alert('Login attempts reset successfully');
    } catch (error: any) {
      console.error('Failed to reset attempts:', error);
      alert(error.response?.data?.error || 'Failed to reset login attempts');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const isLocked = user.locked_until && new Date(user.locked_until) > new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Users
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Edit User Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Account Information */}
            <div>
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                Account Information
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="person_id" className="block text-sm font-medium text-gray-700">
                    Person ID {user.person && `(${user.person.first_name} ${user.person.last_name})`}
                  </label>
                  <input
                    type="number"
                    id="person_id"
                    value={formData.person_id || ''}
                    onChange={(e) => setFormData({ ...formData, person_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Optional - Link to employee record"
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Shield className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                Security
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label htmlFor="active" className="block text-sm font-medium text-gray-700">
                    Account Status
                  </label>
                  <select
                    id="active"
                    value={formData.active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Status Info */}
            <div>
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Clock className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                Account Status
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Login:</span>
                  <span className="text-sm font-medium">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed Login Attempts:</span>
                  <span className="text-sm font-medium">{user.failed_login_attempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">{new Date(user.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm font-medium">{new Date(user.updated_at).toLocaleString()}</span>
                </div>
                
                {isLocked && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Account Locked</p>
                        <p className="text-xs text-red-600">
                          Locked until: {new Date(user.locked_until!).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlock}
                        className="ml-4 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                      >
                        Unlock
                      </button>
                    </div>
                  </div>
                )}
                
                {user.failed_login_attempts > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResetAttempts}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Reset Failed Login Attempts
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserNew;