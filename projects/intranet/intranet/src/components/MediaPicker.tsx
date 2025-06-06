import { useState, useEffect } from 'react';
import { X, Image, Search, Check } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

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
}

interface MediaPickerProps {
  websiteId: string;
  onSelect: (media: MediaFile) => void;
  onClose: () => void;
  selectedUrl?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ websiteId, onSelect, onClose, selectedUrl }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMedia, setTotalMedia] = useState(0);

  useEffect(() => {
    fetchMediaFiles();
  }, [websiteId, searchTerm, currentPage]);

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalPages = Math.ceil(totalMedia / 50);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">Select Media</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
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

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
              <p className="text-gray-600">Upload media files to use them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mediaFiles.map((media) => (
                <div
                  key={media.id}
                  onClick={() => onSelect(media)}
                  className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                    selectedUrl === media.url ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="relative aspect-square">
                    <img
                      src={media.thumbnail_url || media.url}
                      alt={media.alt_text || media.original_name}
                      className="w-full h-full object-cover rounded-t-lg"
                      loading="lazy"
                    />
                    {selectedUrl === media.url && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-t-lg flex items-center justify-center">
                      <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-medium transition-opacity">
                        Select
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-900 truncate font-medium">{media.original_name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(media.file_size)}</p>
                    <p className="text-xs text-gray-500">{format(new Date(media.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPicker;