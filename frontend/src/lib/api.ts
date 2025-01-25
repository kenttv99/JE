import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Enable sending cookies with requests
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request details (but mask sensitive data)
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? '[PRESENT]' : '[MISSING]'
      },
      data: config.data ? {
        ...config.data,
        password: config.data.password ? '[HIDDEN]' : undefined
      } : undefined
    });

    // Ensure headers object exists
    config.headers = config.headers || {};
    
    // Add CORS headers
    config.headers['Access-Control-Allow-Credentials'] = 'true';
    config.headers['Access-Control-Allow-Origin'] = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    return config;
  },
  (error) => {
    console.error('API Request Error:', {
      message: error.message,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: {
          ...error.config.headers,
          Authorization: error.config.headers?.Authorization ? '[PRESENT]' : '[MISSING]'
        }
      } : null
    });
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response (but mask sensitive data)
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data ? {
        ...response.data,
        access_token: response.data.access_token ? '[PRESENT]' : '[MISSING]',
        password: undefined
      } : null
    });
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      headers: error.config?.headers ? {
        ...error.config.headers,
        Authorization: error.config.headers.Authorization ? '[PRESENT]' : '[MISSING]'
      } : null
    });

    // If the error is a 401, log additional details
    if (error.response?.status === 401) {
      console.error('Authentication Error Details:', {
        endpoint: error.config?.url,
        requestHeaders: error.config?.headers ? {
          ...error.config.headers,
          Authorization: error.config.headers.Authorization ? '[PRESENT]' : '[MISSING]'
        } : null,
        responseData: error.response.data
      });
    }

    return Promise.reject(error);
  }
);

export default api;