import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { addHours } from 'date-fns';
import { ordersSocket, ConnectionStatus, OrderEvent, WSMessage } from '@/services/websocket';

export interface Order {
  id: string;
  method: string;
  bank: string;
  number: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

// Configuration options with defaults
const CONFIG = {
  POLLING_INTERVAL: 10000, // 10 seconds
  ORDER_EXPIRY: 3600000 // 1 hour in milliseconds
};

export const useTraderOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('disconnected');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatOrder = useCallback((order: any): Order => {
    return {
      id: order.id,
      method: order.payment_method || order.method || '',
      bank: order.bank || '',
      number: order.req_number || order.number || '',
      createdAt: order.created_at || order.createdAt,
      expiresAt: order.expires_at || order.expiresAt || 
                addHours(new Date(order.created_at || order.createdAt), 1).toISOString(),
      status: order.status
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      
      const response = await api.get('/api/v1/trader_orders');
      
      // Transform the data to match our Order interface
      const formattedOrders = response.data.map(formatOrder);
      
      setOrders(formattedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [formatOrder]);

  const addOrderIfNotExists = useCallback((newOrder: Order) => {
    setOrders(prevOrders => {
      // Check if order already exists
      const exists = prevOrders.some(order => order.id === newOrder.id);
      if (!exists) {
        // Add the new order at the beginning of the array
        return [newOrder, ...prevOrders];
      }
      return prevOrders;
    });
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
  }, []);

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await api.post(`/api/v1/trader_orders/${orderId}/cancel`);
      
      // Update local state to reflect the change
      updateOrderStatus(orderId, 'cancelled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      throw err;
    }
  }, [updateOrderStatus]);

  const confirmOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await api.post(`/api/v1/trader_orders/${orderId}/confirm`);
      
      // Update local state to reflect the change
      updateOrderStatus(orderId, 'completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm order');
      throw err;
    }
  }, [updateOrderStatus]);

  // Process WebSocket messages
  const handleWebSocketMessage = useCallback((message: WSMessage<OrderEvent>) => {
    const event = message.payload; // Извлекаем OrderEvent из payload
    switch (event.type) {
      case 'order_created':
        addOrderIfNotExists(formatOrder(event.payload));
        break;
      case 'order_updated':
        updateOrderStatus(event.payload.id, event.payload.status);
        break;
      case 'order_deleted':
        setOrders(prevOrders => prevOrders.filter(order => order.id !== event.payload.id));
        break;
      default:
        break;
    }
  }, [addOrderIfNotExists, formatOrder, updateOrderStatus]);

  // Setup WebSocket subscription and polling fallback
  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Subscribe to WebSocket events
    const unsubscribe = ordersSocket.subscribe(handleWebSocketMessage);
    
    // Keep track of connection status
    const statusCheck = setInterval(() => {
      const currentStatus = ordersSocket.getStatus();
      setWsStatus(currentStatus);
      
      // If WebSocket is disconnected, ensure we have polling active
      if (currentStatus !== 'connected' && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchOrders();
        }, CONFIG.POLLING_INTERVAL);
      } else if (currentStatus === 'connected' && pollingIntervalRef.current) {
        // If WebSocket is connected and polling is active, turn off polling
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 2000);
    
    // Try to connect if not already connected
    if (ordersSocket.getStatus() !== 'connected') {
      ordersSocket.connect();
    }
    
    return () => {
      unsubscribe();
      clearInterval(statusCheck);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchOrders, handleWebSocketMessage]);

  return { 
    orders, 
    loading, 
    error,
    cancelOrder,
    confirmOrder,
    refreshOrders: fetchOrders,
    wsStatus
  };
};