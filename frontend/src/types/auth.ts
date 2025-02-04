// MODIFY: frontend/src/types/auth.ts
import { User } from "next-auth";

// Define the base interfaces
export interface TraderData {
  id: string;
  email: string;
  verification_level: number;
  pay_in: boolean;
  pay_out: boolean;
  access: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  trader: TraderData;
  token: string;
  message?: string;
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