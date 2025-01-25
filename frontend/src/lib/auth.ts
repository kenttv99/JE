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
          
          const userData = response.data;

          if (userData) {
            const user: User = {
              id: String(userData.id),
              email: userData.email,
              name: userData.full_name || undefined,
              role: userData.role || undefined,
              full_name: userData.full_name || undefined,
              phone_number: userData.phone_number || undefined,
              telegram_username: userData.telegram_username || undefined,
              verification_level: userData.verification_level || undefined,
              created_at: userData.created_at || undefined,
              updated_at: userData.updated_at || undefined,
              access_token: userData.access_token  // Using access_token instead of accessToken
            };
            return user;
          }
          return null;
        } catch (error: any) {
          console.error('Auth error:', error.response?.data || error.message);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.access_token;  // Use access_token from user
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role
        };
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};