import { Session } from 'next-auth';

export interface CustomSession extends Session {
  accessToken?: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  full_name?: string;
  role?: string;
  phone_number?: string;
  telegram_username?: string;
  verification_level?: string;
  created_at?: string;
  updated_at?: string;
  access_token: string;
}

export interface APIUser {
  id: number;
  email: string;
  full_name?: string;
  role?: string;
  phone_number?: string;
  telegram_username?: string;
  verification_level: string;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}