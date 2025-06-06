import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Folder, Plus, Edit2, Trash2, Users, Calendar, DollarSign, BarChart3 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  type: string;
}

interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  project_type: string;
  status: string;
  priority: string;
  department_id?: string;
  department?: Department;
  start_date?: string;
  end_date?: string;
  budget: number;
  progress: number;
  created_at: string;
  updated_at: string;
  issue_count: number;
  members?: any[];
  departments?: any[];
}

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    department: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      
      const response = await api.get(`/projects/?${params.toString()}`);
      setProjects(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setProjects([]);
      if (err.response?.status === 404) {
        setError(null); // No projects is not an error
      } else {
        setError('Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/entities/?type=department');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setDepartments([]);
    }
  };

  const handleEdit = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleCreate = () => {
    navigate('/projects/new');
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'software': return 'bg-blue-100 text-blue-800';
      case 'hardware': return 'bg-green-100 text-green-800';
      case 'infrastructure': return 'bg-gray-100 text-gray-800';
      case 'research': return 'bg-purple-100 text-purple-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="software">Software</option>
              <option value="hardware">Hardware</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="research">Research</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first project</p>
          <button
            onClick={handleCreate}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                </div>
                <span className={`text-xs font-semibold ${getPriorityColor(project.priority)}`}>
                  {project.priority.toUpperCase()}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Code:</span>
                  <span className="text-xs font-mono">{project.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(project.project_type)}`}>
                    {project.project_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                {project.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Department:</span>
                    <span className="text-xs">{project.department.name}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>{project.start_date || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  <span>${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span>{project.members?.length || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-gray-400" />
                  <span>{project.progress}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{project.issue_count} issues</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;