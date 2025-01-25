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
            return {
              id: String(userData.id),
              email: userData.email,
              name: userData.full_name,
              role: userData.role,
              access_token: userData.access_token // Make sure this matches your API response
            };
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
        // Add all user properties to the token
        return {
          ...token,
          ...user,
          accessToken: user.access_token // Make sure to include the access token
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Add the access token and other user data to the session
      return {
        ...session,
        accessToken: token.accessToken, // Add access token directly to session
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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};