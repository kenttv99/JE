// frontend/src/hooks/useAuth.ts
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requiredRole?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (requiredRole && session?.user?.role !== requiredRole) {
      // If user is authenticated but has wrong role
      if (session?.user?.role === 'trader') {
        router.replace('/trader/profile');
      } else {
        router.replace('/');
      }
    }
  }, [status, session, router, requiredRole]);

  return { session, status, isLoading: status === 'loading' };
}