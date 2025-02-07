'use client';

import { FC } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTraderTimezone } from '@/hooks/useTraderTimezone';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useProfile } from '@/hooks/useProfile';
import { useTraderAddresses } from '@/hooks/useTraderAddresses';
import { TraderData, DEFAULT_TRADER_DATA } from '@/types/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMemo } from 'react';

interface InfoFieldProps {
  label: string;
  value: string | number | undefined;
}

interface StatusBadgeProps {
  enabled: boolean | undefined;
  label: string;
  description: string;
}

const InfoField: FC<InfoFieldProps> = ({ label, value }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <p className="mt-1 text-sm text-gray-900">{value || 'Не указано'}</p>
  </div>
);

const StatusBadge: FC<StatusBadgeProps> = ({ enabled, label, description }) => (
  <div className="flex items-center space-x-3 p-2">
    <div className={`
      flex-shrink-0 w-2.5 h-2.5 rounded-full
      ${enabled ? 'bg-green-500' : 'bg-red-500'}
    `} />
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

const TrustedAddressesList: FC = () => {
  const { addresses, isLoading, error } = useTraderAddresses();

  return (
    <div className="divide-y divide-gray-200">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm p-4">{error}</p>
      ) : addresses.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Нет доверенных адресов
        </div>
      ) : (
        <>
          {addresses.map((address) => (
            <div key={address.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{address.wallet_number}</p>
                  <p className="text-sm text-gray-500">{address.network} • {address.coin}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Обновлено: {new Date(address.updated_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                    ${address.status === 'verified' ? 'bg-green-100 text-green-800' :
                      address.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}
                  `}>
                    {address.status === 'verified' ? 'Подтвержден' :
                     address.status === 'rejected' ? 'Отклонен' : 'На проверке'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const TraderProfilePage: FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const {
    isOpen,
    dropdownRef,
    handleMouseEnter,
    handleMouseLeave,
    toggleDropdown
  } = useTraderAddresses();

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

  const traderData: TraderData = useMemo(() => ({
    ...DEFAULT_TRADER_DATA,
    ...(session?.user || {}),
    ...(profile || {})
  }), [session?.user, profile]);

  if (status === 'loading' || (profileLoading && !profileError)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-600">Загрузка профиля</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Ошибка загрузки профиля</h3>
            <p className="mt-2 text-sm text-gray-500">{profileError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Профиль трейдера</h1>
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Доверенные адреса
                </button>
                {isOpen && (
                  <div
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200"
                  >
                    <TrustedAddressesList />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Основная информация
                  </h2>
                  <InfoField label="Email" value={traderData.email} />
                  <InfoField label="Статус" value={traderData.verification_level ? `${traderData.verification_level}` : 'Не верифицирован'} />
                  <InfoField 
                    label="Дата регистрации" 
                    value={traderData.created_at 
                      ? new Date(traderData.created_at).toLocaleString('ru-RU')
                      : undefined
                    } 
                  />
                </div>

                {/* Trading Permissions */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Торговые разрешения
                  </h2>
                  <StatusBadge 
                    enabled={traderData.pay_in}
                    label="Pay-In"
                    description="Прием средств"
                  />
                  <StatusBadge 
                    enabled={traderData.pay_out}
                    label="Pay-Out"
                    description="Вывод средств"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Timezone Settings */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                      {timezoneError && (
                        <p className="mt-2 text-sm text-red-600">{timezoneError}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Change */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                        ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        transition-colors duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <LoadingSpinner />
                          <span className="ml-2">Сохранение...</span>
                        </div>
                      ) : (
                        'Изменить пароль'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderProfilePage;