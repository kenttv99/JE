import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      role?: string;
      verification_level?: number;
      pay_in?: boolean;
      pay_out?: boolean;
      created_at?: string;
      updated_at?: string;
    }
  }

  interface User {
    id: string;
    email: string;
    role?: string;
    verification_level?: number;
    pay_in?: boolean;
    pay_out?: boolean;
    access_token?: string;
    created_at?: string;
    updated_at?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role?: string;
    verification_level?: number;
    pay_in?: boolean;
    pay_out?: boolean;
    accessToken?: string;
    created_at?: string;
    updated_at?: string;
  }
}