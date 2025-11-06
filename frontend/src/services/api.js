import axios from 'axios';

// Base URL - use environment variable in production, proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

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
