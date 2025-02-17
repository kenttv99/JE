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

export interface RequisiteFormData {
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  created_at: string;
}

const useTraderRequisites = () => {
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

  // Sends a payload containing only the status field.
  const updateRequisiteStatus = async (id: number, status: string) => {
    try {
      setLoading(true);
      await api.put(`/api/v1/trader_req/update_requisite/${id}`, { status });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update requisite status'));
    } finally {
      setLoading(false);
    }
  };

  // Soft delete: mark the requisite as "delete", a valid value per TraderReqStatus enum.
  const deleteRequisite = async (id: number) => {
    await updateRequisiteStatus(id, 'delete');
  };

  useEffect(() => {
    refetch();
  }, []);

  return { requisites, loading, error, refetch, updateRequisiteStatus, deleteRequisite };
};

export default useTraderRequisites;