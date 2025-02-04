// MODIFY: frontend/src/types/auth.ts
import { User } from "next-auth";
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export interface TraderData {
  id: string;
  email: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  access: boolean;
  created_at?: string;
  updated_at?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    bik: string;
    correspondentAccount: string;
  };
}

export const DEFAULT_TRADER_DATA: TraderData = {
  id: '',
  email: '',
  verification_level: 0,
  pay_in: false,
  pay_out: false,
  access: false,
  created_at: undefined,
  updated_at: undefined
};

// Base user interface that extends Next-Auth User
export interface CustomUser extends User {
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

export interface LoginResponse {
  trader: TraderData;
  token: string;
  message?: string;
}

export interface CustomSession extends Session {
  accessToken?: string;
  user: CustomUser; // Make user required and of type CustomUser
}

export interface CustomUser extends User {
  verification_level?: number;
  pay_in?: boolean;
  pay_out?: boolean;
  access_token?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// JWT interface with required fields
export interface CustomJWT extends JWT {
  id: string; // Make id required
  email: string;
  role?: string;
  verification_level?: number;
  pay_in?: boolean;
  pay_out?: boolean;
  accessToken?: string;
  created_at?: string;
  updated_at?: string;
}