import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types';
import apiService from './api';

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials) as { success: boolean; token: string; user: User };
      return {
        token: response.token,
        user: response.user
      };
    } catch (error: any) {
      // Extract the specific error message from the API response
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      // Re-throw the error with the specific message
      throw new Error(error.message || 'Login failed');
    }
  }

  // Register user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<{ success: boolean; token: string; user: User }>('/auth/register', credentials) as { success: boolean; token: string; user: User };
      return {
        token: response.token,
        user: response.user
      };
    } catch (error: any) {
      // Extract the specific error message from the API response
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      // Re-throw the error with the specific message
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await apiService.get<{ success: boolean; user: User }>('/auth/me') as { success: boolean; user: User };
    return { user: response.user };
  }

  // Logout user
  async logout(): Promise<void> {
    await apiService.post('/auth/logout');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Set token
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Remove token
  removeToken(): void {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();
export default authService; 