'use client';  // Убедились, что это клиентский компонент

import { useState, useEffect } from 'react';
import { useTraderOrders } from '@/hooks/useTraderOrders';
import { useAuth } from '@/hooks/useAuth';  // Импортируем useAuth
import OrdersTable from '@/components/TraderOrdersTable/TraderOrdersTable';
import { TraderOrder } from '@/types/trader';  // Используем твой интерфейс

const OrdersPage = () => {
  const { orders, loading, error, cancelOrder, confirmOrder, wsStatus } = useTraderOrders();
  const { session } = useAuth('trader');  // Получаем сессию трейдера
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Получаем traderId из сессии (хотя он больше не используется в этом файле)
  const traderId = session?.user?.id || '1';  // Используем '1' как дефолт (оставляем для совместимости)

  const handleCancelOrder = async (orderId: string) => {
    try {
      setIsProcessing(orderId);
      setActionError(null);
      await cancelOrder(orderId);
    } catch (err: any) {  // Указываем тип 'any' для err
      setActionError('Ошибка при отмене заказа. Пожалуйста, попробуйте снова.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      setIsProcessing(orderId);
      setActionError(null);
      await confirmOrder(orderId);
    } catch (err: any) {  // Указываем тип 'any' для err
      setActionError('Ошибка при подтверждении заказа. Пожалуйста, попробуйте снова.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading && !orders.length) {  // Показываем загрузку только если нет ордеров
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
          <div className="bg-blue-500 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Ордера</h1>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                wsStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <span className={`h-2 w-2 rounded-full mr-1 ${
                  wsStatus === 'connected' ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
                {wsStatus === 'connected' ? 'Онлайн' : 'Оффлайн'}
              </span>
            </div>
          </div>

          {(error || actionError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 my-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error || actionError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {isProcessing && isProcessing !== 'toggle' ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-gray-600">Обработка...</span>
              </div>
            ) : (
              <OrdersTable 
                orders={orders} 
                onCancel={handleCancelOrder} 
                onConfirm={handleConfirmOrder} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;