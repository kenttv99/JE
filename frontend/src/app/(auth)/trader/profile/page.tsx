// frontend/src/app/(auth)/trader/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDateTime } from '@/hooks/useDateTime';
import { useTraderTimezone } from '@/hooks/useTraderTimezone';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TraderProfilePage() {
  const { session, status, isLoading } = useAuth('trader');
  const { 
    timeZones, 
    selectedTimezone,
    error: timezoneError,
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

  const currentTime = useDateTime(timeZones.find(tz => tz.id === selectedTimezone)?.utc_offset);
  
  if (isLoading || !session?.user) {
    return <LoadingSpinner />;
  }

  const user = session.user;

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
          <div className="grid grid-cols-2 gap-6 auto-rows-fr">
            {/* Left Column - User Information */}
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
                      {user.created_at 
                        ? new Date(user.created_at).toISOString().slice(0, 19).replace('T', ' ')
                        : 'Не указана'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
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
                  {timezoneError && (
                    <div className="text-red-500 text-sm mt-2">
                      {timezoneError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Section */}
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