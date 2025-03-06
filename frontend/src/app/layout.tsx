// JE/frontend/src/app/layout.tsx
import '../app/globals.css';
import { Providers } from './providers'; // Импортируем провайдеры

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}