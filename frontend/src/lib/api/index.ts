import axios, { AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';
import { CustomSession } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';  // Make sure this matches your backend URL

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
});

// Error handling interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;