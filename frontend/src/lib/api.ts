import axios, { AxiosError, AxiosResponse, AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = token;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

interface LoginResponse {
  access_token: string;
}

export const login = async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
  try {
    const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      console.error('Login error:', axiosError.response?.data || axiosError.message);
    } else {
      console.error('Login error:', error);
    }
    throw error;
  }
};

export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  try {
    const response = await api.get<ApiResponse<User>>('/v1/users/me');
    return response.data;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      console.error('Get profile error:', axiosError.response?.data || axiosError.message);
    } else {
      console.error('Get profile error:', error);
    }
    throw error;
  }
};