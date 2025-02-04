// frontend/src/app/layout.tsx
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from '@/contexts/SessionContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          <SessionProvider>
            {children}
          </SessionProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}