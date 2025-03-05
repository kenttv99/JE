import '../app/globals.css';
import { Providers } from './providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <Providers session={session}>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}