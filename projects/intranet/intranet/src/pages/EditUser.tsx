import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Building2, Shield, Calendar } from 'lucide-react';
import api from '../lib/api';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

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
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface Position {
  id: number;
  title: string;
}

const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  
  const [formData, setFormData] = useState({
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
    date_hired: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user data first
      try {
        const userResponse = await api.get(`users/${id}`);
        const userData = userResponse.data;
        setUser(userData);
        
        // Set form data
        setFormData({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          password: '', // Don't load password
          role: userData.role,
          entity_id: userData.entity_id || '',
          position_id: userData.position_id || 0,
          leave_balance: userData.leave_balance || 0,
          profile_picture: userData.profile_picture || '',
          phone_number: userData.phone_number || '',
          address: userData.address || '',
          active: userData.active,
          date_hired: userData.date_hired && userData.date_hired !== '0001-01-01' ? new Date(userData.date_hired).toISOString().split('T')[0] : '',
        });
      } catch (userError: any) {
        throw userError; // Re-throw to be caught by outer try-catch
      }
      
      // Load entities - use empty array if fails
      try {
        const entitiesResponse = await api.get('entities/tree');
        // Flatten the tree structure if needed
        const flatEntities: Entity[] = [];
        const flattenTree = (items: any[]) => {
          items.forEach(item => {
            flatEntities.push({ id: item.id, name: item.name, type: item.type });
            if (item.children) flattenTree(item.children);
          });
        };
        if (Array.isArray(entitiesResponse.data)) {
          flattenTree(entitiesResponse.data);
        }
        setEntities(flatEntities);
      } catch (entError) {
        console.warn('Failed to load entities:', entError);
        setEntities([]); // Continue with empty entities
      }
      
      // Load positions
      try {
        const positionsResponse = await api.get('positions/');
        setPositions(positionsResponse.data);
      } catch (posError) {
        console.warn('Failed to load positions:', posError);
        setPositions([]);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      console.error('Error details:', error.response?.data || error.message);
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
      // Prepare data for submission
      const submitData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        entity_id: formData.entity_id || undefined,
        position_id: formData.position_id || undefined,
        leave_balance: formData.leave_balance,
        profile_picture: formData.profile_picture,
        phone_number: formData.phone_number,
        address: formData.address,
        active: formData.active,
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

  if (loading) {
    return (
      <PageTemplate>
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageTemplate>
    );
  }

  if (!user) {
    return (
      <PageTemplate>
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Users
        </button>
      </div>

      <PageHeader 
        title="Edit User" 
        subtitle="Modify user account details" 
      />

      <div className="bg-white shadow rounded-lg mt-6">

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
              <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Mail className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Building2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Work Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="entity_id" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="entity_id"
                  value={formData.entity_id}
                  onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">No Department</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="position_id" className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <select
                  id="position_id"
                  value={formData.position_id}
                  onChange={(e) => setFormData({ ...formData, position_id: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="0">No Position</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date_hired" className="block text-sm font-medium text-gray-700">
                  Date Hired
                </label>
                <input
                  type="date"
                  id="date_hired"
                  value={formData.date_hired}
                  onChange={(e) => setFormData({ ...formData, date_hired: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="leave_balance" className="block text-sm font-medium text-gray-700">
                  Leave Balance (days)
                </label>
                <input
                  type="number"
                  id="leave_balance"
                  min="0"
                  step="0.5"
                  value={formData.leave_balance}
                  onChange={(e) => setFormData({ ...formData, leave_balance: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className={`w-full sm:w-auto ${TEMPLATE_STYLES.buttons.secondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full sm:w-auto ${TEMPLATE_STYLES.buttons.primary}`}
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
    </PageTemplate>
  );
};

export default EditUser;