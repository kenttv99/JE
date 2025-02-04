// frontend/src/contexts/SessionContext.tsx
'use client';

import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { CustomSession } from '@/types/auth';

interface SessionContextType {
  session: CustomSession | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  status: 'loading',
  isLoading: true
});

export const useSessionContext = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <SessionContext.Provider 
      value={{ 
        session: session as CustomSession, 
        status,
        isLoading: status === 'loading'
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}