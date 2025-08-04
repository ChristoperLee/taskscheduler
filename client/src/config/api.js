// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Remove trailing slash if present
export const API_BASE_URL = API_URL.replace(/\/$/, '');

// Helper to build API endpoints
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default {
  API_BASE_URL,
  buildApiUrl
};