import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  token?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "example@example.com" 
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "••••••••" 
        }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Необходимо указать email и пароль');
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL не настроен');
          }

          // Исправленный путь для соответствия FastAPI бэкенду
          const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data: LoginResponse = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка авторизации');
          }

          if (!data.user || !data.token) {
            throw new Error('Неверный формат ответа от сервера');
          }

          const user: User = {
            ...data.user,
            token: data.token,
          };

          return user;
        } catch (error) {
          console.error('Auth Error:', error);
          throw new Error(error instanceof Error ? error.message : 'Произошла ошибка при входе');
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT, user?: User }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: JWT }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
      };
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };