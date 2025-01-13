// frontend/src/app/pages/profile.tsx

"use client";

import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { getUserProfile } from '@/lib/api';
import NavigationButtons from '../../components/NavigationButtons';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile();
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке профиля:', err); // Используем переменную err для логирования ошибки
        setError('Ошибка при загрузке профиля');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || 'Не удалось загрузить данные пользователя'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Шапка профиля */}
          <div className="bg-blue-500 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Личный кабинет</h1>
          </div>

          {/* Основная информация */}
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Основная информация</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Email" value={user.email} />
                <InfoItem label="Полное имя" value={user.full_name} />
                <InfoItem label="Уровень верификации" value={user.verification_level} />
                <InfoItem 
                  label="Дата регистрации" 
                  value={new Date(user.created_at).toLocaleDateString('ru-RU')} 
                />
              </div>
            </div>

            {/* Реферальная информация */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Реферальная программа</h2>
              <div className="grid grid-cols-1 gap-4">
                <InfoItem 
                  label="Реферальный код" 
                  value={user.referral_code || 'Не установлен'} 
                />
                <InfoItem 
                  label="ID пригласившего" 
                  value={user.referrer_id?.toString() || 'Нет'} 
                />
              </div>
            </div>

            {/* Контактная информация */}
            {(user.phone_number || user.telegram_username) && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Контактная информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.phone_number && (
                    <InfoItem label="Телефон" value={user.phone_number} />
                  )}
                  {user.telegram_username && (
                    <InfoItem label="Telegram" value={user.telegram_username} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <NavigationButtons />
    </div>
  );
}

// Компонент для отображения пары ключ-значение
const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-base font-medium text-gray-900">{value}</span>
  </div>
);