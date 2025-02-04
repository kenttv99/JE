'use client';

import { useMemo } from 'react';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useDateTime } from '@/hooks/useDateTime';
import { useTraderTimezone } from '@/hooks/useTraderTimezone';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useProfile } from '@/hooks/useProfile';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TraderData, DEFAULT_TRADER_DATA } from '@/types/auth';
import { useSessionContext } from '@/contexts/SessionContext';

// Helper Components - Memoized for better performance
const InfoField = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <p className="mt-1 text-gray-900">{value || 'Не указано'}</p>
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

// Error Alert Component
const ErrorAlert = ({ message }: { message: string }) => (
  <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm text-yellow-700">{message}</p>
      </div>
    </div>
  </div>
);

export default function TraderProfilePage() {
  // Use centralized session management
  const { session, isLoading: sessionLoading } = useSessionContext();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { 
    timeZones, 
    selectedTimezone,
    error: timezoneError,
    isLoading: timezoneLoading,
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

  // Memoize trader data to prevent unnecessary recalculations
  const traderData: TraderData = useMemo(() => ({
    ...DEFAULT_TRADER_DATA,
    ...(session?.user || {}),
    ...(profile || {})
  }), [session?.user, profile]);

  // Memoize timezone calculations
  const { currentTimezoneId, selectedTz } = useMemo(() => {
    const tzId = typeof selectedTimezone === 'string' 
      ? parseInt(selectedTimezone, 10) 
      : selectedTimezone;
    return {
      currentTimezoneId: tzId,
      selectedTz: timeZones.find(tz => tz.id === tzId)
    };
  }, [selectedTimezone, timeZones]);

  // Use current time with selected timezone
  const currentTime = useDateTime(selectedTz?.utc_offset ?? 0);

  // Show loading spinner during initial load
  if (sessionLoading || (profileLoading && !profileError)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white shadow rounded-lg">
        {/* Header Section */}
        <div className="bg-blue-500 px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold text-white">Профиль трейдера</h1>
          <div className="text-white text-sm mt-2 flex items-center space-x-2">
            <span>Текущее время:</span>
            <span className="font-semibold">{currentTime || 'Загрузка...'}</span>
          </div>
        </div>

        {/* Error Messages */}
        {(profileError || timezoneError) && (
          <ErrorAlert message={profileError || timezoneError || 'Произошла ошибка'} />
        )}

        {/* Main Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - User Information */}
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Информация о пользователе
                </h2>
                <div className="space-y-4">
                  <InfoField label="Email" value={traderData.email} />
                  <InfoField label="Роль" value="trader" />
                  <InfoField 
                    label="Статус верификации" 
                    value={`Уровень ${traderData.verification_level}`} 
                  />
                  <InfoField 
                    label="Дата регистрации" 
                    value={traderData.created_at 
                      ? new Date(traderData.created_at).toLocaleString('ru-RU')
                      : undefined
                    } 
                  />
                </div>
              </div>

              {/* Bank Details Card */}
              {traderData.bankDetails && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Банковские реквизиты
                  </h2>
                  <div className="space-y-4">
                    <InfoField label="Банк" value={traderData.bankDetails.bankName} />
                    <InfoField label="Номер счета" value={traderData.bankDetails.accountNumber} />
                    <InfoField label="БИК" value={traderData.bankDetails.bik} />
                    <InfoField 
                      label="Корр. счет" 
                      value={traderData.bankDetails.correspondentAccount} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Trading Permissions Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Направления для торговли
                </h2>
                <div className="space-y-4">
                  <PermissionBadge 
                    enabled={traderData.pay_in}
                    label="Pay-In"
                    description="Возможность принимать средства"
                  />
                  <PermissionBadge 
                    enabled={traderData.pay_out}
                    label="Pay-Out"
                    description="Возможность выводить средства"
                  />
                </div>
              </div>

              {/* Timezone Settings Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Настройки времени
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Часовой пояс
                    </label>
                    <select
                      id="timezone"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                               focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                               sm:text-sm rounded-md"
                      value={selectedTimezone}
                      onChange={(e) => handleTimezoneChange(e.target.value)}
                      disabled={timezoneLoading}
                    >
                      {timeZones.map((tz) => (
                        <option key={tz.id} value={tz.id}>
                          {tz.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Изменение пароля
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Текущий пароль
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                               focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={passwords.currentPassword}
                      onChange={handlePasswordInput}
                      autoComplete="current-password"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                               focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={passwords.newPassword}
                      onChange={handlePasswordInput}
                      autoComplete="new-password"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                               focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordInput}
                      autoComplete="new-password"
                    />
                  </div>
                  
                  {passwordError && (
                    <p className="text-sm text-red-600" role="alert">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-600" role="alert">{passwordSuccess}</p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent 
                              rounded-md shadow-sm text-sm font-medium text-white 
                              ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                              transition-colors duration-200
                              disabled:opacity-50 disabled:cursor-not-allowed`}
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