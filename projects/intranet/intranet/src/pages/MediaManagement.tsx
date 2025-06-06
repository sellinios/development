import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, Image, Trash2, Download, Search, X, Eye, 
  CheckCircle, AlertCircle, Grid, List, ArrowLeft,
  FileImage, Info, Copy, RefreshCw
} from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';

interface MediaFile {
  id: number;
  website_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  url: string;
  thumbnail_url: string;
  alt_text: string;
  caption: string;
  uploaded_by: number;
  created_at: string;
  uploader?: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
  };
}

interface Website {
  id: number;
  name: string;
  domain: string;
}

const MediaManagement: React.FC = () => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<Website | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMedia, setTotalMedia] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [converting, setConverting] = useState(false);
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'preview', label: 'Preview', visible: true, required: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'size', label: 'Size', visible: true },
    { key: 'uploaded', label: 'Uploaded', visible: true },
    { key: 'uploader', label: 'Uploaded By', visible: false },
    { key: 'type', label: 'Type', visible: false },
    { key: 'alt_text', label: 'Alt Text', visible: false },
    { key: 'caption', label: 'Caption', visible: false },
  ]);

  useEffect(() => {
    if (websiteId) {
      fetchWebsite();
      fetchMediaFiles();
    }
  }, [websiteId, searchTerm, currentPage]);

  const fetchWebsite = async () => {
    try {
      const response = await api.get(`/websites/${websiteId}`);
      setWebsite(response.data);
    } catch (error) {
      console.error('Failed to fetch website:', error);
      navigate('/websites');
    }
  };

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/websites/${websiteId}/media?${params.toString()}`);
      setMediaFiles(response.data.media || []);
      setTotalMedia(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setUploadErrors(['Please select image files only']);
      return;
    }

    setUploading(true);
    setUploadErrors([]);
    setUploadProgress({});

    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('files', file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    });

    try {
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          imageFiles.forEach(file => {
            setUploadProgress(prev => ({ ...prev, [file.name]: percentComplete }));
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.errors && response.errors.length > 0) {
            setUploadErrors(response.errors);
          }
          fetchMediaFiles();
          setTimeout(() => {
            setUploadProgress({});
          }, 1000);
        }
      });

      xhr.addEventListener('error', () => {
        setUploadErrors(['Upload failed. Please try again.']);
      });

      const token = localStorage.getItem('token');
      xhr.open('POST', `/intranet/api/websites/${websiteId}/media`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadErrors(['Upload failed. Please try again.']);
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 1000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await api.delete(`/media/${id}`);
      fetchMediaFiles();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete media');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} images?`)) return;
    
    try {
      await api.post('/media/bulk-delete', { ids: selectedFiles });
      setSelectedFiles([]);
      fetchMediaFiles();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete media');
    }
  };

  const handleUpdateMedia = async (id: number, data: { alt_text: string; caption: string }) => {
    try {
      await api.put(`/media/${id}`, data);
      fetchMediaFiles();
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to update media:', error);
      alert('Failed to update media');
    }
  };

  const handleConvertExisting = async () => {
    if (!confirm('Convert all non-WebP images to WebP format? This may take a while.')) return;
    
    try {
      setConverting(true);
      const response = await api.post(`/websites/${websiteId}/media/convert`);
      alert(`Converted ${response.data.converted} images to WebP format`);
      fetchMediaFiles();
    } catch (error) {
      console.error('Failed to convert images:', error);
      alert('Failed to convert images');
    } finally {
      setConverting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderCell = (media: MediaFile, column: Column) => {
    switch (column.key) {
      case 'preview':
        return (
          <img
            src={media.thumbnail_url || media.url}
            alt={media.alt_text || media.original_name}
            className="w-16 h-16 object-cover rounded"
            loading="lazy"
          />
        );
      case 'name':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {media.original_name}
            </div>
            {media.alt_text && (
              <div className="text-sm text-gray-500">{media.alt_text}</div>
            )}
          </div>
        );
      case 'size':
        return <div className="text-sm text-gray-900">{formatFileSize(media.file_size)}</div>;
      case 'uploaded':
        return (
          <div className="text-sm text-gray-900">
            {format(new Date(media.created_at), 'MMM dd, yyyy')}
          </div>
        );
      case 'uploader':
        return media.uploader ? (
          <div className="text-sm text-gray-900">
            {media.uploader.firstname} {media.uploader.lastname}
          </div>
        ) : (
          <div className="text-sm text-gray-500">-</div>
        );
      case 'type':
        return <div className="text-sm text-gray-900">{media.mime_type}</div>;
      case 'alt_text':
        return <div className="text-sm text-gray-900">{media.alt_text || '-'}</div>;
      case 'caption':
        return <div className="text-sm text-gray-900">{media.caption || '-'}</div>;
      default:
        return null;
    }
  };

  const renderActions = (media: MediaFile) => {
    return (
      <div className="flex space-x-2 justify-center">
        <button
          onClick={() => {
            setSelectedMedia(media);
            setShowDetails(true);
          }}
          className="text-indigo-600 hover:text-indigo-900"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => copyToClipboard(media.url)}
          className="text-blue-600 hover:text-blue-900"
          title="Copy URL"
        >
          <Copy className="w-4 h-4" />
        </button>
        <a
          href={media.url}
          download
          className="text-green-600 hover:text-green-900"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={() => handleDelete(media.id)}
          className="text-red-600 hover:text-red-900"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const totalPages = useMemo(() => Math.ceil(totalMedia / 50), [totalMedia]);

  if (!website) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/websites`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Websites
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{website.name} - Media Library</h1>
              <p className="mt-2 text-gray-600">Manage images and media files for {website.domain}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConvertExisting}
                disabled={converting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${converting ? 'animate-spin' : ''}`} />
                Convert to WebP
              </button>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete ({selectedFiles.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop images here or click to upload
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Images will be automatically converted to WebP format for optimal performance
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileInput}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            Select Images
          </label>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h4 className="font-medium mb-2">Uploading...</h4>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{filename}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Upload Errors</h4>
                <ul className="list-disc list-inside text-sm text-red-800">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search and View Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {viewMode === 'list' && (
                <ColumnManager
                  columns={columns}
                  onColumnsChange={setColumns}
                  storageKey={`media-${websiteId}-visible-columns`}
                />
              )}
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media files yet</h3>
            <p className="text-gray-600">Upload your first image to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mediaFiles.map((media) => (
              <div
                key={media.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.includes(media.id) ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => {
                  setSelectedMedia(media);
                  setShowDetails(true);
                }}
              >
                <div className="relative aspect-square">
                  <img
                    src={media.thumbnail_url || media.url}
                    alt={media.alt_text || media.original_name}
                    className="w-full h-full object-cover rounded-t-lg"
                    loading="lazy"
                  />
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(media.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setSelectedFiles([...selectedFiles, media.id]);
                      } else {
                        setSelectedFiles(selectedFiles.filter(id => id !== media.id));
                      }
                    }}
                    className="absolute top-2 left-2 w-5 h-5 text-indigo-600 bg-white rounded border-gray-300 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{media.original_name}</p>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-500">{formatFileSize(media.file_size)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedFiles.length === mediaFiles.length && mediaFiles.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFiles(mediaFiles.map(m => m.id));
                  } else {
                    setSelectedFiles([]);
                  }
                }}
                className="w-4 h-4 text-indigo-600 bg-white rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">Select all</span>
            </div>
            <DynamicTable
              data={mediaFiles}
              columns={columns}
              renderCell={renderCell}
              renderActions={renderActions}
            />
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Media Details Modal */}
        {showDetails && selectedMedia && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">Media Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.alt_text || selectedMedia.original_name}
                      className="w-full rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleUpdateMedia(selectedMedia.id, {
                        alt_text: formData.get('alt_text') as string,
                        caption: formData.get('caption') as string,
                      });
                    }}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Filename
                        </label>
                        <p className="text-sm text-gray-900">{selectedMedia.original_name}</p>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedMedia.url}
                            readOnly
                            className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedMedia.url)}
                            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          name="alt_text"
                          defaultValue={selectedMedia.alt_text}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                          placeholder="Describe this image for accessibility"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Caption
                        </label>
                        <textarea
                          name="caption"
                          defaultValue={selectedMedia.caption}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                          placeholder="Optional caption for this image"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          File Info
                        </label>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Size: {formatFileSize(selectedMedia.file_size)}</p>
                          <p>Type: {selectedMedia.mime_type}</p>
                          <p>Uploaded: {format(new Date(selectedMedia.created_at), 'MMM dd, yyyy HH:mm')}</p>
                          {selectedMedia.uploader && (
                            <p>By: {selectedMedia.uploader.firstname} {selectedMedia.uploader.lastname}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowDetails(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaManagement;