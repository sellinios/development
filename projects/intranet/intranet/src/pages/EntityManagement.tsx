import React, { useState, useEffect } from 'react';
import { Plus, Building2, Users, Briefcase, FolderTree, ChevronRight, ChevronDown, Edit, Trash2, UserPlus } from 'lucide-react';
import api from '../lib/api';
import { Entity, UserEntity } from '../types';

const EntityManagement: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'company' as Entity['type'],
    description: '',
    parent_id: ''
  });

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Log the actual request being made
      console.log('Loading entities from:', '/entities/tree', 'Build:', Date.now());
      
      // Use the api instance directly to ensure proper baseURL
      const response = await api.get('entities/tree');
      setEntities(response.data);
      
      // Expand all entities by default
      const allIds = new Set<string>();
      const collectIds = (entities: Entity[]) => {
        entities.forEach(entity => {
          allIds.add(String(entity.id));
          if (entity.children) collectIds(entity.children);
        });
      };
      collectIds(response.data);
      setExpandedEntities(allIds);
    } catch (error: any) {
      console.error('Failed to load entities:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    
    try {
      const data = {
        ...formData,
        parent_id: formData.parent_id || undefined
      };
      await api.post('entities', data);
      setShowCreateModal(false);
      setFormData({
        name: '',
        code: '',
        type: 'company',
        description: '',
        parent_id: ''
      });
      loadEntities();
    } catch (error: any) {
      console.error('Failed to create entity:', error);
      setFormError(error.response?.data?.error || error.message || 'Failed to create entity');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;
    
    setFormError(null);
    setFormLoading(true);
    
    try {
      const data = {
        ...formData,
        parent_id: formData.parent_id || undefined
      };
      await api.put(`entities/${selectedEntity.id}`, data);
      setShowEditModal(false);
      loadEntities();
    } catch (error: any) {
      console.error('Failed to update entity:', error);
      setFormError(error.response?.data?.error || error.message || 'Failed to update entity');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEntity = async (entity: Entity) => {
    if (!confirm(`Are you sure you want to delete "${entity.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`entities/${entity.id}`);
      loadEntities();
      if (selectedEntity?.id === entity.id) {
        setSelectedEntity(null);
      }
    } catch (error: any) {
      console.error('Failed to delete entity:', error);
      alert(error.response?.data?.error || error.message || 'Failed to delete entity');
    }
  };

  const toggleExpanded = (entityId: number | string) => {
    const idStr = String(entityId);
    const newExpanded = new Set(expandedEntities);
    if (newExpanded.has(idStr)) {
      newExpanded.delete(idStr);
    } else {
      newExpanded.add(idStr);
    }
    setExpandedEntities(newExpanded);
  };

  const openEditModal = (entity: Entity) => {
    setSelectedEntity(entity);
    setFormData({
      name: entity.name,
      code: entity.code,
      type: entity.type,
      description: entity.description || '',
      parent_id: entity.parent_id ? String(entity.parent_id) : ''
    });
    setShowEditModal(true);
  };

  const getEntityIcon = (type: Entity['type']) => {
    switch (type) {
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'division':
        return <Briefcase className="w-4 h-4" />;
      case 'department':
        return <FolderTree className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      default:
        return <FolderTree className="w-4 h-4" />;
    }
  };

  const getAllEntitiesFlat = (entities: Entity[]): Entity[] => {
    const result: Entity[] = [];
    const addEntity = (entity: Entity) => {
      result.push(entity);
      if (entity.children) {
        entity.children.forEach(addEntity);
      }
    };
    entities.forEach(addEntity);
    return result;
  };

  const renderEntityTree = (entities: Entity[], level = 0): React.ReactElement[] => {
    return entities.map(entity => {
      const hasChildren = entity.children && entity.children.length > 0;
      const isExpanded = expandedEntities.has(String(entity.id));
      
      return (
        <div key={entity.id}>
          <div 
            className={`flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
              selectedEntity?.id === entity.id ? 'bg-blue-50 border-2 border-blue-500' : ''
            }`}
            style={{ marginLeft: `${level * (window.innerWidth < 640 ? 12 : 24)}px` }}
            onClick={() => setSelectedEntity(entity)}
          >
            <div className="flex items-center flex-1 w-full">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(entity.id);
                  }}
                  className="mr-1 flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-5 flex-shrink-0" />}
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getEntityIcon(entity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{entity.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {entity.code} • {entity.type}
                    {!entity.active && ' • Inactive'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-6 sm:ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(entity);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEntity(entity);
                }}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderEntityTree(entity.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Organizations Administration</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
          Create Organization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Entity Tree */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Organization Hierarchy</h2>
          {entities.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No organizations found.</p>
              <p className="text-sm text-gray-400">Create your first organization to get started.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {renderEntityTree(entities)}
            </div>
          )}
        </div>

        {/* Entity Details */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Organization Details</h2>
          {selectedEntity ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {getEntityIcon(selectedEntity.type)}
                <h3 className="text-xl font-semibold">{selectedEntity.name}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Code</label>
                  <p className="mt-1 font-mono text-sm">{selectedEntity.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 capitalize">{selectedEntity.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedEntity.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEntity.active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm">{new Date(selectedEntity.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-600">{selectedEntity.description || 'No description provided'}</p>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => openEditModal(selectedEntity)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Organization
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select an organization to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Entity Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {showEditModal ? 'Edit Organization' : 'Create New Organization'}
            </h3>
            
            {formError && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{formError}</span>
              </div>
            )}
            
            <form onSubmit={showEditModal ? handleUpdateEntity : handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Entity['type'] })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={formLoading}
                >
                  <option value="company">Company</option>
                  <option value="division">Division</option>
                  <option value="department">Department</option>
                  <option value="team">Team</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Aethra Tech, IT Department"
                  disabled={formLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., EPS, IT, SALES"
                  disabled={formLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Organization
                  {formData.type === 'company' && ' (Leave empty for top-level company)'}
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={formLoading}
                >
                  <option value="">None (Top Level)</option>
                  {getAllEntitiesFlat(entities)
                    .filter(e => showEditModal ? e.id !== selectedEntity?.id : true)
                    .map(entity => (
                      <option key={entity.id} value={String(entity.id)}>
                        {entity.name} ({entity.type})
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of this organization..."
                  disabled={formLoading}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={formLoading}
                >
                  {formLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {showEditModal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityManagement;