import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Clock, Globe, Tag, Calendar, MapPin, Search, Bold, Italic, Heading2, List, ListOrdered, Link, Quote, Image as ImageIcon, Code, Folder } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';
import MediaPicker from '../components/MediaPicker';

interface Website {
  id: number;
  name: string;
  domain: string;
}

interface Article {
  id?: number;
  website_id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  category: string;
  status: string;
  published_at: string | null;
  event_date: string | null;
  event_location: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
}

const CATEGORIES = [
  { value: 'news', label: 'News', icon: '📰' },
  { value: 'event', label: 'Event', icon: '📅' },
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'blog', label: 'Blog Post', icon: '✍️' },
  { value: 'press', label: 'Press Release', icon: '📄' }
];

const ArticleEditor: React.FC = () => {
  const { websiteId, articleId } = useParams<{ websiteId: string; articleId?: string }>();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<Article>({
    website_id: parseInt(websiteId || '0'),
    title: '',
    slug: '',
    summary: '',
    content: '',
    featured_image: '',
    category: 'news',
    status: 'draft',
    published_at: '',
    event_date: '',
    event_location: '',
    tags: [],
    meta_title: '',
    meta_description: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    fetchWebsite();
    if (articleId) {
      fetchArticle();
    } else {
      setLoading(false);
    }
  }, [websiteId, articleId]);

  const fetchWebsite = async () => {
    try {
      const response = await api.get(`/websites/${websiteId}`);
      setWebsite(response.data);
    } catch (error) {
      console.error('Failed to fetch website:', error);
      navigate('/websites');
    }
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/articles/${articleId}`);
      const article = response.data;
      setFormData({
        ...article,
        published_at: article.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : '',
        event_date: article.event_date ? new Date(article.event_date).toISOString().slice(0, 16) : '',
        tags: article.tags || []
      });
    } catch (error) {
      console.error('Failed to fetch article:', error);
      navigate(`/websites/${websiteId}/articles`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        published_at: formData.published_at || null,
        event_date: formData.event_date || null
      };

      if (articleId) {
        await api.put(`/articles/${articleId}`, payload);
      } else {
        await api.post(`/websites/${websiteId}/articles`, payload);
      }
      
      navigate(`/websites/${websiteId}/articles`);
    } catch (error) {
      console.error('Failed to save article:', error);
      alert('Failed to save article. Please try again.');
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const now = new Date().toISOString().slice(0, 16);
    setFormData({ 
      ...formData, 
      status: 'published',
      published_at: formData.published_at || now
    });
    // Submit will happen after state update
    setTimeout(() => {
      const form = document.getElementById('article-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const insertFormatting = (before: string, after: string = '') => {
    if (!textareaRef) return;
    
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText = formData.content.substring(0, start) + before + selectedText + after + formData.content.substring(end);
    
    setFormData({ ...formData, content: newText });
    
    // Reset cursor position
    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
        textareaRef.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('<strong>', '</strong>') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('<em>', '</em>') },
    { icon: Heading2, label: 'Heading', action: () => insertFormatting('<h2>', '</h2>') },
    { icon: List, label: 'Bullet List', action: () => insertFormatting('<ul>\n  <li>', '</li>\n</ul>') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertFormatting('<ol>\n  <li>', '</li>\n</ol>') },
    { icon: Link, label: 'Link', action: () => insertFormatting('<a href="">', '</a>') },
    { icon: Quote, label: 'Quote', action: () => insertFormatting('<blockquote>', '</blockquote>') },
    { icon: ImageIcon, label: 'Image', action: () => insertFormatting('<img src="', '" alt="">') },
    { icon: Code, label: 'Code', action: () => insertFormatting('<code>', '</code>') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/websites/${websiteId}/articles`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Articles
              </button>
              <div className="ml-4 pl-4 border-l">
                <h1 className="text-xl font-semibold text-gray-900">
                  {articleId ? 'Edit Article' : 'New Article'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button
                type="submit"
                form="article-form"
                disabled={saving || formData.status === 'published'}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving || !formData.title || !formData.content}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                {formData.status === 'published' ? 'Update' : 'Publish'}
              </button>
            </div>
            </div>
          </div>
        </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="article-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({ 
                      ...formData, 
                      title,
                      slug: generateSlug(title)
                    });
                  }}
                  className="w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter a compelling title..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: {website?.domain}/news/{formData.slug || 'article-slug'}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Brief summary that will appear in article listings..."
                />
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content * {showPreview && '(Edit Mode)'}
                </label>
                {!showPreview ? (
                  <div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Formatting Toolbar */}
                      <div className="bg-gray-50 border-b border-gray-200 p-1 flex items-center gap-1 flex-wrap">
                        {formatButtons.map((button, index) => {
                          const Icon = button.icon;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={button.action}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                              title={button.label}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                        <div className="h-4 w-px bg-gray-300 mx-1" />
                        <span className="text-xs text-gray-500 px-2">Select text and click to format</span>
                      </div>
                      
                      {/* Textarea */}
                      <textarea
                        ref={(el) => setTextareaRef(el)}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        rows={20}
                        placeholder="Enter your article content here. You can use HTML tags for formatting."
                        required
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <details>
                        <summary className="cursor-pointer font-semibold mb-1">HTML Reference</summary>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <code>&lt;h2&gt;</code> - Subheading<br/>
                            <code>&lt;h3&gt;</code> - Section heading<br/>
                            <code>&lt;p&gt;</code> - Paragraph<br/>
                            <code>&lt;strong&gt;</code> - Bold text<br/>
                            <code>&lt;em&gt;</code> - Italic text
                          </div>
                          <div>
                            <code>&lt;ul&gt; &lt;li&gt;</code> - Bullet list<br/>
                            <code>&lt;ol&gt; &lt;li&gt;</code> - Numbered list<br/>
                            <code>&lt;a href=""&gt;</code> - Link<br/>
                            <code>&lt;img src=""&gt;</code> - Image<br/>
                            <code>&lt;blockquote&gt;</code> - Quote
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <h2 className="text-xl font-bold mb-4">Preview</h2>
                      <div 
                        dangerouslySetInnerHTML={{ __html: formData.content || '<p>No content to preview</p>' }}
                        className="article-content"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publishing Options */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Publishing
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className={`px-3 py-2 rounded-lg font-medium text-sm ${
                      formData.status === 'published' ? 'bg-green-100 text-green-800' :
                      formData.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Category & Type
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                            formData.category === cat.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="font-medium">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.category === 'event' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Event Date
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.event_date}
                          onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Event Location
                        </label>
                        <input
                          type="text"
                          value={formData.event_location}
                          onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Athens, Greece"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Featured Image
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      Browse
                    </button>
                  </div>
                  {formData.featured_image && (
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </h3>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type and press Enter"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  SEO Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={formData.title || 'Page title for search engines'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder={formData.summary || 'Description for search engines'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && websiteId && (
        <MediaPicker
          websiteId={websiteId}
          selectedUrl={formData.featured_image}
          onSelect={(media) => {
            setFormData({ ...formData, featured_image: media.url });
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </>
  );
};

export default ArticleEditor;