import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "@/lib/api";
import { User } from "next-auth";
import { LoginResponse } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await axios.post<LoginResponse>('/api/v1/auth/login', {
            email: credentials.email,
            password: credentials.password
          });
          
          const userData = response.data.user;
          const token = response.data.token;

          if (!userData || !token) {
            throw new Error('Invalid response from server');
          }

          return {
            id: String(userData.id),
            email: userData.email,
            name: userData.full_name || userData.name,
            role: userData.role,
            access_token: token
          };
        } catch (error: any) {
          console.error('Auth error:', error.response?.data || error.message);
          throw new Error(error.response?.data?.message || 'Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accessToken: user.access_token
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
          name: token.name,
          role: token.role
        }
      };
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development'
};