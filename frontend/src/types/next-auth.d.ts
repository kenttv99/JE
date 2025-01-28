import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name?: string;
      role?: string;
      full_name?: string;
      phone_number?: string;
      telegram_username?: string;
      verification_level?: number;  // Changed to number
      created_at?: string;
      updated_at?: string;
      pay_in?: boolean;  // Added
      pay_out?: boolean; // Added
    }
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    full_name?: string;
    phone_number?: string;
    telegram_username?: string;
    verification_level?: number;  // Changed to number
    created_at?: string;
    updated_at?: string;
    access_token?: string;
    pay_in?: boolean;  // Added
    pay_out?: boolean; // Added
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string;
    role?: string;
    accessToken?: string;
    verification_level?: number;  // Added
    pay_in?: boolean;  // Added
    pay_out?: boolean; // Added
  }
}