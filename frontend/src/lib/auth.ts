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
          console.log('Missing credentials');
          return null;
        }

        try {
          console.log('Making login request to:', '/api/v1/auth/login');
          console.log('With email:', credentials.email);
          
          const response = await axios.post<LoginResponse>('/api/v1/auth/login', {
            email: credentials.email,
            password: credentials.password
          });
          
          console.log('Login response status:', response.status);
          console.log('Login response data:', {
            ...response.data,
            access_token: response.data.access_token ? '[PRESENT]' : '[MISSING]'
          });
          
          const userData = response.data;

          if (!userData || !userData.access_token) {
            console.error('Invalid response data:', userData);
            throw new Error('Invalid response from server');
          }

          const user: User = {
            id: String(userData.id || '0'),
            email: userData.email,
            name: userData.full_name || undefined,
            role: userData.role || undefined,
            access_token: userData.access_token
          };

          console.log('Created user object:', {
            ...user,
            access_token: '[PRESENT]'
          });

          return user;
        } catch (error: any) {
          console.error('Auth error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: {
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              headers: error.config?.headers
            }
          });
          
          // Instead of returning null, throw an error to display the message
          throw new Error(error.response?.data?.detail || 'Authentication failed');
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
      console.log('JWT Callback - Input:', { 
        token: { ...token, accessToken: token.accessToken ? '[PRESENT]' : '[MISSING]' },
        user: user ? { ...user, access_token: '[PRESENT]' } : null 
      });

      if (user) {
        token = {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accessToken: user.access_token
        };
      }

      console.log('JWT Callback - Output:', { 
        ...token,
        accessToken: token.accessToken ? '[PRESENT]' : '[MISSING]'
      });
      
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Input:', {
        session: { ...session, accessToken: session.accessToken ? '[PRESENT]' : '[MISSING]' },
        token: { ...token, accessToken: token.accessToken ? '[PRESENT]' : '[MISSING]' }
      });

      session.accessToken = token.accessToken;
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role
      };

      console.log('Session Callback - Output:', {
        ...session,
        accessToken: session.accessToken ? '[PRESENT]' : '[MISSING]'
      });

      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true
};