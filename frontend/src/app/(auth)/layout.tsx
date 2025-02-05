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
    // Only redirect if we're sure the user is unauthenticated
    if (status === 'unauthenticated' && !isRedirecting) {
      setIsRedirecting(true);
      router.replace('/login'); // Use replace instead of push to prevent history stacking
    }
    // Reset redirecting state when status changes
    if (status !== 'unauthenticated') {
      setIsRedirecting(false);
    }
  }, [status, router, isRedirecting]);

  // Show loading state only when we're not sure about authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Загрузка...</div>
      </div>
    );
  }

  // Only render children if we have a session
  if (!session) {
    return null;
  }

  return <>{children}</>;
}