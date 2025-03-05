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
      // Remove debug logging in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('Adding Authorization header with token:', session.accessToken.substring(0, 10) + '...');
      }
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
    // Remove debug logging in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Response:', {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
          console.error('Authentication error:', error.response?.data);
          console.log('Attempting to sign out due to 401...');
        }
        
        await signOut({ 
          redirect: true,
          callbackUrl: '/login'
        });
        return Promise.reject(error);
      } catch (signOutError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error during sign out:', signOutError);
        }
        return Promise.reject(error);
      }
    }

    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API error:', error);
    }
    
    return Promise.reject(error);
  }
);

// Add request/response logging only in development
if (process.env.NODE_ENV === 'development') {
  // Comment out or remove this block if you don't want any API request logs
  /*
  api.interceptors.request.use(request => {
    console.log('Starting Request:', {
      url: request.url,
      method: request.method,
      headers: request.headers
    });
    return request;
  });
  */
}

export default api;