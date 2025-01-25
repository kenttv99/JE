import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axiosInstance from "@/lib/api";
import { APIUser } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const response = await axiosInstance.post<{ user: APIUser; token: string }>('/api/v1/auth/login', {
            email: credentials?.email,
            password: credentials?.password,
          });

          const { user, token } = response.data;

          if (user && token) {
            return {
              id: String(user.id),
              email: user.email,
              name: user.full_name || undefined,
              accessToken: token,
              full_name: user.full_name,
              phone_number: user.phone_number,
              telegram_username: user.telegram_username,
              verification_level: user.verification_level,
              created_at: user.created_at,
              updated_at: user.updated_at,
            };
          }
          return null;
        } catch (error) {
          console.error('Auth Error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
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
};