// JE/frontend/src/hooks/useTraderOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Импортируем useQuery, useMutation
import { ordersSocket } from '@/services/websocket/ordersSocket';
import { TraderOrder } from '@/types/trader';
import { useAuth } from '@/hooks/useAuth';

export const useTraderOrders = () => {
  const { session, status, isLoading: authLoading } = useAuth('trader');
  const [orders, setOrders] = useState<TraderOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // Добавляем setLoading как состояние
  const queryClient = useQueryClient();

  // Получаем traderId из сессии next-auth
  const traderId = status === 'authenticated' && session?.user?.id ? session.user.id : '1';

  // Используем useQuery для фетча ордеров
  const { data: fetchedOrders, isLoading: queryLoading, isError, refetch } = useQuery<TraderOrder[], Error>({
    queryKey: ['traderOrders', traderId],
    queryFn: async () => {
      if (authLoading || status !== 'authenticated') throw new Error('User not authenticated');
      const token = session?.accessToken || '';
      if (!token) throw new Error('No authentication token available');

      const response = await fetch(`/api/v1/trader_orders/?skip=0&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      const data = await response.json();
      const formattedOrders: TraderOrder[] = data.map((order: any) => ({
        id: order.id.toString(),
        date: order.created_at || new Date().toISOString(),
        status: (order.status as string) as 'pending' | 'completed' | 'cancelled' || 'pending',
        amount: Number(order.amount_currency) || 0,
        type: (order.order_type as string) as 'buy' | 'sell' || 'buy',
      }));
      return formattedOrders;
    },
    enabled: status === 'authenticated' && !authLoading, // Запрос выполняется только если пользователь авторизован
  });

  // Мутации для cancelOrder и confirmOrder
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const token = session?.accessToken || '';
      if (!token) throw new Error('No authentication token available');
      const response = await fetch(`/api/v1/trader_orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traderOrders', traderId] }); // Используем объект для queryKey
    },
    onError: (err: Error) => {
      setError(err.message || 'Не удалось отменить ордер');
      console.error('Error canceling order:', err);
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const token = session?.accessToken || '';
      if (!token) throw new Error('No authentication token available');
      const response = await fetch(`/api/v1/trader_orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!response.ok) throw new Error('Failed to confirm order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traderOrders', traderId] }); // Используем объект для queryKey
    },
    onError: (err: Error) => {
      setError(err.message || 'Не удалось подтвердить ордер');
      console.error('Error confirming order:', err);
    },
  });

  const fetchOrders = useCallback(() => {
    refetch();
  }, [refetch]);

  const toggleOrderAcceptance = async (newStatus: boolean) => {
    try {
      const token = session?.accessToken || '';
      if (!token) {
        console.error('No access token available');
        setError('Не удалось получить токен авторизации');
        return;
      }
      const body = JSON.stringify(newStatus);
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
      setIsAcceptingOrders(data); // Обновляем состояние на основе ответа бэкенда
      if (!newStatus) {
        ordersSocket.disconnect();
        setWsStatus('disconnected');
      } else if (status === 'authenticated') {
        ordersSocket.connect({
          url: 'ws://localhost:8001/api/v1/ws/orders',
          traderId,
          token,
        });
        setWsStatus('connected');
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось переключить состояние онлайн/оффлайн');
      console.error('Error toggling order acceptance:', err);
    }
  };

  useEffect(() => {
    if (authLoading || status !== 'authenticated') {
      setOrders([]);
      setWsStatus('disconnected');
      setIsAcceptingOrders(false);
      setLoading(false); // Используем setLoading вместо setIsLoading
      return;
    }

    setOrders(fetchedOrders || []);
    setLoading(queryLoading); // Используем setLoading для обновления состояния
    if (isError) setError('Не удалось загрузить ордера');

    const fetchTraderProfile = async () => {
      try {
        const token = session?.accessToken || '';
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
      const token = session?.accessToken || '';
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
  }, [traderId, status, isAcceptingOrders, authLoading, fetchedOrders, queryLoading, isError]);

  return {
    orders,
    loading, // Используем loading вместо queryLoading
    error,
    cancelOrder: (orderId: string) => cancelOrderMutation.mutate(orderId),
    confirmOrder: (orderId: string) => confirmOrderMutation.mutate(orderId),
    refreshOrders: fetchOrders,
    wsStatus,
    isAcceptingOrders,
    toggleOrderAcceptance,
  };
};