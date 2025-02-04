// frontend/src/app/(auth)/trader/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TimeZone, TraderProfile } from '@/types/trader';
import { useTraderTimezone } from '@/hooks/useTraderTimezone';

interface ProfileUser {
  id: string;
  email: string;
  role: string;
  pay_in: boolean;
  pay_out: boolean;
  access: boolean;
  created_at: string;
  updated_at: string;
  verification_level?: string;
}

const formatDate = (dateString: string, timeZone: TimeZone | undefined): string => {
  try {
    const date = new Date(dateString);
    const offset = timeZone?.utc_offset || 0;
    
    // Adjust date based on timezone offset
    const localDate = new Date(date.getTime() + offset * 60 * 60 * 1000);
    
    return localDate.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export default function TraderProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const {
    timeZones,
    selectedTimezone,
    loading: timezoneLoading,
    updateLoading,
    error: timezoneError,
    successMessage,
    fetchTimeZones,
    handleTimezoneChange
  } = useTraderTimezone();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const selectedTz = timeZones.find(tz => tz.id === selectedTimezone);
      setCurrentTime(formatDate(now.toISOString(), selectedTz));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTimezone, timeZones]);

  useEffect(() => {
    if (session?.user) {
      fetchTimeZones();
    }
  }, [session]);

  if (status === 'loading' || loading || timezoneLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as ProfileUser;

  return (
    <div className="min-mx-[200px]">
      <div className="bg-white shadow rounded-lg">
        <div className="bg-blue-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Профиль трейдера</h1>
          <div className="text-white text-sm mt-2">
            Текущее время: {currentTime}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Информация о пользователе</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Роль</label>
                  <p className="mt-1 text-gray-900">{user.role || 'Не указана'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Статус верификации</label>
                  <p className="mt-1 text-gray-900">{user.verification_level || 'Не верифицирован'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Дата регистрации</label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(user.created_at, timeZones.find(tz => tz.id === selectedTimezone))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Последнее обновление</label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(user.updated_at, timeZones.find(tz => tz.id === selectedTimezone))}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Статусы</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Pay In</label>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${user.pay_in ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-900">{user.pay_in ? 'Активно' : 'Неактивно'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Pay Out</label>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${user.pay_out ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-900">{user.pay_out ? 'Активно' : 'Неактивно'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Доступ</label>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${user.access ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-900">{user.access ? 'Активно' : 'Неактивно'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Zone Settings */}
          <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Настройки часового пояса</h2>
            {timezoneError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{timezoneError}</p>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600">{successMessage}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Выберите часовой пояс
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => handleTimezoneChange(Number(e.target.value))}
                  disabled={updateLoading}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {timeZones.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.display_name} ({tz.regions}) UTC{tz.utc_offset >= 0 ? '+' : ''}{tz.utc_offset}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                <p>Текущий часовой пояс: {timeZones.find(tz => tz.id === selectedTimezone)?.display_name}</p>
                {updateLoading && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                    <span>Обновление...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}