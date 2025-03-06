// JE/frontend/src/types/auth.ts
import { User, DefaultSession } from 'next-auth';
import { JWT as BaseJWT } from 'next-auth/jwt'; // Явный импорт базового JWT

export interface TraderData {
  id: string;
  email: string;
  role: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  access: boolean;
  created_at?: string;
  updated_at?: string;
  access_token?: string;
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
  role: 'trader',
  verification_level: 0,
  pay_in: false,
  pay_out: false,
  access: false,
  created_at: undefined,
  updated_at: undefined,
  access_token: undefined,
  bankDetails: undefined,
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

export interface CustomSession extends DefaultSession {
  user: TraderData;
  accessToken: string;
  expires: string;
}

// Определяем ExtendedJWT как отдельный интерфейс, расширяющий BaseJWT
export interface ExtendedJWT {
  id: string;
  email: string;
  role: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  accessToken?: string;
  created_at?: string;
  updated_at?: string;
  tokenExpires?: number;
  error?: string;
  [key: string]: any; // Индексная сигнатура для совместимости с JWT
}