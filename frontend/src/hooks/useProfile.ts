// frontend/src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';

export interface TraderProfile extends TraderData {
  balance: string;
  fiat_currency: string;
}

export function useProfile() {
  const { data: session, status } = useSession({ required: true });
  
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      const response = await api.get<TraderProfile>('/api/v1/traders/profile');
      return {
        ...response.data,
        balance: response.data.balance || '0.00',
        fiat_currency: response.data.fiat_currency || 'RUB'
      };
    },
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 1,
    refetchInterval: 10000,    // Refresh every 30 seconds for balance updates
    refetchOnWindowFocus: true // Refresh when window regains focus
  });

  return {
    profile,
    isLoading: isLoading || status === 'loading',
    error: error ? (error as Error).message : null,
    balance: profile?.balance || '0.00',
    fiat_currency: profile?.fiat_currency || 'RUB'
  };
}