// JE/frontend/src/hooks/useAuth.ts
import { useSession } from 'next-auth/react';  // Убираем импорт Session, так как используем CustomSession
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CustomSession } from '@/types/auth';  // Импортируем CustomSession

export function useAuth(requiredRole: 'trader' | 'admin' | 'merchant' | undefined = 'trader') {
  const { data: session, status } = useSession();  // Используем useSession напрямую
  const router = useRouter();

  const customSession = session as CustomSession | undefined;

  useEffect(() => {
    console.log('useAuth effect - Status:', status, 'Session:', customSession?.accessToken);  // Отладочный лог
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && requiredRole && customSession?.user?.role !== requiredRole) {
      if (customSession?.user?.role === 'trader' && !window.location.pathname.startsWith('/trader')) {
        router.replace('/trader/profile');
      } else if (customSession?.user?.role !== 'trader') {
        router.replace('/');
      }
    }
  }, [status, customSession, router, requiredRole]);

  return {
    session: customSession,
    status,
    isLoading: status === 'loading',  // Добавляем isLoading для совместимости
  };
}