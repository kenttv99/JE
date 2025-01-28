import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AxiosError } from "axios";
import { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import api from '@/lib/api';

// Define interfaces for API responses
interface TraderData {
  id: string;
  email: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  access: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LoginResponse {
  trader: TraderData;
  token: string;
  message?: string;
}

interface CustomUser extends User {
  verification_level?: number;
  pay_in?: boolean;
  pay_out?: boolean;
  access_token?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApiError {
  message: string;
  status?: number;
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
          accessToken: customUser.access_token,
          created_at: customUser.created_at,
          updated_at: customUser.updated_at
        };
      }
      return token;
    },

    async session({ session, token }) {
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

// Helper functions
export const isTrader = (session: any): boolean => {
  return session?.user?.role === 'trader';
};

export const hasRequiredVerification = (
  session: any, 
  requiredLevel: number
): boolean => {
  return (session?.user?.verification_level ?? 0) >= requiredLevel;
};

export const hasTraderPermission = (
  session: any, 
  permission: 'pay_in' | 'pay_out'
): boolean => {
  return session?.user?.[permission] === true;
};

export default authOptions;