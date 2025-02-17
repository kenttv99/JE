import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  created_at: string;
  status?: string;
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

interface UseTraderRequisitesResult {
  requisites: Requisite[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>; // Changed from refetchRequisites to refetch
  updateRequisiteStatus: (id: number, status: string) => Promise<void>;
}

const useTraderRequisites = (): UseTraderRequisitesResult => {
  const [requisites, setRequisites] = useState<Requisite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisites = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Requisite[]>('/api/v1/trader_req/get_requisites');
      setRequisites(response.data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch requisites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequisites();
  }, [fetchRequisites]);


  const updateRequisiteStatus = useCallback(async (id: number, status: string) => {
    try {
      setLoading(true);
      await api.put<Requisite>(`/api/v1/trader_req/update_requisite/${id}`, {
        status: status,
      });

      // Update local state
      const updatedRequisites = requisites.map(req =>
        req.id === id ? { ...req, status: status } : req
      );
      setRequisites(updatedRequisites);
    } catch (error: any) {
      setError(error.message || 'Failed to update requisite status');
    } finally {
      setLoading(false);
    }
  }, [requisites, api]);

  return {
    requisites,
    loading,
    error,
    refetch: fetchRequisites, // Changed from refetchRequisites to refetch
    updateRequisiteStatus,
  };
};

export default useTraderRequisites;