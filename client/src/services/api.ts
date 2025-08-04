import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get(url, { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      console.log('🚀 API POST Request:', { url, data });
      const response = await this.api.post(url, data);
      console.log('✅ API POST Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API POST Error:', {
        url,
        data,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put(url, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    try {
      const response = await axios.get('/health');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}

export const apiService = new ApiService();
export default apiService; 