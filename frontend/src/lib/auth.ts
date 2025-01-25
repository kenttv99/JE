import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "@/lib/api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log('Attempting login with:', credentials.email);
          const response = await axios.post('/api/v1/auth/login', {
            email: credentials.email,
            password: credentials.password
          });
          
          console.log('Login response:', response.data);
          const user = response.data;

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.full_name,
              role: user.role,
              accessToken: user.access_token
            };
          }
          return null;
        } catch (error: any) {
          console.error('Detailed auth error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          throw new Error(error.response?.data?.message || 'Authentication failed');
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
        token.accessToken = user.accessToken;
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