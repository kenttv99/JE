// frontend/src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { TraderData } from '@/types/auth';
import { useSession } from 'next-auth/react';

export function useProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<TraderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (!session?.user || isLoading) return; // Don't fetch if no session or already loading
      
      setIsLoading(true);
      try {
        const response = await api.get<TraderData>('/api/v1/traders/profile');
        if (isMounted) {
          setProfile(response.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching profile:', err);
          setError('Failed to load profile data');
          // Use session data as fallback
          setProfile({
            id: session.user.id,
            email: session.user.email as string,
            verification_level: session.user.verification_level || 0,
            pay_in: session.user.pay_in || false,
            pay_out: session.user.pay_out || false,
            access: true,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [session]); // Only run when session changes

  return {
    profile,
    isLoading,
    error,
    setProfile
  };
}