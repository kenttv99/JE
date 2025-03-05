import { useState, useEffect, useCallback } from 'react';
import { ordersSocket } from '@/services/websocket/ordersSocket';
import { TraderOrder } from '@/types/trader';  // Используем твой интерфейс
import { useAuth } from '@/hooks/useAuth';  // Используем хук для авторизации

export const useTraderOrders = () => {
  const { session, status, isLoading } = useAuth('trader');  // Получаем isLoading
  const [orders, setOrders] = useState<TraderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean>(false);  // Начальное значение false для безопасности

  // Получаем traderId из сессии next-auth
  const traderId = status === 'authenticated' && session?.user?.id ? session.user.id : '1';  // Используем '1' как дефолт

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = session?.accessToken || localStorage.getItem('token') || '';  // Используем токен из next-auth
      if (!token) {
        throw new Error('No authentication token available');
      }
      const response = await fetch(`/api/v1/trader_orders/?skip=0&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,  // Используем токен из next-auth
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // Преобразуем данные из REST API в формат TraderOrder
      const formattedOrders: TraderOrder[] = data.map((order: any) => ({
        id: order.id.toString(),
        date: order.created_at || new Date().toISOString(),  // Устанавливаем дефолтную дату
        status: (order.status as string) as 'pending' | 'completed' | 'cancelled' || 'pending',
        amount: Number(order.amount_currency) || 0,  // Дефолт 0
        type: (order.order_type as string) as 'buy' | 'sell' || 'buy',
      }));
      setOrders(formattedOrders);
    } catch (err: any) {  // Указываем тип 'any' для err
      setError(err.message || 'Не удалось загрузить ордера');
      console.error('Error fetching orders:', err);
      setOrders([]);  // Устанавливаем пустой список, чтобы не застревать в загрузке
    } finally {
      setLoading(false);
    }
  }, [traderId, session]);

  const cancelOrder = async (orderId: string) => {
    try {
      const token = session?.accessToken || localStorage.getItem('token') || '';
      if (!token) throw new Error('No authentication token available');
      const response = await fetch(`/api/v1/trader_orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      await fetchOrders();
    } catch (err: any) {  // Указываем тип 'any' для err
      console.error('Error canceling order:', err);
      throw new Error(err.message);
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const token = session?.accessToken || localStorage.getItem('token') || '';
      if (!token) throw new Error('No authentication token available');
      const response = await fetch(`/api/v1/trader_orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),  // Адаптируй под твою схему
      });
      if (!response.ok) throw new Error('Failed to confirm order');
      await fetchOrders();
    } catch (err: any) {  // Указываем тип 'any' для err
      console.error('Error confirming order:', err);
      throw new Error(err.message);
    }
  };

  const refreshOrders = () => {
    fetchOrders();
  };

  const toggleOrderAcceptance = async (newStatus: boolean) => {
    try {
      const token = session?.accessToken || localStorage.getItem('token') || '';
      if (!token) {
        console.error('No access token available');
        setError('Не удалось получить токен авторизации');
        return;
      }
      const body = JSON.stringify(newStatus);  // Отправляем просто true или false
      const response = await fetch(`/api/v1/traders/${traderId}/toggle-online-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to toggle online status:', response.status, errorText);
        throw new Error(`Failed to toggle online status: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setIsAcceptingOrders(data);  // Обновляем состояние на основе ответа бэкенда
      if (!newStatus) {
        ordersSocket.disconnect();  // Закрываем WebSocket при выключении
        setWsStatus('disconnected');
      } else if (status === 'authenticated') {
        // Подключаем WebSocket заново при включении
        ordersSocket.connect({
          url: 'ws://localhost:8001/api/v1/ws/orders',
          traderId,
          token,  // Передаём токен
        });
        setWsStatus('connected');
      }
    } catch (err: any) {  // Указываем тип 'any' для err
      setError(err.message || 'Не удалось переключить состояние онлайн/оффлайн');
      console.error('Error toggling order acceptance:', err);
    }
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();

      const fetchTraderProfile = async () => {
        try {
          const token = session?.accessToken || localStorage.getItem('token') || '';
          if (!token) {
            setError('Не удалось получить токен авторизации');
            return;
          }
          const response = await fetch(`/api/v1/traders/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Failed to fetch trader profile');
          const data = await response.json() as { pay_in: boolean };
          setIsAcceptingOrders(data.pay_in || false);
        } catch (err: any) {
          setError(err.message || 'Не удалось загрузить состояние онлайн');
          console.error('Error fetching trader profile:', err);
        }
      };

      fetchTraderProfile();

      if (isAcceptingOrders) {
        const token = session?.accessToken || localStorage.getItem('token') || '';
        ordersSocket.connect({
          url: 'ws://localhost:8001/api/v1/ws/orders',
          traderId,
          token,
        });

        const timeout = setTimeout(() => {
          if (wsStatus === 'disconnected') {
            setError('Не удалось установить соединение с WebSocket. Проверьте сервер.');
            console.error('WebSocket connection timeout');
          }
        }, 5000);

        ordersSocket.on('orders_update', (updatedOrders: TraderOrder[]) => {
          setOrders(updatedOrders);
          setWsStatus('connected');
          clearTimeout(timeout);
        });

        ordersSocket.on('error', (error: any) => {
          setError(error.message || 'WebSocket error');
          setWsStatus('disconnected');
          console.error('WebSocket error:', JSON.stringify(error));
          clearTimeout(timeout);
        });

        ordersSocket.on('disconnect', (event?: CloseEvent) => {
          setWsStatus('disconnected');
          if (event?.code !== 1000) {
            console.error('WebSocket disconnected unexpectedly, code:', event?.code, 'reason:', event?.reason || 'No reason provided');
          }
          clearTimeout(timeout);
        });
      }

      return () => {
        ordersSocket.disconnect();
      };
    } else {
      setLoading(false);
      setOrders([]);
      setWsStatus('disconnected');
      setIsAcceptingOrders(false);
    }
  }, [fetchOrders, traderId, status, isAcceptingOrders, isLoading]);

  return { 
    orders, 
    loading, 
    error, 
    cancelOrder, 
    confirmOrder, 
    refreshOrders, 
    wsStatus, 
    isAcceptingOrders, 
    toggleOrderAcceptance 
  };
};