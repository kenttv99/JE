// frontend/src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';

export function useProfile() {
    const { data: session, status } = useSession({ required: true });
    const [profile, setProfile] = useState<TraderData | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start as true
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      let isMounted = true;
      
      const fetchProfile = async () => {
        // Only fetch if authenticated
        if (!session || status !== 'authenticated') {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }
  
        try {
          const response = await api.get<TraderData>('/api/v1/traders/profile');
          if (isMounted) {
            setProfile(response.data);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) {
            if (err.response?.status === 401) {
              // Token expired - will trigger redirect through session handling
              return;
            }
            setError('Unable to load profile data');
            console.error('Profile fetch error:', err);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
  
      fetchProfile();
      return () => { isMounted = false; };
    }, [session, status]); // Reset and refetch when session/status changes
  
    return { profile, isLoading, error };
  }