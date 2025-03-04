// src/services/api.js
import axios from 'axios';

// API base URL - set this in your .env file
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tokenType = localStorage.getItem('token_type') || 'bearer';
    
    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service methods
const apiService = {
  // Auth endpoints
  auth: {
    login: async (username, password) => {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post(`${API_URL}/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response.data;
    },
    
    register: async (userData) => {
      const response = await api.post('/register', userData);
      return response.data;
    },
  },
  
  // Dashboard endpoints
  dashboard: {
    getSummary: async () => {
      const response = await api.get('/api/dashboard/summary');
      return response.data;
    },
    
    getMaintenanceDue: async (limit = 10) => {
      const response = await api.get(`/api/dashboard/maintenance-due?limit=${limit}`);
      return response.data;
    },
    
    getRecentWorkOrders: async (limit = 5) => {
      const response = await api.get(`/api/dashboard/recent-work-orders?limit=${limit}`);
      return response.data;
    },
    
    getAlerts: async () => {
      const response = await api.get('/api/dashboard/alerts');
      return response.data;
    },
  },
  
  // Vehicle endpoints
  vehicles: {
    getAll: async (params = {}) => {
      const response = await api.get('/api/vehicles', { params });
      return response.data;
    },
    
    getById: async (id) => {
      const response = await api.get(`/api/vehicles/${id}`);
      return response.data;
    },
    
    create: async (vehicleData) => {
      const response = await api.post('/api/vehicles', vehicleData);
      return response.data;
    },
    
    update: async (id, vehicleData) => {
      const response = await api.put(`/api/vehicles/${id}`, vehicleData);
      return response.data;
    },
    
    delete: async (id) => {
      await api.delete(`/api/vehicles/${id}`);
      return true;
    },
    
    getWorkOrders: async (id, params = {}) => {
      const response = await api.get(`/api/vehicles/${id}/work-orders`, { params });
      return response.data;
    },
    
    getMaintenance: async (id) => {
      const response = await api.get(`/api/vehicles/${id}/maintenance`);
      return response.data;
    },
  },
  
  // Work order endpoints
  workOrders: {
    getAll: async (params = {}) => {
      const response = await api.get('/api/work-orders', { params });
      return response.data;
    },
    
    getById: async (id) => {
      const response = await api.get(`/api/work-orders/${id}`);
      return response.data;
    },
    
    create: async (workOrderData) => {
      const response = await api.post('/api/work-orders', workOrderData);
      return response.data;
    },
    
    update: async (id, workOrderData) => {
      const response = await api.put(`/api/work-orders/${id}`, workOrderData);
      return response.data;
    },
    
    delete: async (id) => {
      await api.delete(`/api/work-orders/${id}`);
      return true;
    },
    
    addTask: async (id, taskData) => {
      const response = await api.post(`/api/work-orders/${id}/tasks`, taskData);
      return response.data;
    },
    
    updateTask: async (workOrderId, taskId, taskData) => {
      const response = await api.put(`/api/work-orders/${workOrderId}/tasks/${taskId}`, taskData);
      return response.data;
    },
    
    addPart: async (id, partData) => {
      const response = await api.post(`/api/work-orders/${id}/parts`, partData);
      return response.data;
    },
  },
  
  // Parts inventory endpoints
  parts: {
    getAll: async (params = {}) => {
      const response = await api.get('/api/parts', { params });
      return response.data;
    },
    
    getById: async (id) => {
      const response = await api.get(`/api/parts/${id}`);
      return response.data;
    },
    
    create: async (partData) => {
      const response = await api.post('/api/parts', partData);
      return response.data;
    },
    
    update: async (id, partData) => {
      const response = await api.put(`/api/parts/${id}`, partData);
      return response.data;
    },
    
    delete: async (id) => {
      await api.delete(`/api/parts/${id}`);
      return true;
    },
    
    adjustInventory: async (id, adjustmentData) => {
      const response = await api.post(`/api/parts/${id}/adjust`, adjustmentData);
      return response.data;
    },
  },
  
  // Samsara integration endpoints
  samsara: {
    getVehicles: async () => {
      const response = await api.get('/api/samsara/vehicles');
      return response.data;
    },
    
    sync: async () => {
      const response = await api.post('/api/samsara/sync');
      return response.data;
    },
    
    getSyncStatus: async () => {
      const response = await api.get('/api/samsara/sync/status');
      return response.data;
    },
  },
};

export default apiService;
