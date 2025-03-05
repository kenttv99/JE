// JE/frontend/src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import type { Session, DefaultSession } from "next-auth";
import type { JWT, DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { AxiosError } from "axios";
import api from '@/lib/api';
import { CustomUser, LoginResponse, ApiError, ExtendedJWT, CustomSession } from '@/types/auth';
import jwt from 'jsonwebtoken';  // Импортируем jsonwebtoken для работы с JWT

// Определяем константы, совпадающие с бэкендом (JE/constants.py)
const SECRET_KEY = process.env.NEXTAUTH_SECRET || '123456789';  // Совпадает с JE/constants.py
const ALGORITHM = 'HS256';  // Совпадает с JE/constants.py
const ACCESS_TOKEN_EXPIRE_MINUTES = 30;  // Совпадает с JE/constants.py

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      email: string;
      role: string;
      verification_level: number;
      pay_in: boolean;
      pay_out: boolean;
      created_at?: string;
      updated_at?: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends Omit<ExtendedJWT, 'sub'> {
    tokenExpires?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await api.post<LoginResponse>('/api/v1/traders/login', {
            email: credentials.email,
            password: credentials.password
          });

          const { trader, token } = response.data;

          if (!trader || !token) {
            throw new Error('Invalid response from server');
          }

          if (!trader.access) {
            throw new Error('Account is disabled');
          }

          return {
            id: trader.id,
            email: trader.email,
            name: trader.email, // Required by NextAuth
            role: 'trader',
            verification_level: trader.verification_level,
            pay_in: trader.pay_in,
            pay_out: trader.pay_out,
            access_token: token,
            created_at: trader.created_at,
            updated_at: trader.updated_at
          };

        } catch (error) {
          if (error instanceof Error) {
            const axiosError = error as AxiosError<ApiError>;
            console.error("Auth error details:", {
              status: axiosError.response?.status,
              data: axiosError.response?.data,
              message: axiosError.message
            });
            
            if (axiosError.response?.data) {
              throw new Error(axiosError.response.data.message || 'Authentication failed');
            }
            throw new Error(error.message || 'Authentication failed');
          }
          throw new Error('An unexpected error occurred');
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        return {
          ...token,
          id: customUser.id,
          email: customUser.email,
          role: customUser.role,
          verification_level: customUser.verification_level,
          pay_in: customUser.pay_in,
          pay_out: customUser.pay_out,
          accessToken: jwt.sign(
            {
              sub: customUser.email,
              type: customUser.role,  // Убедимся, что роль включена
              verification_level: customUser.verification_level,
            },
            SECRET_KEY,
            { algorithm: ALGORITHM, expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` }
          ),
          created_at: customUser.created_at,
          updated_at: customUser.updated_at,
          tokenExpires: Math.floor(Date.now() / 1000) + 23 * 60 * 60
        };
      }

      // Check token expiration
      const tokenExpires = token.tokenExpires as number | undefined;
      const currentTime = Math.floor(Date.now() / 1000);
      // Add a 5-minute buffer before expiration
      if (tokenExpires && currentTime > tokenExpires - 300) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      return token;
    },

    async session({ session, token }) {
      if (token.error === "RefreshAccessTokenError") {
        return { ...session, error: "RefreshAccessTokenError" };
      }

      return {
        ...session,
        accessToken: token.accessToken,
        user: {
          ...session.user,
          id: token.id,
          email: token.email,
          role: token.role,
          verification_level: token.verification_level,
          pay_in: token.pay_in,
          pay_out: token.pay_out,
          created_at: token.created_at,
          updated_at: token.updated_at
        }
      };
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/'
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  debug: process.env.NODE_ENV === 'development',
};

export { isTrader, hasRequiredVerification, hasTraderPermission } from '@/utils/auth';
export default authOptions;