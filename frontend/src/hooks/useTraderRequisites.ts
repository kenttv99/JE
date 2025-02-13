import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FormError {
  field: string;
  message: string;
}

export interface RequisiteFormData {
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  created_at?: string;
}

export const useTraderRequisites = () => {
  const [requisites, setRequisites] = useState<Requisite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequisites = async () => {
    try {
      const response = await api.get<Requisite[]>('/api/v1/trader_req/all_requisites');
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch requisites');
      setError(error);
      return null;
    }
  };

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await fetchRequisites();
      if (data) {
        setRequisites(data);
        return data;
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    refetch();
  }, []);

  return { requisites, loading, error, refetch };
};