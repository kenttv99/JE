// frontend/src/hooks/useTraderAddresses.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TraderAddress {
  id: number;
  wallet_number: string;
  network: string;
  coin: string;
  status: 'check' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export function useTraderAddresses() {
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ['trader-addresses'],
    queryFn: async () => {
      const response = await api.get<TraderAddress[]>('/api/v1/trader_addresses/all_trader_addresses');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    addresses: addresses || [],
    isLoading,
    error: error ? (error as Error).message : null
  };
}