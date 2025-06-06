import api from './lib/api';

// Test function to verify axios configuration
export const testApiConfiguration = () => {
  console.log('Testing API Configuration:');
  console.log('1. API defaults:', api.defaults);
  console.log('2. BaseURL:', api.defaults.baseURL);
  console.log('3. Headers:', api.defaults.headers);
  
  // Test URL construction
  const testUrls = [
    'users/1',
    '/users/1', 
    'users/1/',
    '/users/1/',
  ];
  
  testUrls.forEach(url => {
    console.log(`\nTesting URL: "${url}"`);
    // Create a mock config to see how axios would handle it
    const config = {
      method: 'GET',
      url: url,
      baseURL: api.defaults.baseURL,
    };
    console.log('Config:', config);
  });
};

// Export for use in components
export default testApiConfiguration;