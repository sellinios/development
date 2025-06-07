import axios, { AxiosInstance } from 'axios';

// Create axios instance with proper configuration
const api: AxiosInstance = axios.create({
  baseURL: 'https://intranet.aethra.dev/api/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure the URL is properly constructed
    if (config.url && !config.url.startsWith('http')) {
      // Remove leading slash from URL if baseURL has trailing slash
      if (config.baseURL?.endsWith('/') && config.url.startsWith('/')) {
        config.url = config.url.substring(1);
      }
    }
    
    // Log the request for debugging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/intranet/login';
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Export the configured axios instance as default
export default api;