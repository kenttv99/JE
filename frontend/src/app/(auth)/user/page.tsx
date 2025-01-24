// C:\Users\kentt\OneDrive\Desktop\projects\JE\frontend\src\app\(auth)\user\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';
import NavigationButtons from '@/components/NavigationButtons';

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/v1/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const userData: User = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Ошибка:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Загрузка профиля...</div>;
  }

  if (!user) {
    return <div className="text-center py-8 text-red-500">Ошибка загрузки данных</div>;
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
                  <dd className="mt-1 text-sm text-gray-900">{user.full_name}</dd>
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