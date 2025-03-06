// JE/frontend/src/lib/api/index.ts
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Создаем базовый экземпляр axios
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для авторизации без интерцепторов
export const authApiRequest = <T = any>(url: string, data: any): Promise<AxiosResponse<T>> => {
  return axios.post<T>(url, data, {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Функция для добавления токена авторизации к запросу вручную
export const addAuthHeader = async (config: AxiosRequestConfig = {}): Promise<AxiosRequestConfig> => {
  try {
    const session = await getSession();
    if (session?.accessToken) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${session.accessToken}`
        }
      };
    }
  } catch (error) {
    console.error('Error getting auth header:', error);
  }
  return config;
};

// Интерцептор запросов
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      
      // Отладочный вывод
      if (!session?.accessToken && process.env.NODE_ENV !== 'production') {
        console.log('No access token found in session', {
          session: session ? 'exists' : 'null',
          url: config.url
        });
      }
      
      // Добавляем токен в заголовок
      if (session?.accessToken) {
        config.headers['Authorization'] = `Bearer ${session.accessToken}`;
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('API Request with token:', {
            url: config.url,
            method: config.method,
            hasToken: true
          });
        }
      }
    } catch (error) {
      console.error('Error setting auth header:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор ответов
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Обработка 401 ошибок (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (process.env.NODE_ENV !== 'production') {
        console.error('Authentication error:', error.response?.data);
        console.log('Redirecting to login page due to auth error...');
      }
      
      // Выполняем выход и редирект одним действием
      await signOut({
        redirect: true,
        callbackUrl: '/login'
      });
      
      return Promise.reject(error);
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('API error:', error);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;