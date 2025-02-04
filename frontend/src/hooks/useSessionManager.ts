// frontend/src/hooks/useSessionManager.ts
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CustomSession } from '@/types/auth';

export function useSessionManager() {
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<CustomSession | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setSessionData(session as CustomSession);
    }
  }, [session, status]);

  return {
    session: sessionData,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}