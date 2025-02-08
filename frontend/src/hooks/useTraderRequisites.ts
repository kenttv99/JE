import { useState, useEffect } from 'react';
import axios from 'axios';

interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  payment_details: string;
  status: string;
}

export const useTraderRequisites = () => {
  const [requisites, setRequisites] = useState<Requisite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRequisites = async () => {
      try {
        const response = await axios.get<Requisite[]>('/api/v1/trader_req/all_requisites');
        setRequisites(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequisites();
  }, []);

  return { requisites, loading, error };
};