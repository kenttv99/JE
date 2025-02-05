// frontend/src/app/layout.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { SessionProvider as CustomSessionProvider } from '@/contexts/SessionContext';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <CustomSessionProvider>
            {children}
          </CustomSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}