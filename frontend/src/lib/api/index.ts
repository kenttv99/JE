// frontend/src/lib/api/index.ts

import axios, { AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';
import { CustomSession } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
axiosInstance.interceptors.request.use(async (config) => {
  const session = await getSession() as CustomSession | null;
  
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Error handling interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response || error);
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;