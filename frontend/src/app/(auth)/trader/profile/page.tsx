// frontend/src/app/(auth)/trader/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TimeZone, TraderProfile } from '@/types/trader';
import { useTraderTimezone } from '@/hooks/useTraderTimezone';
import { usePasswordChange } from '@/hooks/usePasswordChange';

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

const formatDate = (date: Date, offset: number): string => {
  const d = new Date(date.getTime() + offset * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS format
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
    error,
    fetchTimeZones,
    handleTimezoneChange
  } = useTraderTimezone();

  const {
    passwords,
    passwordError,
    passwordSuccess,
    isSubmitting,
    handlePasswordChange,
    handlePasswordInput
  } = usePasswordChange();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (timeZones.length > 0) {
      const selectedTz = timeZones.find(tz => tz.id === selectedTimezone);
      const timer = setInterval(() => {
        setCurrentTime(formatDate(new Date(), selectedTz?.utc_offset || 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedTimezone, timeZones]);

  useEffect(() => {
    if (session?.user && timeZones.length === 0) {
      fetchTimeZones();
      setLoading(false);
    }
  }, [session, timeZones.length, fetchTimeZones]);

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

        <div className="p-6 space-y-6">
          {/* Two Column Layout with equal height */}
          <div className="grid grid-cols-2 gap-6 auto-rows-fr">
            {/* Left Column - now with full height */}
            <div className="h-full">
              <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
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
                      {formatDate(new Date(user.created_at), timeZones.find(tz => tz.id === selectedTimezone)?.utc_offset || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - with flex column layout for equal spacing */}
            <div className="h-full flex flex-col space-y-6">
              {/* Trading Directions */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                <h2 className="text-xl font-semibold mb-4">Направления для торговли</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pay In</label>
                    <p className="mt-1 text-gray-900">{user.pay_in ? 'Активен' : 'Неактивен'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pay Out</label>
                    <p className="mt-1 text-gray-900">{user.pay_out ? 'Активен' : 'Неактивен'}</p>
                  </div>
                </div>
              </div>

              {/* Timezone Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                <h2 className="text-xl font-semibold mb-4">Настройки часового пояса</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Выберите часовой пояс
                    </label>
                    <select
                      id="timezone"
                      value={selectedTimezone}
                      onChange={(e) => handleTimezoneChange(Number(e.target.value))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      {timeZones.map((tz) => (
                        <option key={tz.id} value={tz.id}>
                          {tz.display_name} (UTC{tz.utc_offset >= 0 ? '+' : ''}{tz.utc_offset})
                        </option>
                      ))}
                    </select>
                  </div>
                  {error && (
                    <div className="text-red-500 text-sm mt-2">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Password Change Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Смена пароля</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordInput}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Новый пароль
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordInput}
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordInput}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              {passwordError && (
                <div className="text-red-500 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="text-green-500 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                    ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSubmitting ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}