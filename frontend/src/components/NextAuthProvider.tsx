'use client';
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function NextAuthProvider({
  children
}: {
  children: ReactNode
}) {
  return (
    <SessionProvider
      // Включаем периодическую проверку сессии (каждые 5 минут)
      refetchInterval={300000}
      // Проверяем при возвращении фокуса на окно
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}