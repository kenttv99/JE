// frontend/src/hooks/usePasswordChange.ts
import { useState } from 'react';
import api from '@/lib/api';
import { validatePassword } from '@/utils';

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


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (!validatePassword(passwords.newPassword)) {
        setPasswordError('Новый пароль должен содержать минимум 8 символов');
        return;
      }

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/traders/change_password', {
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
      setPasswordError(error.response?.data?.detail || 'Ошибка при смене пароля');
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