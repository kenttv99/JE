'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';  // Now properly imported
import NavigationButtons from '@/components/NavigationButtons';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/api';

// Rest of your component code remains the same...

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!session?.accessToken) {
          throw new Error('Нет токена авторизации');
        }

        const response = await axiosInstance.get<User>('/api/v1/auth/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [session]);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8 px-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">Пожалуйста, войдите в систему для просмотра профиля</p>
          <NavigationButtons />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8 px-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные профиля</p>
          <NavigationButtons />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-500 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Профиль пользователя</h1>
          </div>

          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Основная информация</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500">Полное имя</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.full_name || 'Не указано'}</dd>
                </div>
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.phone_number || 'Не указан'}
                  </dd>
                </div>
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500">Telegram</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.telegram_username || 'Не указан'}
                  </dd>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Дополнительная информация</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500">Дата регистрации</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </dd>
                </div>
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500">Уровень верификации</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.verification_level}</dd>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 border-t border-gray-200">
            <NavigationButtons />
          </div>
        </div>
      </div>
    </div>
  );
}