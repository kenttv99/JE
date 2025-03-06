// JE/frontend/src/lib/api/index.ts
import axios from 'axios';
import { LoginResponse, ApiError } from '@/types/auth';
import { getSession, GetSessionParams } from 'next-auth/react'; // Используем GetSessionParams для SSR

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  // Проверяем, вызывается ли код на сервере или клиенте
  const isServer = typeof window === 'undefined';
  let session;

  if (isServer) {
    // Для серверного рендеринга используем параметры запроса
    const request = config as any; // Типизация может потребовать доработки
    session = await getSession({ req: request });
  } else {
    // Для клиентского рендеринга получаем сессию напрямую
    session = await getSession();
  }

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
    console.log('API request with token:', config.url, config.headers.Authorization);
  } else {
    console.warn('No access token found for API request:', config.url);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;