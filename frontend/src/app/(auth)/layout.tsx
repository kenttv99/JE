// frontend/src/app/(auth)/layout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' && !isRedirecting) {
      setIsRedirecting(true);
      const timeout = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [status, router, isRedirecting]);

  // if (status === 'loading' || isRedirecting) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-2xl font-semibold">Загрузка...</div>
  //     </div>
  //   );
  // }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}