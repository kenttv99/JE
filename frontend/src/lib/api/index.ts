// frontend/src/lib/api/index.ts
import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  async (config) => {
    // Get current session
    const session = await getSession();
    
    // If session exists and has accessToken, add it to headers
    if (session?.accessToken) {
      config.headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use Next-Auth signOut instead of direct window.location
        await signOut({ 
          redirect: true,
          callbackUrl: '/login'
        });
        return Promise.reject(error);
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
        return Promise.reject(error);
      }
    }

    // For other errors, reject with the original error
    return Promise.reject(error);
  }
);

export default api;