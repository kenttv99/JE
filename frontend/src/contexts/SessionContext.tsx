// frontend/src/contexts/SessionContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CustomSession } from '@/types/auth';

interface SessionContextType {
  session: CustomSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  status: 'loading',
  isLoading: true,
  isAuthenticated: false,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<CustomSession | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setSessionData(session as CustomSession);
    } else if (status === 'unauthenticated') {
      setSessionData(null);
    }
  }, [session, status]);

  const value = {
    session: sessionData,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionContext = () => useContext(SessionContext);