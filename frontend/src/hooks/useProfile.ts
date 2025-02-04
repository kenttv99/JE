// frontend/src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';

export function useProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<TraderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      // Don't fetch if we're not authenticated or have already attempted
      if (status !== 'authenticated' || hasAttemptedLoad) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<TraderData>('/api/v1/traders/profile');
        if (isMounted) {
          setProfile(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load profile data');
          console.error('Profile fetch error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasAttemptedLoad(true);
        }
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [status, hasAttemptedLoad]); // Only run when auth status changes

  return { profile, isLoading, error };
}