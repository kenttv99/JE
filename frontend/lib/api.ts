import axios from 'axios';
import type { User } from '@/types/user'; // Добавляем импорт типа User

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем типы для конфига
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (config.headers) { // Проверка наличия headers
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Типизируем ответ от API
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Добавляем типизацию для функции получения профиля
export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>('/auth/profile');
  return response.data;
};

export default api;