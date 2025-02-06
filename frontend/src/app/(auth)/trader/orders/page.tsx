'use client';

import { useState } from 'react';
import { useTraderOrders } from '@/hooks/useTraderOrders';
import OrdersTable from '@/components/TraderOrdersTable';

const OrdersPage = () => {
  const [filterStatus, setFilterStatus] = useState('processing');
  const { orders, loading, error } = useTraderOrders(filterStatus);

  const handleCancelOrder = (orderId: string) => {
    // Implement order cancellation logic
  };

  const handleConfirmOrder = (orderId: string) => {
    // Implement order confirmation logic
  };

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
          <div className="bg-blue-500 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Заказы</h1>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="processing">В обработке</option>
              <option value="completed">Выполнено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>

          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Нет заказов</div>
            ) : (
              <OrdersTable orders={orders} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;