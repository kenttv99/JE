// JE/frontend/src/hooks/useTraderOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersSocket } from '@/services/websocket/ordersSocket';
import { TraderOrder } from '@/types/trader';
import { useAuth } from '@/hooks/useAuth';

export const useTraderOrders = () => {
  const { session, status, isLoading: authLoading } = useAuth('trader');
  const [orders, setOrders] = useState<TraderOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
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
    enabled: status === 'authenticated' && !authLoading,
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
      queryClient.invalidateQueries({ queryKey: ['traderOrders', traderId] });
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
      queryClient.invalidateQueries({ queryKey: ['traderOrders', traderId] });
    },
    onError: (err: Error) => {
      setError(err.message || 'Не удалось подтвердить ордер');
      console.error('Error confirming order:', err);
    },
  });

  const fetchOrders = useCallback(() => {
    refetch();
  }, [refetch]);

  // Функция для управления состоянием приема ордеров
  const toggleOrderAcceptance = async (newStatus: boolean) => {
    try {
      console.log(`Toggling order acceptance to: ${newStatus}`);
      
      const token = session?.accessToken || '';
      if (!token) {
        console.error('No access token available');
        setError('Не удалось получить токен авторизации');
        return;
      }
      
      // Сначала обновляем UI для лучшего UX
      setIsAcceptingOrders(newStatus);
      
      // Отправляем запрос на сервер
      const response = await fetch(`/api/v1/traders/${traderId}/toggle-online-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to toggle online status:', response.status, errorText);
        // Возвращаем предыдущее состояние в случае ошибки
        setIsAcceptingOrders(!newStatus);
        throw new Error(`Failed to toggle online status: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // Отключаем WebSocket, если статус изменился на "не принимать ордера"
      if (!newStatus) {
        console.log('Disconnecting WebSocket due to order acceptance turned off');
        ordersSocket.disconnect();
        setWsStatus('disconnected');
      } 
      // Подключаем WebSocket, если статус изменился на "принимать ордера"
      else if (status === 'authenticated') {
        // Если WebSocket уже подключен, не переподключаемся
        if (!ordersSocket.isConnected()) {
          console.log('Connecting WebSocket due to order acceptance turned on');
          ordersSocket.connect({
            url: 'ws://localhost:8001/api/v1/ws/orders',
            traderId,
            token,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось переключить состояние онлайн/оффлайн');
      console.error('Error toggling order acceptance:', err);
    }
  };

  // Инициализация WebSocket и обработчиков событий
  useEffect(() => {
    // Если пользователь не аутентифицирован, сбросить состояние
    if (authLoading || status !== 'authenticated') {
      setOrders([]);
      setWsStatus('disconnected');
      setIsAcceptingOrders(false);
      setLoading(false);
      return;
    }

    // Обновляем список ордеров из обычного API-запроса
    setOrders(fetchedOrders || []);
    setLoading(queryLoading);
    if (isError) setError('Не удалось загрузить ордера');

    // Получаем статус приема ордеров из профиля трейдера
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
        
        // Подключаем WebSocket только если трейдер в режиме приема ордеров
        if (data.pay_in && !ordersSocket.isConnected()) {
          console.log('Connecting WebSocket based on trader profile pay_in status');
          ordersSocket.connect({
            url: 'ws://localhost:8001/api/v1/ws/orders',
            traderId,
            token,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить состояние онлайн');
        console.error('Error fetching trader profile:', err);
      }
    };

    fetchTraderProfile();

    // Настройка обработчиков событий WebSocket
    // Важно: мы устанавливаем слушателей, даже если не подключены,
    // чтобы они работали при последующем подключении
    
    const onConnect = () => {
      console.log('WebSocket connected');
      setWsStatus('connected');
    };
    
    const onDisconnect = (event?: CloseEvent) => {
      console.log('WebSocket disconnected', event);
      setWsStatus('disconnected');
      if (event?.code !== 1000) {
        console.error('WebSocket disconnected unexpectedly, code:', event?.code, 'reason:', event?.reason || 'No reason provided');
      }
    };
    
    const onOrdersUpdate = (updatedOrders: TraderOrder[]) => {
      console.log('Received orders update via WebSocket', updatedOrders.length);
      setOrders(updatedOrders);
    };
    
    const onError = (error: any) => {
      console.error('WebSocket error:', error);
      setError(typeof error === 'string' ? error : 'WebSocket error');
    };

    // Устанавливаем слушателей событий
    ordersSocket.on('connect', onConnect);
    ordersSocket.on('disconnect', onDisconnect);
    ordersSocket.on('orders_update', onOrdersUpdate);
    ordersSocket.on('error', onError);

    // Очистка при размонтировании компонента
    return () => {
      // Отключаем WebSocket только при размонтировании компонента
      ordersSocket.disconnect();
    };
  }, [traderId, status, authLoading, fetchedOrders, queryLoading, isError, session]);

  return {
    orders,
    loading,
    error,
    cancelOrder: (orderId: string) => cancelOrderMutation.mutate(orderId),
    confirmOrder: (orderId: string) => confirmOrderMutation.mutate(orderId),
    refreshOrders: fetchOrders,
    wsStatus,
    isAcceptingOrders,
    toggleOrderAcceptance,
  };
};