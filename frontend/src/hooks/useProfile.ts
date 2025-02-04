// frontend/src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';

export function useProfile() {
  const { data: session, status } = useSession({ required: true });
  const [profile, setProfile] = useState<TraderData | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      // Only fetch if we have a valid session
      if (!session || status !== 'authenticated') {
        return;
      }

      // Prevent multiple fetches
      if (isLoading || profile) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await api.get<TraderData>('/api/v1/traders/profile');
        if (isMounted) {
          setProfile(response.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          // Don't set error for 401 - this prevents refresh cycle
          if (err.response?.status !== 401) {
            setError('Unable to load profile data');
          }
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
  }, [session, status]); // Only depend on session and status

  return { profile, isLoading, error };
}