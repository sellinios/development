import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Shield, Key, UserPlus } from 'lucide-react';
import api from '../lib/api';

interface UserFormNew {
  username: string;
  email: string;
  password: string;
  person_id?: number;
  role: string;
  active: boolean;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

const AddUserNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const employeeId = searchParams.get('employee_id');
  
  const [formData, setFormData] = useState<UserFormNew>({
    username: '',
    email: '',
    password: '',
    person_id: employeeId ? parseInt(employeeId) : undefined,
    role: 'employee',
    active: true,
  });

  useEffect(() => {
    if (employeeId) {
      fetchEmployee(parseInt(employeeId));
    }
  }, [employeeId]);

  const fetchEmployee = async (id: number) => {
    try {
      const response = await api.get(`employees/${id}/`);
      setEmployee(response.data);
      // Pre-fill form with employee data
      setFormData(prev => ({
        ...prev,
        person_id: id,
        username: `${response.data.first_name.toLowerCase()}.${response.data.last_name.toLowerCase()}`,
        email: response.data.email || ''
      }));
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    }
  };

  // Log to debug
  console.log('AddUserNew: Form data initialized:', formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        person_id: formData.person_id || null,
      };
      
      console.log('Creating user with payload:', payload);
      
      const response = await api.post('users/', payload);
      console.log('User created successfully:', response.data);
      navigate('/users');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to create user. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

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
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Create New User</h1>
          </div>

          <form key="add-new-user-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Employee Info Alert */}
            {employee && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <UserPlus className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Creating user account for employee
                    </h4>
                    <p className="text-sm text-blue-700">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      This user account will be linked to the employee record.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Information */}
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-400" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    required
                    autoComplete="off"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    autoComplete="new-email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-gray-400" />
                Security
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                  <p className="mt-1 text-xs text-gray-500">Password is required for new users</p>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employee Link */}
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-gray-400" />
                Employee Link
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="person_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Person ID (Optional)
                  </label>
                  <input
                    type="number"
                    id="person_id"
                    value={formData.person_id || ''}
                    onChange={(e) => setFormData({...formData, person_id: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter person ID to link with employee record"
                  />
                  <p className="mt-1 text-xs text-gray-500">Link this user account to an existing employee record</p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-gray-400" />
                Account Status
              </h3>
              <div className="space-y-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.active ? 'Active' : 'Inactive'}
                  </span>
                </label>
                <p className="text-xs text-gray-500">
                  Active users can log in to the system
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserNew;