import axios from 'axios';
// import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getUserProfile = async (): Promise<User> => {
  const token = localStorage.getItem('token');
  try {
    const response = await api.get<User>('/api/v1/auth/profile', {
      headers: {
        Authorization: token || '',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Profile error details:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw new Error(error.response?.data?.message || 'Ошибка загрузки профиля');
    }
    throw error;
  }
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Auth error details:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw new Error(error.response?.data?.message || 'Ошибка авторизации');
    }
    throw error;
  }
};

export default api;