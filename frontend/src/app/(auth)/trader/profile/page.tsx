'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

interface ProfileUser {
  id: string;
  email: string;
  role?: string;
  verification_level?: number;
  created_at?: string;
  updated_at?: string;
  pay_in?: boolean;
  pay_out?: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        timeZone: selectedTimezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(dateString));
    } catch {
      return 'Некорректная дата';
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    try {
      const response = await fetch('/api/v1/traders/change_password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        } as PasswordChangeRequest),
      });

      if (response.ok) {
        toast.success('Пароль успешно изменен');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const data = await response.json();
        toast.error(data.message || 'Ошибка при смене пароля');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Ошибка при смене пароля');
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Доступ запрещен</p>
      </div>
    );
  }

  const user = session.user as ProfileUser;

  return (
    <div className="min-mx-[200px]">
      <div className="bg-white shadow rounded-lg">
        <div className="bg-blue-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Профиль пользователя</h1>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - User Information */}
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
                  <label className="block text-sm font-medium text-gray-700">Дата регистрации</label>
                  <p className="mt-1 text-gray-900">{formatDate(user.created_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Последнее обновление</label>
                  <p className="mt-1 text-gray-900">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Status Information */}
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
              </div>
            </div>
          </div>

          {/* Timezone Selection */}
          <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Настройки отображения времени</h2>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
              <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
              <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
              <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
            </select>
          </div>

          {/* Password Change Section */}
          <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Изменение пароля</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Изменить пароль
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}