'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    const passwordChangeRequest: PasswordChangeRequest = {
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    };

    try {
      const response = await fetch('/traders/change_password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(passwordChangeRequest),
      });

      if (response.ok) {
        toast.success('Пароль успешно изменен');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Ошибка при смене пароля');
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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-blue-500 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Профиль</h1>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{session.user.email}</p>
              </div>

              {/* Verification Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Уровень верификации</label>
                <p className="mt-1 text-gray-900">
                  {session.user.verification_level || 'Не верифицирован'}
                </p>
              </div>
            </div>
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

          {/* Referral Information */}
          <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Реферальная программа</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pay In</label>
                <p className="mt-1 text-gray-900">
                  {session.user.pay_in ? 'Активно' : 'Неактивно'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pay Out</label>
                <p className="mt-1 text-gray-900">
                  {session.user.pay_out ? 'Активно' : 'Неактивно'}
                </p>
              </div>

              {(session.user.pay_in || session.user.pay_out) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Реферальная ссылка
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/ref/${session.user.id}`}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/ref/${session.user.id}`);
                        toast.success('Ссылка скопирована');
                      }}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}