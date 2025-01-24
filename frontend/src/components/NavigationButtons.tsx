'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function NavigationButtons() {
  const { data: session } = useSession();

  return (
    <div className="flex gap-4 mt-8">
      <Link
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        На главную
      </Link>
      {!session ? (
        <Link
          href="/login"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Войти
        </Link>
      ) : (
        <>
          <Link
            href="/profile"
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Профиль
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Выйти
          </button>
        </>
      )}
    </div>
  );
}