// src/lib/api/index.ts
import axios from 'axios';
import { API_URL } from '../config';
import type { ApiResponse, User } from '@/types';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Общий интерцептор для авторизации
api.interceptors.request.use(request => {
  const token = localStorage.getItem('token');
  if (token) {
    request.headers.Authorization = token;
  }
  return request;
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Произошла ошибка';
      throw new Error(message);
    }
    throw error;
  }
);