import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  ArrowLeft, Save, Plus, Edit2, Trash2, Users, Calendar, 
  BarChart3, Folder, Package, CheckSquare, MessageSquare,
  ChevronRight, DollarSign
} from 'lucide-react';

interface Project {
  id?: number;
  name: string;
  code: string;
  description: string;
  project_type: string;
  status: string;
  priority: string;
  department_id?: string;
  department?: any;
  start_date?: string;
  end_date?: string;
  budget: number;
  progress: number;
  components?: Component[];
  members?: any[];
  departments?: any[];
}

interface Component {
  id?: number;
  project_id?: number;
  name: string;
  code: string;
  description: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  tasks?: Task[];
}

interface Task {
  id?: number;
  component_id?: number;
  title: string;
  description: string;
  task_type: string;
  status: string;
  priority: string;
  assigned_to?: number;
  assignee?: any;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [project, setProject] = useState<Project>({
    name: '',
    code: '',
    description: '',
    project_type: 'software',
    status: 'planning',
    priority: 'medium',
    budget: 0,
    progress: 0,
    components: []
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
    if (!isNew) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch project:', err);
      navigate('/projects');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/entities/?type=department');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        const response = await api.post('/projects/', project);
        navigate(`/projects/${response.data.id}`);
      } else {
        await api.put(`/projects/${id}`, project);
        fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const addComponent = () => {
    const newComponent: Component = {
      name: '',
      code: '',
      description: '',
      status: 'planning',
      progress: 0,
      tasks: []
    };
    setProject({ ...project, components: [...(project.components || []), newComponent] });
    setSelectedComponent(newComponent);
  };

  const updateComponent = (index: number, component: Component) => {
    const components = [...(project.components || [])];
    components[index] = component;
    setProject({ ...project, components });
  };

  const deleteComponent = (index: number) => {
    const components = [...(project.components || [])];
    components.splice(index, 1);
    setProject({ ...project, components });
    setSelectedComponent(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">
            {isNew ? 'New Project' : project.name}
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'components'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Components & Tasks
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Team
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Code *
                </label>
                <input
                  type="text"
                  value={project.code}
                  onChange={(e) => setProject({ ...project, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!isNew}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type
                </label>
                <select
                  value={project.project_type}
                  onChange={(e) => setProject({ ...project, project_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="research">Research</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={project.status}
                  onChange={(e) => setProject({ ...project, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={project.priority}
                  onChange={(e) => setProject({ ...project, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={project.department_id || ''}
                  onChange={(e) => setProject({ ...project, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={project.start_date || ''}
                  onChange={(e) => setProject({ ...project, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={project.end_date || ''}
                  onChange={(e) => setProject({ ...project, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  value={project.budget}
                  onChange={(e) => setProject({ ...project, budget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={project.progress}
                  onChange={(e) => setProject({ ...project, progress: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Components List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Components</h2>
              <button
                onClick={addComponent}
                className="text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {project.components?.map((component, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedComponent(component)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedComponent === component
                      ? 'bg-blue-50 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{component.name || 'New Component'}</h3>
                      <p className="text-sm text-gray-500">{component.code}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(component.status)}`}>
                      {component.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${component.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component Details */}
          {selectedComponent && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Component Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedComponent.name}
                      onChange={(e) => {
                        const updated = { ...selectedComponent, name: e.target.value };
                        setSelectedComponent(updated);
                        const index = project.components?.indexOf(selectedComponent) || 0;
                        updateComponent(index, updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={selectedComponent.code}
                      onChange={(e) => {
                        const updated = { ...selectedComponent, code: e.target.value };
                        setSelectedComponent(updated);
                        const index = project.components?.indexOf(selectedComponent) || 0;
                        updateComponent(index, updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedComponent.description}
                      onChange={(e) => {
                        const updated = { ...selectedComponent, description: e.target.value };
                        setSelectedComponent(updated);
                        const index = project.components?.indexOf(selectedComponent) || 0;
                        updateComponent(index, updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Tasks</h3>
                  <button className="text-blue-600 hover:text-blue-800">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedComponent.tasks?.map((task, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-500">{task.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!selectedComponent.tasks || selectedComponent.tasks.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No tasks yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>
          <p className="text-gray-500">Team management coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;