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
      verification_level?: string;
      created_at?: string;
      updated_at?: string;
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
    verification_level?: string;
    created_at?: string;
    updated_at?: string;
    access_token?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string;
    role?: string;
    accessToken?: string;
  }
}