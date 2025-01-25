'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import NavigationButtons from '@/components/NavigationButtons';

export default function MerchantPage() {
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
          <p className="text-gray-600 mb-4">У вас нет прав для просмотра страницы продавца</p>
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
            <h1 className="text-2xl font-bold text-white">Панель продавца</h1>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Карточка с информацией о товарах */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Мои товары</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Всего товаров: 0</p>
                  <p className="text-gray-600">Активных: 0</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Добавить товар
                  </button>
                </div>
              </div>

              {/* Карточка с заказами */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Заказы</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Новых заказов: 0</p>
                  <p className="text-gray-600">В обработке: 0</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Просмотреть заказы
                  </button>
                </div>
              </div>

              {/* Карточка со статистикой */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Продажи за месяц: 0</p>
                  <p className="text-gray-600">Средний рейтинг: -</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Подробная статистика
                  </button>
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