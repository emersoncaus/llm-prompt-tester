import axios from 'axios';

// TEMPORARY: Hardcoded API URL until we fix the GitHub Actions workflow
// TODO: Use environment variable properly
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:8000/api' 
    : 'https://c66vjufkfd.execute-api.us-east-1.amazonaws.com/prod/api');

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

  // Upload CSV file
  async uploadFile(formData) {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Process CSV file
  async processFile(payload) {
    const response = await api.post('/process', payload);
    return response.data;
  },
};

export default api;
