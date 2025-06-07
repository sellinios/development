import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../lib/api';

interface Principal {
  system_id?: number;
  principal_id?: string;
  software_id?: number;
  principal_group?: string;
  group_id?: number;
  principal_logo?: string;
  principal_name: string;
  principal_owner_ceo?: string;
  date_established?: number;
  type_of_principal?: string;
  type_of_principal_id?: number;
  principal_owned_companies?: string;
  ethnicity?: string;
  ethnicity_id?: number;
  number_of_ships?: number;
  number_of_epsilon_ships?: number;
  ship_types?: string;
  total_dwt?: number;
  total_teu?: number;
  crew_ethnicities?: string;
  address?: string;
  webpage?: string;
  telephone?: string;
  email?: string;
  greek_shipping_directory?: string;
  newbuilds_orders_count?: number;
  notes?: string;
}

interface DropdownOption {
  id: number;
  title: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Principal) => Promise<void>;
  principal?: Principal | null;
  mode: 'add' | 'edit';
}

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  principal,
  mode
}) => {
  const [formData, setFormData] = useState<Principal>({
    principal_name: '',
    principal_id: '',
    software_id: undefined,
    principal_group: '',
    principal_logo: '',
    principal_owner_ceo: '',
    date_established: new Date().getFullYear(),
    type_of_principal: '',
    principal_owned_companies: '',
    ethnicity: '',
    number_of_ships: 0,
    number_of_epsilon_ships: 0,
    ship_types: '',
    total_dwt: 0,
    total_teu: 0,
    crew_ethnicities: '',
    address: '',
    webpage: '',
    telephone: '',
    email: '',
    greek_shipping_directory: '',
    newbuilds_orders_count: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [principalGroups, setPrincipalGroups] = useState<DropdownOption[]>([]);
  const [principalTypes, setPrincipalTypes] = useState<DropdownOption[]>([]);
  const [ethnicities, setEthnicities] = useState<DropdownOption[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (principal && mode === 'edit') {
      setFormData(principal);
      if (principal.principal_logo) {
        setLogoPreview(principal.principal_logo);
      }
    } else {
      setFormData({
        principal_name: '',
        principal_id: '',
        software_id: undefined,
        principal_group: '',
        group_id: undefined,
        principal_logo: '',
        principal_owner_ceo: '',
        date_established: new Date().getFullYear(),
        type_of_principal: '',
        type_of_principal_id: undefined,
        principal_owned_companies: '',
        ethnicity: '',
        ethnicity_id: undefined,
        number_of_ships: 0,
        number_of_epsilon_ships: 0,
        ship_types: '',
        total_dwt: 0,
        total_teu: 0,
        crew_ethnicities: '',
        address: '',
        webpage: '',
        telephone: '',
        email: '',
        greek_shipping_directory: '',
        newbuilds_orders_count: 0,
        notes: ''
      });
    }
    setErrors({});
    setLogoFile(null);
    if (!principal || mode !== 'edit') {
      setLogoPreview(null);
    }
  }, [principal, mode, isOpen]);

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch principal groups
      api.get('principals/groups').then(response => {
        setPrincipalGroups(response.data);
      }).catch(error => {
        console.error('Failed to fetch principal groups:', error);
      });

      // Fetch principal types
      api.get('principals/types').then(response => {
        setPrincipalTypes(response.data);
      }).catch(error => {
        console.error('Failed to fetch principal types:', error);
      });

      // Fetch ethnicities
      api.get('principals/ethnicities').then(response => {
        setEthnicities(response.data);
        
        // Set Greek as default for new principals
        if (mode === 'add' && response.data.length > 0) {
          const greekOption = response.data.find((e: DropdownOption) => 
            e.title.toLowerCase() === 'greek' || e.title.toLowerCase() === 'greece'
          );
          if (greekOption && !formData.ethnicity_id) {
            setFormData(prev => ({ ...prev, ethnicity_id: greekOption.id }));
          }
        }
      }).catch(error => {
        console.error('Failed to fetch ethnicities:', error);
      });
    }
  }, [isOpen, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['date_established', 'software_id', 'number_of_ships', 
      'number_of_epsilon_ships', 'total_dwt', 'total_teu', 'newbuilds_orders_count',
      'group_id', 'type_of_principal_id', 'ethnicity_id'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? (value === '' ? undefined : parseInt(value)) 
        : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Please select an image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'File size must be less than 5MB' }));
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear error
      if (errors.logo) {
        setErrors(prev => ({ ...prev, logo: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.principal_name?.trim()) {
      newErrors.principal_name = 'Principal name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.webpage && !/^https?:\/\//.test(formData.webpage)) {
      formData.webpage = 'https://' + formData.webpage;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      let updatedFormData = { ...formData };
      
      // If there's a new logo file, upload it first
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        
        try {
          const response = await api.post('upload/logo', logoFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          updatedFormData.principal_logo = response.data.url;
        } catch (uploadError) {
          console.error('Failed to upload logo:', uploadError);
          setErrors({ logo: 'Failed to upload logo' });
          setLoading(false);
          return;
        }
      }
      
      await onSave(updatedFormData);
      onClose();
    } catch (error) {
      console.error('Failed to save principal:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'add' ? 'Add New Account' : 'Edit Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
              {errors.submit}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Name *
              </label>
              <input
                type="text"
                name="principal_name"
                value={formData.principal_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.principal_name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.principal_name && (
                <p className="mt-1 text-sm text-red-600">{errors.principal_name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Group
              </label>
              <select
                name="group_id"
                value={formData.group_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Group</option>
                {principalGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Software ID
              </label>
              <input
                type="number"
                name="software_id"
                value={formData.software_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner/CEO
              </label>
              <input
                type="text"
                name="principal_owner_ceo"
                value={formData.principal_owner_ceo || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Established
              </label>
              <input
                type="number"
                name="date_established"
                value={formData.date_established || ''}
                onChange={handleChange}
                min="1800"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Principal
              </label>
              <select
                name="type_of_principal_id"
                value={formData.type_of_principal_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Type</option>
                {principalTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ethnicity
              </label>
              <select
                name="ethnicity_id"
                value={formData.ethnicity_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Ethnicity</option>
                {ethnicities.map(ethnicity => (
                  <option key={ethnicity.id} value={ethnicity.id}>
                    {ethnicity.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telephone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webpage
              </label>
              <input
                type="text"
                name="webpage"
                value={formData.webpage || ''}
                onChange={handleChange}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal ID
              </label>
              <input
                type="text"
                name="principal_id"
                value={formData.principal_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <div className="space-y-2">
                {logoPreview && (
                  <div className="flex items-center space-x-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-16 w-16 object-contain border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setFormData(prev => ({ ...prev, principal_logo: '' }));
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.logo && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Owned Companies
              </label>
              <input
                type="text"
                name="principal_owned_companies"
                value={formData.principal_owned_companies || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No of Ships Total
              </label>
              <input
                type="number"
                name="number_of_ships"
                value={formData.number_of_ships || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No of Aethra Ships
              </label>
              <input
                type="number"
                name="number_of_epsilon_ships"
                value={formData.number_of_epsilon_ships || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ships' Types
              </label>
              <input
                type="text"
                name="ship_types"
                value={formData.ship_types || ''}
                onChange={handleChange}
                placeholder="Bulk, Tanker, Container..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total DWT
              </label>
              <input
                type="number"
                name="total_dwt"
                value={formData.total_dwt || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total TEU
              </label>
              <input
                type="number"
                name="total_teu"
                value={formData.total_teu || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crew Ethnicities
              </label>
              <input
                type="text"
                name="crew_ethnicities"
                value={formData.crew_ethnicities || ''}
                onChange={handleChange}
                placeholder="Greek, Filipino, Ukrainian..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Greek Shipping Directory
              </label>
              <input
                type="text"
                name="greek_shipping_directory"
                value={formData.greek_shipping_directory || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Newbuilds / Orders
              </label>
              <input
                type="number"
                name="newbuilds_orders_count"
                value={formData.newbuilds_orders_count || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Account' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;