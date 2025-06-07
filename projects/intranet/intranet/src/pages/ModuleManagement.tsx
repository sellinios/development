import React, { useState, useEffect } from 'react';
import { Database, Users, Package, HeadphonesIcon, Globe, AlertCircle } from 'lucide-react';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';
import api from '../lib/api';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  enabled: boolean;
  order: number;
}

const ModuleManagement: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Icon mapping
  const iconMap: { [key: string]: React.FC<any> } = {
    Database,
    Users,
    Package,
    HeadphonesIcon,
    Globe,
  };

  // Default modules configuration
  const defaultModules: Module[] = [
    {
      id: 'crm',
      name: 'CRM',
      description: 'Manage customer relationships, accounts, ships, and more',
      icon: 'Database',
      path: '/crm',
      enabled: true,
      order: 1,
    },
    {
      id: 'hr',
      name: 'HR Management',
      description: 'Employee management, leave tracking, and organizational structure',
      icon: 'Users',
      path: '/hr',
      enabled: true,
      order: 2,
    },
    {
      id: 'assets',
      name: 'Assets',
      description: 'Track and manage company assets, equipment, and resources',
      icon: 'Package',
      path: '/assets',
      enabled: true,
      order: 3,
    },
    {
      id: 'support',
      name: 'Support & R&D',
      description: 'Technical support, R&D projects, and issue tracking',
      icon: 'HeadphonesIcon',
      path: '/support',
      enabled: true,
      order: 4,
    },
    {
      id: 'websites',
      name: 'Website Management',
      description: 'Manage websites, content, news, and social media',
      icon: 'Globe',
      path: '/websites',
      enabled: true,
      order: 5,
    },
  ];

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/modules');
      
      // If no modules are configured yet, use defaults
      if (!response.data || response.data.length === 0) {
        setModules(defaultModules);
      } else {
        setModules(response.data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      // Use default modules if API fails
      setModules(defaultModules);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, enabled: !module.enabled }
        : module
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      await api.post('/modules', { modules });
      
      setSuccessMessage('Module settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving modules:', error);
      setError(error.response?.data?.error || 'Failed to save module settings');
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

  return (
    <PageTemplate>
      <PageHeader 
        title="Module Management"
        subtitle="Enable or disable main system modules"
      />

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modules List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {modules.map((module) => {
            const Icon = iconMap[module.icon] || Database;
            return (
              <li key={module.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                      module.enabled ? 'bg-indigo-100' : 'bg-gray-100'
                    } flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${
                        module.enabled ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {module.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {module.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        module.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className="sr-only">Toggle module</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          module.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`${TEMPLATE_STYLES.buttons.primary} ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Info Note */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Disabled modules will not appear on the home page for any users, regardless of their permissions.
            </p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ModuleManagement;