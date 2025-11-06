import axios from 'axios';

// Base URL - use environment variable in production, proxy in development
// For production builds, VITE_API_URL MUST be set during build time
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '');

// Validate API URL in production
if (!import.meta.env.DEV && !API_BASE_URL) {
  console.error('VITE_API_URL is not set! API calls will fail.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service methods
export const apiService = {
  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },

  // Get available models
  async getModels() {
    const response = await api.get('/models');
    return response.data;
  },

  // Send prompt to LLM
  async sendPrompt(promptData) {
    const response = await api.post('/prompt', promptData);
    return response.data;
  },
};

export default api;
