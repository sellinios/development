import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Edit, Trash2, FileText, Share2, Image, Settings } from 'lucide-react';
import api from '../lib/api';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';

interface Website {
  id: number;
  name: string;
  domain: string;
  description: string;
  logo_url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const WebsiteManagement: React.FC = () => {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    logo_url: ''
  });
  const [operationLoading, setOperationLoading] = useState<number | null>(null);
  const [cachedWebsites, setCachedWebsites] = useState<Website[] | null>(null);

  useEffect(() => {
    // Use cached data if available while fetching fresh data
    if (cachedWebsites) {
      setWebsites(cachedWebsites);
      setLoading(false);
    }
    fetchWebsites();
  }, []);

  const fetchWebsites = useCallback(async () => {
    try {
      if (!cachedWebsites) {
        setLoading(true);
      }
      const response = await api.get('/websites/');
      const websiteData = response.data || [];
      setWebsites(websiteData);
      setCachedWebsites(websiteData);
    } catch (error) {
      console.error('Failed to fetch websites:', error);
      if (!cachedWebsites) {
        alert('Failed to load websites. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  }, [cachedWebsites]);

  const handleCreateEdit = (website?: Website) => {
    if (website) {
      setEditingWebsite(website);
      setFormData({
        name: website.name,
        domain: website.domain,
        description: website.description,
        logo_url: website.logo_url
      });
    } else {
      setEditingWebsite(null);
      setFormData({
        name: '',
        domain: '',
        description: '',
        logo_url: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWebsite) {
        await api.put(`/websites/${editingWebsite.id}/`, formData);
      } else {
        await api.post('/websites/', formData);
      }
      fetchWebsites();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save website:', error);
      alert('Failed to save website');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this website? All associated content will be deleted.')) return;
    
    try {
      await api.delete(`/websites/${id}/`);
      fetchWebsites();
    } catch (error) {
      console.error('Failed to delete website:', error);
      alert('Failed to delete website');
    }
  };

  const handleToggleActive = async (website: Website) => {
    try {
      setOperationLoading(website.id);
      await api.put(`/websites/${website.id}/`, {
        active: !website.active
      });
      // Optimistic update
      setWebsites(prev => prev.map(w => 
        w.id === website.id ? { ...w, active: !w.active } : w
      ));
      setCachedWebsites(prev => prev ? prev.map(w => 
        w.id === website.id ? { ...w, active: !w.active } : w
      ) : null);
    } catch (error) {
      console.error('Failed to update website status:', error);
      // Revert on error
      fetchWebsites();
    } finally {
      setOperationLoading(null);
    }
  };

  // Memoize sorted websites
  const sortedWebsites = useMemo(() => {
    return [...websites].sort((a, b) => {
      // Sort by active status first, then by name
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [websites]);

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
    <PageTemplate maxWidth="wide">
      <PageHeader 
        title="Website Management"
        subtitle="Manage websites, content, and social media"
        actions={
          <button
            onClick={() => handleCreateEdit()}
            className={TEMPLATE_STYLES.buttons.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </button>
        }
      />

      {/* Websites Grid */}
      <div className={TEMPLATE_STYLES.grids.threeColumn}>
          {sortedWebsites.map((website) => (
            <div key={website.id} className={`${TEMPLATE_STYLES.cards.base} hover:shadow-lg transition-shadow`}>
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {website.logo_url ? (
                      <img 
                        src={website.logo_url} 
                        alt={website.name} 
                        className="w-12 h-12 object-contain" 
                        loading="lazy"
                      />
                    ) : (
                      <Globe className="w-12 h-12 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
                      <a href={website.domain} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:underline">
                        {website.domain}
                      </a>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    website.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {website.active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {website.description || 'No description available'}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => navigate(`/websites/${website.id}/articles`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Articles</span>
                  </button>
                  <button
                    onClick={() => navigate(`/websites/${website.id}/social`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Social</span>
                  </button>
                  <button
                    onClick={() => navigate(`/websites/${website.id}/media`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100"
                  >
                    <Image className="w-4 h-4" />
                    <span>Media</span>
                  </button>
                  <button
                    onClick={() => navigate(`/websites/${website.id}/settings`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreateEdit(website)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Edit Website"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(website.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Website"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleToggleActive(website)}
                    disabled={operationLoading === website.id}
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      operationLoading === website.id
                        ? 'opacity-50 cursor-not-allowed'
                        : website.active 
                          ? 'text-gray-600 hover:bg-gray-100' 
                          : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {operationLoading === website.id ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      website.active ? 'Deactivate' : 'Activate'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      {websites.length === 0 && (
        <div className={TEMPLATE_STYLES.states.empty}>
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className={`${TEMPLATE_STYLES.typography.sectionTitle} mb-2`}>No websites yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first website</p>
          <button
            onClick={() => handleCreateEdit()}
            className={TEMPLATE_STYLES.buttons.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={TEMPLATE_STYLES.modals.overlay}>
          <div className={TEMPLATE_STYLES.modals.backdrop} onClick={() => setShowModal(false)} />
          <div className={TEMPLATE_STYLES.modals.container}>
            <div className={TEMPLATE_STYLES.modals.content}>
              <h2 className="text-xl font-bold mb-4">
                {editingWebsite ? 'Edit Website' : 'Add New Website'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className={TEMPLATE_STYLES.typography.label}>
                      Website Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={TEMPLATE_STYLES.forms.input}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain
                    </label>
                    <input
                      type="url"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={TEMPLATE_STYLES.buttons.secondary}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={TEMPLATE_STYLES.buttons.primary}
                  >
                    {editingWebsite ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default WebsiteManagement;