'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTraderOrders } from '@/hooks/useTraderOrders';  // Импортируем useTraderOrders

export default function NavigationButtons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAcceptingOrders, toggleOrderAcceptance } = useTraderOrders();  // Получаем состояние и функцию из useTraderOrders
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/"
        className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
      >
        Главная
      </Link>

      {!session ? (
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Войти
        </Link>
      ) : (
        <>
          <Link
            href="/trader"
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Личный кабинет
          </Link>
          
          {session.user?.role === 'admin' && (
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Админ панель
            </Link>
          )}
          
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              ${isSigningOut ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSigningOut ? 'Выход...' : 'Выйти'}
          </button>
          <label className="inline-flex items-center cursor-pointer">
            <span className={`mr-2 text-sm ${isAcceptingOrders ? 'text-green-300' : 'text-red-300'}`}>
              {isAcceptingOrders ? 'Онлайн' : 'Оффлайн'}
            </span>
            <input
              type="checkbox"
              checked={isAcceptingOrders}
              onChange={(e) => toggleOrderAcceptance(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
          </label>
        </>
      )}
    </div>
  );
};