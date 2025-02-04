// frontend/src/hooks/useAuth.ts
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requiredRole?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' || (requiredRole && session?.user?.role !== requiredRole)) {
      router.push('/login');
    }
  }, [status, session, router, requiredRole]);

  return { session, status, isLoading: status === 'loading' };
}