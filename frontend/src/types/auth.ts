// frontend/src/types/auth.ts
import { User } from "next-auth";
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

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
  access: false
};

export interface CustomUser extends User {
  id: string;
  email: string;
  role: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  access_token: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  trader: TraderData;
  token: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Remove the circular dependencies by not extending Session and JWT directly
export interface CustomSession {
  user: {
    id: string;
    email: string;
    role: string;
    verification_level: number;
    pay_in: boolean;
    pay_out: boolean;
    created_at?: string;
    updated_at?: string;
  } & DefaultSession["user"];
  accessToken: string;
  expires: string;
}

export interface ExtendedJWT extends DefaultJWT {
  id: string;
  email: string;
  role: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  accessToken: string;
  created_at?: string;
  updated_at?: string;
  tokenExpires?: number;
}