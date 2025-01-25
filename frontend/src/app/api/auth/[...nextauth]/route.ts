import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axiosInstance from "@/lib/api";
import { CustomSession, CustomUser, CustomJWT, APIUser, BaseAuthUser } from "@/types";

// Extend NextAuth types without recursive references
declare module "next-auth" {
  interface Session extends Omit<CustomSession, "user"> {
    user: BaseAuthUser & {
      image?: string | null;
    };
  }
  interface User extends Omit<CustomUser, "name"> {
    name?: string | undefined;
  }
  interface JWT extends CustomJWT {}
}

interface LoginResponse {
  user: APIUser;
  token: string;
}

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
          const response = await axiosInstance.post<LoginResponse>('/api/v1/auth/login', {
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
    async jwt({ token, user }): Promise<CustomJWT> {
      if (user) {
        return {
          ...token,
          accessToken: (user as CustomUser).accessToken,
          id: user.id,
          email: user.email,
        };
      }
      return token as CustomJWT;
    },
    async session({ session, token }): Promise<CustomSession> {
      if (!token.accessToken || !token.id || !token.email) {
        throw new Error('Invalid token data');
      }
      
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: session.user?.name ?? null,
          image: session.user?.image ?? null,
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

const handler = NextAuth(authOptions);
export const GET = handler.GET;
export const POST = handler.POST;