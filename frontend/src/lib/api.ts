import axios from 'axios';
import { User } from '@/types/user';
import { API_URL } from './config';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

const api = axios.create({
  baseURL: API_URL, // Добавляем базовый URL из конфигурации
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

// Добавим интерцептор для отладки
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;