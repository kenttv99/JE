import { DefaultSession } from "next-auth";
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

// Basic user interface without auth specifics
export interface BaseAuthUser {
  id: string;
  email: string;
  name?: string | undefined;
}

// Custom User interface for NextAuth
export interface CustomUser extends BaseAuthUser {
  accessToken: string;
  full_name: string | null;
  phone_number: string | null;
  telegram_username: string | null;
  verification_level: string;
  created_at: string;
  updated_at: string;
}

// Export APIUser as User for components
export type User = APIUser;

// Session interface
export interface CustomSession extends Omit<DefaultSession, "user"> {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

// JWT interface
export interface CustomJWT extends NextAuthJWT {
  accessToken: string;
  id: string;
  email: string;
}