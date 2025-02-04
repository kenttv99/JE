// frontend/src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';

export function useProfile() {
  const { data: session, status } = useSession({ required: true });
  
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      const response = await api.get<TraderData>('/api/v1/traders/profile');
      return response.data;
    },
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (using gcTime instead of cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    profile,
    isLoading: isLoading || status === 'loading',
    error: error ? (error as Error).message : null
  };
}