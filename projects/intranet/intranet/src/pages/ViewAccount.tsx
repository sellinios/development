import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Building2, Globe, Phone, Mail, Calendar, Users, Ship } from 'lucide-react';
import api from '../lib/api';
import { PageTemplate, PageHeader } from '../components/templates';

interface Principal {
  system_id: number;
  principal_id: string;
  software_id: string;
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

const ViewAccount: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrincipal();
  }, [id]);

  const fetchPrincipal = async () => {
    try {
      setLoading(true);
      const response = await api.get(`principals/${id}`);
      setPrincipal(response.data);
    } catch (error) {
      console.error('Failed to fetch principal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!principal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Account not found</p>
          <Link to="/crm/accounts" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to Accounts
          </Link>
        </div>
      </div>
    );
  }

  const accountSubtitle = principal.type_of_principal 
    ? `${principal.type_of_principal} • ${principal.principal_id || 'No ID'}`
    : `Account ID: ${principal.principal_id || 'No ID'}`;

  return (
    <PageTemplate>
      <PageHeader 
        title={principal.principal_name}
        subtitle={accountSubtitle}
        actions={
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/crm/accounts')}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <Link
              to={`/crm/accounts/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </div>
        }
      >
        {principal.software_id && (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Customer
          </span>
        )}
      </PageHeader>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">General Information</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Principal ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.principal_id || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Software ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.software_id || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Group</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.principal_group || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Owner/CEO</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.principal_owner_ceo || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.type_of_principal || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Established</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {principal.date_established ? (
                        <span className="inline-flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {principal.date_established}
                        </span>
                      ) : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ethnicity</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.ethnicity || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Greek Shipping Directory</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.greek_shipping_directory || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Fleet Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Fleet Information</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Ships</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className="inline-flex items-center">
                        <Ship className="h-4 w-4 mr-1 text-gray-400" />
                        {principal.number_of_ships || 0}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Epsilon Ships</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.number_of_epsilon_ships || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ship Types</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.ship_types || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total DWT</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {principal.total_dwt ? principal.total_dwt.toLocaleString() : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total TEU</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {principal.total_teu ? principal.total_teu.toLocaleString() : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Newbuilds/Orders</dt>
                    <dd className="mt-1 text-sm text-gray-900">{principal.newbuilds_orders_count || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Crew Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Crew Information</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Crew Ethnicities</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {principal.crew_ethnicities ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {principal.crew_ethnicities.split(',').map((ethnicity, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {ethnicity.trim()}
                            </span>
                          ))}
                        </div>
                      ) : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Notes */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                {principal.address && (
                  <div className="flex items-start">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{principal.address}</p>
                    </div>
                  </div>
                )}
                
                {principal.telephone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <a href={`tel:${principal.telephone}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {principal.telephone}
                      </a>
                    </div>
                  </div>
                )}
                
                {principal.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <a href={`mailto:${principal.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {principal.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {principal.webpage && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <a 
                        href={principal.webpage.startsWith('http') ? principal.webpage : `https://${principal.webpage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {principal.webpage}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {principal.notes && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Notes</h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{principal.notes}</p>
                </div>
              </div>
            )}

            {/* Additional Companies */}
            {principal.principal_owned_companies && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Owned Companies</h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{principal.principal_owned_companies}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ViewAccount;