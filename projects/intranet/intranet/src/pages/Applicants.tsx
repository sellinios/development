import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, UserCheck } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';

interface Applicant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  nationality: string;
  current_rank: string;
  position_applying: string;
  preferred_ship_type: string;
  address: string;
  telephone: string;
  date_of_birth: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const Applicants: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'name', label: 'Name/Email', visible: true, required: true },
    { key: 'position_applying', label: 'Position Applied', visible: true },
    { key: 'current_rank', label: 'Current Rank', visible: true },
    { key: 'nationality', label: 'Nationality', visible: true },
    { key: 'preferred_ship_type', label: 'Preferred Ship Type', visible: false },
    { key: 'telephone', label: 'Telephone', visible: false },
    { key: 'date_of_birth', label: 'Date of Birth', visible: false },
    { key: 'address', label: 'Address', visible: false },
    { key: 'created_at', label: 'Applied Date', visible: true },
    { key: 'updated_at', label: 'Last Updated', visible: false },
    { key: 'status', label: 'Status', visible: true },
  ]);

  useEffect(() => {
    fetchApplicants();
  }, [searchTerm, statusFilter]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      console.log('Fetching applicants with URL:', `applicants/?${params.toString()}`);
      const response = await api.get(`applicants/?${params.toString()}`);
      console.log('Applicants response:', response.data);
      setApplicants(response.data);
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setNotes(applicant.notes || '');
    setStatus(applicant.status);
    setShowModal(true);
    setEditingNotes(false);
  };

  const handleUpdateApplicant = async () => {
    if (!selectedApplicant) return;
    
    try {
      const response = await api.put(`applicants/${selectedApplicant.id}`, {
        status: status,
        notes: notes
      });
      
      // Update the applicant in the list
      setApplicants(applicants.map(a => 
        a.id === selectedApplicant.id ? response.data : a
      ));
      
      setShowModal(false);
      setSelectedApplicant(null);
    } catch (error) {
      console.error('Failed to update applicant:', error);
    }
  };

  const handleDeleteApplicant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this applicant?')) return;
    
    try {
      await api.delete(`applicants/${id}`);
      setApplicants(applicants.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete applicant:', error);
      alert('Failed to delete applicant. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCell = (applicant: Applicant, column: Column) => {
    switch (column.key) {
      case 'name':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {applicant.first_name} {applicant.last_name}
            </div>
            <div className="text-sm text-gray-500">{applicant.email}</div>
          </div>
        );
      case 'position_applying':
        return <div className="text-sm text-gray-900">{applicant.position_applying}</div>;
      case 'current_rank':
        return <div className="text-sm text-gray-900">{applicant.current_rank}</div>;
      case 'nationality':
        return <div className="text-sm text-gray-900">{applicant.nationality}</div>;
      case 'preferred_ship_type':
        return <div className="text-sm text-gray-900">{applicant.preferred_ship_type}</div>;
      case 'telephone':
        return <div className="text-sm text-gray-900">{applicant.telephone}</div>;
      case 'date_of_birth':
        return (
          <div className="text-sm text-gray-900">
            {format(new Date(applicant.date_of_birth), 'MMM dd, yyyy')}
          </div>
        );
      case 'address':
        return <div className="text-sm text-gray-900">{applicant.address}</div>;
      case 'created_at':
        return (
          <div className="text-sm text-gray-900">
            {format(new Date(applicant.created_at), 'MMM dd, yyyy')}
          </div>
        );
      case 'updated_at':
        return (
          <div className="text-sm text-gray-900">
            {format(new Date(applicant.updated_at), 'MMM dd, yyyy')}
          </div>
        );
      case 'status':
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(applicant.status)}`}>
            {applicant.status}
          </span>
        );
      default:
        return null;
    }
  };

  const renderActions = (applicant: Applicant) => {
    return (
      <div className="flex space-x-2 justify-center">
        <button
          onClick={() => handleViewApplicant(applicant)}
          className="text-indigo-600 hover:text-indigo-900"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteApplicant(applicant.id)}
          className="text-red-600 hover:text-red-900"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
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
        title="Job Applicants"
        subtitle="Manage seafarer job applications"
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserCheck className="w-5 h-5" />
            <span className="font-medium">{applicants.length} applicants found</span>
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            storageKey="applicants-visible-columns"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="interviewed">Interviewed</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <DynamicTable
        data={applicants}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
      />
      
      {applicants.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No applicants found</p>
        </div>
      )}

      {/* View/Edit Modal */}
      {showModal && selectedApplicant && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Applicant Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplicant.first_name} {selectedApplicant.last_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telephone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.telephone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedApplicant.date_of_birth), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.nationality}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Rank</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.current_rank}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position Applied</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.position_applying}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Ship Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.preferred_ship_type}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.address}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <button
                    onClick={() => setEditingNotes(!editingNotes)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    {editingNotes ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                    rows={4}
                    placeholder="Add notes about this applicant..."
                  />
                ) : (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {notes || 'No notes yet'}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateApplicant}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default Applicants;