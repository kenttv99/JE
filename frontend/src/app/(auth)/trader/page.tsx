'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import NavigationButtons from '@/components/NavigationButtons';

export default function TraderPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8 px-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">У вас нет прав для просмотра страницы трейдера</p>
          <NavigationButtons />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-500 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Панель трейдера</h1>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Портфолио */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Мое портфолио</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Активные сделки: 0</p>
                  <p className="text-gray-600">Баланс: 0 USDT</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Управление портфолио
                  </button>
                </div>
              </div>

              {/* Торговые сигналы */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Торговые сигналы</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Новых сигналов: 0</p>
                  <p className="text-gray-600">Активных подписок: 0</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Просмотр сигналов
                  </button>
                </div>
              </div>

              {/* Аналитика */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Аналитика</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Прибыль за месяц: 0%</p>
                  <p className="text-gray-600">ROI: 0%</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Подробная статистика
                  </button>
                </div>
              </div>

              {/* График производительности */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">График производительности</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">График будет доступен после совершения первой сделки</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 border-t border-gray-200">
            <NavigationButtons />
          </div>
        </div>
      </div>
    </div>
  );
}