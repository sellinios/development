import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit, Trash2, Eye, Search, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';
import { PageTemplate, PageHeader, TEMPLATE_STYLES } from '../components/templates';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';

interface Article {
  id: number;
  website_id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  author_id: number;
  author?: {
    id: number;
    username: string;
    email: string;
  };
  category: string;
  status: string;
  published_at: string | null;
  event_date: string | null;
  event_location: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  views: number;
  created_at: string;
  updated_at: string;
}

interface Website {
  id: number;
  name: string;
  domain: string;
}

const CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'event', label: 'Event' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'blog', label: 'Blog Post' },
  { value: 'press', label: 'Press Release' }
];

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'Archived', color: 'bg-red-100 text-red-800' }
];

const ArticleManagement: React.FC = () => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<Website | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [loadingArticles, setLoadingArticles] = useState(false);
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'title', label: 'Title/Slug', visible: true, required: true },
    { key: 'category', label: 'Category', visible: true },
    { key: 'author', label: 'Author', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'published_at', label: 'Published', visible: true },
    { key: 'views', label: 'Views', visible: true },
    { key: 'tags', label: 'Tags', visible: false },
    { key: 'summary', label: 'Summary', visible: false },
    { key: 'created_at', label: 'Created', visible: false },
    { key: 'updated_at', label: 'Last Updated', visible: false },
    { key: 'event_date', label: 'Event Date', visible: false },
    { key: 'event_location', label: 'Event Location', visible: false },
  ]);

  const fetchWebsite = async () => {
    try {
      const response = await api.get(`/websites/${websiteId}`);
      setWebsite(response.data);
    } catch (error) {
      console.error('Failed to fetch website:', error);
      navigate('/websites');
    }
  };

  const fetchArticles = useCallback(async () => {
    try {
      setLoadingArticles(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await api.get(`/websites/${websiteId}/articles?${params.toString()}`);
      setArticles(response.data.articles || []);
      setTotalArticles(response.data.total || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setArticles([]);
      setTotalArticles(0);
    } finally {
      setLoadingArticles(false);
      setLoading(false);
    }
  }, [websiteId, debouncedSearchTerm, statusFilter, categoryFilter, currentPage]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (websiteId) {
      fetchWebsite();
    }
  }, [websiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (websiteId) {
      fetchArticles();
    }
  }, [websiteId, debouncedSearchTerm, statusFilter, categoryFilter, currentPage, fetchArticles]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await api.delete(`/articles/${id}`);
      fetchArticles();
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Failed to delete article');
    }
  };



  // Memoize pagination info
  const totalPages = useMemo(() => Math.ceil(totalArticles / 20), [totalArticles]);

  const renderCell = (article: Article, column: Column) => {
    switch (column.key) {
      case 'title':
        return (
          <div className="flex items-center">
            {article.featured_image && (
              <img 
                src={article.featured_image} 
                alt="" 
                className="w-10 h-10 object-cover rounded mr-3"
                loading="lazy"
              />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">
                {article.title}
              </div>
              <div className="text-sm text-gray-500">
                {article.slug}
              </div>
            </div>
          </div>
        );
      case 'category':
        return (
          <span className="text-sm text-gray-900">
            {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
          </span>
        );
      case 'author':
        return (
          <div className="text-sm text-gray-900">
            {article.author?.username || 'Unknown'}
          </div>
        );
      case 'status': {
        const statusConfig = STATUSES.find(s => s.value === article.status);
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
            {statusConfig?.label || article.status}
          </span>
        );
      }
      case 'published_at':
        return (
          <div className="text-sm text-gray-900">
            {article.published_at ? format(new Date(article.published_at), 'MMM dd, yyyy') : '-'}
          </div>
        );
      case 'views':
        return <div className="text-sm text-gray-900">{article.views.toLocaleString()}</div>;
      case 'tags':
        return (
          <div className="text-sm text-gray-900">
            {article.tags?.join(', ') || '-'}
          </div>
        );
      case 'summary':
        return (
          <div className="text-sm text-gray-900 max-w-xs truncate">
            {article.summary || '-'}
          </div>
        );
      case 'created_at':
        return (
          <div className="text-sm text-gray-900">
            {format(new Date(article.created_at), 'MMM dd, yyyy')}
          </div>
        );
      case 'updated_at':
        return (
          <div className="text-sm text-gray-900">
            {format(new Date(article.updated_at), 'MMM dd, yyyy')}
          </div>
        );
      case 'event_date':
        return (
          <div className="text-sm text-gray-900">
            {article.event_date ? format(new Date(article.event_date), 'MMM dd, yyyy') : '-'}
          </div>
        );
      case 'event_location':
        return (
          <div className="text-sm text-gray-900">
            {article.event_location || '-'}
          </div>
        );
      default:
        return null;
    }
  };

  const renderActions = (article: Article) => {
    return (
      <div className="flex space-x-2 justify-center">
        <button
          onClick={() => window.open(`${website?.domain}/articles/${article.slug}`, '_blank')}
          className="text-gray-600 hover:text-gray-900"
          title="View Live"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate(`/websites/${websiteId}/articles/${article.id}/edit`)}
          className="text-indigo-600 hover:text-indigo-900"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(article.id)}
          className="text-red-600 hover:text-red-900"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };


  if (!website && loading) {
    return (
      <PageTemplate variant="tight">
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageTemplate>
    );
  }

  if (!website) {
    return null;
  }

  return (
    <PageTemplate variant="tight">
      <div className="mb-4">
        <button
          onClick={() => navigate('/websites')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Websites
        </button>
      </div>
      
      <PageHeader 
        title={`${website.name} - Articles`}
        subtitle={`Manage news, events, and content for ${website.domain}`}
        actions={
          <button
            onClick={() => navigate(`/websites/${websiteId}/articles/new`)}
            className={TEMPLATE_STYLES.buttons.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </button>
        }
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-5 h-5" />
            <span className="font-medium">{totalArticles} articles</span>
          </div>
          <ColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            storageKey={`articles-${websiteId}-visible-columns`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={TEMPLATE_STYLES.forms.select}
          >
            <option value="">All Status</option>
            {STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && !loadingArticles ? (
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <DynamicTable
            data={articles}
            columns={columns}
            renderCell={renderCell}
            renderActions={renderActions}
          />
          
          {articles.length === 0 && !loadingArticles && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first article</p>
              <button
                onClick={() => navigate(`/websites/${websiteId}/articles/new`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                New Article
              </button>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loadingArticles}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || loadingArticles}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </PageTemplate>
  );
};

export default ArticleManagement;