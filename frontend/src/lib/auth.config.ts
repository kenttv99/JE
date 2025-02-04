// frontend/src/lib/auth.config.ts
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import { CustomUser, CustomSession, LoginResponse } from '@/types/auth';

// Create an axios instance for authentication
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          const response = await authApi.post<LoginResponse>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.status === 200 && response.data.trader) {
            const { trader, token } = response.data;
            const user: CustomUser = {
              ...trader,
              role: 'trader',
              access_token: token,
              name: undefined,
              image: undefined,
            };
            return user;
          }
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.email = customUser.email;
        token.role = customUser.role;
        token.verification_level = customUser.verification_level;
        token.pay_in = customUser.pay_in;
        token.pay_out = customUser.pay_out;
        token.accessToken = customUser.access_token;
        token.created_at = customUser.created_at;
        token.updated_at = customUser.updated_at;
      }
      return token;
    },
    async session({ session, token }): Promise<CustomSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
          verification_level: token.verification_level as number,
          pay_in: token.pay_in as boolean,
          pay_out: token.pay_out as boolean,
          created_at: token.created_at as string | undefined,
          updated_at: token.updated_at as string | undefined,
        },
        accessToken: token.accessToken as string,
        expires: session.expires
      };
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};