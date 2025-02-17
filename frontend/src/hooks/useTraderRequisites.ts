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
      }
    } finally {
      setLoading(false);
    }
  };

  // Update status primarily used for deletion.
  const updateRequisiteStatus = async (id: number, status: string) => {
    try {
      setLoading(true);
      await api.put(`/api/v1/trader_req/update_requisite/${id}`, { status });
      // For status update we refetch, since deletion may be more involved.
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update requisite status'));
    } finally {
      setLoading(false);
    }
  };

  // New generic update function for toggling properties.
  // This version uses an optimistic update to change local state without reloading the entire page.
  const updateRequisiteProperties = async (
    id: number,
    payload: Partial<Pick<Requisite, 'can_buy' | 'can_sell'>>
  ) => {
    try {
      // Optimistically update local requisite state.
      setRequisites((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, ...payload, updated_at: new Date().toISOString() } : req
        )
      );
      // Perform the API update; no need to refetch the entire list.
      await api.put(`/api/v1/trader_req/update_requisite/${id}`, payload);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update requisite properties'));
      // If the API call fails, refetch to sync state.
      await refetch();
    }
  };

  // Soft delete: mark the requisite as "deleted" (must match your backend enum).
  const deleteRequisite = async (id: number) => {
    await updateRequisiteStatus(id, 'deleted');
  };

  useEffect(() => {
    refetch();
  }, []);

  return { requisites, loading, error, refetch, updateRequisiteStatus, updateRequisiteProperties, deleteRequisite };
};

export default useTraderRequisites;