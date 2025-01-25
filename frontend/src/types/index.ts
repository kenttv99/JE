import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

// Base User interface for API responses
export interface APIUser {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  telegram_username: string | null;
  verification_level: string;
  created_at: string;
  updated_at: string;
}

// Export custom User type
export interface User extends DefaultUser {
  accessToken: string;
  full_name: string | null;
  phone_number: string | null;
  telegram_username: string | null;
  verification_level: string;
  created_at: string;
  updated_at: string;
}

// Explicitly export CustomSession interface
export interface CustomSession extends DefaultSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  } & DefaultSession["user"];
}

// Extend the built-in session type
declare module "next-auth" {
  interface Session extends CustomSession {}
  interface User extends APIUser {
    accessToken: string;
  }
}

// Custom JWT interface
export interface CustomJWT extends NextAuthJWT {
  accessToken: string;
  id: string;
  email: string;
}