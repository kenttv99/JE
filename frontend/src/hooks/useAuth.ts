// frontend/src/hooks/useAuth.ts
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';

export function useAuth(requiredRole?: string) {
  const { session, status, isLoading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (status === 'unauthenticated') {
        router.replace('/login');
      } else if (status === 'authenticated' && requiredRole && session?.user?.role !== requiredRole) {
        if (session?.user?.role === 'trader' && !window.location.pathname.startsWith('/trader')) {
          router.replace('/trader/profile');
        } else if (session?.user?.role !== 'trader') {
          router.replace('/');
        }
      }
    }
  }, [status, session, router, requiredRole, isLoading]);

  return { session, status, isLoading };
}