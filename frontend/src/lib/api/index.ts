// JE/frontend/src/lib/api/index.ts
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
    
    // Update this line to match the token name from auth.ts
    if (session?.accessToken) { 
      config.headers['Authorization'] = `Bearer ${session.accessToken}`;
      console.log('Adding Authorization header with token:', session.accessToken.substring(0, 10) + '...');  // Отладочный лог
    } else {
      console.warn('No access token available in session');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.error('Authentication error:', error.response?.data);
        console.log('Attempting to sign out due to 401...');
        
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
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

// Add request/response logging in development
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(request => {
    console.log('Starting Request:', {
      url: request.url,
      method: request.method,
      headers: request.headers
    });
    return request;
  });
}

export default api;