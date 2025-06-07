import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Plus } from 'lucide-react';
import api from '../lib/api';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';
import AccountModal from '../components/AccountModal';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

interface Principal {
  system_id: number;
  principal_id: string;
  software_id: number;
  principal_group: string;
  principal_logo: string;
  principal_name: string;
  principal_owner_ceo: string;
  date_established: number;
  type_of_principal: string;
  principal_owned_companies: string;
  ethnicity: string;
  number_of_ships: number;
  number_of_epsilon_ships: number;
  ship_types: string;
  total_dwt: number;
  total_teu: number;
  crew_ethnicities: string;
  address: string;
  webpage: string;
  telephone: string;
  email: string;
  greek_shipping_directory: string;
  newbuilds_orders_count: number;
  notes: string;
}

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(null);
  
  // Define all available columns
  const allColumns: Column[] = [
    { key: 'principal_id', label: 'Principal ID', visible: true, required: true },
    { key: 'software_id', label: 'Software ID', visible: true },
    { key: 'principal_group', label: 'Principal Group', visible: true },
    { key: 'principal_logo', label: 'Principal Logo', visible: true },
    { key: 'principal_name', label: 'Principal Name', visible: true },
    { key: 'principal_owner_ceo', label: 'Principal Owner/CEO', visible: true },
    { key: 'date_established', label: 'Date Established', visible: true },
    { key: 'type_of_principal', label: 'Type of Principal', visible: true },
    { key: 'principal_owned_companies', label: 'Principal Owned Companies', visible: true },
    { key: 'ethnicity', label: 'Ethnicity', visible: true },
    { key: 'number_of_ships', label: 'No of Ships Total', visible: true },
    { key: 'number_of_epsilon_ships', label: 'No of Epsilon Ships', visible: true },
    { key: 'ship_types', label: 'Ships\' Types', visible: true },
    { key: 'total_dwt', label: 'Total DWT', visible: true },
    { key: 'total_teu', label: 'Total TEU', visible: true },
    { key: 'crew_ethnicities', label: 'Crew Ethnicity', visible: true },
    { key: 'address', label: 'Address', visible: true },
    { key: 'webpage', label: 'Webpage', visible: true },
    { key: 'telephone', label: 'Telephone', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'greek_shipping_directory', label: 'Greek Shipping Directory', visible: true },
    { key: 'newbuilds_orders_count', label: 'Newbuilds / Orders', visible: true },
    { key: 'notes', label: 'Notes', visible: true },
  ];
  
  const [visibleColumns, setVisibleColumns] = useState(allColumns);

  useEffect(() => {
    fetchPrincipals();
  }, []);

  const fetchPrincipals = async () => {
    try {
      setLoading(true);
      const response = await api.get('principals/');
      setPrincipals(response.data);
    } catch (error) {
      console.error('Failed to fetch principals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPrincipal(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEdit = (principal: Principal) => {
    setSelectedPrincipal(principal);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (principal: Principal) => {
    navigate(`/crm/accounts/${principal.system_id}`);
  };

  const handleDelete = async (principal: Principal) => {
    if (!window.confirm(`Are you sure you want to delete ${principal.principal_name}?`)) {
      return;
    }

    try {
      await api.delete(`principals/${principal.system_id}`);
      fetchPrincipals();
    } catch (error) {
      console.error('Failed to delete principal:', error);
      alert('Failed to delete account');
    }
  };

  const handleSave = async (data: Principal) => {
    try {
      if (modalMode === 'add') {
        await api.post('principals/', data);
      } else {
        await api.put(`principals/${selectedPrincipal?.system_id || 0}`, data);
      }
      fetchPrincipals();
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save principal:', error);
      throw error;
    }
  };

  const filteredPrincipals = principals.filter(principal => {
    const matchesFilter = filter === 'all' || 
      (filter === 'customers' && principal.software_id) ||
      (filter === 'prospects' && !principal.software_id);
    
    const matchesSearch = searchTerm === '' || 
      principal.principal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (principal.principal_group && principal.principal_group.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (principal.principal_id && principal.principal_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (principal.email && principal.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

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
        title="Accounts"
        subtitle="Manage customer relationships, accounts, and business opportunities"
        actions={
          <div className="flex items-center gap-4">
            <ColumnManager
              columns={visibleColumns}
              onColumnsChange={setVisibleColumns}
              storageKey="accounts-visible-columns"
            />
            <button
              onClick={handleAdd}
              className={TEMPLATE_STYLES.buttons.primary + " flex items-center"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </button>
          </div>
        }
      />

        {/* Filters and Search */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
              Filter
            </label>
            <select
              id="filter"
              name="filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Accounts</option>
              <option value="customers">Existing Customers</option>
              <option value="prospects">Prospects</option>
            </select>
          </div>
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              name="search"
              id="search"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by name, group, or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3 max-w-4xl">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Accounts
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {principals.length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Existing Customers
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {principals.filter(p => p.software_id).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Prospects
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {principals.filter(p => !p.software_id).length}
              </dd>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <DynamicTable
          columns={visibleColumns}
          data={filteredPrincipals}
          renderActions={(principal) => (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleView(principal)}
                className="text-indigo-600 hover:text-indigo-900"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEdit(principal)}
                className="text-gray-600 hover:text-gray-900"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(principal)}
                className="text-red-600 hover:text-red-900"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
          renderCell={(principal, column) => {
            switch (column.key) {
              case 'principal_id':
                return principal.principal_id || principal.system_id;
              case 'principal_logo':
                return principal.principal_logo ? (
                  <img src={principal.principal_logo} alt="Logo" className="h-8 w-8" />
                ) : '-';
              case 'principal_name':
                return principal.principal_name;
              case 'number_of_ships':
              case 'number_of_epsilon_ships':
                return principal[column.key] || 0;
              case 'total_dwt':
              case 'total_teu':
                return principal[column.key] ? principal[column.key].toLocaleString() : '-';
              case 'webpage':
                return principal.webpage ? (
                  <a href={principal.webpage} target="_blank" rel="noopener noreferrer" 
                     className="text-indigo-600 hover:text-indigo-900 underline">
                    Link
                  </a>
                ) : '-';
              case 'greek_shipping_directory':
                return principal.greek_shipping_directory ? (
                  <a href={principal.greek_shipping_directory} target="_blank" rel="noopener noreferrer" 
                     className="text-indigo-600 hover:text-indigo-900 underline">
                    Link
                  </a>
                ) : '-';
              case 'software_id':
              case 'principal_group':
              case 'principal_owner_ceo':
              case 'date_established':
              case 'type_of_principal':
              case 'principal_owned_companies':
              case 'ethnicity':
              case 'ship_types':
              case 'crew_ethnicities':
              case 'address':
              case 'telephone':
              case 'email':
              case 'newbuilds_orders_count':
              case 'notes':
                return principal[column.key] || '-';
              default:
                return principal[column.key] || '-';
            }
          }}
        />

        {filteredPrincipals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No accounts found matching your criteria.</p>
          </div>
        )}
        
        {/* Account Modal */}
        <AccountModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          principal={selectedPrincipal}
          mode={modalMode}
        />
    </PageTemplate>
  );
};

export default Accounts;