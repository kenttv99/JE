'use client';

import {
  XMarkIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { traderNavigation } from '@/config/navigation';
import { useProfile } from '@/hooks/useProfile';

interface TraderLayoutProps {
  children: React.ReactNode;
}

export default function TraderLayout({ children }: TraderLayoutProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { profile, isLoading } = useProfile();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'trader') {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
        <div className="container h-full mx-auto px-4">
          <div className="h-full flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 mr-4 focus:outline-none"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-600" />
                )}
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Кабинет трейдера</h1>
            </div>

            {/* Balance Display */}
            <div className="flex items-center">
              <div className={`bg-gray-100 rounded-md px-4 py-2 flex items-center ${isLoading ? 'animate-pulse' : ''}`}>
                <span className="text-sm font-medium text-gray-700">
                  {isLoading ? 'Загрузка...' : `Баланс: ${profile?.balance || '0.00'} ${profile?.fiat_currency || 'RUB'}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 pt-16
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {traderNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200
                        ${isActive(item.href)
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                        }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2">
              Статус верификации: {session.user.verification_level || 'Не верифицирован'}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 w-full"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
              Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen pt-16 ${sidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>
        <div className="p-4">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}