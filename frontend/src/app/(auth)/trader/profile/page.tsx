// frontend/src/app/(auth)/trader/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDateTime } from '@/hooks/useDateTime';
import { useTraderTimezone } from '@/hooks/useTraderTimezone';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useProfile } from '@/hooks/useProfile';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function TraderProfilePage() {
  const { session, status, isLoading: authLoading } = useAuth('trader');
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
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

  const selectedTz = timeZones.find(tz => tz.id === Number(selectedTimezone));
  const currentTime = useDateTime(selectedTz?.utc_offset ?? 0);
  
  // Handle loading states
  if (authLoading || profileLoading || !session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error states
  if (profileError) {
    toast.error(profileError);
  }

  const user = profile || session.user;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white shadow rounded-lg">
        {/* Header Section */}
        <div className="bg-blue-500 px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold text-white">Профиль трейдера</h1>
          <div className="text-white text-sm mt-2 flex items-center space-x-2">
            <span>Текущее время:</span>
            <span className="font-semibold">{currentTime}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - User Information */}
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Информация о пользователе</h2>
                <div className="space-y-4">
                  <InfoField label="Email" value={user.email} />
                  <InfoField label="Роль" value={user.role || 'Не указана'} />
                  <InfoField 
                    label="Статус верификации" 
                    value={`Уровень ${user.verification_level || 'Не верифицирован'}`}
                  />
                  <InfoField 
                    label="Дата регистрации" 
                    value={user.created_at 
                      ? new Date(user.created_at).toLocaleString('ru-RU')
                      : 'Не указана'
                    }
                  />
                </div>
              </div>

              {/* Bank Details Card */}
              {profile?.bankDetails && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Банковские реквизиты</h2>
                  <div className="space-y-4">
                    <InfoField label="Банк" value={profile.bankDetails.bankName} />
                    <InfoField label="Номер счета" value={profile.bankDetails.accountNumber} />
                    <InfoField label="БИК" value={profile.bankDetails.bik} />
                    <InfoField 
                      label="Корр. счет" 
                      value={profile.bankDetails.correspondentAccount} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Trading Permissions Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Направления для торговли</h2>
                <div className="space-y-4">
                  <PermissionBadge 
                    enabled={user.pay_in ?? false}
                    label="Pay-In"
                    description="Возможность принимать средства"
                  />
                  <PermissionBadge 
                    enabled={user.pay_out ?? false}
                    label="Pay-Out"
                    description="Возможность выводить средства"
                  />
                </div>
              </div>

              {/* Timezone Settings Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Настройки времени</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Часовой пояс
                    </label>
                    <select
                      id="timezone"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedTimezone}
                      onChange={(e) => handleTimezoneChange(e.target.value)}
                    >
                      {timeZones.map((tz) => (
                        <option key={tz.id} value={tz.id}>
                          {tz.display_name}
                        </option>
                      ))}
                    </select>
                    {timezoneError && (
                      <p className="mt-2 text-sm text-red-600">{timezoneError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Изменение пароля</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Текущий пароль
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={passwords.currentPassword}
                      onChange={handlePasswordInput}
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={passwords.newPassword}
                      onChange={handlePasswordInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Подтверждение пароля
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordInput}
                    />
                  </div>
                  
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-600">{passwordSuccess}</p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isSubmitting ? 'Сохранение...' : 'Изменить пароль'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <p className="mt-1 text-gray-900">{value}</p>
  </div>
);

const PermissionBadge = ({ 
  enabled, 
  label, 
  description 
}: { 
  enabled: boolean | undefined; 
  label: string; 
  description: string;
}) => (
  <div className="flex items-center space-x-3">
    <div className={`
      flex-shrink-0 w-2.5 h-2.5 rounded-full
      ${enabled ? 'bg-green-500' : 'bg-red-500'}
    `} />
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);