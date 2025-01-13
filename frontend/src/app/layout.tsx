import type { Metadata } from "next";
import { GeistSans } from 'geist/font';
import "./globals.css";
import Link from 'next/link';

// No need to configure the fonts as they come pre-configured
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
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link 
                  href="/" 
                  className="flex items-center px-2 py-2 text-2xl font-bold text-blue-500"
                >
                  JIVA PAY
                </Link>
              </div>
              <div className="flex items-center">
                <Link
                  href="/profile"
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-500"
                >
                  Профиль
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}