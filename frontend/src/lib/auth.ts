// JE/frontend/src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { AxiosError } from "axios";
import { authApiRequest } from '@/lib/api';
import { TraderData, LoginResponse, ExtendedJWT, CustomSession } from '@/types/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<TraderData | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          // Используем прямой запрос без интерцепторов
          const response = await authApiRequest<LoginResponse>('/api/v1/traders/login', {
            email: credentials.email,
            password: credentials.password
          });
          const { trader, token } = response.data;
          if (!trader || !token) throw new Error('Invalid response from server');
          if (!trader.access) throw new Error('Account is disabled');
          return { ...trader, access_token: token, role: 'trader' };
        } catch (error) {
          if (error instanceof AxiosError && error.response?.data) {
            throw new Error(error.response.data.message || 'Authentication failed');
          }
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const trader = user as TraderData;
        return {
          ...token,
          id: trader.id,
          email: trader.email,
          role: trader.role || 'trader',
          verification_level: trader.verification_level || 0,
          pay_in: trader.pay_in || false,
          pay_out: trader.pay_out || false,
          accessToken: trader.access_token || '',
          created_at: trader.created_at,
          updated_at: trader.updated_at,
          tokenExpires: Math.floor(Date.now() / 1000) + 23 * 60 * 60
        } as ExtendedJWT;
      }
      const tokenExpires = (token as ExtendedJWT).tokenExpires as number | undefined;
      const currentTime = Math.floor(Date.now() / 1000);
      if (tokenExpires && currentTime > tokenExpires - 300) {
        return { ...token, error: "RefreshAccessTokenError" } as ExtendedJWT;
      }
      return token as ExtendedJWT;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<CustomSession> {
      const extendedToken = token as ExtendedJWT;
      if (extendedToken.error === "RefreshAccessTokenError") {
        return { ...session, error: "RefreshAccessTokenError" } as CustomSession;
      }
      return {
        ...session,
        accessToken: extendedToken.accessToken || '',
        user: {
          id: extendedToken.id || '',
          email: extendedToken.email || '',
          role: extendedToken.role || 'trader',
          verification_level: extendedToken.verification_level || 0,
          pay_in: extendedToken.pay_in || false,
          pay_out: extendedToken.pay_out || false,
          access: true,
          created_at: extendedToken.created_at,
          updated_at: extendedToken.updated_at,
          access_token: extendedToken.accessToken || ''
        } as TraderData
      };
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/'
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  jwt: { maxAge: 24 * 60 * 60 },
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;