'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NavigationButtons() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  if (status === 'loading') {
    return (
      <div className="flex gap-4 items-center">
        <div className="px-4 py-2 bg-gray-200 text-gray-500 rounded animate-pulse">
          Загрузка...
        </div>
      </div>
    );
  }

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
            href="/user"  // Changed from /profile to /user
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Личный кабинет  {/* Changed text from "Профиль" to "Личный кабинет" */}
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
              ${isSigningOut ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSigningOut && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isSigningOut ? 'Выход...' : 'Выйти'}
          </button>
        </>
      )}
    </div>
  );
}