import type { Metadata } from "next";
import { GeistSans } from 'geist/font';
import "./globals.css";
import NavigationButtons from '@/components/NavigationButtons';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "JIVA PAY - Личный кабинет",
  description: "Личный кабинет пользователя JIVA PAY",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a 
                    href="/" 
                    className="flex items-center px-2 py-2 text-2xl font-bold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    JIVA PAY
                  </a>
                </div>
                <div className="flex items-center">
                  <NavigationButtons />
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}