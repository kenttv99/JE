import axios from 'axios';
import type { User } from '@/types/user';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Improved type safety and browser check
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/auth/profile');
  return response.data.data; // Fixed to return the actual user data
};

export default api;