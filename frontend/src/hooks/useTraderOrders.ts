import { useEffect, useState } from 'react';
import axios from 'axios';

interface Order {
  id: string;
  detailsType: string;
  detailsNumber: string;
  createdAt: string;
  status: string;
  // Add other fields as necessary
}

export function useTraderOrders(filterStatus: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/orders', {
          params: { status: filterStatus }
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]); // Set orders to an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filterStatus]);

  return { orders, loading, error };
}