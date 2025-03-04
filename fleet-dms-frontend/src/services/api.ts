// src/services/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// API base URL - set this in your .env file
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    login: async (username: string, password: string) => {
      // Create URLSearchParams object for proper form encoding
      const searchParams = new URLSearchParams();
      searchParams.append('username', username);
      searchParams.append('password', password);
      
      // For debugging purposes
      console.log(`Attempting login for user: ${username}`);
      console.log(`Login endpoint: ${API_URL}/token`);
      
      try {
        const response = await axios.post(`${API_URL}/token`, searchParams, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        console.log('Login successful');
        return response.data;
      } catch (error: any) {
        console.error('Login error details:', error.response?.data);
        throw error;
      }
    },
    
    register: async (userData: any) => {
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
    
    getById: async (id: string | number) => {
      const response = await api.get(`/api/vehicles/${id}`);
      return response.data;
    },
    
    create: async (vehicleData: any) => {
      const response = await api.post('/api/vehicles', vehicleData);
      return response.data;
    },
    
    update: async (id: string | number, vehicleData: any) => {
      const response = await api.put(`/api/vehicles/${id}`, vehicleData);
      return response.data;
    },
    
    delete: async (id: string | number) => {
      await api.delete(`/api/vehicles/${id}`);
      return true;
    },
    
    getWorkOrders: async (id: string | number, params = {}) => {
      const response = await api.get(`/api/vehicles/${id}/work-orders`, { params });
      return response.data;
    },
    
    getMaintenance: async (id: string | number) => {
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
    
    getById: async (id: string | number) => {
      const response = await api.get(`/api/work-orders/${id}`);
      return response.data;
    },
    
    create: async (workOrderData: any) => {
      const response = await api.post('/api/work-orders', workOrderData);
      return response.data;
    },
    
    update: async (id: string | number, workOrderData: any) => {
      const response = await api.put(`/api/work-orders/${id}`, workOrderData);
      return response.data;
    },
    
    delete: async (id: string | number) => {
      await api.delete(`/api/work-orders/${id}`);
      return true;
    },
    
    addTask: async (id: string | number, taskData: any) => {
      const response = await api.post(`/api/work-orders/${id}/tasks`, taskData);
      return response.data;
    },
    
    updateTask: async (workOrderId: string | number, taskId: string | number, taskData: any) => {
      const response = await api.put(`/api/work-orders/${workOrderId}/tasks/${taskId}`, taskData);
      return response.data;
    },
    
    addPart: async (id: string | number, partData: any) => {
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
    
    getById: async (id: string | number) => {
      const response = await api.get(`/api/parts/${id}`);
      return response.data;
    },
    
    create: async (partData: any) => {
      const response = await api.post('/api/parts', partData);
      return response.data;
    },
    
    update: async (id: string | number, partData: any) => {
      const response = await api.put(`/api/parts/${id}`, partData);
      return response.data;
    },
    
    delete: async (id: string | number) => {
      await api.delete(`/api/parts/${id}`);
      return true;
    },
    
    adjustInventory: async (id: string | number, adjustmentData: any) => {
      const response = await api.post(`/api/parts/${id}/adjust`, adjustmentData);
      return response.data;
    },
  },
  
  // Maintenance endpoints
  maintenance: {
    getPredictions: async (daysAhead = 30) => {
      const response = await api.get(`/api/samsara/maintenance/predictions?days_ahead=${daysAhead}`);
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
    
    resetSync: async () => {
      const response = await api.post('/api/samsara/sync/reset');
      return response.data;
    },
    
    // New endpoints for enhanced telematics data
    getVehicleStats: async (vehicleId: string, types?: string) => {
      const params: any = {};
      if (types) {
        params.types = types;
      }
      const response = await api.get(`/api/samsara/vehicle/${vehicleId}/stats`, { params });
      return response.data;
    },
    
    getVehicleStatsFeed: async (vehicles: string, types?: string) => {
      const params: any = { vehicles };
      if (types) {
        params.types = types;
      }
      const response = await api.get('/api/samsara/vehicles/stats/feed', { params });
      return response.data;
    },
    
    getVehicleStatsHistory: async (vehicles: string, startTime: string, endTime: string, types?: string) => {
      const params: any = {
        vehicles,
        start_time: startTime,
        end_time: endTime
      };
      if (types) {
        params.types = types;
      }
      const response = await api.get('/api/samsara/vehicles/stats/history', { params });
      return response.data;
    },
    
    getDiagnosticCodes: async (vehicleId: string) => {
      const response = await api.get(`/api/samsara/vehicle/${vehicleId}/diagnostic-codes`);
      return response.data;
    },
    
    createWorkOrderFromDiagnostic: async (codeId: number, data: any) => {
      const response = await api.post(`/api/samsara/diagnostic/${codeId}/create-work-order`, data);
      return response.data;
    },
    
    getVehicleLocations: async (vehicleId: string, startTime: string, endTime: string) => {
      const params = {
        start_time: startTime,
        end_time: endTime
      };
      const response = await api.get(`/api/samsara/vehicle/${vehicleId}/locations`, { params });
      return response.data;
    },
    
    getDiagnosticAlerts: async () => {
      const response = await api.get('/api/samsara/dashboard/diagnostic-alerts');
      return response.data;
    },
  },
};

export default apiService;
