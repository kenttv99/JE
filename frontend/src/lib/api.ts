import axios from 'axios';
import { CustomSession, APIUser } from '@/types';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get session from somewhere if needed
    // const session = ...
    
    // Add authorization header if token exists
    // if (session?.accessToken) {
    //   config.headers.Authorization = `Bearer ${session.accessToken}`;
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;