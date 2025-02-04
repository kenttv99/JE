// frontend/src/hooks/usePasswordChange.ts
import { useState, FormEvent } from 'react';
import api from '@/lib/api';

interface Passwords {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const usePasswordChange = () => {
  const [passwords, setPasswords] = useState<Passwords>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать минимум 8 символов');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put('/api/v1/traders/change_password', {
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword
      });

      setPasswordSuccess('Пароль успешно изменен');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 403 || status === 401) {
          setPasswordError('Неверный текущий пароль');
        } else if (data?.detail) {
          setPasswordError(typeof data.detail === 'string' ? data.detail : 'Ошибка при смене пароля');
        } else if (Array.isArray(data) && data.length > 0) {
          setPasswordError(data[0].msg || 'Ошибка при смене пароля');
        } else {
          setPasswordError('Ошибка при смене пароля');
        }
      } else {
        setPasswordError('Ошибка при смене пароля');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error and success messages when user starts typing
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  return {
    passwords,
    passwordError,
    passwordSuccess,
    isSubmitting,
    handlePasswordChange,
    handlePasswordInput
  };
};