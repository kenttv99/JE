// frontend/src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';

// Интерфейс для данных профиля трейдера
export interface TraderProfile extends TraderData {
  balance: string;
  fiat_currency: string;
}

// Хук для загрузки данных профиля
export function useProfile() {
  // Получаем данные сессии и статус авторизации
  const { data: session, status } = useSession({ required: true });

  // Используем react-query для выполнения запроса
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', session?.user?.id], // Уникальный ключ запроса
    queryFn: async () => {
      // Извлекаем токен из сессии
      const token = session?.accessToken;
      if (!token) {
        throw new Error('Токен авторизации отсутствует');
      }

      // Выполняем GET-запрос к API с токеном в заголовках
      const response = await api.get<TraderProfile>('/api/v1/traders/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Возвращаем данные с обработкой значений по умолчанию
      return {
        ...response.data,
        balance: response.data.balance || '0.00',
        fiat_currency: response.data.fiat_currency || 'RUB',
      };
    },
    // Запрос выполняется только при наличии сессии и токена
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // Данные считаются устаревшими через 5 минут
    gcTime: 30 * 60 * 1000,  // Данные хранятся в кэше 30 минут
    retry: 1,                 // Повторная попытка при ошибке (1 раз)
    refetchInterval: 10000,   // Обновление каждые 10 секунд
    refetchOnWindowFocus: true // Обновление при возвращении фокуса на окно
  });

  // Возвращаем данные профиля и состояние загрузки/ошибки
  return {
    profile,
    isLoading: isLoading || status === 'loading',
    error: error ? (error as Error).message : null,
    balance: profile?.balance || '0.00',
    fiat_currency: profile?.fiat_currency || 'RUB',
  };
}