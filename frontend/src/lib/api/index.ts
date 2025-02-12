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
    if (session?.accessToken) { // This now matches the name in auth.ts
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
        // Add logging to help debug authentication issues
        console.error('Authentication error:', error.response?.data);
        
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

  api.interceptors.response.use(response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  });
}

export default api;