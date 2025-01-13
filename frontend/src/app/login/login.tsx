// frontend/src/app/pages/login.tsx

"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavigationButtons from '../../components/NavigationButtons';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', `Bearer ${access_token}`);
      router.push('/profile'); // Перенаправление на страницу профиля после успешной авторизации
    } catch (err) {
      console.error('Ошибка при авторизации:', err); // Используем переменную err для логирования ошибки
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="login-page">
      <h1>Авторизация</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Войти</button>
      </form>
      <NavigationButtons />
      <style jsx>{`
        .login-page {
          max-width: 400px;
          margin: 0 auto;
          padding: 1rem;
        }
        form {
          display: flex;
          flex-direction: column;
        }
        label {
          margin-bottom: 0.5rem;
        }
        input {
          margin-bottom: 1rem;
          padding: 0.5rem;
          font-size: 1rem;
        }
        .error {
          color: red;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;