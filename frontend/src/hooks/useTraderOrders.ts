import { useState, useEffect } from 'react';
import axios from 'axios';

interface Order {
  id: string;
  detailsType: string;
  detailsNumber: string;
  createdAt: string;
  status: string;
}

interface UseTraderOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

export const useTraderOrders = (): UseTraderOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios.get('/api/orders?status=processing')
      .then(response => {
        setOrders(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return { orders, loading, error };
};