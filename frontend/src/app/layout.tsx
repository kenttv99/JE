import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font';
import "./globals.css";
import NavigationButtons from '@/components/NavigationButtons';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "JIVA PAY - Личный кабинет",
  description: "Личный кабинет пользователя JIVA PAY",
  keywords: ["JIVA PAY", "личный кабинет", "платежи", "финансы"],
  authors: [{ name: "JIVA PAY Team" }],
  robots: "index, follow",
  icons: {
    icon: '/favicon.ico',
  },
};

// Отдельный экспорт для viewport настроек
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased min-h-screen bg-gray-50`}>
        <Providers>
          {/* Header */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a 
                    href="/" 
                    className="flex items-center gap-2 px-2 py-2 text-2xl font-bold text-blue-500 hover:text-blue-600 transition-colors"
                    aria-label="На главную"
                  >
                    <img
                      src="/logo.svg"
                      alt="JIVA PAY Logo"
                      className="h-8 w-auto"
                      width={32}
                      height={32}
                    />
                    <span>JIVA PAY</span>
                  </a>
                </div>
                <div className="flex items-center">
                  <NavigationButtons />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  © {new Date().getFullYear()} JIVA PAY. Все права защищены.
                </div>
                <div className="flex gap-4">
                  <a 
                    href="/privacy" 
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Политика конфиденциальности
                  </a>
                  <a 
                    href="/terms" 
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Условия использования
                  </a>
                </div>
              </div>
            </div>
          </footer>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}