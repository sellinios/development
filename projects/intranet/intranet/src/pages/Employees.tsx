import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon, UserPlus, UserCheck } from 'lucide-react';
import api from '../lib/api';
import { PageTemplate, PageHeader, FilterSection, TEMPLATE_STYLES } from '../components/templates';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone_number: string;
  mobile_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  profile_picture: string;
  employment?: {
    entity_id?: string;
    entity?: {
      id: string;
      name: string;
      type: string;
    };
    position_id?: number;
    position?: {
      id: number;
      title: string;
    };
    employment_type: string;
    date_hired: string;
    date_terminated?: string;
    leave_balance: number;
    is_current: boolean;
  };
  has_user_account: boolean;
  user_id?: number;
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

interface EmployeeForm {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone_number: string;
  mobile_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  profile_picture: string;
  employment?: {
    entity_id?: string;
    position_id?: number;
    employment_type: string;
    date_hired: string;
    date_terminated?: string;
    leave_balance: number;
  };
}

const Employees: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'name', label: 'Employee', visible: true, required: true },
    { key: 'contact', label: 'Contact', visible: true },
    { key: 'date_of_birth', label: 'Date of Birth', visible: false },
    { key: 'address', label: 'Address', visible: false },
    { key: 'city', label: 'City', visible: true },
    { key: 'country', label: 'Country', visible: false },
    { key: 'department', label: 'Department', visible: true },
    { key: 'position', label: 'Position', visible: true },
    { key: 'employment_type', label: 'Employment Type', visible: true },
    { key: 'date_hired', label: 'Date Hired', visible: true },
    { key: 'leave_balance', label: 'Leave Balance', visible: false },
    { key: 'emergency_contact', label: 'Emergency Contact', visible: false },
    { key: 'user_account', label: 'User Account', visible: true },
  ]);
  
  const [formData, setFormData] = useState<EmployeeForm>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    mobile_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    profile_picture: '',
    employment: {
      entity_id: '',
      position_id: 0,
      employment_type: 'full_time',
      date_hired: new Date().toISOString().split('T')[0],
      leave_balance: 0,
    },
  });

  useEffect(() => {
    loadEmployees();
    loadEntities();
    loadPositions();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('employees/');
      console.log('Loaded employees:', response.data);
      setEmployees(response.data);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    try {
      const response = await api.get('entities/');
      setEntities(response.data);
    } catch (error: any) {
      console.error('Failed to load entities:', error);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await api.get('positions/');
      setPositions(response.data);
    } catch (error: any) {
      console.error('Failed to load positions:', error);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('employees/', formData);
      setShowCreateModal(false);
      resetForm();
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      alert(error.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      await api.put(`employees/${selectedEmployee.id}/`, formData);
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      alert(error.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (employee.has_user_account) {
      alert('Cannot delete employee with active user account. Please delete the user account first.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }
    
    try {
      await api.delete(`employees/${employee.id}`);
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      alert(error.response?.data?.error || 'Failed to delete employee');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      phone_number: '',
      mobile_number: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      profile_picture: '',
      employment: {
        entity_id: '',
        position_id: 0,
        employment_type: 'full_time',
        date_hired: new Date().toISOString().split('T')[0],
        leave_balance: 0,
      },
    });
  };


  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.phone_number.includes(searchTerm) ||
                         employee.mobile_number.includes(searchTerm);
    const matchesDepartment = filterDepartment === 'all' || 
                             (employee.employment?.entity_id === filterDepartment);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && employee.employment?.is_current) ||
                         (filterStatus === 'terminated' && employee.employment?.date_terminated);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  
  console.log('Filtered employees:', filteredEmployees.length, 'out of', employees.length);

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case 'full_time':
        return 'bg-green-100 text-green-800';
      case 'part_time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-yellow-100 text-yellow-800';
      case 'intern':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEmploymentType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderCell = (employee: Employee, column: Column) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {employee.first_name} {employee.last_name}
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="text-sm text-gray-900">
            {employee.phone_number || employee.mobile_number || '-'}
          </div>
        );
      case 'date_of_birth':
        return employee.date_of_birth ? (
          <div className="text-sm text-gray-900">
            {new Date(employee.date_of_birth).toLocaleDateString()}
          </div>
        ) : <span className="text-gray-500">-</span>;
      case 'address':
        return (
          <div className="text-sm text-gray-900">
            {employee.address || '-'}
          </div>
        );
      case 'city':
        return (
          <div className="text-sm text-gray-900">
            {employee.city || '-'}
          </div>
        );
      case 'country':
        return (
          <div className="text-sm text-gray-900">
            {employee.country || '-'}
          </div>
        );
      case 'department':
        return (
          <div className="text-sm text-gray-900">
            {employee.employment?.entity?.name || '-'}
          </div>
        );
      case 'position':
        return (
          <div className="text-sm text-gray-900">
            {employee.employment?.position?.title || '-'}
          </div>
        );
      case 'employment_type':
        return employee.employment ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            getEmploymentTypeBadge(employee.employment.employment_type)
          }`}>
            {formatEmploymentType(employee.employment.employment_type)}
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        );
      case 'date_hired':
        return employee.employment ? (
          <div className="text-sm text-gray-900">
            {new Date(employee.employment.date_hired).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-gray-500">-</span>
        );
      case 'leave_balance':
        return employee.employment ? (
          <div className="text-sm text-gray-900">
            {employee.employment.leave_balance} days
          </div>
        ) : (
          <span className="text-gray-500">-</span>
        );
      case 'emergency_contact':
        return (
          <div className="text-sm text-gray-900">
            {employee.emergency_contact_name || '-'}
            {employee.emergency_contact_phone && (
              <div className="text-xs text-gray-500">{employee.emergency_contact_phone}</div>
            )}
          </div>
        );
      case 'user_account':
        return employee.has_user_account ? (
          <div className="flex items-center text-green-600">
            <UserCheck className="w-4 h-4 mr-1" />
            <span className="text-sm">Active</span>
          </div>
        ) : (
          <button
            className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
            title="Create user account for this employee"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            <span className="text-sm">Create</span>
          </button>
        );
      default:
        return null;
    }
  };

  const renderActions = (employee: Employee) => {
    return (
      <div className="flex space-x-2 justify-center">
        <button
          onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteEmployee(employee)}
          className="text-red-600 hover:text-red-900"
          disabled={employee.has_user_account}
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
        title="Employees Management"
        subtitle="Manage employee records and information"
        actions={
          <button
            onClick={() => navigate('/hr/employees/add')}
            className={TEMPLATE_STYLES.buttons.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </button>
        }
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon className="w-5 h-5" />
            <span className="font-medium">{filteredEmployees.length} employees found</span>
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            storageKey="employees-visible-columns"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="all">All Departments</option>
            {entities.map(entity => (
              <option key={entity.id} value={entity.id}>{entity.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      <DynamicTable
        data={filteredEmployees}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
      />
      
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No employees found</p>
        </div>
      )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={showCreateModal ? handleCreateEmployee : handleUpdateEmployee}>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {showCreateModal ? 'Create New Employee' : 'Edit Employee'}
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
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
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Address Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={formData.postal_code}
                            onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={formData.emergency_contact_name}
                            onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.emergency_contact_phone}
                            onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Employment Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Employment Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                          </label>
                          <select
                            value={formData.employment?.entity_id || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              employment: {...formData.employment!, entity_id: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Select Department</option>
                            {entities.map(entity => (
                              <option key={entity.id} value={entity.id}>{entity.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                          </label>
                          <select
                            value={formData.employment?.position_id || 0}
                            onChange={(e) => setFormData({
                              ...formData, 
                              employment: {...formData.employment!, position_id: parseInt(e.target.value)}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="0">Select Position</option>
                            {positions.map(position => (
                              <option key={position.id} value={position.id}>{position.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employment Type
                          </label>
                          <select
                            value={formData.employment?.employment_type || 'full_time'}
                            onChange={(e) => setFormData({
                              ...formData, 
                              employment: {...formData.employment!, employment_type: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="intern">Intern</option>
                            <option value="consultant">Consultant</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Hired
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.employment?.date_hired || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              employment: {...formData.employment!, date_hired: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        {showEditModal && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date Terminated
                            </label>
                            <input
                              type="date"
                              value={formData.employment?.date_terminated || ''}
                              onChange={(e) => setFormData({
                                ...formData, 
                                employment: {...formData.employment!, date_terminated: e.target.value}
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Leave Balance
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={formData.employment?.leave_balance || 0}
                            onChange={(e) => setFormData({
                              ...formData, 
                              employment: {...formData.employment!, leave_balance: parseFloat(e.target.value)}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
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
                      setSelectedEmployee(null);
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

export default Employees;